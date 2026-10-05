import { store } from "@/Atoms.ts";
import { sessionAtom } from "@/auth/authAtoms.ts";
import { ApiError } from "@/shared/api.ts";
import { createChatActions, EXPIRED_CONFIRMATION } from "@/shared/chat/chatActions.ts";
import * as chatsApi from "@/shared/chat/chatApi.ts";
import { chatStateAtom } from "@/shared/chat/chatAtoms.ts";
import * as messagesApi from "@/shared/chat/messagesApi.ts";
import type { Chat } from "@/shared/types.ts";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/shared/chat/chatApi.ts", () => ({ getChat: vi.fn(), createChat: vi.fn() }));
vi.mock("@/shared/chat/messagesApi.ts", () => ({
  listMessages: vi.fn(),
  sendMessageStream: vi.fn(),
  resumeToolCall: vi.fn(),
}));
const chat = (id: string): Chat => ({
  id,
  title: id,
  owner_id: "u",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
});
afterEach(() => {
  vi.clearAllMocks();
  store.set(sessionAtom, null);
  store.set(chatStateAtom, { chat: null, messages: [], busy: false, error: "", gate: null });
});
it("ignores a late conversation load after selecting another chat", async () => {
  let release!: (value: Chat) => void;
  vi.mocked(chatsApi.getChat).mockImplementation((id) =>
    id === "a"
      ? new Promise((r) => {
          release = r;
        })
      : Promise.resolve(chat(id)),
  );
  vi.mocked(messagesApi.listMessages).mockResolvedValue({ items: [], next_cursor: null });
  const actions = createChatActions();
  const old = actions.select("a");
  await actions.select("b");
  release(chat("a"));
  expect(await old).toBeNull();
  expect(store.get(chatStateAtom).chat?.id).toBe("b");
});
it("does not resurrect a chat when creation completes after reset", async () => {
  let release!: (value: Chat) => void;
  vi.mocked(chatsApi.createChat).mockImplementation(
    () =>
      new Promise((r) => {
        release = r;
      }),
  );
  const actions = createChatActions();
  const sending = actions.send({ content: "Hello" });
  actions.reset();
  release(chat("late"));
  expect(await sending).toBe(false);
  expect(store.get(chatStateAtom)).toMatchObject({ chat: null, messages: [], busy: false });
  expect(messagesApi.sendMessageStream).not.toHaveBeenCalled();
});
it("stopping a stream preserves partial content and releases the busy state", async () => {
  store.set(chatStateAtom, {
    chat: chat("active"),
    messages: [],
    busy: false,
    error: "",
    gate: null,
  });
  vi.mocked(messagesApi.sendMessageStream).mockImplementation(
    async (_id, _body, signal) =>
      new Response(
        new ReadableStream({
          start(controller) {
            const frames = [
              { type: "start", lq_ai_message_id: "assistant", chat_id: "active" },
              { type: "delta", delta: "Partial answer", lq_ai_message_id: "assistant" },
            ];
            controller.enqueue(
              new TextEncoder().encode(
                frames.map((f) => "data: " + JSON.stringify(f) + "\n\n").join(""),
              ),
            );
            signal?.addEventListener(
              "abort",
              () => controller.error(new DOMException("Stopped", "AbortError")),
              { once: true },
            );
          },
        }),
      ),
  );
  const actions = createChatActions();
  const sending = actions.send({ content: "Question" });
  await vi.waitFor(() =>
    expect(store.get(chatStateAtom).messages.at(-1)?.content).toBe("Partial answer"),
  );
  actions.stop();
  await sending;
  expect(store.get(chatStateAtom)).toMatchObject({ busy: false, error: "" });
  expect(store.get(chatStateAtom).messages.at(-1)?.content).toBe("Partial answer");
});
it("clears an expired tool confirmation instead of leaving a dead approval prompt", async () => {
  vi.mocked(messagesApi.resumeToolCall).mockRejectedValue(
    new ApiError(410, "gone", "Pending call expired"),
  );
  store.set(chatStateAtom, {
    chat: chat("c"),
    messages: [],
    busy: false,
    error: "",
    gate: {
      assistantId: "assistant",
      kind: "confirm",
      frame: {
        type: "tool_confirmation_required",
        lq_ai_message_id: "assistant",
        pending_call_id: "pending",
        provider: "test",
        tool: "save",
        function_name: "save",
        args_summary: "Save",
        tier: 1,
        destructive: true,
      },
    },
  });
  await createChatActions().resume("approve");
  expect(store.get(chatStateAtom)).toMatchObject({
    gate: null,
    busy: false,
    error: EXPIRED_CONFIRMATION,
  });
});
