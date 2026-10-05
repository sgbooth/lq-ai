import { store } from "@/Atoms.ts";
import { sessionAtom } from "@/auth/authAtoms.ts";
import { clearSession, getAccessToken, getRefreshToken, setSession } from "@/auth/authSession.ts";
import type { ErrorBody, TokenResponse } from "@/shared/types.ts";
export const LQ_AI_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/lq/api/v1").replace(
  /\/$/,
  "",
);
export class LQAIApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "LQAIApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class UnauthorizedError extends LQAIApiError {
  constructor(message = "Not authenticated", details?: Record<string, unknown>) {
    super(401, "unauthorized", message, details);
    this.name = "UnauthorizedError";
  }
}

export class PasswordChangeRequiredError extends LQAIApiError {
  constructor(message = "Password change required", details?: Record<string, unknown>) {
    super(403, "password_change_required", message, details);
    this.name = "PasswordChangeRequiredError";
  }
}

export class MfaChallengeError extends LQAIApiError {
  constructor(readonly mfaToken: string) {
    super(423, "mfa_required", "Enter an authenticator or recovery code.");
  }
}
interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip auth header attachment (used by /auth/login + /auth/refresh). */
  skipAuth?: boolean;
  /** Skip the on-401 refresh-and-retry (used by /auth/refresh itself). */
  skipRefresh?: boolean;
  /** Override the `Accept` header (e.g., for SSE). */
  accept?: string;
  /** When true, expect a streaming response and return the raw `Response`. */
  stream?: boolean;
  /** Multipart form body; replaces `body`. */
  formData?: FormData;
  signal?: AbortSignal;
}

/**
 * Internal: perform a single HTTP request with auth header attachment and
 * structured error translation. Caller handles refresh / retry.
 */
async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };

  if (options.formData) {
    // Browsers set the multipart Content-Type with boundary themselves.
  } else if (options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  if (options.accept) {
    headers["Accept"] = options.accept;
  }

  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    signal: options.signal,
  };

  if (options.formData) {
    init.body = options.formData;
  } else if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  return fetch(`${LQ_AI_API_BASE_URL}${path}`, init);
}

async function performRefresh(): Promise<boolean> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    return false;
  }
  const res = await rawRequest("/auth/refresh", {
    method: "POST",
    body: { refresh_token },
    skipAuth: true,
    skipRefresh: true,
  });
  if (!res.ok) {
    return false;
  }
  const data = (await res.json()) as TokenResponse;
  if (getRefreshToken() !== refresh_token) return false;
  setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  });
  return true;
}

async function parseErrorBody(res: Response): Promise<ErrorBody | null> {
  try {
    return (await res.json()) as ErrorBody;
  } catch {
    return null;
  }
}

/**
 * Extract a human-readable error message + code from the three FastAPI
 * detail shapes:
 *
 *   1. String:   `{ "detail": "some message" }` — the common plain-text shape.
 *   2. Object:   `{ "detail": { "code": "...", "message": "...", "details": {} } }`
 *                — LQ.AI structured error shape.
 *   3. Array:    `{ "detail": [{ "msg": "...", "type": "...", "loc": [...] }] }`
 *                — Pydantic ValidationError shape (FastAPI 422 responses).
 *
 * Falls back to a generic "Request failed with status N" message when none of
 * the above shapes match.
 */
function errorFor(status: number, body: ErrorBody | null): LQAIApiError {
  const challenge = body as unknown as { mfa_token?: unknown } | null;
  if (status === 423 && typeof challenge?.mfa_token === "string")
    return new MfaChallengeError(challenge.mfa_token);
  const detail = body?.detail;

  let code = `http_${status}`;
  let message = `Request failed with status ${status}`;
  let details: Record<string, unknown> | undefined;

  if (detail !== null && detail !== undefined) {
    if (typeof detail === "string") {
      // Shape 1: { "detail": "some message" }
      message = detail;
    } else if (Array.isArray(detail)) {
      // Shape 3: Pydantic ValidationError — [{ "msg": "...", ... }, ...]
      const first = detail[0];
      if (first && typeof first === "object" && "msg" in first) {
        message = String((first as { msg: unknown }).msg);
      }
    } else if (typeof detail === "object") {
      // Shape 2: LQ.AI structured error — { "code": "...", "message": "...", ... }
      const d = detail as Record<string, unknown>;
      if (typeof d.code === "string") code = d.code;
      if (typeof d.message === "string") message = d.message;
      if (d.details && typeof d.details === "object" && !Array.isArray(d.details)) {
        details = d.details as Record<string, unknown>;
      }
    }
  }

  if (status === 401) {
    return new UnauthorizedError(message, details);
  }
  if (status === 403 && code === "password_change_required") {
    return new PasswordChangeRequiredError(message, details);
  }
  return new LQAIApiError(status, code, message, details);
}

/**
 * JSON request: serialize body, parse JSON response, throw typed errors on
 * non-2xx. Refresh-and-retry once on 401.
 */
export async function apiResponseRequest(
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  let token = getAccessToken();
  let res = await rawRequest(path, options);
  if (
    res.status === 401 &&
    !options.skipRefresh &&
    !options.skipAuth &&
    getAccessToken() === token
  ) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      token = getAccessToken();
      res = await rawRequest(path, options);
    }
  }
  if (!res.ok) {
    const err = errorFor(res.status, await parseErrorBody(res));
    if (err instanceof PasswordChangeRequiredError && getAccessToken() === token) {
      const session = store.get(sessionAtom);
      if (session)
        store.set(sessionAtom, {
          ...session,
          user: { ...session.user, must_change_password: true },
        });
    }
    if (err.status === 401 && !options.skipAuth && getAccessToken() === token) clearSession();
    throw err;
  }
  return res;
}
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await apiResponseRequest(path, options);
  if (res.status === 204) return undefined as T;
  return res.headers.get("content-type")?.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);
}
export const apiStreamRequest = (path: string, options: RequestOptions = {}) =>
  apiResponseRequest(path, { ...options, accept: "text/event-stream" });

let refreshFlight: { token: string | null; promise: Promise<boolean> } | null = null;
async function refreshOnce(): Promise<boolean> {
  const token = getRefreshToken();
  if (refreshFlight?.token === token) return refreshFlight.promise;
  const flight = { token, promise: performRefresh() };
  refreshFlight = flight;
  void flight.promise
    .finally(() => {
      if (refreshFlight === flight) refreshFlight = null;
    })
    .catch(() => {});
  return flight.promise;
}
export { LQAIApiError as ApiError };
// Auth-specific RequestInit adapter retained for the initial scaffold.
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, {
    method: (options.method || "GET") as RequestOptions["method"],
    body: typeof options.body === "string" ? JSON.parse(options.body) : undefined,
    headers: options.headers as Record<string, string> | undefined,
    signal: options.signal ?? undefined,
    skipAuth:
      path === "/auth/login" || path === "/auth/mfa/verify" || path === "/admin/bootstrap-status",
    skipRefresh: path === "/auth/login" || path === "/auth/mfa/verify",
  });
}

export const refreshSession = refreshOnce;
