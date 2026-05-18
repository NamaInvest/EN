# Tenant Enforcement Update - 2026-05-18

## Purpose

This document records the runtime tenant isolation hardening applied in the first security phase.

The change does not modify Prisma schema, route names, API response shapes, accounting logic, ZATCA logic, or Desktop Sync behavior.

## Canonical Source

The official tenant isolation source is:

```text
src/lib/governance/tenant-guard.ts
```

Legacy guard paths must only re-export the canonical guard:

```text
src/lib/tenant/tenant-guard.ts
src/lib/security/tenant-guard.ts
```

## Tenant Context Terms

Runtime tenant context has two separate meanings:

- `tenantSlug`: request tenant from subdomain, JWT, API key, desktop license, or explicit job context.
- `recordTenantId`: value stored in tenant database rows.

For legacy shared-database tenants, `recordTenantId` equals the real tenant slug.
For Phase 2 physical tenant databases, business rows use `recordTenantId = "default"` while routing keeps the real `tenantSlug`.

Important boundary rule:

`recordTenantId = "default"` is allowed only inside tenant database row scoping. It is not accepted as a request/JWT/header tenant identity for physical tenant databases.

## Mandatory Runtime Controls

1. `withRoute` resolves tenant context before handler execution.
2. `withRoute` rejects mismatches between `x-tenant`, `x-tenant-id`, subdomain, and authenticated tenant.
3. `getPrisma(req, { requireTenant: true })` does not use environment/default fallback.
4. Prisma tenant auto-scope injects or normalizes tenant filters for every Prisma model that contains `tenantId`.
5. `OutboxEvent` and `IdempotencyRecord` keep the real `tenantSlug`, because workers and retry logic use it for routing.
6. Direct `new PrismaClient()` usage appears in the tenant audit scanner unless explicitly allowlisted.

## Verification

Run:

```bash
npm run audit:tenant
npx jest src/lib/__tests__/tenant-isolation.test.ts --runInBand --forceExit
npx tsc --noEmit
```
