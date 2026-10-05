# ADR 0038 — Move the LQ.AI product interface from Svelte to React

**Status:** Proposed (2026-10-02)
**Evidence refreshed:** 2026-10-04
**Affected components:** `app/`, `web/`, frontend deployment, CI, contributor guidance
**Relates to:** ADR [0001](0001-openwebui-fork-pin.md) (OpenWebUI fork),
ADR [0002](0002-backend-owned-auth.md) (backend-owned authentication),
ADR [0009](0009-web-lq-ai-shell-coexistence.md) (independent product shell)
**Supersedes on acceptance:** the part of ADR 0009 that puts the LQ.AI product
inside the SvelteKit app. Its separation from OpenWebUI stays.

## What this proposes

LQ.AI is a desktop web app. It is not used on phones or tablets, so mobile layout,
render speed and download size are not criteria in this decision.

Rebuild the LQ.AI user interface in React, in the `app/` folder, and retire the
Svelte version in `web/src/lib/lq-ai` and `web/src/routes/lq-ai`. OpenWebUI itself
is untouched. The rebuild uses Mantine (a ready-made set of buttons, forms, menus
and dialogs), Jotai (state), Wouter (page routing) and Vite (build).

The completed migration has a firm framework boundary: **Svelte is used only by
OpenWebUI. All LQ.AI product pages, components, state and workflows live in React.**
LQ.AI does not use OpenWebUI's Svelte components, stores, routing or runtime. The
existing Svelte LQ.AI shell remains during review and rollback validation; it is
retired at cutover. OpenWebUI continues to run in Svelte after that cutover.

The reasons, most important first:

1. **Semantic architecture.** The code is organized by responsibility, with
   names, boundaries and conventions defined in `AGENTS.md`. Authentication,
   backend calls, shared controls and feature workflows each have a predictable
   home. Changes land in one place, are easier to find, and reach every feature
   that uses that behavior. These conventions give contributors and AI agents
   the same architecture to follow, keeping the product consistent as it grows.
2. **Less code to maintain.** Named components express the purpose of the UI.
   Shared components and Mantine replace repeated layout, styling and feedback
   code. The React frontend has 12,960 code lines compared with 35,648 in Svelte.
   There is less source to read, change, review and keep consistent.
3. **The product looks consistent.** Users have complained about appearance. Today
   114 of 133 Svelte components carry their own styling, so of course the user
   interface is going to drift. In React, one theme and one set of controls cover
   the whole product.
4. **We use Mantine's work instead of rebuilding it.** Mantine is a mature,
   widely used component library. Its buttons, forms, menus, dialogs, tables and
   notifications are already built, tested and kept up to date by a team whose job
   is UI. Building and maintaining our own versions is not a good use of a legal
   product team's time, and the result would be worse. We should take what Mantine
   provides and spend our effort on the legal workflows.
5. **More UI tooling is available.** Mantine itself, and several things we may want
   later (rich-text editing, a command palette, highlighting passages in documents),
   are React-only or React-first. React has far more libraries for these than Svelte.
6. **Nothing still requires Svelte.** We chose Svelte to match OpenWebUI, and the
   product no longer needs to match it (see below). We use no Svelte code from
   OpenWebUI. Svelte lets each component carry its own styling, and in our front end
   that produced 12,533 lines of scattered CSS. Staying on Svelte would cost us
   reasons 1 to 5 and the match with the Word add-in, and we can't point to anything
   it would give us in return. Svelte's usual advantages, fast rendering and small
   downloads, don't matter for a desktop app.

We are not claiming React is better than Svelte in general. The case rests on two
facts: the product no longer needs to match OpenWebUI, and the evidence below.

## Why Svelte was chosen, and why that no longer applies

We used Svelte because OpenWebUI is a Svelte app, and we wanted the product to look
and behave like it. ADR 0001 kept our changes compatible with upstream. ADR 0009
had us reuse OpenWebUI's styling. CONTRIBUTING.md and CLAUDE.md forbid React in
`web/`.

Later decisions undid most of that:

- ADR 0002 moved login and identity to our own FastAPI backend.
- ADR 0009 gave LQ.AI its own components, routes, API code, state and session
  storage, and said the LQ.AI interface may be rewritten without touching upstream
  code.

