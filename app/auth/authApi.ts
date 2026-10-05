import { store } from "@/Atoms.ts";
import { sessionAtom } from "@/auth/authAtoms.ts";
import { setUser } from "@/auth/authSession.ts";
import type { LoginRequest, Session } from "@/auth/authTypes.ts";
import { apiRequest, request, UnauthorizedError } from "@/shared/api.ts";
import type { TokenResponse, User } from "@/shared/types.ts";
export async function login(credentials: LoginRequest): Promise<Session> {
  const session = await request<Session>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  store.set(sessionAtom, session);
  return session;
}
/**
 * Clear local credentials immediately, then revoke server sessions. The access token is
 * usually expired by an idle logout, so a 401 falls back to the captured refresh token.
 */
export async function logout(): Promise<void> {
  const session = store.get(sessionAtom);
  store.set(sessionAtom, null);
  if (!session) return;
  const revoke = (token: string) =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      skipAuth: true,
      skipRefresh: true,
    });
  try {
    await revoke(session.access_token);
  } catch (error) {
    if (!(error instanceof UnauthorizedError) || !session.refresh_token) throw error;
    const fresh = await apiRequest<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: session.refresh_token },
      skipAuth: true,
      skipRefresh: true,
    });
    await revoke(fresh.access_token);
  }
}
export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<void> {
  const session = store.get(sessionAtom);
  if (!session) throw new Error("Please sign in again.");
  await request<void>("/auth/change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ current_password, new_password }),
  });
  store.set(sessionAtom, null);
}

export interface BootstrapStatus {
  default_password_active: boolean;
  logs_hint: string;
}
export const getBootstrapStatus = () => request<BootstrapStatus>("/admin/bootstrap-status");

export async function verifyMfa(mfa_token: string, code: string): Promise<Session> {
  const session = await request<Session>("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ mfa_token, code }),
  });
  store.set(sessionAtom, session);
  return session;
}

export async function syncCurrentUser(): Promise<void> {
  const id = store.get(sessionAtom)?.user.id;
  const user = await request<User>("/users/me");
  if (store.get(sessionAtom)?.user.id === id) setUser(user);
}
