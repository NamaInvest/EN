
# Security & Tenant Isolation
**Generated At:** 2026-05-14T08:21:09.109Z

## Tenant Isolation
- Implemented primarily via Prisma Extension/Middleware in `src/lib/prisma.ts`.
- `tenant-guard`: Automatically appends `tenantId: currentTenant` to `where` clauses.
- **Risk:** Raw queries (`$queryRaw`) bypass this guard. Must manually append `tenantId`.

## Authentication
- Handled by Clerk SSO.
- Middleware (`middleware.ts`) protects `/(dashboard)` routes and injects tenant session.
- `/sso-callback` handles infinite redirect loops safely.
