import { store } from "@/Atoms.ts";
import { sessionAtom } from "@/auth/authAtoms.ts";
import { apiRequest, apiResponseRequest } from "@/shared/api.ts";
import { afterEach, describe, expect, it, vi } from "vitest";
const session = {
  access_token: "old",
  refresh_token: "refresh",
  expires_in: 3600,
  user: {
    id: "u",
    email: "u@example.com",
    is_admin: false,
    mfa_enabled: false,
    must_change_password: false,
    created_at: "2026-01-01",
  },
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
afterEach(() => {
  store.set(sessionAtom, null);
  vi.unstubAllGlobals();
});
describe("shared API session handling", () => {
  it("coalesces concurrent refreshes and retries each request with the new token", async () => {
    store.set(sessionAtom, session);
    let release!: () => void;
    const wait = new Promise<void>((r) => {
      release = r;
    });
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        await wait;
        return json({ access_token: "new", refresh_token: "next", expires_in: 3600 });
      }
      return (init.headers as Record<string, string>).Authorization === "Bearer old"
        ? json({ detail: "expired" }, 401)
        : json({ ok: true });
    });
    vi.stubGlobal("fetch", fetch);
    const a = apiRequest("/a"),
      b = apiRequest("/b");
    await vi.waitFor(() =>
      expect(fetch.mock.calls.filter(([url]) => url.endsWith("/auth/refresh"))).toHaveLength(1),
    );
    release();
    expect(await Promise.all([a, b])).toEqual([{ ok: true }, { ok: true }]);
    expect(store.get(sessionAtom)?.access_token).toBe("new");
  });
  it("does not restore a session when logout occurs during refresh", async () => {
    store.set(sessionAtom, session);
    let release!: (response: Response) => void;
    const pending = new Promise<Response>((r) => {
      release = r;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.endsWith("/auth/refresh") ? pending : Promise.resolve(json({ detail: "expired" }, 401)),
      ),
    );
    const call = apiRequest("/a");
    await vi.waitFor(() =>
      expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2),
    );
    store.set(sessionAtom, null);
    release(json({ access_token: "new", refresh_token: "next", expires_in: 3600 }));
    await expect(call).rejects.toMatchObject({ status: 401 });
    expect(store.get(sessionAtom)).toBeNull();
  });
  it("preserves the session on a permission denial", async () => {
    store.set(sessionAtom, session);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ detail: { code: "forbidden", message: "No access" } }, 403)),
    );
    await expect(apiRequest("/admin")).rejects.toMatchObject({ status: 403, code: "forbidden" });
    expect(store.get(sessionAtom)).toEqual(session);
  });
  it("enforces required password rotation when the server reports it", async () => {
    store.set(sessionAtom, session);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json({ detail: { code: "password_change_required", message: "Rotate" } }, 403),
        ),
    );
    await expect(apiRequest("/a")).rejects.toMatchObject({ status: 403 });
    expect(store.get(sessionAtom)?.user.must_change_password).toBe(true);
  });
  it("clears rejected sessions after a failed refresh", async () => {
    store.set(sessionAtom, session);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ detail: "invalid" }, 401)));
    await expect(apiRequest("/a")).rejects.toMatchObject({ status: 401 });
    expect(store.get(sessionAtom)).toBeNull();
  });
  it("uses the same refresh path for binary exports", async () => {
    store.set(sessionAtom, session);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ detail: "expired" }, 401))
      .mockResolvedValueOnce(json({ access_token: "new", refresh_token: "next", expires_in: 3600 }))
      .mockResolvedValueOnce(new Response("csv", { headers: { "Content-Type": "text/csv" } }));
    vi.stubGlobal("fetch", fetch);
    expect(await (await apiResponseRequest("/export")).text()).toBe("csv");
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe("Bearer new");
  });
  it("does not clear a new login because an old request returns 401", async () => {
    store.set(sessionAtom, session);
    let release!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            release = r;
          }),
      ),
    );
    const call = apiRequest("/a");
    store.set(sessionAtom, { ...session, access_token: "other", refresh_token: "other-refresh" });
    release(json({ detail: "expired" }, 401));
    await expect(call).rejects.toMatchObject({ status: 401 });
    expect(store.get(sessionAtom)?.access_token).toBe("other");
  });
});
