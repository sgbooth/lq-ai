# LQ.AI React frontend

React 19.3 + Mantine + Jotai, built as an independent Vite SPA.

```sh
cd app
npm install
npm run dev
```

Open http://localhost:5173. Development proxies `/lq/*` to the existing API on localhost:8000, stripping `/lq`. Set `VITE_API_BASE_URL` to change the API endpoint. The React container serves the compiled SPA through Caddy, including history fallback and same-origin `/lq` API routing.

The canonical LQ.AI Svelte shell’s 48 routes now have React counterparts: chat, matters, skills and workspaces, knowledge, saved prompts, playbooks, tabular review, autonomous work, administration, settings, trust, learning, and the Word add-in sign-in bridge. Reused compositions live in `shared/`; bespoke pages live in `features/`. See [MIGRATION.md](MIGRATION.md) for the route map and validation boundaries.

Login, MFA challenges, required password rotation and logout use the real API. Sessions persist in localStorage, refresh on activity and on a 401, and expire after 30 minutes of inactivity with a five-minute warning. The existing upstream OpenWebUI shell remains in `web/`; this port targets the LQ.AI shell described by ADR 0009. Old `/lq-ai/*` URLs redirect to the matching React routes while preserving query parameters.

The Learn pages reuse the existing standalone educational HTML documents from `web/static/learn`. They contain their own pre-existing diagram presentation and are served as documentation assets, with no Svelte runtime. React UI styling uses Mantine and `global.css` only. Local Vite builds emit these assets; Compose supplies them through the `learning-artifacts` build context.

`npm run check`, `npm test`, `npm run test:browser`, `npm run build`. Browser checks use Chrome by default and mocked APIs; set `PLAYWRIGHT_CHANNEL` for another installed channel. Set `PLAYWRIGHT_BASE_URL=http://localhost:3001` to run them against the compiled container. See AGENTS.md for architecture and component rules.

## Container testing

From the repository root, with Docker running and the existing `.env` configured:

```sh
docker compose --profile react up -d --build react-app
```

Open http://localhost:3001/login. Compose starts the API and its dependencies if needed. The existing Svelte frontend remains on port 3000. Override `REACT_HOST_PORT` to change the React port. After frontend edits, rebuild with the same command (the container serves a compiled bundle).

The first-run email defaults to `admin@lq.ai` (configurable with `LQ_AI_FIRST_RUN_ADMIN_EMAIL`). Find the generated password locally:

```sh
docker compose logs api | rg "First-run admin password"
```

For an existing deployment whose password you have forgotten, the administrative reset command is:

```sh
docker compose exec api python -m app.cli reset-admin-password
```

Resetting changes credentials and requires a password change on next login. Do this only when you intend to reset the account. The React login routes to `/change-password` when required. The release stack continues to use its existing frontend; this is an opt-in development service.

Developer reference cards derive backend docs and metrics URLs from `VITE_API_BASE_URL`. Set `VITE_GATEWAY_BASE_URL` at build time to expose gateway Swagger, ReDoc, OpenAPI JSON and metrics links. Without it, the cards show configuration guidance.
