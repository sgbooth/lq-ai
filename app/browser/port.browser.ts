import { expect, test, type Page } from "@playwright/test";
import { routes } from "../routes.ts";
const user = {
  id: "user",
  email: "test@example.com",
  is_admin: true,
  role: "admin",
  must_change_password: false,
  mfa_enabled: false,
  created_at: "2026-01-01T00:00:00Z",
};
const session = {
  access_token: "test-only-access",
  refresh_token: "test-only-refresh",
  expires_in: 3600,
  user,
};
const preferences = {
  reasoning_visibility: "disclosure",
  featured_tools: "prominent",
  workspace_layout: "three_pane",
  trust_pills: "labels",
  provenance_pills: "always",
  autonomous_enabled: true,
};
const project = {
  id: "example",
  name: "Example matter",
  owner_id: user.id,
  slug: "example",
  privileged: false,
  attached_file_ids: [],
  attached_skill_names: [],
  attached_knowledge_base_ids: [],
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
const skill = {
  name: "example",
  id: null,
  title: "Example skill",
  description: "Fixture",
  version: "1.0.0",
  scope: "builtin",
  content_md: "## Instructions\nReview the agreement.",
  content_yaml: "",
  inputs: [],
  reference_files: [],
  example_files: [],
  script_files: [],
};
const fixtures: Record<string, unknown> = {
  "/users/me": user,
  "/users/me/preferences": preferences,
  "/projects": [],
  "/projects/example": project,
  "/projects/sandbox/ensure": project,
  "/chats": { items: [], next_cursor: null },
  "/skills": [skill],
  "/skills/example": skill,
  "/skills/example/inputs": { name: "example", required: [], optional: [] },
  "/skills/autocomplete": { results: [] },
  "/chats/search": { items: [] },
  "/user-skills": [],
  "/user-skills/example": {
    ...skill,
    id: "example",
    slug: "example",
    display_name: "Example skill",
    body: "Review the agreement.",
    tags: [],
    description: "Fixture",
    owner_team_id: null,
    frontmatter_extra: {},
  },
  "/teams": [],
  "/teams/mine": [],
  "/skill-workspaces": [],
  "/saved-prompts": [],
  "/knowledge-bases": [],
  "/knowledge-bases/example": {
    id: "example",
    name: "Example knowledge",
    file_count: 0,
    chunk_count: 0,
    hybrid_alpha: 0.5,
  },
  "/knowledge-bases/example/files": [],
  "/models": { data: [{ id: "smart", owned_by: "local" }] },
  "/playbooks": [],
  "/playbook-executions/example": {
    id: "example",
    status: "completed",
    results: {
      summary: { matches_standard: 1, matches_fallback: 0, deviates: 0, missing: 0 },
      positions: [],
    },
  },
  "/tabular/executions": [],
  "/tabular/executions/example": {
    id: "example",
    status: "completed",
    document_ids: [],
    document_names: [],
    columns: [],
    results: { rows: [] },
  },
  "/admin/provider-keys": { provider_keys: [] },
  "/admin/tool-providers": { tool_providers: [] },
  "/admin/aliases": { data: [] },
  "/admin/config": { providers: [], model_aliases: {} },
  "/admin/audit-log": { items: [], next_cursor: null },
  "/admin/users": { users: [], total_count: 0 },
  "/admin/usage": {
    rows: [],
    total_request_count: 0,
    total_tokens_in: 0,
    total_tokens_out: 0,
    total_cost_estimate: 0,
  },
  "/admin/intake-bridges": { slack_workspaces: [], teams_tenants: [] },
  "/autonomous/sessions": { sessions: [], total_count: 0 },
  "/autonomous/memory": { entries: [], total_count: 0 },
  "/autonomous/precedents": { entries: [], total_count: 0 },
  "/autonomous/project-context-proposals": { proposals: [], total_count: 0 },
  "/autonomous/schedules": { schedules: [], total_count: 0 },
  "/autonomous/watches": { watches: [], total_count: 0 },
  "/autonomous/notifications": { notifications: [], total_count: 0 },
  "/autonomous/sessions/example": {
    session: {
      id: "example",
      status: "completed",
      halt_state: "running",
      current_phase: "delivery",
      cost_total_usd: "0.01",
      max_cost_usd: "1",
      params: {},
      result: null,
    },
    receipt: { phase_transitions: [], tool_calls: [], terminal_reason: null },
  },
  "/autonomous/orchestration/chat-runs": { enabled: false },
  "/autonomous/orchestration/chat-runs/example": {
    root_id: "example",
    status: "completed",
    spent_usd: "0.01",
    reserved_usd: "0",
    planning: { goal: "Review fixture" },
    tree: null,
  },
};
async function mock(page: Page) {
  const unknown: string[] = [];
  await page.route("**/lq/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/lq/api/v1", "");
    if (path === "/auth/login") return route.fulfill({ json: session });
    if (path === "/auth/logout") return route.fulfill({ status: 204 });
    if (path === "/auth/refresh")
      return route.fulfill({ json: { ...session, access_token: "refreshed" } });
    if (!(path in fixtures)) {
      unknown.push(path);
      return route.fulfill({ status: 404, json: { detail: "Unmocked API " + path } });
    }
    return route.fulfill({ json: fixtures[path] });
  });
  return unknown;
}
async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByPlaceholder("Your password").fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
}
test("login persists, logout clears credentials, and signed-out routes are guarded", async ({
  page,
}, testInfo) => {
  await mock(page);
  await page.goto("/matters");
  await expect(page).toHaveURL(/\/login\?next=%2Fmatters$/);
  await signIn(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login(\?|$)/);
  expect(await page.evaluate(() => localStorage.getItem("lq_ai_react_auth"))).toBeNull();
});
test("all migrated routes render without runtime or API shape errors", async ({ page }) => {
  test.setTimeout(90000);
  const unknown = await mock(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Only the Caddy image sends a CSP; run with PLAYWRIGHT_BASE_URL to check it.
  page.on("console", (m) => {
    if (m.text().includes("Content Security Policy")) errors.push(m.text());
  });
  await signIn(page);
  const paths = [
    ...routes.map((p) => p.replace(":id", "example").replace(":topic", "how")),
    "/learn/use",
    "/learn/compare",
    "/skills/example?tab=source",
    "/skills/example?tab=try",
    "/skills/example?tab=versions",
  ];
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "Unable to load" })).toHaveCount(0);
    await expect(page.getByLabel("Loading", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("alert").filter({ hasText: "Unable to load" })).toHaveCount(0);
  }
  expect(unknown).toEqual([]);
  expect(errors).toEqual([]);
});
test("admin pages are guarded for a non-admin account", async ({ page }) => {
  await mock(page);
  await page.route("**/lq/api/v1/users/me", (route) =>
    route.fulfill({ json: { ...user, is_admin: false, role: "member" } }),
  );
  await page.addInitScript((s) => localStorage.setItem("lq_ai_react_auth", JSON.stringify(s)), {
    ...session,
    user: { ...user, is_admin: false, role: "member" },
  });
  await page.goto("/admin/provider-keys");
  await expect(page.getByRole("alert")).toContainText("Administrator access required");
});
test("required password rotation takes precedence over product routes", async ({ page }) => {
  await mock(page);
  await page.addInitScript((s) => localStorage.setItem("lq_ai_react_auth", JSON.stringify(s)), {
    ...session,
    user: { ...user, must_change_password: true },
  });
  await page.goto("/matters");
  await expect(page.getByRole("heading", { name: /password/i })).toBeVisible();
});
const sse = (...frames: unknown[]) =>
  frames.map((frame) => "data: " + JSON.stringify(frame) + "\n\n").join("") + "data: [DONE]\n\n";
