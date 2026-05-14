
# System Map
**Generated At:** 2026-05-14T08:21:09.109Z

## Full Folder Structure
- `/src/app`: Next.js App Router UI and API.
- `/src/components`: Shared React UI.
- `/src/lib`: Core utilities, Prisma client, Idempotency logic, ZATCA SDK.
- `/prisma`: Database schema and migrations.
- `/docs/ai-brain`: This memory system.
- `/.agent`: Workflow and agent rules.

## Entry Points
- `src/app/page.tsx`: Landing page.
- `src/app/(dashboard)`: Main ERP Tenant UI.
- `src/app/ice`: Master Control Panel.
- `src/app/api`: Backend microservices.

## Shared Libraries
- `src/lib/prisma.ts`: DB connection and Tenant Guards.
- `src/lib/idempotency.ts`: Request deduplication.

## Deprecated Areas
- `src/app/(dashboard)/_ice_archive`: Old route safely archived to avoid collisions.
