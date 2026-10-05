# React migration

The 48 routed pages of the canonical LQ.AI shell have React implementations in `app/`. The inherited OpenWebUI shell remains separate in `web/`, consistent with ADR 0009. This does not port or remove OpenWebUI’s upstream chat/admin/workspace screens.

## Refactoring

- Shared page chrome, resource/action feedback, confirmations, pagination, chat/message rendering, skill inputs and sandbox trials, Markdown, evidence and playbook editing use Mantine compositions.
- Chat state and async conversation actions use Jotai and a cancellable controller. Selections ignore late results. Authentication refresh is shared across concurrent requests and guarded against logout/new-login races.
- All props-bearing components use named `React.FC<Props>` exports. Semantic Tabler icons go through `Icon`. `global.css` is the only authored React stylesheet; overlay shadows are centralized in the Mantine theme.
- REST clients keep existing LQ.AI contracts. The React SPA uses same-origin `/lq/api/v1` calls; Caddy strips `/lq` before forwarding to the API. No Svelte component or store imports occur in application code.
- The 24 existing standalone Learn playgrounds remain static educational documents. Both frontends can serve the same source assets. Their existing document styles are unchanged.

## Route map

Legacy `/lq-ai/*` links redirect to these React paths. IDs retain the existing backend identity. Learn uses one React page for its three topic routes. Schedule/watch creation also has dedicated `/new` routes.

| Svelte route                                | React route                           |
| ------------------------------------------- | ------------------------------------- |
| `/lq-ai`                                    | `/`                                   |
| `/lq-ai/admin/audit-log`                    | `/admin/audit-log`                    |
| `/lq-ai/admin/developer`                    | `/admin/developer`                    |
| `/lq-ai/admin/intake-bridges`               | `/admin/intake-bridges`               |
| `/lq-ai/admin/models`                       | `/admin/models`                       |
| `/lq-ai/admin/provider-keys`                | `/admin/provider-keys`                |
| `/lq-ai/admin/research-sources`             | `/admin/research-sources`             |
| `/lq-ai/admin/word-addin`                   | `/admin/word-addin`                   |
| `/lq-ai/autonomous`                         | `/autonomous`                         |
| `/lq-ai/autonomous/configure`               | `/autonomous/configure`               |
| `/lq-ai/autonomous/matters`                 | `/autonomous/matters`                 |
| `/lq-ai/autonomous/memory`                  | `/autonomous/memory`                  |
| `/lq-ai/autonomous/notifications`           | `/autonomous/notifications`           |
| `/lq-ai/autonomous/orchestration/chat`      | `/autonomous/orchestration/chat`      |
| `/lq-ai/autonomous/orchestration/chat/[id]` | `/autonomous/orchestration/chat/[id]` |
| `/lq-ai/autonomous/precedents`              | `/autonomous/precedents`              |
| `/lq-ai/autonomous/proposals`               | `/autonomous/proposals`               |
| `/lq-ai/autonomous/schedules`               | `/autonomous/schedules`               |
| `/lq-ai/autonomous/sessions/[id]`           | `/autonomous/sessions/[id]`           |
| `/lq-ai/autonomous/watches`                 | `/autonomous/watches`                 |
| `/lq-ai/change-password`                    | `/change-password`                    |
| `/lq-ai/chats`                              | `/chats`                              |
| `/lq-ai/knowledge`                          | `/knowledge`                          |
| `/lq-ai/knowledge/[id]`                     | `/knowledge/[id]`                     |
| `/lq-ai/learn`                              | `/learn`                              |
| `/lq-ai/learn/build`                        | `/learn/build`                        |
| `/lq-ai/learn/compare`                      | `/learn/compare`                      |
| `/lq-ai/learn/how`                          | `/learn/how`                          |
| `/lq-ai/learn/use`                          | `/learn/use`                          |
| `/lq-ai/login`                              | `/login`                              |
| `/lq-ai/matters`                            | `/matters`                            |
| `/lq-ai/matters/[id]`                       | `/matters/[id]`                       |
| `/lq-ai/playbook-executions/[id]`           | `/playbook-executions/[id]`           |
| `/lq-ai/playbooks`                          | `/playbooks`                          |
| `/lq-ai/playbooks/easy`                     | `/playbooks/easy`                     |
| `/lq-ai/saved-prompts`                      | `/saved-prompts`                      |
| `/lq-ai/settings/account`                   | `/settings/account`                   |
| `/lq-ai/settings/appearance`                | `/settings/appearance`                |
| `/lq-ai/settings/autonomous`                | `/settings/autonomous`                |
| `/lq-ai/skills`                             | `/skills`                             |
| `/lq-ai/skills/[id]`                        | `/skills/[id]`                        |
| `/lq-ai/skills/[id]/edit`                   | `/skills/[id]/edit`                   |
| `/lq-ai/skills/new`                         | `/skills/new`                         |
| `/lq-ai/skills/workspaces`                  | `/skills/workspaces`                  |
| `/lq-ai/tabular`                            | `/tabular`                            |
| `/lq-ai/tabular/[id]`                       | `/tabular/[id]`                       |
| `/lq-ai/tabular/new`                        | `/tabular/new`                        |
| `/lq-ai/trust`                              | `/trust`                              |
| `/lq-ai/word-addin/oauth-start`             | `/word-addin/oauth-start`             |

