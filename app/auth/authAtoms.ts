import type { Session } from "@/auth/authTypes.ts";
import { chatStateAtom, enhancementOriginalsAtom } from "@/shared/chat/chatAtoms.ts";
import { atom } from "jotai";
export const SESSION_STORAGE_KEY = "lq_ai_react_auth";
/** Parse a persisted session, rejecting anything without a token and user. */
export function parseStoredSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return typeof value.access_token === "string" && value.user?.id ? value : null;
  } catch {
    return null;
  }
}
function initial(): Session | null {
  try {
    return parseStoredSession(
      typeof localStorage !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : null,
    );
  } catch {
    return null;
  }
}
const stateAtom = atom<Session | null>(initial());
export const sessionAtom = atom(
  (get) => get(stateAtom),
  (get, set, session: Session | null) => {
    if (get(stateAtom)?.user.id !== session?.user.id) {
      set(chatStateAtom, { chat: null, messages: [], busy: false, error: "", gate: null });
      set(enhancementOriginalsAtom, {});
    }
    set(stateAtom, session);
    try {
      if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* Storage may be disabled. */
    }
  },
);
export const userAtom = atom((get) => get(sessionAtom)?.user ?? null);
