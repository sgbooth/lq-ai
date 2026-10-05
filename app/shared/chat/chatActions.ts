import { recordOnboardingSignal } from "@/shared/onboardingSignals.ts";
import { store } from "@/Atoms.ts";
import { sessionAtom } from "@/auth/authAtoms.ts";
import { ApiError } from "@/shared/api.ts";
import * as chatsApi from "@/shared/chat/chatApi.ts";
import { chatStateAtom } from "@/shared/chat/chatAtoms.ts";
import * as messagesApi from "@/shared/chat/messagesApi.ts";
import { consumeMessageStream } from "@/shared/messageStream.ts";
import type { Chat, MessageCreate } from "@/shared/types.ts";
import type { ExtractAtomValue } from "jotai";
export function updateChat(values: Partial<ExtractAtomValue<typeof chatStateAtom>>) {
  store.set(chatStateAtom, { ...store.get(chatStateAtom), ...values });
}
export const EXPIRED_CONFIRMATION = "This confirmation expired — re-send your message to continue.";
/** A controller owns one mounted conversation. Late results cannot cross selections. */
export function createChatActions() {
  const owner = store.get(sessionAtom)?.user.id;
  let generation = 0;
  let abort: AbortController | null = null;
  const current = (ticket: number) =>
    generation === ticket && owner === store.get(sessionAtom)?.user.id;
  const failure = (error: unknown, ticket: number) => {
    if (current(ticket) && !(error instanceof DOMException && error.name === "AbortError"))
      updateChat({ error: error instanceof Error ? error.message : "Chat request failed." });
  };
  const dispose = () => {
    ++generation;
    abort?.abort();
  };
  const reset = () => {
    dispose();
    updateChat({ chat: null, messages: [], busy: false, error: "", gate: null });
  };
  async function consume(response: Response, id: string, ticket: number, hasDocument = false) {
    if (!response.body) throw new Error("Empty message stream.");
    let assistantId = id;
    await consumeMessageStream(response.body, {
      onStart: (frame) => {
        if (!current(ticket)) return;
        const old = assistantId;
        assistantId = frame.lq_ai_message_id;
        updateChat({
          messages: store
            .get(chatStateAtom)
            .messages.map((m) => (m.id === old ? { ...m, id: assistantId } : m)),
        });
      },
      onDelta: (frame) => {
        if (current(ticket))
          updateChat({
            messages: store.get(chatStateAtom).messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: m.content + frame.delta,
                    routed_inference_tier: frame.routed_inference_tier,
                    applied_skills: frame.applied_skills,
                  }
                : m,
            ),
          });
      },
      onComplete: (frame) => {
        if (
          current(ticket) &&
          frame.message.applied_skills?.length &&
          (hasDocument || frame.citations?.length || frame.message.citations?.length)
        )
          recordOnboardingSignal("skill-document", owner);
        if (current(ticket))
          updateChat({
            messages: store
              .get(chatStateAtom)
              .messages.map((m) =>
                m.id === assistantId
                  ? { ...frame.message, citations: frame.citations || frame.message.citations }
                  : m,
              ),
          });
      },
      onError: (frame) => {
        if (current(ticket)) updateChat({ error: frame.error.message });
      },
      onToolConfirmation: (frame) => {
        if (current(ticket)) updateChat({ gate: { assistantId, kind: "confirm", frame } });
      },
      onMcpAuthorization: (frame) => {
        if (current(ticket)) updateChat({ gate: { assistantId, kind: "connect", frame } });
      },
    });
  }
  return {
    dispose,
    reset,
    stop: () => abort?.abort(),
    async select(id: string) {
      reset();
      const ticket = generation;
      try {
        const [chat, page] = await Promise.all([
          chatsApi.getChat(id),
          messagesApi.listMessages(id),
        ]);
        if (!current(ticket)) return null;
        updateChat({ chat, messages: page.items });
        return { chat, cursor: page.next_cursor };
      } catch (error) {
        failure(error, ticket);
        return null;
      }
    },
    async earlier(chat: Chat, cursor: string) {
      const ticket = generation;
      try {
        const page = await messagesApi.listMessages(chat.id, { cursor });
        if (!current(ticket)) return null;
        updateChat({ messages: [...page.items, ...store.get(chatStateAtom).messages] });
        return page.next_cursor;
      } catch (error) {
        failure(error, ticket);
        return null;
      }
    },
    async send(body: MessageCreate, projectId?: string, onStarted?: () => void) {
      if (store.get(chatStateAtom).busy) return false;
      const ticket = ++generation;
      abort?.abort();
      abort = new AbortController();
      updateChat({ busy: true, error: "", gate: null });
      try {
        let active = store.get(chatStateAtom).chat;
        if (!active) {
          active = await chatsApi.createChat({
            project_id: projectId,
            title: body.content.slice(0, 80),
          });
          if (!current(ticket)) return false;
          updateChat({ chat: active });
        }
        const now = new Date().toISOString(),
          id = crypto.randomUUID();
        updateChat({
          messages: [
            ...store.get(chatStateAtom).messages,
            {
              id: crypto.randomUUID(),
              chat_id: active.id,
              role: "user",
              is_enhanced: body.skills?.includes("enhance-prompt"),
              content: body.content,
              created_at: now,
            },
            { id, chat_id: active.id, role: "assistant", content: "", created_at: now },
          ],
        });
        onStarted?.();
        const response = await messagesApi.sendMessageStream(active.id, body, abort.signal);
        if (!current(ticket)) {
          await response.body?.cancel();
          return false;
        }
        await consume(response, id, ticket, !!body.file_ids?.length);
        return true;
      } catch (error) {
        failure(error, ticket);
        return false;
      } finally {
        if (current(ticket)) updateChat({ busy: false });
      }
    },
    async resume(decision: "approve" | "deny") {
      const { gate, chat, busy } = store.get(chatStateAtom);
      if (!gate || gate.kind !== "confirm" || !chat || busy) return;
      const ticket = ++generation;
      abort = new AbortController();
      updateChat({ busy: true, error: "" });
      try {
        const response = await messagesApi.resumeToolCall(
          chat.id,
          gate.frame.pending_call_id,
          decision,
          abort.signal,
        );
        if (!current(ticket)) {
          await response.body?.cancel();
          return;
        }
        updateChat({ gate: null });
        await consume(response, gate.assistantId, ticket);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 409 || error.status === 410)) {
          if (current(ticket)) updateChat({ gate: null, error: EXPIRED_CONFIRMATION });
        } else failure(error, ticket);
      } finally {
        if (current(ticket)) updateChat({ busy: false });
      }
    },
  };
}