## Validation

`npm run check`, `npx prettier --check .`, `npm test`, `npm run build` and `npm run test:browser` run in CI (`app-checks` in `.github/workflows/ci.yml`).

Unit tests cover:

- authentication failures, coalesced refresh, logout/new-login races and password rotation;
- logout revocation after the access token expires, and cross-tab session adoption;
- safe post-login redirects and binary export authentication;
- stale conversation loads, cancellation and expired tool confirmations;
- MCP OAuth return parsing, skill metadata/inputs and UTC cron previews;
- route coverage and the explicit styling/import rules, including required import extensions and no imports from `web/`.

Playwright uses mocked API data. It checks every migrated route (and reports CSP violations when run against the Caddy image), login persistence/logout, and deep-link return after sign-in. It also covers:

- admin, password-change and autonomous-setting guards, including orchestration receipts while autonomous work is disabled;
- tool approval/resume, expired confirmations and the MCP OAuth return to a matter conversation;
- keyboard access to message evidence, enhanced-prompt confirmation and MFA challenge completion;
- idle sign-out revocation, mobile and collapsed navigation, and a standalone learning document.

Run the suite against the production image with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:browser`.

These checks validate UI and client behavior without real provider keys or billable work. Live model/provider execution, document ingestion workers, Office host messaging and Slack/Teams OAuth installations have not been validated end to end.

## Deployment notes

- The React container remains an opt-in Compose service (`--profile react`) on port 3001; the Svelte service remains on port 3000.
- Caddy sends a restrictive Content-Security-Policy for the SPA (no remote images, scripts or connections) and a separate policy for standalone Learn documents. The Word add-in sign-in route is excluded until its policy is validated inside an Office host.
- `/lq/*` is proxied without compression so server-sent chat streams are not buffered; confirm with a live streaming turn before promotion.
- MCP connect-on-demand returns the browser to the page that started it. The backend accepts that return URL only when its origin is listed in `LQ_AI_CORS_ORIGINS` (for local use, `http://127.0.0.1:3001`). An empty allowlist rejects the connect flow on either frontend.
- The Word add-in still opens `/lq-ai/word-addin/oauth-start` on the deployment origin. React serves that legacy path; pointing the add-in at the React origin is part of the default-entry transition.

## Behavior parity register

Each Svelte behavior absent from React must be accepted as a product change or ported before promotion. Status values: **ported** (implemented in React), **gap** (to port), **changed** (different interaction to confirm), **pre-existing** (broken in Svelte too).

| Svelte behavior                                                                                    | Svelte source                                                                | React state                                                                                      | Status       |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------ |
| Inline colour-coded citation markers in message prose                                              | `citations/decorate-inline.ts`, `M2Citations.svelte`                         | Mantine inline verification labels; embedded citations or lazy fetch; code blocks excluded       | ported       |
| Plain-English tier meaning (data-retention posture), cost estimate                                 | `TierDetailsPanel.svelte`                                                    | Visible tier explanations; evidence details include recorded cost estimate                       | ported       |
| "Not legal advice" disclaimer on playbooks and executions                                          | `PlaybookDisclaimerBanner.svelte`                                            | Shared Mantine alert on playbooks, editor, generation and execution                              | ported       |
| Playbook execution cost preview                                                                    | `PlaybookExecuteModal.svelte`, `playbookCost.ts`                             | Visible reference estimate with token/rate assumptions; smart routing caveat                     | ported       |
| Ambient trust chrome (self-hosted pill, provider + tier footer by the composer)                    | `AmbientTrustChrome.svelte`, `AmbientFooter.svelte`                          | Self-hosted header indicator (labels/dots); last response provider/model/tier footer             | ported       |
| Model picker grouped by alias/provider; model remembered per chat                                  | `ModelPicker.svelte`, `ChatPanel.svelte` (`groupModels`, `defaultSelection`) | Mantine grouped select with alias resolution/fallbacks; validated account/chat memory            | ported       |
| Slash-command typeahead with arrow/Enter selection (`role="listbox"`)                              | `SlashPopover.svelte`                                                        | Arrow/Enter/Escape selection, listbox options and active descendant; IME respected               | ported       |
| Getting-started checklist driven by six usage signals                                              | `GettingStartedChecklist.svelte`, `getting-started-signals.ts`               | Six tasks: five legacy tasks plus matter creation; server signals and account-scoped usage flags | ported       |
| Featured tools row on home                                                                         | `FeaturedToolsRow.svelte`                                                    | Absent                                                                                           | gap          |
| Developer cards: ReDoc, gateway Swagger, OpenAPI JSON, metrics links, API playground, fork callout | `Dev*Card.svelte`, `DevForkCallout.svelte`                                   | Backend references, configured gateway references, playground, roles and React fork guidance     | ported       |
| Glossary tooltips on product terms                                                                 | `InfoTip.svelte`                                                             | Absent                                                                                           | gap          |
| Inline saved-prompts panel above the composer                                                      | `SavedPromptsPanel.svelte`                                                   | Saved prompts page pre-fills the composer                                                        | changed      |
| Four-section guided skill wizard                                                                   | `SkillWizard.svelte`                                                         | Single form with Edit / Preview / Try draft tabs                                                 | changed      |
| Chat sidebar grouped by matter                                                                     | `ChatSidebar.svelte`                                                         | Flat list filtered by the current matter                                                         | changed      |
| Receipts drawer open state remembered per chat                                                     | `ReceiptsDrawer.svelte`                                                      | Evidence opens on demand                                                                         | changed      |
| Appearance settings `trust_pills`, `provenance_pills`, `reasoning_visibility`, `workspace_layout`  | `settings/appearance`                                                        | Saved but not read by any component (also `featured_tools` in React)                             | pre-existing |

React additions not present in Svelte: matter and chat archiving, tabular execution deletion, playbook edit/delete, a client-side admin guard, collapsible icon navigation, mobile navigation and a colour-scheme menu.

## Svelte defects fixed by the React implementation

| Svelte defect                                                                           | React behavior                                                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Concurrent 401s each refresh with the same rotated token; the loser clears the session  | Refresh is coalesced and guarded against logout/new-login races                       |
| Idle timeout navigates to the login page without clearing credentials                   | Idle timeout clears credentials and revokes server sessions using the refresh token   |
| Autonomous opt-in regex exempts the new orchestration chat page and blocks its receipts | Receipts and halt controls are exempt; configuration pages wait for the saved setting |
| Tabs do not observe each other's sign-out or refresh-token rotation                     | Sessions sync through `storage` events                                                |
| Deep links are lost through the login redirect                                          | `?next=` returns to the requested same-origin page                                    |
| OAuth success banner reads the server name from the wrong parameter                     | Reads `mcp_connected={server}` as sent by the backend                                 |
| Remote images in model Markdown can be fetched with no CSP                              | The SPA policy restricts images to same-origin, `data:` and `blob:`                   |

The legacy getting-started component actually renders five tasks, although the original
register described six signals. React retains those five and adds matter creation.
Skill-on-document and Enhance Prompt completion use account-scoped browser usage memory;
password rotation, matter creation, knowledge-base attachment and saved skills use server state.

Playbook cost previews retain the legacy reference token budget and explicit $3/$15 per
million input/output rate assumptions. They do not claim live pricing: the executor uses
`smart`, and its configured model and actual usage may differ. Gateway reference links use
`VITE_GATEWAY_BASE_URL`; an unconfigured deployment shows setup text instead of guessing a host.
