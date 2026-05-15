# SECURITY AND TENANT ISOLATION

## Authentication Architecture
- Relies on Clerk for identity.
- Local SSO mappings route users to the correct `tenantId`.

## Tenant Context Flow
1. Middleware reads Host header or Token.
2. Injects `x-tenant-id` and `x-tenant-subdomain` to Headers.
3. API routes extract `x-tenant-id`.
4. Prisma queries MUST include `where: { tenantId }`.

## Risks
- Missing `tenantId` in any Prisma query leads to severe cross-tenant data leakage.
