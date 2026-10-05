export const articles = {
  "/": [
    {
      kind: "heading",
      text: "Learn",
      links: [],
    },
    {
      kind: "text",
      text: "A guided introduction to LQ.AI for everyone — practicing attorneys curious about what the project does, security and procurement teams evaluating it for deployment, engineers exploring the architecture, and anyone considering contributing a skill. The three sections below address a different question: what it does, how it works, and how to contribute.",
      links: [],
    },
    {
      kind: "text",
      text: "Every claim on these pages is backed by a path to verify it in the codebase. If the docs say something the code does not do, the code is canonical — please open an issue.",
      links: [],
    },
    {
      kind: "text",
      text: "📋 How to Use What every feature does, in plain language. With links to source for every claim. Explore →",
      links: [
        {
          label:
            "📋 How to Use What every feature does, in plain language. With links to source for every claim. Explore →",
          href: "/learn/use",
        },
      ],
    },
    {
      kind: "text",
      text: "🔍 How It Works Interactive playgrounds that show how the system fits together. Click any visualization to verify claims against the source. Explore →",
      links: [
        {
          label:
            "🔍 How It Works Interactive playgrounds that show how the system fits together. Click any visualization to verify claims against the source. Explore →",
          href: "/learn/how",
        },
      ],
    },
    {
      kind: "text",
      text: "🔧 How to Build How to contribute a skill, a mini-PRD, or a bug fix. What's open right now. Explore →",
      links: [
        {
          label:
            "🔧 How to Build How to contribute a skill, a mini-PRD, or a bug fix. What's open right now. Explore →",
          href: "/learn/build",
        },
      ],
    },
    {
      kind: "text",
      text: "⚖️ How It Compares An evidence-linked, vendor-neutral comparison — every capability claim links to the code, ADR, or interactive playground that proves it. Explore →",
      links: [
        {
          label:
            "⚖️ How It Compares An evidence-linked, vendor-neutral comparison — every capability claim links to the code, ADR, or interactive playground that proves it. Explore →",
          href: "/learn/compare",
        },
      ],
    },
  ],
  "/how": [
    {
      kind: "text",
      text: "← Learn",
      links: [
        {
          label: "← Learn",
          href: "/learn",
        },
      ],
    },
    {
      kind: "heading",
      text: "How It Works",
      links: [],
    },
    {
      kind: "text",
      text: "Twenty-two interactive surfaces. Together they tell the story of how LQ.AI works from request to response — the engine, its boundaries, the M3 capability surfaces built on top, the governed tool boundary, and the fiduciary-grade cluster that records, verifies, and derives from what that boundary retrieves. Each playground links to the source files that implement what it shows — if a visualization makes a claim, the linked file is where you verify it.",
      links: [],
    },
    {
      kind: "heading",
      text: "1. The big picture: System Architecture",
      links: [],
    },
    {
      kind: "text",
      text: "LQ.AI is three services: the FastAPI backend (api/), the Inference Gateway (gateway/), and the React web frontend (app/). They communicate over HTTP using OpenAPI-defined contracts; no service shares in-process code with another. The Gateway is the security boundary — the only component that holds provider API keys and makes outbound inference calls. This map shows the service topology, the network boundaries, and the trust model.",
      links: [],
    },
    {
      kind: "playground",
      src: "/learn/playgrounds/system-architecture.html",
      text: "System Architecture Map",
    },
    {
      kind: "text",
      text: "Open full-screen ↗ Source: docs/architecture.md Every interaction starts at the frontend and travels through the backend to the Gateway. The next playground traces that path step by step. 2. A request, end to end: Lifecycle of a chat send When you press Enter in the composer, the message travels through at least six distinct processing stages before the model sees it — and through three more before the response reaches your screen. Each stage can add context (skill prompt, KB chunks, tier metadata), apply a policy check, or produce an audit record. This playground walks the full path so you can see where each transformation happens and which file implements it. Open full-screen ↗ Source: api/app/api/chats.py; gateway/app/router.py One of the Gateway's most consequential processing steps is tier enforcement — deciding whether the requested provider is permitted for the matter's sensitivity level. The next playground makes that decision legible. 3. The tier system: when the Gateway says no The Gateway enforces five data-sensitivity tiers (Tier 1 = local / air-gapped, most secure; Tier 5 = consumer, least secure). When a request arrives, the Gateway compares the requested provider's tier against the matter's configured floor. A floor of Tier N means \"require Tier N or stronger\" — if the provider's tier is weaker (higher-numbered) than the floor, the request is refused with a structured error, not a generic 500. This playground lets you set a matter context and a model alias and see whether the request would pass or be refused — the same logic the Gateway runs at gateway/app/tier_floor.py. Open full-screen ↗ Source: gateway/app/tier_floor.py If the tier check passes, the Gateway forwards the request. But what exactly does the model receive? The next playground disassembles the assembled prompt so you can see each layer. 4. What the model actually sees: Skill Composition When a skill is invoked, the final prompt the model receives is an assembly of layers: the skill's system prompt, any input variables resolved against the user's message, reference file content, KB chunks retrieved for this specific message, and the conversation history. This playground lets you toggle each layer on or off and watch the assembled context update in real time. The assembly logic lives at api/app/pipeline/. Open full-screen ↗ Source: api/app/pipeline/ Once the model responds, the chat surface renders the output — but every citation the model emits has to be verified against the source before it counts. The next playground walks the 4-stage cascade that decides which citations show up as verified, which show up as \"verified with caveats,\" and which surface as unverified. 5. Verifying what the model said: Citation Engine cascade Every \"<quote>\" (Source: [N]) the model emits runs through a four-stage verification cascade: exact match → tolerant match → paraphrase judge → optional ensemble. The first stage to verify wins; failures cascade. A citation that misses every stage is not persisted — its absence is the \"unverified\" signal the M2-C2 UI consumes. This playground lets you pick or craft a (source, quote) pair and watch which stage verifies, what the persisted verification_method would be, and how the chat surface would render it. Open full-screen ↗ Source: api/app/citation/verification.py; docs/citation-engine.md The Citation Engine answers \"did the model quote the source faithfully\" — but a parallel question is \"what did the model see in the first place?\" The Anonymization Layer pseudonymizes sensitive entities before any chat content leaves the gateway and rehydrates pseudonyms on the return path. The next playground shows the full pipeline. 6. Confidentiality: Anonymization Layer pre/post The gateway's Anonymization Layer (M2-B3) is pre/post middleware that pseudonymizes detected entities (PERSON, ORGANIZATION, EMAIL_ADDRESS, PHONE_NUMBER, LOCATION, US_BANK_NUMBER + custom CASE_NUMBER and MATTER_NUMBER) before requests leave for the model provider, and rehydrates the pseudonyms on the response. The per-request PseudonymMapper lives in process memory only — never persisted, never logged, dropped on function exit. Privileged-project chats skip the layer entirely; retrieval-context system messages skip via lq_ai_skip_anonymization so source quotes reach the model intact for citation grounding. This playground walks the full pipeline with toggles for both skip behaviors. Honest validation posture: the custom recognizers and middleware integration are tested; Presidio default-recognizer recall/precision on legal-document corpus specifically is empirically unmeasured — docs/security/anonymization.md §\"What's validated vs unvalidated\" for the risk framing and route-to-Tier-1 guidance. Open full-screen ↗ Source: gateway/app/anonymization/; docs/security/anonymization.md Understanding what the model receives answers the \"what\" — but procurement and security teams also need to know where that data is stored and whether it ever leaves the operator's environment. The next playground addresses that directly. 7. Where your data lives: Data Residency LQ.AI is self-hosted. By default, all conversation data, knowledge base content, and skill definitions stay within the operator's deployment — they never touch LegalQuants infrastructure. The only outbound path is the inference call from the Gateway to the chosen provider, and only when the matter's tier floor permits it. This map shows every data store, every outbound boundary, and which tiers cross each boundary. The Anonymization Layer middleware (M2-shipped — see playground 6 above) is one of the controls that crosses this surface; this map shows where its pre/post substitution sits relative to every storage and egress point in the system. Open full-screen ↗ Source: docs/architecture.md; gateway/app/router.py The seven playgrounds above trace the engine and its boundaries. The final three demonstrate the M3 capability surfaces — Playbooks, Tabular Review, and the Word add-in — built on that engine. 8. Reviewing a contract: the Playbook execution cascade A Playbook codifies an organization's standard positions on common contract issues. Applying one runs a four-node LangGraph cascade — retrieve → classify → redline → compile — that walks each position, extracts the matching clause, classifies it against the standard, and drafts a redline where it deviates. This playground steps through that cascade position-by-position against synthetic NDAs. The per-position references are the verbatim matched clause text (lexical FTS), not the M2 Citation Engine verification cascade — that integration is deferred. Open full-screen ↗ Source: api/app/playbooks/nodes.py; docs/playbooks.md A Playbook reviews one contract against many positions. Tabular Review inverts that — many contracts against a few questions, in a grid. 9. Comparing many contracts: the Tabular Review grid Tabular Review extracts the same set of questions across a set of documents and lays the answers out in a grid — one row per document, one column per question. Each cell is grounded in the chunks the model cited; click a cell to open its citation drawer. This playground renders a small grid of synthetic NDAs; the citation drawer shows the same fields the real surface does. Per-cell citations are display-only chunk references today (a synthetic citation id), not Citation-Engine-resolved provenance. Open full-screen ↗ Source: api/app/tabular/nodes.py; docs/tabular-review.md Playbooks and Tabular Review run in the web app. The Word add-in brings the deployment into the operator's editor — the last playground walks its install and auth flow. 10. Into the editor: the Word add-in install + auth flow The Word add-in is an Office.js task pane installed against the operator's own deployment. This playground walks the four-stage flow: admin generates a per-deployment manifest, the operator sideloads the unsigned manifest via the Microsoft 365 Admin Center (which warns about the unsigned add-in — expected at v0.3.0), the task pane completes OAuth against the deployment, and the version handshake confirms compatibility. M3 shipped the plumbing only — the in-pane feature surface (chat, skills, playbooks) is deferred (DE-287; M4 closed without it — community-friendly), and the signed distribution package is community-led. Open full-screen ↗ Source: api/app/api/word_addin.py; docs/word-addin.md Every chat-send, playbook run, and tabular extraction emits a distributed trace. The final playground makes the full span hierarchy visible — from the HTTP boundary at the api down through inference dispatch, anonymization, and citation verification — so operators can answer latency, cost, and data-handling questions from a single trace view. 11. Seeing it all at once: the observability trace Every chat-send is one OpenTelemetry trace spanning api → gateway → provider, with domain spans for citation verification, anonymization, skill dispatch, and inference carrying counts and types only — never raw entity values, prompt text, or response content. This playground lets you toggle the citation path, anonymization state, workflow type, and provider tier to see how the span tree changes, and shows which span attribute answers each of the five questions an operator is most likely to ask in production. Open full-screen ↗ Source: docs/observability.md; api/app/observability_helpers.py 12. Autonomy you can audit: the Autonomous flow The Autonomous Layer (M4, shipped) runs a single agent on your behalf — on a schedule, or when documents arrive — without you watching each step. Because no human approves each action, the agent runs through declared phases behind one brake-checked chokepoint, and every run produces an auditable receipt. Step through a session below and trip each brake yourself. Open full-screen ↗ Source: agentic-flow-alignment-guide.md; ADR 0013 The flow above showed a single session start to finish. But what schedules those sessions, what feeds them documents, and what captures what they learn? The next playground breaks the Autonomous Layer into its four primitives. 13. The four autonomous primitives: watches, schedules, memory, precedent An autonomous session does not run in isolation — it is wired to four primitives that decide when it runs and what it carries across runs. Watches trigger a session when matching documents arrive; schedules trigger it on a cron-like cadence; memory persists what a session learned so later runs build on it; and the precedent lifecycle promotes vetted work product into reusable precedent. This playground steps through each primitive and shows how it feeds the session you saw in playground 12. The Autonomous Layer shipped in M4. Open full-screen ↗ Source: api/app/api/autonomous.py; docs/autonomous-layer.md Every one of these surfaces — chat, playbooks, autonomous sessions — leans on the same retrieval foundation: finding the right knowledge-base chunks for a given query. The next playground opens up how that retrieval actually works. 14. Finding the right chunks: knowledge-base hybrid retrieval When a message needs grounding context, LQ.AI does not rely on vector search alone. It runs hybrid retrieval: a lexical full-text-search pass (Postgres FTS) and a vector cosine-similarity pass run in parallel, and their results are fused into a single ranked set so that both exact-term matches and semantically-related passages surface. This playground lets you issue a query against synthetic KB chunks and watch the lexical scores, the vector scores, and the fused ranking that the engine ultimately uses. Knowledge-base retrieval shipped in M1. Open full-screen ↗ Source: api/app/knowledge/retrieval.py; api/app/api/knowledge_bases.py Retrieval finds the right chunks, but the chunks are only part of the context. A matter's organization profile, its attachments, and its privilege and tier settings all shape what a request is allowed to do. The next playground shows that context being assembled. 15. The matter's context: projects, org profile, and tier floors Every request runs inside a matter (a project), and the matter carries the context that shapes it: the organization profile (the house voice and standard positions), the matter's attachments and knowledge bases, and its privilege flag and tier floor. This playground lets you configure a matter and watch how each of those settings flows into the assembled request — including how a privileged matter or a stricter tier floor narrows which providers the Gateway will permit. Projects, organization profiles, and tier floors shipped in M1. Open full-screen ↗ Source: api/app/api/projects.py; gateway/app/tier_floor.py Everything so far has been about work already inside LQ.AI. The last playground covers getting work in — the Slack and Teams intake bridges — and is honest about how much of it is verified today. 16. Getting work in: the Slack/Teams intake bridges The intake bridges let an operator connect a Slack workspace or a Microsoft Teams tenant so that requests can flow into LQ.AI from where the business already works. This playground walks the OAuth install flow and the admin lifecycle (list, soft-delete) for a connected bridge. Honest partial state: the backend plumbing and admin lifecycle shipped in M3, but the live OAuth install handshake is unverified against real Slack and Teams tenants (DE-312), and the inbound /lq command path is inert — it does not yet dispatch a request (DE-288). Treat this surface as scaffolding, not a production-ready intake channel. Open full-screen ↗ Source: docs/intake-bridges.md; api/app/api/admin_intake_bridges.py The newest capability lets the assistant look up case law and reach operator-approved connectors — without ever loosening the security boundary. This last playground walks that governed path and lets you switch each guardrail off to see how the boundary reacts. 17. Case-law & connectors: the governed tool boundary When the assistant looks up case law (CourtListener) or calls an operator-approved connector (an MCP server), the request leaves your environment only through the Inference Gateway — the single audited egress. The operator chooses which connectors exist; every call is tier-gated and audited (counts and types only, never the raw arguments or results); per-user connector tokens travel in a header and are never logged; and a destructive tool pauses for your explicit approval. Step through the flow, then flip any guardrail off to see the boundary refuse, prompt, or pause. Available today: the governed backend tool-loop, egress boundary, per-user OAuth, audit, the confirmation-gate protocol, the in-chat confirmation and connect prompts that render this gate inside the chat, rich case-law provenance — source-kinded citations with provenance pills for the external sources a tool call pulled in — and the procedural case-law research skill. Open full-screen ↗ Source: ADR 0014; ADR 0015; api/app/chat/tool_loop.py The governed tool boundary above answers \"what can the assistant reach, and how is that reach controlled.\" The five playgrounds below answer what happens to what it reaches: where that authority content is registered, where the record of what was read lives, how a turn's citations are verified against that record before they render, what is derived from the record after the fact (is this still good law?), and the governed agentic session that orchestrates all four across the life of a matter — plan, act, observe, replan, one brake-checked chokepoint at a time. This is the fiduciary-grade cluster. 18. Where authority comes from: the content-source registry Every authority citation traces back to a registered content source — CourtListener, SEC EDGAR, EUR-Lex, and the others in the 4-entry registry. Each source declares its name, type, jurisdiction, coverage, content kinds, and the operations it supports; the registry is what the governed tool boundary (section 17) consults to decide what an authority lookup can reach. This playground lets you inspect each source, toggle whether it is operator-configured, and see how the registry reports availability. Honest state: EUR-Lex is get-by-CELEX only — no keyword search (DE-374) or treaty lookup (DE-375) yet. Sources are operator-config-gated; a registered source with no configured provider is reported unavailable-with-reason, never silently omitted. The registry exposes name / type / jurisdiction / coverage / content_kinds / ops only — never auth keys, cost, or secrets (ADR 0021). Open full-screen ↗ Source: api/app/research/registry.py; ADR 0021 The registry says what a lookup is allowed to reach. The next playground shows what gets recorded once it does. 19. The record of what was read: the Citation Ledger Every claim a turn makes against a source — quoted or provenance-only — writes a ledger entry: the claim text, the source id, and (for quote-bearing claims) a character offset into that source. This playground shows a turn's ledger entries; click a quote-bearing claim to trace it to its source id and offset, and see how a provenance-only entry (a source a tool call surfaced but that no claim quotes) differs. Honest state: the ledger references content by id + character offset only — no raw payloads live in the audit layer (P3). A trace resolves an id + offset; the quoted text itself is not stored in the ledger row (ADR 0018). Open full-screen ↗ Source: api/app/citation/ledger.py; ADR 0018 A ledger entry is a record, not a verdict. The next playground shows how a turn's ledger entries are recomputed into a pass/fail decision before the response is allowed to render. 20. Derive, don't assert: the fiduciary-grade gate The gate assembles a turn's citation set from its ledger entries and recomputes a PASS / SUPPORTED / FAIL verdict live and deterministically — it never trusts a previously-stored verdict. This playground lets you assemble a citation set from quote-bearing and provenance-only claims and watch the verdict recompute as you add or remove entries. Honest state: chat vs autonomous verdict-tier parity gaps remain (DE-370 / DE-371) — the gate runs on both the chat and autonomous paths, but tier handling is not yet identical across them (ADR 0018 D3). Open full-screen ↗ Source: api/app/citation/gate.py; ADR 0018 The gate verifies a citation at the moment it renders. A separate question is whether the case behind that citation is still good law months or years later — the next playground covers what gets derived after the fact. 21. Is it still good law? the derived treatment layer For a cited case, the treatment layer computes a rollup — how citing cases have treated it — from the citation graph plus a bounded judge pass over citing-case signals. This playground lets you pick a cited case and inspect the derived treatment rollup alongside the citing-case signals that produced it. Honest state: derived, not editorial — computed from the citation graph plus a judge pass, not an authoritative citator. Judge input snippets are transient and never stored (P3); the stored row is a rollup (derived_method='citation_graph+judge') with a 30-day TTL and a bounded judge budget (ADR 0019). Open full-screen ↗ Source: api/app/citation/treatment.py; ADR 0019 Registry, ledger, gate, and treatment layer are four separate mechanisms. The last playground puts them together inside a single governed session that plans, acts, observes, and replans over the life of a matter. 22. Putting it together: a governed agentic matter session A matter session runs a plan → act → observe → replan loop over a matter's research — the same brakes that gate autonomous flow (section 12), plus a per-phase step cap. Each act step is a governed tool call: the model chooses which registered source to query and when, the ledger records what it read, and the gate verifies each citation before it reaches you. This playground steps through a session and lets you trip each brake yourself. Honest state: the backend is shipped; there is no dedicated matter-intake UI yet — this capability reuses the autonomous session UI. An out-of-allowlist planner proposal is rejected, not executed; the model chooses which governed tool and when — it never invents one (ADR 0020 / ADR 0015). Open full-screen ↗ Source: api/app/autonomous/planner.py; api/app/autonomous/guard.py; ADR 0020 Ready to contribute?",
      links: [
        {
          label:
            "Open full-screen ↗ Source: docs/architecture.md Every interaction starts at the frontend and travels through the backend to the Gateway. The next playground traces that path step by step. 2. A request, end to end: Lifecycle of a chat send When you press Enter in the composer, the message travels through at least six distinct processing stages before the model sees it — and through three more before the response reaches your screen. Each stage can add context (skill prompt, KB chunks, tier metadata), apply a policy check, or produce an audit record. This playground walks the full path so you can see where each transformation happens and which file implements it. Open full-screen ↗ Source: api/app/api/chats.py; gateway/app/router.py One of the Gateway's most consequential processing steps is tier enforcement — deciding whether the requested provider is permitted for the matter's sensitivity level. The next playground makes that decision legible. 3. The tier system: when the Gateway says no The Gateway enforces five data-sensitivity tiers (Tier 1 = local / air-gapped, most secure; Tier 5 = consumer, least secure). When a request arrives, the Gateway compares the requested provider's tier against the matter's configured floor. A floor of Tier N means \"require Tier N or stronger\" — if the provider's tier is weaker (higher-numbered) than the floor, the request is refused with a structured error, not a generic 500. This playground lets you set a matter context and a model alias and see whether the request would pass or be refused — the same logic the Gateway runs at gateway/app/tier_floor.py. Open full-screen ↗ Source: gateway/app/tier_floor.py If the tier check passes, the Gateway forwards the request. But what exactly does the model receive? The next playground disassembles the assembled prompt so you can see each layer. 4. What the model actually sees: Skill Composition When a skill is invoked, the final prompt the model receives is an assembly of layers: the skill's system prompt, any input variables resolved against the user's message, reference file content, KB chunks retrieved for this specific message, and the conversation history. This playground lets you toggle each layer on or off and watch the assembled context update in real time. The assembly logic lives at api/app/pipeline/. Open full-screen ↗ Source: api/app/pipeline/ Once the model responds, the chat surface renders the output — but every citation the model emits has to be verified against the source before it counts. The next playground walks the 4-stage cascade that decides which citations show up as verified, which show up as \"verified with caveats,\" and which surface as unverified. 5. Verifying what the model said: Citation Engine cascade Every \"<quote>\" (Source: [N]) the model emits runs through a four-stage verification cascade: exact match → tolerant match → paraphrase judge → optional ensemble. The first stage to verify wins; failures cascade. A citation that misses every stage is not persisted — its absence is the \"unverified\" signal the M2-C2 UI consumes. This playground lets you pick or craft a (source, quote) pair and watch which stage verifies, what the persisted verification_method would be, and how the chat surface would render it. Open full-screen ↗ Source: api/app/citation/verification.py; docs/citation-engine.md The Citation Engine answers \"did the model quote the source faithfully\" — but a parallel question is \"what did the model see in the first place?\" The Anonymization Layer pseudonymizes sensitive entities before any chat content leaves the gateway and rehydrates pseudonyms on the return path. The next playground shows the full pipeline. 6. Confidentiality: Anonymization Layer pre/post The gateway's Anonymization Layer (M2-B3) is pre/post middleware that pseudonymizes detected entities (PERSON, ORGANIZATION, EMAIL_ADDRESS, PHONE_NUMBER, LOCATION, US_BANK_NUMBER + custom CASE_NUMBER and MATTER_NUMBER) before requests leave for the model provider, and rehydrates the pseudonyms on the response. The per-request PseudonymMapper lives in process memory only — never persisted, never logged, dropped on function exit. Privileged-project chats skip the layer entirely; retrieval-context system messages skip via lq_ai_skip_anonymization so source quotes reach the model intact for citation grounding. This playground walks the full pipeline with toggles for both skip behaviors. Honest validation posture: the custom recognizers and middleware integration are tested; Presidio default-recognizer recall/precision on legal-document corpus specifically is empirically unmeasured — docs/security/anonymization.md §\"What's validated vs unvalidated\" for the risk framing and route-to-Tier-1 guidance. Open full-screen ↗ Source: gateway/app/anonymization/; docs/security/anonymization.md Understanding what the model receives answers the \"what\" — but procurement and security teams also need to know where that data is stored and whether it ever leaves the operator's environment. The next playground addresses that directly. 7. Where your data lives: Data Residency LQ.AI is self-hosted. By default, all conversation data, knowledge base content, and skill definitions stay within the operator's deployment — they never touch LegalQuants infrastructure. The only outbound path is the inference call from the Gateway to the chosen provider, and only when the matter's tier floor permits it. This map shows every data store, every outbound boundary, and which tiers cross each boundary. The Anonymization Layer middleware (M2-shipped — see playground 6 above) is one of the controls that crosses this surface; this map shows where its pre/post substitution sits relative to every storage and egress point in the system. Open full-screen ↗ Source: docs/architecture.md; gateway/app/router.py The seven playgrounds above trace the engine and its boundaries. The final three demonstrate the M3 capability surfaces — Playbooks, Tabular Review, and the Word add-in — built on that engine. 8. Reviewing a contract: the Playbook execution cascade A Playbook codifies an organization's standard positions on common contract issues. Applying one runs a four-node LangGraph cascade — retrieve → classify → redline → compile — that walks each position, extracts the matching clause, classifies it against the standard, and drafts a redline where it deviates. This playground steps through that cascade position-by-position against synthetic NDAs. The per-position references are the verbatim matched clause text (lexical FTS), not the M2 Citation Engine verification cascade — that integration is deferred. Open full-screen ↗ Source: api/app/playbooks/nodes.py; docs/playbooks.md A Playbook reviews one contract against many positions. Tabular Review inverts that — many contracts against a few questions, in a grid. 9. Comparing many contracts: the Tabular Review grid Tabular Review extracts the same set of questions across a set of documents and lays the answers out in a grid — one row per document, one column per question. Each cell is grounded in the chunks the model cited; click a cell to open its citation drawer. This playground renders a small grid of synthetic NDAs; the citation drawer shows the same fields the real surface does. Per-cell citations are display-only chunk references today (a synthetic citation id), not Citation-Engine-resolved provenance. Open full-screen ↗ Source: api/app/tabular/nodes.py; docs/tabular-review.md Playbooks and Tabular Review run in the web app. The Word add-in brings the deployment into the operator's editor — the last playground walks its install and auth flow. 10. Into the editor: the Word add-in install + auth flow The Word add-in is an Office.js task pane installed against the operator's own deployment. This playground walks the four-stage flow: admin generates a per-deployment manifest, the operator sideloads the unsigned manifest via the Microsoft 365 Admin Center (which warns about the unsigned add-in — expected at v0.3.0), the task pane completes OAuth against the deployment, and the version handshake confirms compatibility. M3 shipped the plumbing only — the in-pane feature surface (chat, skills, playbooks) is deferred (DE-287; M4 closed without it — community-friendly), and the signed distribution package is community-led. Open full-screen ↗ Source: api/app/api/word_addin.py; docs/word-addin.md Every chat-send, playbook run, and tabular extraction emits a distributed trace. The final playground makes the full span hierarchy visible — from the HTTP boundary at the api down through inference dispatch, anonymization, and citation verification — so operators can answer latency, cost, and data-handling questions from a single trace view. 11. Seeing it all at once: the observability trace Every chat-send is one OpenTelemetry trace spanning api → gateway → provider, with domain spans for citation verification, anonymization, skill dispatch, and inference carrying counts and types only — never raw entity values, prompt text, or response content. This playground lets you toggle the citation path, anonymization state, workflow type, and provider tier to see how the span tree changes, and shows which span attribute answers each of the five questions an operator is most likely to ask in production. Open full-screen ↗ Source: docs/observability.md; api/app/observability_helpers.py 12. Autonomy you can audit: the Autonomous flow The Autonomous Layer (M4, shipped) runs a single agent on your behalf — on a schedule, or when documents arrive — without you watching each step. Because no human approves each action, the agent runs through declared phases behind one brake-checked chokepoint, and every run produces an auditable receipt. Step through a session below and trip each brake yourself. Open full-screen ↗ Source: agentic-flow-alignment-guide.md; ADR 0013 The flow above showed a single session start to finish. But what schedules those sessions, what feeds them documents, and what captures what they learn? The next playground breaks the Autonomous Layer into its four primitives. 13. The four autonomous primitives: watches, schedules, memory, precedent An autonomous session does not run in isolation — it is wired to four primitives that decide when it runs and what it carries across runs. Watches trigger a session when matching documents arrive; schedules trigger it on a cron-like cadence; memory persists what a session learned so later runs build on it; and the precedent lifecycle promotes vetted work product into reusable precedent. This playground steps through each primitive and shows how it feeds the session you saw in playground 12. The Autonomous Layer shipped in M4. Open full-screen ↗ Source: api/app/api/autonomous.py; docs/autonomous-layer.md Every one of these surfaces — chat, playbooks, autonomous sessions — leans on the same retrieval foundation: finding the right knowledge-base chunks for a given query. The next playground opens up how that retrieval actually works. 14. Finding the right chunks: knowledge-base hybrid retrieval When a message needs grounding context, LQ.AI does not rely on vector search alone. It runs hybrid retrieval: a lexical full-text-search pass (Postgres FTS) and a vector cosine-similarity pass run in parallel, and their results are fused into a single ranked set so that both exact-term matches and semantically-related passages surface. This playground lets you issue a query against synthetic KB chunks and watch the lexical scores, the vector scores, and the fused ranking that the engine ultimately uses. Knowledge-base retrieval shipped in M1. Open full-screen ↗ Source: api/app/knowledge/retrieval.py; api/app/api/knowledge_bases.py Retrieval finds the right chunks, but the chunks are only part of the context. A matter's organization profile, its attachments, and its privilege and tier settings all shape what a request is allowed to do. The next playground shows that context being assembled. 15. The matter's context: projects, org profile, and tier floors Every request runs inside a matter (a project), and the matter carries the context that shapes it: the organization profile (the house voice and standard positions), the matter's attachments and knowledge bases, and its privilege flag and tier floor. This playground lets you configure a matter and watch how each of those settings flows into the assembled request — including how a privileged matter or a stricter tier floor narrows which providers the Gateway will permit. Projects, organization profiles, and tier floors shipped in M1. Open full-screen ↗ Source: api/app/api/projects.py; gateway/app/tier_floor.py Everything so far has been about work already inside LQ.AI. The last playground covers getting work in — the Slack and Teams intake bridges — and is honest about how much of it is verified today. 16. Getting work in: the Slack/Teams intake bridges The intake bridges let an operator connect a Slack workspace or a Microsoft Teams tenant so that requests can flow into LQ.AI from where the business already works. This playground walks the OAuth install flow and the admin lifecycle (list, soft-delete) for a connected bridge. Honest partial state: the backend plumbing and admin lifecycle shipped in M3, but the live OAuth install handshake is unverified against real Slack and Teams tenants (DE-312), and the inbound /lq command path is inert — it does not yet dispatch a request (DE-288). Treat this surface as scaffolding, not a production-ready intake channel. Open full-screen ↗ Source: docs/intake-bridges.md; api/app/api/admin_intake_bridges.py The newest capability lets the assistant look up case law and reach operator-approved connectors — without ever loosening the security boundary. This last playground walks that governed path and lets you switch each guardrail off to see how the boundary reacts. 17. Case-law & connectors: the governed tool boundary When the assistant looks up case law (CourtListener) or calls an operator-approved connector (an MCP server), the request leaves your environment only through the Inference Gateway — the single audited egress. The operator chooses which connectors exist; every call is tier-gated and audited (counts and types only, never the raw arguments or results); per-user connector tokens travel in a header and are never logged; and a destructive tool pauses for your explicit approval. Step through the flow, then flip any guardrail off to see the boundary refuse, prompt, or pause. Available today: the governed backend tool-loop, egress boundary, per-user OAuth, audit, the confirmation-gate protocol, the in-chat confirmation and connect prompts that render this gate inside the chat, rich case-law provenance — source-kinded citations with provenance pills for the external sources a tool call pulled in — and the procedural case-law research skill. Open full-screen ↗ Source: ADR 0014; ADR 0015; api/app/chat/tool_loop.py The governed tool boundary above answers \"what can the assistant reach, and how is that reach controlled.\" The five playgrounds below answer what happens to what it reaches: where that authority content is registered, where the record of what was read lives, how a turn's citations are verified against that record before they render, what is derived from the record after the fact (is this still good law?), and the governed agentic session that orchestrates all four across the life of a matter — plan, act, observe, replan, one brake-checked chokepoint at a time. This is the fiduciary-grade cluster. 18. Where authority comes from: the content-source registry Every authority citation traces back to a registered content source — CourtListener, SEC EDGAR, EUR-Lex, and the others in the 4-entry registry. Each source declares its name, type, jurisdiction, coverage, content kinds, and the operations it supports; the registry is what the governed tool boundary (section 17) consults to decide what an authority lookup can reach. This playground lets you inspect each source, toggle whether it is operator-configured, and see how the registry reports availability. Honest state: EUR-Lex is get-by-CELEX only — no keyword search (DE-374) or treaty lookup (DE-375) yet. Sources are operator-config-gated; a registered source with no configured provider is reported unavailable-with-reason, never silently omitted. The registry exposes name / type / jurisdiction / coverage / content_kinds / ops only — never auth keys, cost, or secrets (ADR 0021). Open full-screen ↗ Source: api/app/research/registry.py; ADR 0021 The registry says what a lookup is allowed to reach. The next playground shows what gets recorded once it does. 19. The record of what was read: the Citation Ledger Every claim a turn makes against a source — quoted or provenance-only — writes a ledger entry: the claim text, the source id, and (for quote-bearing claims) a character offset into that source. This playground shows a turn's ledger entries; click a quote-bearing claim to trace it to its source id and offset, and see how a provenance-only entry (a source a tool call surfaced but that no claim quotes) differs. Honest state: the ledger references content by id + character offset only — no raw payloads live in the audit layer (P3). A trace resolves an id + offset; the quoted text itself is not stored in the ledger row (ADR 0018). Open full-screen ↗ Source: api/app/citation/ledger.py; ADR 0018 A ledger entry is a record, not a verdict. The next playground shows how a turn's ledger entries are recomputed into a pass/fail decision before the response is allowed to render. 20. Derive, don't assert: the fiduciary-grade gate The gate assembles a turn's citation set from its ledger entries and recomputes a PASS / SUPPORTED / FAIL verdict live and deterministically — it never trusts a previously-stored verdict. This playground lets you assemble a citation set from quote-bearing and provenance-only claims and watch the verdict recompute as you add or remove entries. Honest state: chat vs autonomous verdict-tier parity gaps remain (DE-370 / DE-371) — the gate runs on both the chat and autonomous paths, but tier handling is not yet identical across them (ADR 0018 D3). Open full-screen ↗ Source: api/app/citation/gate.py; ADR 0018 The gate verifies a citation at the moment it renders. A separate question is whether the case behind that citation is still good law months or years later — the next playground covers what gets derived after the fact. 21. Is it still good law? the derived treatment layer For a cited case, the treatment layer computes a rollup — how citing cases have treated it — from the citation graph plus a bounded judge pass over citing-case signals. This playground lets you pick a cited case and inspect the derived treatment rollup alongside the citing-case signals that produced it. Honest state: derived, not editorial — computed from the citation graph plus a judge pass, not an authoritative citator. Judge input snippets are transient and never stored (P3); the stored row is a rollup (derived_method='citation_graph+judge') with a 30-day TTL and a bounded judge budget (ADR 0019). Open full-screen ↗ Source: api/app/citation/treatment.py; ADR 0019 Registry, ledger, gate, and treatment layer are four separate mechanisms. The last playground puts them together inside a single governed session that plans, acts, observes, and replans over the life of a matter. 22. Putting it together: a governed agentic matter session A matter session runs a plan → act → observe → replan loop over a matter's research — the same brakes that gate autonomous flow (section 12), plus a per-phase step cap. Each act step is a governed tool call: the model chooses which registered source to query and when, the ledger records what it read, and the gate verifies each citation before it reaches you. This playground steps through a session and lets you trip each brake yourself. Honest state: the backend is shipped; there is no dedicated matter-intake UI yet — this capability reuses the autonomous session UI. An out-of-allowlist planner proposal is rejected, not executed; the model chooses which governed tool and when — it never invents one (ADR 0020 / ADR 0015). Open full-screen ↗ Source: api/app/autonomous/planner.py; api/app/autonomous/guard.py; ADR 0020 Ready to contribute?",
          href: "/learn/playgrounds/system-architecture.html",
        },
      ],
    },
    {
      kind: "text",
      text: "Want the architect's view? Read docs/architecture.md with its Mermaid diagram.",
      links: [],
    },
  ],
  "/use": [
    {
      kind: "text",
      text: "← Learn",
      links: [
        {
          label: "← Learn",
          href: "/learn",
        },
      ],
    },
    {
      kind: "heading",
      text: "How to Use LQ.AI",
      links: [],
    },
    {
      kind: "text",
      text: "A plain-language tour of every user-facing feature across M1–M4. Each section names the file paths and test that exercise the behavior described, so you can verify any claim against the source. The M4 Autonomous Layer surfaces in the web app as the autonomous dashboard (Autonomous) plus an opt-in toggle in settings (off by default).",
      links: [
        {
          label: "Autonomous",
          href: "/autonomous",
        },
      ],
    },
    {
      kind: "heading",
      text: "1. Send a message",
      links: [],
    },
    {
      kind: "text",
      text: "Type or paste into the composer and press Enter (or Shift+Enter for a newline). Every reply is appended to the same conversation thread; you can scroll up to see the full history. Conversations are persisted server-side and retrievable via Chats. Multi-turn context is preserved across browser sessions.",
      links: [
        {
          label: "Chats",
          href: "/chats",
        },
      ],
    },
    {
      kind: "text",
      text: "Source: api/app/api/chats.py — chat CRUD and message persistence.",
      links: [
        {
          label: "api/app/api/chats.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/chats.py",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/chat.cy.ts",
      links: [
        {
          label: "web/cypress/e2e/chat.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/chat.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: chat.message.send",
      links: [],
    },
    {
      kind: "heading",
      text: "2. Use a built-in skill",
      links: [],
    },
    {
      kind: "text",
      text: "In the composer, type / followed by a skill alias (for example /nda-review). A picker appears showing matching skills; select one and press Enter. The skill's system prompt, input schema, and reference files are assembled and sent to the model — the full assembled prompt is visible in the receipts drawer. Ten starter skills ship with M1: NDA Review, MSA Review — SaaS, MSA Review — Commercial Purchase, DPA Checklist Review, Vendor Privacy Policy First Pass, Contract QA, Action Items from Client Alert, Comms Improver, Enhance Prompt (an optional prompt-rewriting pre-step), and Skill Creator (a meta-skill for building new skills).",
      links: [],
    },
    {
      kind: "text",
      text: "Source: web/src/lib/lq-ai/components/SkillComposerPicker.svelte — slash picker UI.",
      links: [
        {
          label: "web/src/lib/lq-ai/components/SkillComposerPicker.svelte",
          href: "https://github.com/LegalQuants/blob/main/web/src/lib/components/SkillComposerPicker.svelte",
        },
      ],
    },
    {
      kind: "text",
      text: "Skills corpus: skills/",
      links: [
        {
          label: "skills/",
          href: "https://github.com/LegalQuants/blob/main/skills/",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-d2-skill-creator.cy.ts Test 4",
      links: [
        {
          label: "web/cypress/e2e/wave-d2-skill-creator.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-d2-skill-creator.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: skill.invoked",
      links: [],
    },
    {
      kind: "heading",
      text: "3. Capture a chat reply as a skill",
      links: [],
    },
    {
      kind: "text",
      text: 'Under any assistant message, a 📝 Capture button opens the Skill Wizard with the reply pre-filled as the seed content. You give it a name, add input variables or examples if needed, and save. The new skill is immediately available via / in the composer and visible in Skills. This is the fastest path from "that response was useful" to "I can reproduce it on demand."',
      links: [
        {
          label: "Skills",
          href: "/skills",
        },
      ],
    },
    {
      kind: "text",
      text: "Source: web/src/lib/lq-ai/components/SkillWizard.svelte — wizard component (pre-fill path).",
      links: [
        {
          label: "web/src/lib/lq-ai/components/SkillWizard.svelte",
          href: "https://github.com/LegalQuants/blob/main/web/src/lib/components/SkillWizard.svelte",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-d2-skill-creator.cy.ts Test 1",
      links: [
        {
          label: "web/cypress/e2e/wave-d2-skill-creator.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-d2-skill-creator.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: skill.created",
      links: [],
    },
    {
      kind: "heading",
      text: "4. Fork a built-in skill",
      links: [],
    },
    {
      kind: "text",
      text: "On any skill detail page, Fork as my own creates a personal copy under your account. You can edit the system prompt, swap reference files, change the input schema, or rename the alias without affecting the canonical version. Forked skills version independently from the original.",
      links: [],
    },
    {
      kind: "text",
      text: "Source: api/app/api/user_skills.py — fork endpoint.",
      links: [
        {
          label: "api/app/api/user_skills.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/user_skills.py",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-d2-skill-creator.cy.ts Test 3",
      links: [
        {
          label: "web/cypress/e2e/wave-d2-skill-creator.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-d2-skill-creator.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: skill.forked",
      links: [],
    },
    {
      kind: "heading",
      text: "5. Author a skill from scratch",
      links: [],
    },
    {
      kind: "text",
      text: "Navigate to Skills and press + New skill. The Skill Wizard walks through: name + alias, system prompt, input variables, reference files, and at least one worked example. The wizard validates structure against the SKILL.md schema before saving. The finished skill is stored as a SKILL.md-formatted record in the database and is immediately available via slash invocation.",
      links: [
        {
          label: "Skills",
          href: "/skills",
        },
      ],
    },
    {
      kind: "text",
      text: "Source: web/src/lib/lq-ai/components/SkillWizard.svelte",
      links: [
        {
          label: "web/src/lib/lq-ai/components/SkillWizard.svelte",
          href: "https://github.com/LegalQuants/blob/main/web/src/lib/components/SkillWizard.svelte",
        },
      ],
    },
    {
      kind: "text",
      text: "Schema spec: docs/skill-authoring-guide.md",
      links: [
        {
          label: "docs/skill-authoring-guide.md",
          href: "https://github.com/LegalQuants/blob/main/docs/skill-authoring-guide.md",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-d2-skill-creator.cy.ts Test 2",
      links: [
        {
          label: "web/cypress/e2e/wave-d2-skill-creator.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-d2-skill-creator.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: skill.created",
      links: [],
    },
    {
      kind: "heading",
      text: "6. Attach a knowledge base to a chat",
      links: [],
    },
    {
      kind: "text",
      text: "In the composer, press the 📎 button to open the KB attach modal. Select one or more knowledge bases from the list. Once attached, each message in that conversation retrieves relevant chunks from the KB via hybrid retrieval (vector similarity + full-text search) and appends them to the model context. You can also attach KBs at the matter level so they are automatically available in all chats under that matter.",
      links: [],
    },
    {
      kind: "text",
      text: "Source: api/app/api/knowledge_bases.py; api/app/pipeline/ingest.py",
      links: [
        {
          label: "api/app/api/knowledge_bases.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/knowledge_bases.py",
        },
        {
          label: "api/app/pipeline/ingest.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/pipeline/ingest.py",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-d1-power-features.cy.ts Test 2",
      links: [
        {
          label: "web/cypress/e2e/wave-d1-power-features.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-d1-power-features.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: kb.attached",
      links: [],
    },
    {
      kind: "heading",
      text: "7. Use a saved prompt",
      links: [],
    },
    {
      kind: "text",
      text: "Saved Prompts is a personal library of reusable prompt fragments — shorter than a full skill, longer than typing the same thing every time. Press Use in chat on any saved prompt to pre-populate the composer with its text. You can also insert from the saved-prompts side panel inside any chat. Prompt text is carried via sessionStorage, not a URL parameter, so it stays out of server logs and browser history.",
      links: [
        {
          label: "Saved Prompts",
          href: "/saved-prompts",
        },
      ],
    },
    {
      kind: "text",
      text: "Source: api/app/api/saved_prompts.py; web/src/routes/lq-ai/saved-prompts/+page.svelte",
      links: [
        {
          label: "api/app/api/saved_prompts.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/saved_prompts.py",
        },
        {
          label: "web/src/routes/lq-ai/saved-prompts/+page.svelte",
          href: "https://github.com/LegalQuants/blob/main/web/src/routes/saved-prompts/+page.svelte",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-m1-final-surfaces.cy.ts Test 1",
      links: [
        {
          label: "web/cypress/e2e/wave-m1-final-surfaces.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-m1-final-surfaces.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: saved_prompt.used",
      links: [],
    },
    {
      kind: "heading",
      text: "8. Read receipts",
      links: [],
    },
    {
      kind: "text",
      text: 'Every model response has a provenance record. Press the 📜 button in the composer toolbar to open the receipts drawer. Each receipt entry shows: the request timestamp, the model and provider used, the tier in effect, the full assembled prompt (including any skill system prompt and KB chunks), and — when a skill was invoked — "via slash command /<alias>". Receipts are read-only audit artifacts; they cannot be edited or deleted through the UI.',
      links: [],
    },
    {
      kind: "text",
      text: "Source: api/app/api/chat_receipts.py",
      links: [
        {
          label: "api/app/api/chat_receipts.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/chat_receipts.py",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-d1-power-features.cy.ts Test 4; wave-m1-final-surfaces.cy.ts Test 3",
      links: [
        {
          label: "web/cypress/e2e/wave-d1-power-features.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-d1-power-features.cy.ts",
        },
        {
          label: "wave-m1-final-surfaces.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-m1-final-surfaces.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: receipt.viewed",
      links: [],
    },
    {
      kind: "heading",
      text: "9. Privileged matter + admin override",
      links: [],
    },
    {
      kind: "text",
      text: "When a matter is flagged as privileged, the Inference Gateway enforces a tier floor. Requests below that floor are refused with a clear explanation — not a generic error. Admins can issue a just-in-time override for a specific session; the override is logged as an admin action and visible in the audit log. The tier system has five levels (Tiers 1–5); Tier 1 is a local Ollama model that never makes an outbound call.",
      links: [],
    },
    {
      kind: "text",
      text: "Source: gateway/app/tier_floor.py",
      links: [
        {
          label: "gateway/app/tier_floor.py",
          href: "https://github.com/LegalQuants/blob/main/gateway/app/tier_floor.py",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/wave-d1-power-features.cy.ts Test 3 + Test 5",
      links: [
        {
          label: "web/cypress/e2e/wave-d1-power-features.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/wave-d1-power-features.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: inference.tier_floor_overridden",
      links: [],
    },
    {
      kind: "heading",
      text: "10. Export your data / delete your account",
      links: [],
    },
    {
      kind: "text",
      text: "GDPR-aligned export and deletion are runnable today. From Settings, request a data export — the backend packages your chat history, skills, saved prompts, and knowledge base metadata as a JSON archive and delivers it as a download. Account deletion removes your data from the primary database; the deletion job runs asynchronously and produces an audit record confirming completion.",
      links: [],
    },
    {
      kind: "text",
      text: "Source: api/app/workers/user_export.py; api/app/workers/user_deletion.py; api/app/api/users.py",
      links: [
        {
          label: "api/app/workers/user_export.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/workers/user_export.py",
        },
        {
          label: "api/app/workers/user_deletion.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/workers/user_deletion.py",
        },
        {
          label: "api/app/api/users.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/users.py",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: user.export.requested, user.deleted",
      links: [],
    },
    {
      kind: "heading",
      text: "11. Read verified citations",
      links: [],
    },
    {
      kind: "text",
      text: 'When a model reply quotes a source in the form "<quote>" (Source: [N]), the Citation Engine verifies each quote against the cited source before it counts. Verified quotes render as a green chip in the chat message; quotes the model emitted but that could not be matched render as a grey [unverified] chip. There are four chip states — verified by exact match, verified by tolerant match, verified by paraphrase judge, and unverified — so you see not just whether a citation checked out but how strong the match was. Click a verified chip to jump to the matched span in the source.',
      links: [],
    },
    {
      kind: "text",
      text: "Source: api/app/citation/verification.py — four-stage cascade; web/src/lib/lq-ai/components/M2Citations.svelte — chip rendering.",
      links: [
        {
          label: "api/app/citation/verification.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/citation/verification.py",
        },
        {
          label: "web/src/lib/lq-ai/components/M2Citations.svelte",
          href: "https://github.com/LegalQuants/blob/main/web/src/lib/components/M2Citations.svelte",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/m2-c2-citation-states.cy.ts",
      links: [
        {
          label: "web/cypress/e2e/m2-c2-citation-states.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/m2-c2-citation-states.cy.ts",
        },
      ],
    },
    {
      kind: "heading",
      text: "12. Run a playbook against a document",
      links: [],
    },
    {
      kind: "text",
      text: "A playbook codifies your organization's standard positions on common contract issues. From Playbooks, pick a playbook, choose the document to review, preview the cost, and run it. Execution walks each position through a four-node cascade — retrieve the matching clause, classify it against your standard, draft a redline where it deviates, and compile the result. Each position lands on one of four verdicts so you can triage at a glance. Completed runs are saved and re-openable from playbook executions.",
      links: [
        {
          label: "Playbooks",
          href: "/playbooks",
        },
        {
          label: "playbook executions",
          href: "/playbook-executions",
        },
      ],
    },
    {
      kind: "text",
      text: "Source: api/app/playbooks/nodes.py — cascade nodes; api/app/api/playbooks.py — endpoints.",
      links: [
        {
          label: "api/app/playbooks/nodes.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/playbooks/nodes.py",
        },
        {
          label: "api/app/api/playbooks.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/playbooks.py",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/m3-a4-playbook-execution.cy.ts",
      links: [
        {
          label: "web/cypress/e2e/m3-a4-playbook-execution.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/m3-a4-playbook-execution.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: playbook.created, playbook.updated, playbook.deleted",
      links: [],
    },
    {
      kind: "heading",
      text: "13. Compare many documents in a grid",
      links: [],
    },
    {
      kind: "text",
      text: "Tabular Review asks the same set of questions across a set of documents and lays the answers out in a grid — one row per document, one column per question. From Tabular Review, a four-step wizard collects the documents, the questions, and a cost preview, then runs the extraction. Each cell is grounded in the chunks the model cited; click a cell to open its citation drawer. Finished grids export to XLSX or CSV.",
      links: [
        {
          label: "Tabular Review",
          href: "/tabular",
        },
      ],
    },
    {
      kind: "text",
      text: "Source: api/app/tabular/nodes.py — extraction nodes; api/app/api/tabular.py — endpoints + export.",
      links: [
        {
          label: "api/app/tabular/nodes.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/tabular/nodes.py",
        },
        {
          label: "api/app/api/tabular.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/tabular.py",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/m3-c-tabular-review.cy.ts",
      links: [
        {
          label: "web/cypress/e2e/m3-c-tabular-review.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/m3-c-tabular-review.cy.ts",
        },
      ],
    },
    {
      kind: "text",
      text: "Audit action: tabular.execution_started, tabular.execution_exported",
      links: [],
    },
    {
      kind: "heading",
      text: "14. Word add-in (plumbing only at v0.3.0)",
      links: [],
    },
    {
      kind: "text",
      text: "The Microsoft Word add-in is an Office.js task pane that installs against your own deployment. At v0.3.0, only the plumbing has shipped: an admin generates a per-deployment manifest, the operator sideloads the unsigned manifest (Microsoft 365 warns about the unsigned package — expected), the pane completes OAuth against the deployment, and a version handshake confirms compatibility. The in-pane feature surface — chat, skills, playbooks — is deferred (DE-287), and a signed distribution package is community-led (DE-295). We call this out plainly rather than implying the editor experience is finished.",
      links: [],
    },
    {
      kind: "text",
      text: "Source: api/app/api/word_addin.py; docs/word-addin.md",
      links: [
        {
          label: "api/app/api/word_addin.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/word_addin.py",
        },
        {
          label: "docs/word-addin.md",
          href: "https://github.com/LegalQuants/blob/main/docs/word-addin.md",
        },
      ],
    },
    {
      kind: "text",
      text: "E2E test: web/cypress/e2e/m3-b2-word-addin-oauth.cy.ts",
      links: [
        {
          label: "web/cypress/e2e/m3-b2-word-addin-oauth.cy.ts",
          href: "https://github.com/LegalQuants/blob/main/web/cypress/e2e/m3-b2-word-addin-oauth.cy.ts",
        },
      ],
    },
    {
      kind: "heading",
      text: "15. Intake bridges: Slack + Teams (admin)",
      links: [],
    },
    {
      kind: "text",
      text: "Intake bridges let a legal team take in requests from Slack and Microsoft Teams. This is an admin-facing surface: from Admin → Intake bridges, an administrator connects a workspace over OAuth, lists the configured bridges, and soft-deletes ones that are no longer needed. The bridge services run as separate deployments. Honest state: the admin shell and backend persistence have shipped; end-to-end OAuth against live Slack and Teams workspaces is not yet validated in CI (DE-312).",
      links: [
        {
          label: "Admin → Intake bridges",
          href: "/admin/intake-bridges",
        },
      ],
    },
    {
      kind: "text",
      text: "Source: api/app/api/admin_intake_bridges.py; slack-bridge/; teams-bridge/",
      links: [
        {
          label: "api/app/api/admin_intake_bridges.py",
          href: "https://github.com/LegalQuants/blob/main/api/app/api/admin_intake_bridges.py",
        },
        {
          label: "slack-bridge/",
          href: "https://github.com/LegalQuants/blob/main/slack-bridge/",
        },
        {
          label: "teams-bridge/",
          href: "https://github.com/LegalQuants/blob/main/teams-bridge/",
        },
      ],
    },
    {
      kind: "text",
      text: "Want to see how this all fits together? — Twelve interactive playgrounds that show the system from request to response.",
      links: [
        {
          label: "Want to see how this all fits together?",
          href: "/learn/how",
        },
      ],
    },
    {
      kind: "text",
      text: "For the full shipped/deferred capability catalog, read docs/HONEST-STATE.md.",
      links: [
        {
          label: "docs/HONEST-STATE.md",
          href: "https://github.com/LegalQuants/blob/main/docs/HONEST-STATE.md",
        },
      ],
    },
  ],
  "/compare": [
    {
      kind: "text",
      text: "← Learn",
      links: [
        {
          label: "← Learn",
          href: "/learn",
        },
      ],
    },
    {
      kind: "heading",
      text: "How It Compares",
      links: [],
    },
    {
      kind: "text",
      text: 'A category of proprietary legal-tech products has begun describing its AI output as "fiduciary-grade" — verified, trustworthy, defensible. That\'s the right bar. Where this comparison differs is the axis it measures on: verifiability, not capability. No vendor is named below — the "proprietary category" column states one fact, consistently: whatever it claims, it is closed-source, so the claim cannot be independently checked or forked by the user relying on it. Every LQ.AI row below resolves to one or more clickable artifacts — a design record, a source file, and/or an interactive playground you can drive yourself.',
      links: [],
    },
    {
      kind: "heading",
      text: "The three fundamental truths",
      links: [],
    },
    {
      kind: "heading",
      text: "1. Demonstrable vs. asserted",
      links: [],
    },
    {
      kind: "text",
      text: "Every LQ.AI checkmark resolves to a clickable artifact — an ADR, the source file that implements it, and a playground that lets you drive the logic yourself. A proprietary product's equivalent checkmark is a marketing or support-page claim; there is no file you are allowed to open to check it. The difference isn't effort — it's that only one side lets you look.",
      links: [],
    },
    {
      kind: "heading",
      text: "2. Show-the-work vs. trust-us",
      links: [],
    },
    {
      kind: "text",
      text: 'An opaque "this citation is good law" or "this output is verified" verdict is architecturally un-inspectable in a closed system — there is no mechanism by which a user could ever see the reasoning, only the label. LQ.AI\'s citation and treatment layers derive their verdicts from passages the system actually read and expose the derivation itself, not just the label.',
      links: [],
    },
    {
      kind: "heading",
      text: "3. Named accountability vs. committee-anonymized",
      links: [],
    },
    {
      kind: "text",
      text: "Legal work product built into a proprietary tool does not disclose a named individual accountable for it — responsibility diffuses across an anonymous process, as far as a user can see. Every LQ.AI skill that touches legal substance carries a named practicing-attorney attestation as a condition of merge — a real person's name is on the work.",
      links: [],
    },
    {
      kind: "heading",
      text: "Highlight matrix",
      links: [],
    },
    {
      kind: "text",
      text: "Eight of the fourteen rows in the full comparison — the ones most people ask about first. Each links to its interactive playground and its ADR/source. Where LQ.AI's own capability is partial or roadmapped, the caveat is stated inline, not buried.",
      links: [],
    },
    {
      kind: "table",
      rows: [
        [
          {
            text: "Capability",
            links: [],
          },
          {
            text: "LQ.AI — verifiable (proof)",
            links: [],
          },
          {
            text: "Proprietary category — closed → not user-verifiable",
            links: [],
          },
        ],
        [
          {
            text: "Derive-don't-assert citation verification (4-stage cascade)",
            links: [],
          },
          {
            text: "playground · ADR 0018 · verification.py",
            links: [],
          },
          {
            text: "May claim verified citations; the verification logic is not published, so the claim cannot be audited or reproduced by the user.",
            links: [],
          },
        ],
        [
          {
            text: "Citation Ledger — every source read, id/offset only, no raw payload stored (P3)",
            links: [],
          },
          {
            text: "playground · ADR 0018 · ledger.py",
            links: [],
          },
          {
            text: "May claim a source trail exists; its structure, retention, and payload-handling guarantees are not disclosed.",
            links: [],
          },
        ],
        [
          {
            text: "Fiduciary-grade gate (PASS / SUPPORTED / FAIL over every citation) Caveat: chat/autonomous verdict-tier parity is open (DE-370 / DE-371).",
            links: [],
          },
          {
            text: "playground · ADR 0018 · gate.py",
            links: [],
          },
          {
            text: 'May claim a "verified" or "fiduciary-grade" badge; the gate\'s verdict logic and tier definitions are not published.',
            links: [],
          },
        ],
        [
          {
            text: 'Derived validity/treatment signal ("derived, not editorial") Caveat: a derived signal from citing opinions actually read under a bounded budget — not an authoritative citator.',
            links: [],
          },
          {
            text: "playground · ADR 0019 · treatment.py",
            links: [],
          },
          {
            text: "May offer an editorial good-law/bad-law verdict; the editorial process and reviewer identity behind it are not disclosed.",
            links: [],
          },
        ],
        [
          {
            text: "Free primary-authority retrieve-and-verify (CourtListener / GovInfo / EDGAR / EUR-Lex) Caveat: EUR-Lex is get-by-CELEX only today — no full-text search (DE-374) or treaty CELEX formats (DE-375).",
            links: [],
          },
          {
            text: "playground · ADR 0021 · registry.py",
            links: [],
          },
          {
            text: "May aggregate primary authority from licensed feeds; the sourcing and licensing chain is not visible to the user.",
            links: [],
          },
        ],
        [
          {
            text: 'Governed agentic matter sessions (plan → act → observe → replan brakes) Caveat: no dedicated matter-intake UI yet — reuses the existing autonomous session UI rather than a purpose-built "describe your matter" flow.',
            links: [],
          },
          {
            text: "playground · ADR 0020 · planner.py",
            links: [],
          },
          {
            text: 'May offer an "agentic" research or drafting mode; the governing brakes and their enforcement points are not published.',
            links: [],
          },
        ],
        [
          {
            text: "Single audited egress boundary (tier-gated, per-call audit)",
            links: [],
          },
          {
            text: "playground · ADR 0014 · ADR 0015",
            links: [],
          },
          {
            text: "May claim governed or audited tool use; the egress boundary's implementation and audit granularity are not published.",
            links: [],
          },
        ],
        [
          {
            text: "Data residency — self-hosted / BYOK / air-gapped",
            links: [],
          },
          {
            text: "playground · architecture.md",
            links: [],
          },
          {
            text: "May claim data residency, private-cloud, or on-prem options; the actual deployment architecture and where data flows are not independently verifiable or auditable by the user.",
            links: [],
          },
        ],
      ],
      text: "",
    },
    {
      kind: "text",
      text: "Full evidence-linked comparison + verification paths → docs/comparison.md — all 14 rows, the honest-caveats section, and how to verify the comparison yourself.",
      links: [],
    },
    {
      kind: "text",
      text: "See it work → — the How It Works page walks the interactive playgrounds linked above in narrative order.",
      links: [
        {
          label: "See it work →",
          href: "/learn/how",
        },
      ],
    },
    {
      kind: "text",
      text: "Don't take this page's word for it either. Read HONEST-STATE.md, the canonical claims-vs-reality document this comparison is built from.",
      links: [],
    },
  ],
} as const;