test("streaming tool approval resumes the same assistant message", async ({ page }) => {
  await mock(page);
  const chat = {
    id: "stream-chat",
    title: "Stream fixture",
    owner_id: user.id,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  let resumed: unknown = null;
  await page.route("**/lq/api/v1/chats", (route) => route.fulfill({ json: chat }));
  await page.route("**/lq/api/v1/chats/stream-chat/messages", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: sse(
        { type: "start", lq_ai_message_id: "assistant", chat_id: chat.id },
        { type: "delta", delta: "Draft", lq_ai_message_id: "assistant" },
        {
          type: "tool_confirmation_required",
          lq_ai_message_id: "assistant",
          pending_call_id: "pending",
          provider: "test",
          tool: "save",
          function_name: "save",
          args_summary: "Save this draft",
          tier: 1,
          destructive: true,
        },
      ),
    }),
  );
  await page.route("**/lq/api/v1/chats/stream-chat/tool-calls/pending", (route) => {
    resumed = route.request().postDataJSON();
    return route.fulfill({
      contentType: "text/event-stream",
      body: sse({
        type: "complete",
        lq_ai_message_id: "assistant",
        message: {
          id: "assistant",
          chat_id: chat.id,
          role: "assistant",
          content: "Saved draft",
          created_at: "2026-01-01",
        },
      }),
    });
  });
  await signIn(page);
  await page.goto("/chats");
  await page.getByLabel("Message", { exact: true }).fill("Review this agreement");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Approve tool action: save")).toBeVisible();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Saved draft", { exact: true })).toBeVisible();
  expect(resumed).toEqual({ decision: "approve" });
  const evidence = page.getByRole("button", { name: "Sources & receipt" });
  await expect(evidence).toHaveCount(1);
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Sources & receipt" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Sources & receipt" })).toHaveCount(0);
  await expect(evidence).toBeFocused();
});
test("enhancement preview preserves the original until explicitly applied", async ({ page }) => {
  await mock(page);
  let outcome: unknown = null;
  await page.route("**/lq/api/v1/enhance-prompt", (route) =>
    route.fulfill({
      json: {
        interaction_id: "enhance",
        expansion_applied: true,
        expanded_prompt: "Review the agreement under New York law.",
        reasoning: ["Adds a specific jurisdiction."],
      },
    }),
  );
  await page.route("**/lq/api/v1/enhance-prompt/enhance", (route) => {
    outcome = route.request().postDataJSON();
    return route.fulfill({ status: 204 });
  });
  await signIn(page);
  await page.goto("/chats");
  await page.getByLabel("Message", { exact: true }).fill("Review agreement");
  await page.getByRole("button", { name: "Enhance prompt", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("Review agreement");
  await page.getByRole("button", { name: "Use enhanced", exact: true }).click();
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
    "Review the agreement under New York law.",
  );
  expect(outcome).toEqual({ used: true, edited_before_use: false });
});
test("learning diagrams are served as interactive standalone documents", async ({ page }) => {
  await page.goto("/learn/playgrounds/tier-system.html");
  await expect(page.locator("body")).toContainText("Tier");
  await expect(page.locator("input, select, button").first()).toBeVisible();
});
test("MFA challenge completes authentication before establishing a session", async ({ page }) => {
  await mock(page);
  let payload: unknown = null;
  await page.route("**/lq/api/v1/auth/login", (route) =>
    route.fulfill({
      status: 423,
      json: { mfa_token: "test-challenge", methods: ["totp", "recovery_code"] },
    }),
  );
  await page.route("**/lq/api/v1/auth/mfa/verify", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: session });
  });
  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByPlaceholder("Your password").fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByLabel("Authenticator or recovery code")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("lq_ai_react_auth"))).toBeNull();
  await page.getByLabel("Authenticator or recovery code").fill("123456");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  expect(payload).toEqual({ mfa_token: "test-challenge", code: "123456" });
});
test("mobile shell opens navigation without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mock(page);
  await signIn(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(page.getByRole("link", { name: "Knowledge", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("mobile.png"), fullPage: true });
});

test("chat actions menu keeps archive confirmation accessible after the menu closes", async ({
  page,
}) => {
  await mock(page);
  let archived = false;
  const chat = {
    id: "menu-chat",
    title: "Menu fixture",
    owner_id: user.id,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  await page.route("**/lq/api/v1/chats?*", (route) =>
    route.fulfill({ json: { items: archived ? [] : [chat], next_cursor: null } }),
  );
  await page.route("**/lq/api/v1/chats/menu-chat", (route) => {
    archived = true;
    return route.fulfill({ json: { ...chat, archived: true } });
  });
  await signIn(page);
  await page.goto("/chats");
  await page.getByRole("button", { name: "Menu fixture", exact: true }).hover();
  await page.getByRole("button", { name: "Actions for Menu fixture" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  const dialog = page.getByRole("dialog", { name: "Archive" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "Menu fixture", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Menu fixture", exact: true }).hover();
  await page.getByRole("button", { name: "Actions for Menu fixture" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await dialog.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Menu fixture", exact: true })).toHaveCount(0);
  expect(archived).toBe(true);
});

test("desktop navigation collapses to a usable icon rail", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mock(page);
  await signIn(page);
  const navbar = page.locator("#primary-navigation");
  await expect(navbar).toHaveCSS("width", "248px");
  await page.getByRole("button", { name: "Collapse navigation to icons" }).click();
  await expect(navbar).toHaveCSS("width", "64px");
  await expect(navbar).toBeVisible();
  await navbar.getByRole("link", { name: "Chats", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Chats", exact: true })).toBeVisible();
  await expect(navbar).toHaveCSS("width", "64px");
  await navbar.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("menuitem", { name: "Appearance", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Appearance & preferences" })).toBeVisible();
  await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
  await expect(navbar).toHaveCSS("width", "248px");
  await expect(navbar.getByRole("link", { name: "Chats", exact: true })).toBeVisible();
});
test("a signed-out deep link returns to the requested page after sign-in", async ({ page }) => {
  await mock(page);
  await page.goto("/matters/example?tab=chat");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel("Email address").fill(user.email);
  await page.getByPlaceholder("Your password").fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/matters\/example\?tab=chat$/);
});
test("autonomous pages wait for the saved setting instead of flashing as disabled", async ({
  page,
}) => {
  await mock(page);
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/lq/api/v1/users/me/preferences", async (route) => {
    await released;
    await route.fulfill({ json: preferences });
  });
  await page.addInitScript(
    (s) => localStorage.setItem("lq_ai_react_auth", JSON.stringify(s)),
    session,
  );
  await page.goto("/autonomous/configure");
  await expect(page.getByLabel("Loading page")).toBeVisible();
  await expect(page.getByText("Autonomous work is disabled")).toHaveCount(0);
  release();
  await expect(page.getByLabel("Loading page")).toHaveCount(0);
  await expect(page.getByText("Autonomous work is disabled")).toHaveCount(0);
});
test("orchestration receipts stay reachable when autonomous work is disabled", async ({ page }) => {
  await mock(page);
  await page.route("**/lq/api/v1/users/me/preferences", (route) =>
    route.fulfill({ json: { ...preferences, autonomous_enabled: false } }),
  );
  await page.addInitScript(
    (s) => localStorage.setItem("lq_ai_react_auth", JSON.stringify(s)),
    session,
  );
  await page.goto("/autonomous/orchestration/chat/example");
  await expect(page.getByText("Review fixture").first()).toBeVisible();
  await page.goto("/autonomous/configure");
  await expect(page.getByText("Autonomous work is disabled")).toBeVisible();
});
test("an expired tool confirmation is cleared with guidance", async ({ page }) => {
  await mock(page);
  const chat = {
    id: "gate-chat",
    title: "Gate fixture",
    owner_id: user.id,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  await page.route("**/lq/api/v1/chats", (route) => route.fulfill({ json: chat }));
  await page.route("**/lq/api/v1/chats/gate-chat/messages", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: sse(
        { type: "start", lq_ai_message_id: "assistant", chat_id: chat.id },
        {
          type: "tool_confirmation_required",
          lq_ai_message_id: "assistant",
          pending_call_id: "pending",
          provider: "test",
          tool: "save",
          function_name: "save",
          args_summary: "Save this draft",
          tier: 1,
          destructive: true,
        },
      ),
    }),
  );
  await page.route("**/lq/api/v1/chats/gate-chat/tool-calls/pending", (route) =>
    route.fulfill({ status: 410, json: { detail: "Pending call expired" } }),
  );
  await signIn(page);
  await page.goto("/chats");
  await page.getByLabel("Message", { exact: true }).fill("Save this");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("This confirmation expired");
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
});
test("returning from tool OAuth restores the matter conversation once", async ({ page }) => {
  await mock(page);
  const chat = {
    id: "matter-chat",
    title: "Matter conversation",
    owner_id: user.id,
    project_id: "example",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  await page.route("**/lq/api/v1/chats/matter-chat", (route) => route.fulfill({ json: chat }));
  await page.route("**/lq/api/v1/chats/matter-chat/messages*", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: "m1",
            chat_id: chat.id,
            role: "user",
            content: "Check the docket",
            created_at: "2026-01-01",
          },
        ],
        next_cursor: null,
      },
    }),
  );
  await page.addInitScript(
    (s) => localStorage.setItem("lq_ai_react_auth", JSON.stringify(s)),
    session,
  );
  await page.goto("/matters/example?mcp_connected=docket&mcp_chat=matter-chat");
  await expect(page.getByText("Connected to docket")).toBeVisible();
  await expect(page.getByText("Check the docket")).toBeVisible();
  await expect(page).toHaveURL(/\/matters\/example$/);
  await page.reload();
  await expect(page.getByText("Connected to docket")).toHaveCount(0);
});
test("idle sign-out revokes the server session even after the access token expires", async ({
  page,
}) => {
  await mock(page);
  await page.clock.install();
  const calls: string[] = [];
  await page.route("**/lq/api/v1/auth/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace("/lq/api/v1", "");
    const bearer = route.request().headers().authorization;
    calls.push(path + " " + (bearer ?? ""));
    if (path === "/auth/logout")
      return bearer === "Bearer refreshed"
        ? route.fulfill({ status: 204 })
        : route.fulfill({ status: 401, json: { detail: "Token expired" } });
    if (path === "/auth/refresh")
      return route.fulfill({ json: { ...session, access_token: "refreshed" } });
    return route.fallback();
  });
  await page.addInitScript(
    (s) => localStorage.setItem("lq_ai_react_auth", JSON.stringify(s)),
    session,
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  await page.clock.runFor(26 * 60_000);
  await expect(page.getByText("Session expires in 5 minutes")).toBeVisible();
  await page.clock.runFor(5 * 60_000);
  await expect(page).toHaveURL(/\/login/);
  await expect.poll(() => calls.at(-1)).toBe("/auth/logout Bearer refreshed");
});

test("slash commands support arrows, Enter and Escape without sending", async ({ page }) => {
  await mock(page);
  await page.route("**/lq/api/v1/skills/autocomplete?**", (route) =>
    route.fulfill({
      json: {
        results: [
          { slug: "example", title: "Example skill", slash_alias: "/example" },
          { slug: "second", title: "Second skill", slash_alias: "/second" },
        ],
      },
    }),
  );
  await page.route("**/lq/api/v1/skills/second/inputs", (route) =>
    route.fulfill({ json: { name: "second", required: [], optional: [] } }),
  );
  await signIn(page);
  await page.goto("/chats");
  const composer = page.getByRole("textbox", { name: "Message", exact: true });
  await composer.fill("/");
  await expect(page.getByRole("listbox", { name: "Slash commands" })).toBeVisible();
  await composer.press("ArrowDown");
  await expect(page.getByRole("option", { name: /Second skill/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await composer.press("Enter");
  await expect(composer).toHaveValue("");
  await expect(page.getByRole("listbox", { name: "Slash commands" })).toHaveCount(0);
  await composer.fill("/");
  await expect(page.getByRole("listbox", { name: "Slash commands" })).toBeVisible();
  await composer.press("Escape");
  await expect(page.getByRole("listbox", { name: "Slash commands" })).toHaveCount(0);
  await expect(composer).toHaveValue("/");
});

test("grouped models persist per chat across reloads and reset for a new chat", async ({
  page,
}) => {
  await mock(page);
  const chats = ["a", "b"].map((id) => ({
    id,
    title: `Chat ${id}`,
    owner_id: user.id,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  }));
  await page.route("**/lq/api/v1/models", (route) =>
    route.fulfill({
      json: {
        object: "list",
        data: [
          {
            id: "smart",
            owned_by: "default",
            lq_ai_kind: "alias",
            lq_ai_resolves_to: "local/small",
            lq_ai_fallback_count: 2,
          },
          {
            id: "local/small",
            owned_by: "local",
            lq_ai_kind: "provider_native",
            routed_inference_tier: 1,
          },
        ],
      },
    }),
  );
  await page.route("**/lq/api/v1/chats", (route) =>
    route.fulfill({ json: { items: chats, next_cursor: null } }),
  );
  for (const chat of chats) {
    await page.route(`**/lq/api/v1/chats/${chat.id}`, (route) => route.fulfill({ json: chat }));
    await page.route(`**/lq/api/v1/chats/${chat.id}/messages`, (route) =>
      route.fulfill({ json: { items: [], next_cursor: null } }),
    );
  }
  await signIn(page);
  await page.goto("/chats?id=a");
  const picker = page.getByRole("combobox", { name: "Model", exact: true });
  await expect(picker).toHaveValue(/smart/);
  await picker.click();
  await expect(page.getByText("Aliases (defaults)", { exact: true })).toBeVisible();
  await page.getByRole("option", { name: /^local\/small/ }).click();
  await page.reload();
  await expect(picker).toHaveValue(/local\/small/);
  await page.goto("/chats?id=b");
  await expect(picker).toHaveValue(/smart/);
  await page.goto("/chats?id=a");
  await expect(picker).toHaveValue(/local\/small/);
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(picker).toHaveValue(/smart/);
});

test("message prose renders safe inline verification, tier meaning and trust footer", async ({
  page,
}) => {
  await mock(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const chat = {
    id: "cited",
    title: "Cited chat",
    owner_id: user.id,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  const message = {
    id: "answer",
    chat_id: chat.id,
    role: "assistant",
    created_at: "2026-01-01",
    content:
      '## Findings\n"quote" (Source: [1]) and “invented” (Source: [2]).\n\n`"code" (Source: [3])`\n\n<img src="x" onerror="window.unsafe=true">',
    routed_provider: "local",
    routed_model: "small",
    routed_inference_tier: 1,
    cost_estimate: 0.01,
  };
  await page.route("**/lq/api/v1/chats/cited", (route) => route.fulfill({ json: chat }));
  await page.route("**/lq/api/v1/chats/cited/messages", (route) =>
    route.fulfill({ json: { items: [message], next_cursor: null } }),
  );
  await page.route("**/lq/api/v1/chats/cited/messages/answer/citations", (route) =>
    route.fulfill({
      json: [
        {
          id: "citation",
          source_file_id: "f",
          source_offset_start: 0,
          source_offset_end: 5,
          source_text: "quote",
          verified: true,
          verification_method: "exact_match",
        },
      ],
    }),
  );
  await signIn(page);
  await page.goto("/chats?id=cited");
  await expect(page.getByText("[Verified verbatim]", { exact: true })).toBeVisible();
  await expect(page.getByText("[Unverified]", { exact: true })).toHaveCount(1);
  await expect(
    page.getByText("Inference stays inside your environment", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Chat status")).toContainText(
    "Last response: local / small · Tier 1",
  );
  await expect(page.locator("img[onerror]")).toHaveCount(0);
  await page.getByRole("button", { name: "Sources & receipt" }).click();
  await expect(page.getByText("Estimated cost: $0.0100")).toBeVisible();
  expect(errors).toEqual([]);
});

test("playbook disclaimer and cost preview are visible before execution", async ({ page }) => {
  await mock(page);
  await page.route("**/lq/api/v1/playbooks", (route) =>
    route.fulfill({
      json: [
        {
          id: "book",
          name: "Review NDA",
          description: "Review",
          contract_type: "NDA",
          version: "1",
          positions: [{}, {}, {}],
        },
      ],
    }),
  );
  await signIn(page);
  await page.goto("/playbooks");
  await expect(page.getByText("Not legal advice", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review document", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Not legal advice", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Estimated review cost: $0.06")).toBeVisible();
  await expect(dialog.getByText(/Execution uses your deployment’s smart alias/)).toBeVisible();
});

test("home shows six completion signals and developer reference cards", async ({ page }) => {
  await mock(page);
  await page.route("**/lq/api/v1/projects", (route) =>
    route.fulfill({ json: [{ ...project, attached_knowledge_base_ids: ["kb"] }] }),
  );
  await page.route("**/lq/api/v1/user-skills", (route) =>
    route.fulfill({ json: [{ id: "saved" }] }),
  );
  await page.addInitScript(() => {
    localStorage.setItem("lq-ai:onboarded:user:skill-document", "true");
    localStorage.setItem("lq-ai:onboarded:user:enhance", "true");
  });
  await signIn(page);
  await expect(page.getByText("6 of 6 complete")).toBeVisible();
  await expect(page.getByText("Run a skill on a document", { exact: true })).toBeVisible();
  await page.goto("/admin/developer");
  await expect(page.getByRole("heading", { name: "API playground" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build your own frontend" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ReDoc (backend)", exact: true })).toHaveAttribute(
    "href",
    "/lq/redoc",
  );
  await expect(
    page.getByRole("link", { name: "OpenAPI JSON (backend)", exact: true }),
  ).toHaveAttribute("href", "/lq/openapi.json");
});
