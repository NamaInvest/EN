# System Map

Generated: 2026-05-18 02:34:44 +03:00

Scan facts:
- API routes: 850
- Prisma models: 609
- Prisma enums: 2
- Pages: 492
- Tests: 83
- Graphify files: 4576
- Graphify words: 6562824
- Sensitive skipped by graphify: 14
- graph.html: 27.75 MB, updated 05/18/2026 02:21:51
- graph.json: 29.84 MB, updated 05/18/2026 02:21:48

## Important Folders

- src/app — Next app routes/pages.
- src/app/api — API route files.
- src/lib — shared libraries, guards, engines, services, integrations.
- src/services — domain service classes/functions.
- src/workers — background workers.
- src/hooks — frontend hooks including offline sync if present.
- electron — Electron desktop shell.
- prisma — Prisma schema, migrations, seeds.
- docs and .ai-brain — documentation/knowledge bases.
- project-governance and project-ops — governance/runbook rules.
- graphify-out — knowledge graph artifacts.

## Important Files

- middleware.ts
- src/proxy.ts
- src/lib/api/with-route.ts
- src/lib/api/with-cron.ts
- src/lib/prisma.ts
- src/lib/auth.ts
- src/lib/governance/tenant-guard.ts
- src/lib/idempotency.ts
- src/lib/services/outbox.service.ts
- src/workers/outbox/outbox-relay.worker.ts
- src/lib/accounting-engine.ts
- src/lib/auto-journal.ts
- src/lib/inventory-engine.ts
- src/lib/zatca.ts
- src/lib/zatca-fatoora.ts
- src/lib/webhooks.ts
- src/lib/queue/index.ts
- electron/main.js

## Entry Points

- Web app: Next.js src/app.
- API: src/app/api/**/route.ts.
- Middleware: middleware.ts, src/proxy.ts.
- Worker script: package script worker points to 	sx src/scripts/start_workers.ts.
- WhatsApp worker script: package script start:whatsapp points to 	sx src/workers/whatsapp.ts.
- Electron app: package main points to electron/main.js.

## Runtime Flow

Request -> middleware/proxy -> route wrapper -> auth/tenant/rate-limit -> tenant-aware Prisma -> domain services -> DB/external integrations -> response/outbox/worker.

## Deprecated / Risky Areas

UNKNOWN globally. The root contains many historical ix_*, check_*, deploy_*, and audit scripts. Treat them as unsafe until reviewed.
