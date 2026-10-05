import { afterEach, expect, it, vi } from "vitest";
import { recalledChatModel, rememberChatModel } from "@/shared/chat/chatModelMemory.ts";
import type { ModelListResponse } from "@/shared/modelsApi.ts";
const models: ModelListResponse = {
  object: "list",
  data: [
    { id: "smart", object: "model", created: 0, owned_by: "default", lq_ai_kind: "alias" },
    {
      id: "local/small",
      object: "model",
      created: 0,
      owned_by: "local",
      lq_ai_kind: "provider_native",
    },
  ],
};
afterEach(() => vi.unstubAllGlobals());
it("isolates model choices by account and chat, and rejects removed models", () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key),
    setItem: (key: string, value: string) => values.set(key, value),
  });
  rememberChatModel("a", "one", "local/small");
  expect(recalledChatModel("a", "one", models)).toBe("local/small");
  expect(recalledChatModel("b", "one", models)).toBe("smart");
  expect(recalledChatModel("a", "two", models)).toBe("smart");
  expect(recalledChatModel("a", undefined, models)).toBe("smart");
  rememberChatModel("a", "one", "removed");
  expect(recalledChatModel("a", "one", models)).toBe("smart");
});
it("still defaults when storage is unavailable or the catalog is empty", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  });
  expect(() => rememberChatModel("a", "one", "smart")).not.toThrow();
  expect(recalledChatModel("a", "one", models)).toBe("smart");
  expect(recalledChatModel("a", "one", { object: "list", data: [] })).toBeNull();
});
