import { store } from "@/Atoms.ts";
import { SESSION_STORAGE_KEY, sessionAtom } from "@/auth/authAtoms.ts";
import { syncSessionAcrossTabs } from "@/auth/authSession.ts";
import { afterEach, expect, it } from "vitest";
const user = {
  id: "1",
  email: "user@example.com",
  is_admin: false,
  must_change_password: false,
  mfa_enabled: false,
  created_at: "2026-01-01T00:00:00Z",
};
function tab() {
  let listener: ((event: StorageEvent) => void) | undefined;
  syncSessionAcrossTabs({
    addEventListener: ((_: string, l: (event: StorageEvent) => void) => {
      listener = l;
    }) as Window["addEventListener"],
  });
  return (key: string | null, newValue: string | null) =>
    listener!({ key, newValue } as StorageEvent);
}
afterEach(() => store.set(sessionAtom, null));
it("adopts a refresh token rotated by another tab", () => {
  store.set(sessionAtom, { access_token: "a1", refresh_token: "r1", expires_in: 900, user });
  const rotated = { access_token: "a2", refresh_token: "r2", expires_in: 900, user };
  tab()(SESSION_STORAGE_KEY, JSON.stringify(rotated));
  expect(store.get(sessionAtom)).toEqual(rotated);
});
it("signs out when another tab signs out, and ignores unrelated keys", () => {
  const session = { access_token: "a1", refresh_token: "r1", expires_in: 900, user };
  store.set(sessionAtom, session);
  const dispatch = tab();
  dispatch("other", null);
  expect(store.get(sessionAtom)).toEqual(session);
  dispatch(SESSION_STORAGE_KEY, null);
  expect(store.get(sessionAtom)).toBeNull();
});
