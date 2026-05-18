# 64 - Tenant Isolation Hardening

## Date

2026-05-18

## Scope

This Brain note documents the first Tenant Isolation hardening phase.

No Prisma schema, accounting rules, ZATCA rules, Desktop Sync flow, route names, or API response shapes were changed.

## Canonical Files

```text
src/lib/governance/tenant-guard.ts
src/lib/api/with-route.ts
src/lib/prisma.ts
scripts/audit-tenant-isolation.js
project-governance/05A-TENANT_ENFORCEMENT_2026-05-18.md
```

## Core Decision

Tenant isolation must not depend on each developer remembering to add `tenantId` to every query.

The official runtime flow is:

```text
Request
  -> withRoute
  -> resolveTenantContext
  -> mismatch validation
  -> currentRequestStore
  -> getPrisma(req, { requireTenant: true })
  -> Prisma tenant-auto-scope extension
  -> tenant-scoped model operation
```

## Tenant Terms

- `tenantSlug`: the real routing tenant from subdomain/header/JWT/job context.
- `recordTenantId`: the value stored on tenant-scoped rows.

Legacy shared DB tenants:

```text
tenantSlug = n11
recordTenantId = n11
```

Phase 2 physical tenant DBs:

```text
tenantSlug = company_a
recordTenantId = default
```

`recordTenantId = default` is allowed only inside Prisma row scoping. It is not accepted as a request/JWT/header tenant identity for physical tenant databases.

Outbox and idempotency records keep the real `tenantSlug` because workers and retry pipelines route by tenant.

## Runtime Guarantees

1. `withRoute` rejects tenant-required API requests without tenant context.
2. `withRoute` rejects mismatches between `x-tenant`, `x-tenant-id`, subdomain, and authenticated tenant.
3. `RouteContext` now includes `tenantContext` and keeps the old `tenant` field for compatibility.
4. Prisma auto-scopes every model that has a `tenantId` field.
5. Prisma rejects mismatched tenant values instead of silently reading another tenant.
6. Legacy guard modules re-export the canonical governance guard.
7. `npm run audit:tenant` reports direct PrismaClient usage, routes without withRoute/withGuard, legacy guard imports, and unscoped sensitive Prisma operations.

## Verification

```bash
npm run audit:tenant
npx jest src/lib/__tests__/tenant-isolation.test.ts --runInBand --forceExit
npx tsc --noEmit --pretty false
```

## Known Follow-Up Debt

The scanner reports existing legacy debt:

- direct `new PrismaClient()` occurrences
- API routes without `withRoute` or `withGuard`
- old imports from compatibility tenant guard paths
- route-local sensitive Prisma calls without explicit local `tenantId`

These are now visible as audit findings. They should be burned down in future focused phases, starting with direct `new PrismaClient()` inside tenant-facing API routes.
