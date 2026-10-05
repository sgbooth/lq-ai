import type { PendingGate } from "@/shared/chat/toolGate.ts";
import type { Chat, Message } from "@/shared/types.ts";
import { atom } from "jotai";
export const chatStateAtom = atom<{
  chat: Chat | null;
  messages: Message[];
  busy: boolean;
  error: string;
  gate: PendingGate | null;
}>({ chat: null, messages: [], busy: false, error: "", gate: null });
export const messagesAtom = atom((get) => get(chatStateAtom).messages);
export const activeChatAtom = atom((get) => get(chatStateAtom).chat);
export const chatBusyAtom = atom((get) => get(chatStateAtom).busy);
export const chatErrorAtom = atom((get) => get(chatStateAtom).error);
export const chatGateAtom = atom((get) => get(chatStateAtom).gate);

export const enhancementOriginalsAtom = atom<Record<string, string>>({});