A search found no imports from OpenWebUI code into the LQ.AI code (outside
`$lib/lq-ai/`). The two still share the SvelteKit setup, global styles and root
layout, but the product works independently of OpenWebUI. So there is no longer a
reason to match its framework. Keeping React out of the OpenWebUI fork is still a
good rule, and the new app lives outside the fork.

## The maintenance problem in the Svelte version

The Svelte version has shared colors and some shared components, but they are used
inconsistently. For example, the skills list and the knowledge list each build their
own loading state, error message and button styling. Token refresh and streaming
are written more than once, in separate request paths. A styling fix means finding
and changing many local style rules. A behavior fix means changing several copies of
the same logic.

## Reason 1: Use Agents to follow architecture

The primary benefit is an explicit architecture that contributors and AI agents
can follow consistently. Folder names identify who owns a responsibility;
component names explain what a piece of UI does; dependency boundaries define
where reusable behavior belongs. That makes the code easier to navigate and
changes easier to implement because agents follow the same documented conventions.

In the Svelte implementation, agents placed new code near the feature they were
working on and made architecture decisions within each task. Presentation, state,
API calls and workflow logic accumulated in the same components, while similar
behavior was implemented separately on other pages. Maintaining a feature meant
reading through layout and styling to find its logic, then finding the other copies
that needed the same change. The React architecture puts those decisions in
`AGENTS.md`, where agents are instructed to follow common rules for ownership,
state, shared behavior and presentation. Each task starts from the same structure,
so changes have a predictable home, shared fixes reach every consumer, and the
code stays consistent across features.

We added two levels of guidance. The root [`AGENTS.md`](../../AGENTS.md) identifies
`app/` as the React frontend, directs agents to its conventions, and keeps the
Svelte migration boundary explicit. [`app/AGENTS.md`](../../app/AGENTS.md) defines
the architecture and conventions inside that frontend:

