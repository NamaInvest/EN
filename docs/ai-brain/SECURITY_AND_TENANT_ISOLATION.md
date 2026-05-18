# Security And Tenant Isolation

# Project Brain

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

## Executive Overview

Nama Invest / 
amaweb is a large Multi-Tenant SaaS ERP + POS + Electron Desktop + PWA repository. The stack detected from code/config includes Next.js, React, Prisma, PostgreSQL, TypeScript, Electron, Redis/BullMQ patterns, Sentry, Zod, and Saudi compliance/ZATCA modules.

## Authentication Architecture

Confirmed files:
- src/lib/auth.ts — JWT/password/permission helpers and withGuard.
- middleware.ts and src/proxy.ts — request classification and tenant header behavior.
- src/lib/api/with-route.ts — route wrapper, auth, roles, rate limit, tenant context, requestId.

## Tenant Context Flow

1. Request host/header/JWT supplies tenant identity.
2. withRoute resolves 	enantContext.
3. withRoute rejects mismatches between request boundary sources.
4. getPrisma(req, { requireTenant: true }) creates tenant-aware Prisma access.
5. src/lib/prisma.ts scopes models with 	enantId.

Important distinction:
- 	enantSlug = request identity.
- 
ecordTenantId = row scope.
- default may be a row value in physical tenant DBs but must not be accepted as a physical tenant request identity.

## RBAC / Permissions

Role checks exist through withRoute({ roles }); permission helper exists in src/lib/auth.ts. Full permission coverage is UNKNOWN route-by-route.

## Tenant Audit Scanner

Command:

`ash
npm run audit:tenant
`

Latest session summary: directPrismaClientUnallowed=61; routesWithoutWithRoute=103; legacyTenantGuardImports=112; unscopedPrismaOps=767

## Cross-Tenant Financial Vulnerability Protections

1. **Reopen Period Operations**: `period-close.service.ts` explicitly scopes any reopening of a `fiscalPeriod` with `where: { id, tenantId }`.
2. **Year-End Closing (Phase 4)**: `YearEndCloseEngine` requires explicit `tenantId` passing to avoid leaking or locking periods across tenants.
3. **Immutability Hashing**: Reports and journals signed at year-end are strictly bound to the generating `tenantId`.

## Weaknesses To Review

- Routes not wrapped by withRoute/withGuard.
- Direct 
ew PrismaClient() outside clearly scoped scripts/system contexts.
- Tenant fallback literals in API code.
- Public/master/provisioning endpoints that intentionally bypass tenant behavior need explicit allowlist documentation.
