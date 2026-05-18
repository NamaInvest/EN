# Tenant Middleware Hardening Report

## 1. Tenant Flow Map
- **Extraction**: The `tenantId` is extracted at multiple layers:
  - **Edge Middleware (`middleware.ts`)**: Resolves the subdomain (`x-tenant-subdomain`) and forwards it via headers. Also decodes JWT and sets `x-tenant-id`, `x-user-id`, and `x-user-role`.
  - **API Boundary (`with-route.ts` / `tenant-guard.ts`)**: Reads from `x-tenant-id`, `x-tenant`, or `x-tenant-subdomain` and verifies it using `requireTenantId()`.
- **Validation**:
  - `tenant-guard.ts` verifies against allowed tenants (`LEGACY_TENANTS`, `SYSTEM_TENANTS`).
  - `withRoute` calls `assertTenantContextMatch` to verify that `authTenantId`, `headerTenant`, and `subdomainTenant` match the requested tenant to prevent cross-tenant access.
- **Prisma Direct Injection**: `getPrisma()` accepts `options.requireTenant` which initializes a tenant-scoped Prisma proxy ensuring the `where` clause contains `tenantId`.

## 2. Route Categorizations
### Public Routes
- Explicitly defined in `middleware.ts`: `/api/auth/login`, `/api/health`, `/api/webhook`, `/api/tenant/provision`, etc.
- Allowed to pass through without JWT or API Key.

### System/Admin Routes
- Includes `/api/master-panel/*` and `/ice/*`.
- Protected by `ice_session` JWT verification directly inside `middleware.ts` or handles its own auth.

### Authenticated Tenant Routes
- Managed by `withRoute` (or `withGuard`), which validates the `JWT`, executes `assertTenantContextMatch`, enforces rate limits, and injects a tenant-scoped Prisma client.

## 3. Vulnerability & Risk Analysis
- **Missing Tenant Guards**: A significant number of routes (e.g., `src/app/api/integrations/mudad/route.ts`, `src/app/api/manufacturing/aps/route.ts`, `src/app/api/accounting/trial-balance/route.ts`...) do **not** use `withRoute` or `withGuard` wrappers.
- **High-Risk Direct Prisma Access**: Any API route not wrapped by `withRoute` that instantiates `const prisma = new PrismaClient()` directly bypasses the `getPrisma` tenant enforcement, allowing it to query across tenants or insert data with `tenantId = 'default'`.
- **Silent Fallbacks**: While `withRoute` defaults `tenantRequired = requireAuth`, if a route doesn't use `withRoute`, it may fall back to `'default'` or the environment variable unconditionally.

## 4. Recommended Enforcement Pattern
1. **Mandatory Wrapper**: All authenticated API routes **must** use `withRoute` or `withGuard`.
2. **Explicit `assertTenantAccess`**: Expose a clear helper for manual validation in service methods or legacy routes.
3. **Helper: `requireTenantContext`**: Ensure a unified method explicitly fetches the validated tenant context inside non-HTTP contexts (like background jobs).
4. **Remove Fallbacks**: Prohibit defaulting to `tenantId = 'default'` unless the route is explicitly defined as a system route (`isSystemTenant`).

## 5. Safe Migration Plan
1. Introduce standard `requireTenantContext` and `assertTenantAccess` utilities in `src/lib/tenant/tenant-guard.ts`.
2. Consolidate `middleware.ts` routing rules to explicitly define public routes.
3. Incrementally wrap identified non-compliant routes with `withRoute`.
4. Ensure `tenantRequired = true` is strictly passed to `getPrisma` when not using `withRoute`.
