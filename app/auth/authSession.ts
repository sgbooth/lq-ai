import { store } from "@/Atoms.ts";
import { parseStoredSession, SESSION_STORAGE_KEY, sessionAtom } from "@/auth/authAtoms.ts";
import type { User } from "@/shared/types.ts";
export const getAccessToken = () => store.get(sessionAtom)?.access_token ?? null;
export const getRefreshToken = () => store.get(sessionAtom)?.refresh_token ?? null;
export const clearSession = () => store.set(sessionAtom, null);
export function setSession(value: {
  access_token: string;
  refresh_token?: string | null;
  expires_in: number;
  user?: User | null;
}) {
  const previous = store.get(sessionAtom);
  const user = value.user ?? previous?.user;
  if (!user) return;
  store.set(sessionAtom, {
    access_token: value.access_token,
    refresh_token: value.refresh_token ?? previous?.refresh_token,
    expires_in: value.expires_in,
    user,
  });
}
export function setUser(user: User) {
  const session = store.get(sessionAtom);
  if (session) store.set(sessionAtom, { ...session, user });
}
/**
 * Adopt sign-in, sign-out and refresh-token rotation from other tabs. Without this, a tab
 * holding a rotated-away refresh token fails its next refresh and signs the user out.
 */
export function syncSessionAcrossTabs(target: Pick<Window, "addEventListener"> = window) {
  target.addEventListener("storage", (event) => {
    if (event.key !== SESSION_STORAGE_KEY && event.key !== null) return;
    const next = parseStoredSession(event.newValue);
    if (JSON.stringify(next) !== JSON.stringify(store.get(sessionAtom)))
      store.set(sessionAtom, next);
  });
}
