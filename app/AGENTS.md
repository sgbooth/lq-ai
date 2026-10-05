# React frontend conventions

## Structure

- `auth/`: login, logout, password changes, session state and authentication functions.
- `shared/`: reusable components and infrastructure. Any component used more than once belongs here.
- `features/{feature}/`: bespoke feature compositions, pages, APIs, types and feature atoms. Keep feature folders flat until complexity warrants subdivision.
- `hooks/`: reusable hooks; keep feature-only hooks with their feature.
- `Atoms.ts`: explicit Jotai store and cross-cutting atoms only. Feature atoms belong beside their feature.

## Hard rules

- React 19.3, Mantine, Jotai and Tabler icons.
- Use Wouter for routing, consistent with the add-in. Keep route definitions and access guards in `App.tsx`.
- Every component accepting props uses `export const Name: React.FC<Props> = ...` (import React as a type when appropriate).
- Names: `NamePage` for routed pages, `NamePanel` for independently composed panels, `NameCard` for cards, `NameHoverCard` for hover cards, `NamePopover` for click-opened popovers. Content that must be reachable by keyboard or touch uses a button-triggered popover, not a hover card.
- `global.css` is the only authored CSS file. Reserve it for application-wide defaults and resets; no feature/component CSS files or CSS modules.
- Use Mantine components, theme configuration and Mantine layout/style props for component styling. Avoid inline `style`/`styles` objects and style tags.
- Import Mantine’s required library stylesheet and `global.css` once in `main.tsx`; do not import CSS from components.
- Menus, modals and select dropdowns use medium (`md`) shadows, configured centrally in `theme.ts`. Do not override them with weaker shadows.
- Never drill props through more than one intermediary. Use composition, feature atoms or context instead.
- Consume icons through semantic `Icon.Name` components in `shared/Icon.tsx`; Tabler imports stay there. Decorative icons are hidden from assistive technology; icon-only buttons need accessible names.
- Shared modules must not import feature modules. No imports from the Svelte frontend.
- Use named exports, PascalCase component files, feature-prefixed camelCase logic files, and `@/` imports with `.ts`/`.tsx` extensions.
- Keep pure data out of JSX and component return expressions. Declare static navigation, cards, options, tabs, and column metadata as named module-level constants above the component. Derive data that depends on props, state, or fetched results inside the component before its return; render the named values. Keep event handlers and presentation props with the UI.
- Prefer feature root atoms with derived field atoms; async orchestration belongs in actions or API modules. Components subscribe to the state they render. Live handles remain separate from serializable state.
- Distinguish 401 (invalid session) from 403 (permission denied). UI route guards are not server authorization.
- Keep transient popovers short; file pickers and lengthy forms belong in persistent panels or modals.
- Colocate meaningful tests; cover API/session failure paths. Never log passwords or tokens.

## Flexible conventions

- Extract duplication when a second real consumer appears; avoid speculative abstractions.
- Prefer pure, framework-independent helpers. Preserve cancellation and ignore stale async results.
- Use 2 spaces, double quotes, semicolons, trailing commas and 100-column formatting.

## Commands

`npm install`, `npm run dev`, `npm run check`, `npm test`, `npm run test:browser`, `npm run build`, `npm run format` from `app/`.
Vite is the static SPA build/dev server; REST calls use the existing LQ.AI API. Do not import IPbasis's RPC/server infrastructure.

## Migration boundaries

- `App.tsx` owns lazy routes and UI access guards. `routes.ts` lists product routes for migration checks. Preserve legacy `/lq-ai/*` redirects and query parameters.
- `shared/api.ts` owns JSON, streaming and binary response handling, token refresh, and typed authentication errors. Feature clients must reuse it.
- Existing self-contained Learn playground documents are static educational assets, supplied from `web/static/learn` without a Svelte runtime. Do not add application/component styling to those documents.
- Browser checks mock the API and must not make billable model calls or mutate the developer’s actual data. Live provider execution and Office/Slack/Teams host integrations require separate integration validation.
