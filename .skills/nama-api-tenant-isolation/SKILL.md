# Nama API Tenant Isolation Skill

## Purpose

Audit and govern API protection, tenant isolation, RBAC enforcement, and safe data access across Nama Invest ERP.

## Allowed Actions

- Read `src/app/api/**/route.ts`.
- Read auth, tenant, RBAC, and validation utilities.
- Generate route protection matrices.
- Generate direct Prisma/raw SQL audit reports.
- Update `.ai-brain/04-api-and-tenant-isolation.md`.
- Update risk/gap/evidence registers.

## Forbidden Actions

- Runtime code changes without explicit approval.
- DB writes.
- Production access.
- Deploy.
- Migration.
- Secrets access.
- Git push.

## Audit Focus

- `withRoute`
- `getPrisma(req)`
- tenant guard
- RBAC
- validation
- audit logging
- direct `new PrismaClient()`
- raw SQL
- `tenantId` accepted from body/query
- financial critical routes
- admin routes

## Required Outputs

- `API_ROUTE_PROTECTION_MATRIX.csv`
- `TENANT_ISOLATION_AUDIT_REPORT.md`
- `DIRECT_PRISMA_RAW_SQL_AUDIT.md`
- `.ai-brain/04-api-and-tenant-isolation.md`

## Required Classification

Each route must be classified as:

- `PUBLIC`
- `AUTH_REQUIRED`
- `TENANT_REQUIRED`
- `ADMIN_ONLY`
- `FINANCIAL_CRITICAL`
- `SYSTEM_INTERNAL`
- `NEEDS_REVIEW`

## Stop Conditions

Stop if a critical route requires runtime code changes.

## Approval Gates

- `GO_FOR_API_TENANT_ISOLATION_AUDIT_ONLY`
- `GO_FOR_RUNTIME_CODE_FIXES_ONLY`