| Architectural convention                                                                                                                        | How it provides consistency                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth/` owns authentication; `features/{feature}/` owns feature pages, APIs and state; `shared/` owns reusable components and infrastructure    | A change has a predictable home, and related code is easy to find                          |
| `Page`, `Panel`, `Card` and `Popover` names identify component roles; icons use semantic `Icon.Name` exports                                    | Names explain purpose and interaction instead of leaving readers to infer them from markup |
| Feature state lives beside the feature; async orchestration belongs in actions or API modules; components subscribe to the state they render    | State, behavior and presentation follow the same structure across features                 |
| `shared/api.ts` owns request handling, streaming, token refresh and authentication errors; feature clients reuse it                             | A transport or session fix lands in one place and reaches every caller                     |
| `App.tsx` owns routes and access guards; shared modules cannot import feature modules; neither frontend imports application code from the other | Ownership and dependency direction stay clear as the product grows                         |
| Mantine controls, `theme.ts`, one global stylesheet and shared feedback components define presentation                                          | Features use the same controls, appearance and loading/error behavior                      |
| Shared behavior is extracted when a second real consumer appears; composition, atoms or context avoid long chains of passed props               | Reuse follows actual product needs and keeps dependencies understandable                   |

These rules provide a common way to extend the app. A contributor changing token
refresh goes to `shared/api.ts`; one changing page feedback goes to the shared
feedback components; one changing a playbook workflow goes to
`features/playbooks/`. They can find the owner and make the change there, without
searching for several page-specific implementations of the same behavior.

`app/migration.test.ts` checks the mechanical conventions in CI. Review still
checks responsibility boundaries and whether a new implementation follows the
established pattern. The result is consistency in how code is organized, how
behavior is implemented and how the interface is composed. The bug fixes and
shared consumers below demonstrate that changes do land in one place. Reason 2
shows how these conventions also reduce the amount of code we maintain.

### Bugs found in the Svelte version, now fixed

| Svelte bug                                                                                                                                     | Where it is fixed in React                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Two requests fail with a 401 at once; each tries to refresh the login with the same token; the second refresh fails and the user is signed out | `shared/api.ts`: only one refresh runs at a time                                              |
| Idle timeout sends you to the login page but doesn't clear your credentials                                                                    | `hooks/useSessionActivity.ts`, `auth/authApi.ts`: credentials cleared, server session revoked |
| The autonomous opt-in rule wrongly blocks the new orchestration chat page and its receipts                                                     | `App.tsx`: receipts and halt controls always allowed                                          |
| Signing out in one browser tab doesn't sign out the others                                                                                     | `auth/authSession.ts`: tabs stay in sync                                                      |
| A deep link is lost when you're sent to log in first                                                                                           | `App.tsx`, `auth/authRedirect.ts`: you return to the page you wanted                          |
| The OAuth success banner shows the wrong server name                                                                                           | `shared/chat/toolGate.ts`: reads the field the backend actually sends                         |

Each fix has a test. The React serving image also sets a Content-Security-Policy
for model-generated Markdown. Browser checks report CSP violations when run
against that image.

### Shared pieces really are shared

| Shared piece          | Files that use it | What a single change fixes                |
| --------------------- | ----------------: | ----------------------------------------- |
| `FeaturePanel`        |                39 | Page title and layout                     |
| `ResourcePanel`       |                34 | Loading, error and retry for fetched data |
| `ActionFeedback`      |                32 | Progress, error and success messages      |
| `ConfirmButton`       |                21 | "Are you sure?" on destructive actions    |
| `PaginationPanel`     |                 8 | Page-by-page lists                        |
| `MarkdownPanel`       |                 8 | Safe Markdown display                     |
| `ChatPanel`           |                 3 | Chats, matter chat, skill trials          |
| `SkillTryPanel`       |                 2 | Skill detail and skill editor trials      |
| `PlaybookEditorPanel` |                 2 | Both playbook editors                     |

A fix to chat send/cancel or tool approval now reaches chats, matters and skill
trials at once.

## Reason 2: less code to maintain

Less code means fewer implementations to read, change, review and keep consistent.
The component names carry meaning: `Card` defines a content container, `Stack`
defines vertical layout, `Title` defines a heading, and `ActionFeedback` handles
progress, errors and success. A reader can identify each responsibility directly
from the code.

Mantine supplies the controls and their styling. Shared components supply behavior
used across features. Pages compose those pieces instead of repeating their
implementation. A change to spacing goes in the theme or layout component; a
change to feedback goes in `ActionFeedback`. Each consumer gets the change through
that shared implementation.

### Code we maintain

Measured on 2026-10-04, comparing `app/` with `web/src/lib/lq-ai/` and
`web/src/routes/lq-ai/`. The count covers project source. It excludes tests,
generated files, dependencies, config, docs, translations and the shared Learn
pages. Reproduce it with `python3 scripts/frontend_maintenance_metrics.py`.

| Measure                               |   React |    Svelte | Reduction |
| ------------------------------------- | ------: | --------: | --------: |
| Source files                          |     144 |       199 |     27.6% |
| Lines of code (no blanks or comments) |  12,960 |    35,648 |     63.6% |
| Characters                            | 562,905 | 1,322,215 |     57.4% |
| Component files                       |      79 |       133 |     40.6% |
| Components over 500 lines             |       0 |        22 |    100.0% |
| Hand-written CSS lines                |      46 |    12,533 |     99.6% |

The React frontend has 22,688 fewer code lines and 759,310 fewer source characters.
Characters give a size comparison independent of where lines are wrapped. The
reduction in CSS comes from using Mantine controls and theme settings instead of
maintaining styling in individual components.

The Svelte chat component has 1,429 lines. React's `ChatPanel.tsx` has 30 lines and
composes named history, conversation, skill and composer panels. State and async
actions live in separate modules. Readers can go directly to the part responsible
for the change.

### Example: the API playground card

The Svelte [`DevApiPlaygroundCard.svelte`](../../web/src/lib/lq-ai/components/DevApiPlaygroundCard.svelte)
uses two nested `<div>` wrappers: `dev-card` contains `token-row`. Its markup is:

```svelte
<div class="dev-card">
  <h2 class="dev-card-title">API playground</h2>
  <p class="playground-desc">
    Copy your current JWT into Swagger UI's Authorize dialog to make authenticated requests.
  </p>
  <div class="token-row">
    <code
      class="token-display"
      aria-label="JWT token (copy to clipboard)"
    >{truncated}</code>
    <button
      type="button"
      class="copy-btn"
      on:click={copyToken}
      disabled={!token}
    >
      {#if copied}
        Copied
      {:else if copyError}
        Failed
      {:else}
        Copy
      {/if}
    </button>
  </div>
  <p class="playground-footer">
    Paste into Swagger UI's Authorize dialog (Bearer + the token). Token expires; copy again later if a request 401s.
  </p>
</div>
```

The corresponding card in React's
[`DeveloperReferencePanel.tsx`](../../app/features/admin/DeveloperReferencePanel.tsx)
is:

```tsx
<Card withBorder>
  <Stack>
    <Title order={2} size="h3">
      API playground
    </Title>
    <Text>
      Copy your current access token into Swagger’s Authorize dialog to make
      authenticated requests. If a request returns 401, sign in again and copy a
      fresh token.
    </Text>
    <Button
      variant="light"
      disabled={!getAccessToken()}
      onClick={() =>
        void action.run(
          () => navigator.clipboard.writeText(getAccessToken() || ""),
          "Token copied. Paste into Swagger’s Authorize dialog.",
        )
      }
    >
      Copy API access token
    </Button>
    <ActionFeedback {...action} />
  </Stack>
</Card>
```

| API playground card       |           Svelte |                              React |
| ------------------------- | ---------------: | ---------------------------------: |
| Authored `<div>` wrappers |                2 |                                  0 |
| Wrapper nesting depth     | 2 `<div>` levels | 2 named levels: `Card` and `Stack` |
| Local CSS lines           |               69 |                                  0 |

These counts describe the card's authored markup and CSS. Mantine renders the HTML
and supplies the component styles. `Card` and `Stack` state the layout directly;
the Svelte wrappers get their layout from separate class rules. React also uses
`useAction` and `ActionFeedback` for clipboard progress and errors. Svelte keeps
its own `copied` and `copyError` state, timers and conditional feedback. The React
card keeps those responsibilities in the shared implementation. It does not
display the token prefix that the Svelte card displays.

## Reason 3: a consistent look

React with Mantine fixes the appearance complaints at the source:

- **One theme file** (`app/theme.ts`) sets fonts, spacing, colours, shadows and
  dialog defaults for every page.
- **One set of controls** (inputs, menus, dialogs, tables, tabs, navigation), with
  keyboard and screen-reader behavior built in rather than rebuilt per page.
- **One way to show loading, empty and error states**, so pages can't invent their
  own.
- **Light and dark mode** come with the library.

Hand-written CSS drops from 12,533 lines to 46. That shows where the look is now
decided. It doesn't prove every screen looks better. That needs a human review of
the screens (see acceptance below).

## Reason 4: use Mantine's work instead of rebuilding it

Mantine works, and it is fast to build with. Its components are used in many
products, so most of the usability, keyboard and screen-reader problems have already
been found and fixed by people who specialize in this. When we build the same
controls ourselves, we repeat that work with a smaller team and less UI experience,
and we then own the bugs.

In practice:

- Use a Mantine component wherever one exists. Don't write a custom version.
- Change the look through the theme file, not by restyling individual components.
- Spend our design and engineering effort on what Mantine doesn't provide: the
  citation views, skill and playbook screens, matter workflows and approval flows.

This is also why the Svelte version has 12,533 lines of hand-written CSS and the
React version has 46. The Svelte version rebuilt controls that Mantine already has.

## Reason 5: tools we may want later

Some things we are likely to want exist mainly for React:

| Need                            | Option                                        | Where it would help                                                       |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| Command palette                 | `@mantine/spotlight`                          | Search and navigation (the Svelte app shows a ⌘K hint but has no palette) |
| Rich-text editing               | `@mantine/tiptap`, Lexical                    | Writing skills, playbooks and saved prompts                               |
| Notifications, dates, file drop | `@mantine/notifications`, `dates`, `dropzone` | Autonomous alerts, schedules, document upload                             |
| Highlighting in documents       | React PDF libraries                           | Rendering a citation                                                      |
| Rendering .docx files           | React .docx libraries                         | Rendering a citation                                                      |

These are options, not commitments. Each new dependency still needs its own
justification under CLAUDE.md. What this decision does is keep them available.

### The Word add-in

The Word add-in is already built with React and calls the same LQ.AI API. Today the
web app and the add-in are two separate codebases on different frameworks. Moving the
web app to React lets them share one codebase, apart from the parts specific to
Office.js.

## The decision

1. **Make `app/` the LQ.AI product interface** once the acceptance checks below
   pass. React, Mantine, Jotai, Wouter, Vite.
2. **Keep the semantic architecture and conventions explicit:** follow the
   ownership, naming, state and dependency rules in `app/AGENTS.md`. New work
   belongs with the responsibility it changes; reusable behavior has one shared
   implementation. The Mantine theme and shared components define the look, with
   hand-written CSS limited to a few global defaults.
3. **Don't change the backend.** Same API, same backend-owned login. The frontend's
   route guards are a convenience; the backend still enforces access.
4. **Limit Svelte to OpenWebUI after cutover.** All LQ.AI product UI is React in
   `app/`. Retire `web/src/lib/lq-ai` and `web/src/routes/lq-ai` as part of that
   cutover. LQ.AI has no dependency on Svelte components, stores or runtime; React
   stays out of the OpenWebUI fork. The standalone Learn HTML documents are static
   assets and introduce no Svelte runtime dependency.
5. **Switching the default is the admin team's call.** The `app/` work on this
   branch demonstrates that the rebuild is feasible. Before the default changes
   there must be user documentation and a way back, and legacy `/lq-ai/*` links must
   keep working. Removing OpenWebUI altogether needs its own decision.
6. **Check `app/` in CI.** Type checking, formatting, unit tests, the production
   build and mocked browser tests run on every pull request (`app-checks` in
   `.github/workflows/ci.yml`).
7. **Update CONTRIBUTING.md and CLAUDE.md on acceptance:** new product UI goes in
   `app/`; the rule against React in the OpenWebUI fork stays.
8. **Generate API types from the backend** as follow-up work (below).

## What does not work yet

All 48 Svelte pages have a React page; `migration.test.ts` checks this. **Feature
parity is not complete.** [`app/MIGRATION.md`](../../app/MIGRATION.md) lists every
Svelte behavior missing from React as a gap, a changed interaction, or a bug that
already existed in Svelte. The requested parity features are now implemented:

- inline citation verification markers in message text;
- visible plain-English tier explanations and recorded cost in evidence details;
- the playbook "not legal advice" banner and an informational cost preview;
- a self-hosted header indicator and last-response provider/tier footer;
- a Mantine model picker grouped by alias/provider, with account-scoped per-chat memory;
- arrow-key, Enter and Escape navigation for slash suggestions;
- the getting-started checklist and developer reference cards.

The checklist preserves the five tasks actually rendered by Svelte and adds matter
creation as a sixth. The playbook preview states its reference rate/token assumptions;
execution uses the deployment's `smart` alias, so actual charges may differ. Gateway
reference links require `VITE_GATEWAY_BASE_URL` at build time.

**Feature parity is still incomplete.** Remaining gaps in the register must be built
or accepted as product changes before switching. A feature dropped without agreement
doesn't count as simplification.

Test coverage also differs. The Svelte LQ.AI code has 85 test files and about 780
cases, many of them small helper-function tests. React has 13 unit test files with
38 cases, plus 22 mocked browser scenarios covering whole workflows the Svelte
tests did not: login guards, streaming and approval, OAuth return, idle sign-out,
keyboard access to evidence, and CSP violations. Helper tests should be ported
along with each gap. Coverage should be judged by behavior covered, not file count.

## Follow-up: generating API types

Two backends must stay separate (ADR 0009): the LQ.AI backend and OpenWebUI's.

- **LQ.AI.** `app/` calls `/lq/api/v1` (the proxy strips `/lq`). The Word add-in
  uses the same API. `make openapi` already exports
  `docs/api/backend-openapi.generated.yaml`, and `api/tests/test_openapi_export.py`
  checks it hasn't drifted. The React types are still written by hand. Generating
  them is the missing step.
- **OpenWebUI.** `app/` doesn't call it. If that is ever needed, generate a separate
  client from the pinned OpenWebUI version's schema.

What the follow-up needs to do:

1. Generate from the exported LQ.AI schema, not the hand-written sketch. Pin the
   generator version.
2. Put the generated types in their own module, hooked into `shared/api.ts` so token
   refresh, 401/403 handling, cancellation and file downloads keep working. The
   add-in can use the same types with its own transport. `web/` must not depend on
   `app/`.
3. For any OpenWebUI client, record the upstream version and schema, and regenerate
   on each upstream rebase.
4. One command to regenerate, and a CI check that fails if generated code is stale.
   No hand-editing generated files.
5. Keep tests for auth, uploads/downloads, cancellation and streaming. Type and test
   the streaming event types and tool approval explicitly; generated HTTP code
   doesn't cover them.

Generated code adds lines. Report it separately from hand-written code. None of the
numbers above include this work.

## Alternatives considered

- **Create a design system.** This system was proposed in a PR in light of layout
  that provided no semantic guidance (aka div soup). That PR was closed and
  recommended to reimplement as an ADR with a punchlist. In the end, this would have
  been a minimial improvement, but in reality the architecture problems would continue
  to compound. The design system itself simply copied Mantine design using Tailwind
  primitives.
- **Clean up the Svelte frontend instead.** A shared component library and one theme
  in Svelte could fix the visual problems. It would still mean reworking the
  product UI and 12,533 lines of local styling, and it would not give access to the
  React-only tools above or line up with the Word add-in. We have not costed this
  option. The React version exists and can be reviewed now.
- **Keep fixing pages one at a time.** Solves individual complaints, but leaves the
  same logic copied across pages.
- **Put React inside the OpenWebUI fork.** Mixes two frameworks in an app we want to
  keep close to upstream. A separate app matches what ADR 0009 already set up.

## Consequences

Benefits:

- a semantic architecture with clear ownership and predictable places to find code;
- consistent naming, state, dependency and component conventions;
- one place to change shared behavior, reaching every consumer;
- a consistent look;
- 57.4% fewer source characters to maintain;
- smaller components;
- access to React-based UI tools;
- one framework for the web app and the Word add-in.
- AI models all code better in React because larger sample size

Costs:

- reviewing the rebuild and building the remaining gaps;
- contributors may need to rely on AI models to understand React syntax;
- the Svelte and React LQ.AI implementations coexist during migration; OpenWebUI
  keeps its separate Svelte frontend after cutover;
- we depend on Mantine's releases, including breaking changes between major
  versions. Mantine's releases are remarkably stable and also generally
  include a skill file to migrate their components.

A rewrite can lose features, accessibility or tests even when the page names match.
The gap list and acceptance checks are there to catch that.

## Acceptance checks before switching

- **CI.** `app-checks` passes: type check, formatting, unit tests, production
  build, mocked browser tests.
- **Parity.** Every gap in `app/MIGRATION.md` is built or accepted by the
  maintainers as a product change. Every changed interaction is confirmed.
- **Screen review.** Look at representative desktop screens for
  consistent fonts, spacing, navigation, controls, dialogs, and loading, empty and
  error states. Check keyboard use, focus and accessible names. Things like message
  evidence must be reachable without a mouse.
- **Workflows.** Check legacy links, login and refresh failures, password change and
  admin restrictions, streaming and cancel, exports, tool approval and resume, and
  MCP connect from each chat screen.
- **Real integrations** (mocked tests don't prove these): live model providers,
  document ingestion, streaming through Caddy without buffering, Word messaging and
  the add-in sign-in dialog under its eventual CSP, and Slack/Teams.
- **Deployment.** Write down how the default changes and how to roll back. Include
  `LQ_AI_CORS_ORIGINS` for the React origin (needed for the MCP OAuth return) and
  the Word add-in dialog URL. Keep the Svelte deployment available until then.
  Sessions are stored separately, so users sign in again after the switch.

This ADR records evidence for review. It does not record acceptance by the
maintainers or a finished rollout.
