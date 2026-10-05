import { store } from "@/Atoms.ts";
import { changePassword, login, logout } from "@/auth/authApi.ts";
import { sessionAtom } from "@/auth/authAtoms.ts";
import { afterEach, describe, expect, it, vi } from "vitest";
const session = {
  access_token: "test-token",
  refresh_token: "test-refresh",
  expires_in: 3600,
  user: {
    id: "1",
    email: "user@example.com",
    is_admin: false,
    must_change_password: true,
    mfa_enabled: false,
    created_at: "2026-01-01T00:00:00Z",
  },
};
afterEach(() => {
  vi.unstubAllGlobals();
  store.set(sessionAtom, null);
});
describe("authentication API", () => {
  it("stores the actual server session and preserves required password rotation", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(session), { headers: { "Content-Type": "application/json" } }),
      );
    vi.stubGlobal("fetch", fetch);
    await login({ email: "user@example.com", password: "secret" });
    expect(store.get(sessionAtom)).toEqual(session);
    expect(fetch.mock.calls[0][0]).toBe("/lq/api/v1/auth/login");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      email: "user@example.com",
      password: "secret",
    });
  });
  it("does not establish a session after rejected credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: { code: "invalid_credentials", message: "Invalid credentials" },
          }),
          { status: 401 },
        ),
      ),
    );
    await expect(login({ email: "user@example.com", password: "wrong" })).rejects.toMatchObject({
      status: 401,
    });
    expect(store.get(sessionAtom)).toBeNull();
  });
  it("clears local credentials even when logout cannot reach the server", async () => {
    store.set(sessionAtom, session);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")));
    await expect(logout()).rejects.toThrow("Offline");
    expect(store.get(sessionAtom)).toBeNull();
  });
  it("revokes server sessions with the refresh token when the access token has expired", async () => {
    store.set(sessionAtom, session);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Expired" }), { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "fresh", refresh_token: "rotated", expires_in: 900 }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await logout();
    expect(store.get(sessionAtom)).toBeNull();
    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      "/lq/api/v1/auth/logout",
      "/lq/api/v1/auth/refresh",
      "/lq/api/v1/auth/logout",
    ]);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ refresh_token: "test-refresh" });
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe("Bearer fresh");
    expect(store.get(sessionAtom)).toBeNull();
  });
  it("does not restore a session when logout revocation fails after refresh rejection", async () => {
    store.set(sessionAtom, session);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ detail: "Expired" }), { status: 401 })),
    );
    await expect(logout()).rejects.toMatchObject({ status: 401 });
    expect(store.get(sessionAtom)).toBeNull();
  });
  it("keeps the session on failed password changes, then clears it after success", async () => {
    store.set(sessionAtom, session);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Password rejected" }), { status: 400 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await expect(changePassword("old", "new")).rejects.toMatchObject({ status: 400 });
    expect(store.get(sessionAtom)).toEqual(session);
    await changePassword("old", "better");
    expect(store.get(sessionAtom)).toBeNull();
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer test-token");
  });
});
it("does not persist an MFA challenge as a login session", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ mfa_token: "challenge", methods: ["totp"] }), {
        status: 423,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  await expect(login({ email: "user@example.com", password: "secret" })).rejects.toMatchObject({
    status: 423,
    mfaToken: "challenge",
  });
  expect(store.get(sessionAtom)).toBeNull();
});
