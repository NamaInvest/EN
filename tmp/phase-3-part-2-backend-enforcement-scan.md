# Phase 3 Part 2 — Backend Enforcement Scan & RBAC Audit Report

## 1. Executive Summary

This report presents a thorough backend security audit of the Nama Invest ERP API layer, focusing on role-based access control (RBAC) and tenant isolation for sensitive transactional and operational endpoints. 

Following the completion of the UI-level dashboard masking in Phase 3 Part 1, this audit was conducted to answer a critical architectural question: **Is the visually masked frontend data backed by robust server-side enforcement, or does the API remain exposed to unauthorized calls from valid tenant users?**

### Key Findings:
1. **Perfect Tenant Isolation (Law 1 Enforced):** The custom `smartPrisma` client proxy in `src/lib/prisma.ts` combined with `withRoute`'s `currentRequestStore` context successfully forces every database read and write to be scoped strictly within the authenticated user's `tenantId`. No cross-tenant data leaks are possible.
2. **Missing Granular RBAC (Server-Side Vulnerability):** While tenant boundaries are fully secure, **module-level permissions are not enforced at the API layer for most read, write, and execute operations.**
3. **Scattered Auth Logic:** Some routes implement custom role checks inside the handler functions, while others rely on the default `withRoute` wrapper options (which only confirm authentication but do not restrict by module or role unless explicitly configured).
4. **Actionable Remediation Strategy:** We propose extending the core `withRoute` higher-order function (`src/lib/api/with-route.ts`) to support a declarative `module` verification property. This will allow the backend to leverage the existing `hasPermission(userId, module)` system in a single line of code per route.

---

## 2. Current Backend Auth & RBAC Architecture

The application's backend authentication flow is split into two sequential phases:

### A. Next.js Edge Middleware (`middleware.ts`)
- **Subdomain Resolution:** The middleware inspects the request host to resolve the subdomain (e.g. `n11.namainvist.com`) and sets the header `x-tenant-subdomain`.
- **Credential Verification:** For authenticated routes, it validates either the `Bearer <JWT>` header or the `token` cookie against `process.env.JWT_SECRET`.
- **Identity Forwarding:** Once verified, the decoded JWT payloads are set as downstream request headers:
  - `x-user-id` (User ID)
  - `x-user-role` (User Role: e.g., `admin`, `owner`, `cashier`, `user`)
  - `x-tenant-id` (Canonical Database tenant slug)
  - `x-username` (Username/Email)

### B. Route Guard Layer (`src/lib/api/with-route.ts` & `src/lib/auth.ts`)
- **withRoute:** Extracted headers are parsed into `ctx.auth` containing `{ userId, role, tenantId, username }`. 
- **Prisma Integration:** Calls `currentRequestStore.run(tenant, ...)` which binds the active thread to the resolved tenant. This forces the `smartPrisma` proxy to return a tenant-scoped Prisma client.
- **Tenant Assertions:** Compares `x-tenant-id` from the token with the resolved domain tenant to prevent boundary bypasses.
- **Static Role Filtering:** Supports `options.roles` containing allowed roles (e.g. `['admin', 'owner']`), returning `403 Forbidden` if the user's role is not present in the list.

### C. Permissions Engine (`src/lib/auth.ts` - `hasPermission`)
- The system includes a robust helper function `hasPermission(userId, module, prismaClient)`:
  - If user role is `admin` or `owner` → always returns `true` (bypass logic).
  - Otherwise, checks if the user has a record in the `user_permissions` table matching the specific `module` name.

---

## 3. API Coverage Map by Domain

The table below maps the active operational endpoints, details the data returned, current protections, tenant isolation status, risk classifications, and recommended architectural mitigations.

### Risk Classification Matrix:
- **CRITICAL:** Sensitive financial/payroll/audit logs exposed to any authenticated tenant user without RBAC checks.
- **HIGH:** Operational summaries or transactional pipelines accessible without checking specific module permissions.
- **MEDIUM:** Non-critical operational metrics visible, but should ideally be role-restricted.
- **LOW:** Secured backend or non-sensitive data endpoint.

| Endpoint Path | Domain | Data Returned | Current Protection | Tenant Isolation | Risk Level | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/audit-logs` | GRC / Audit | Database CDC changes, JSON old/new | Authenticated only (`withRoute` default) | **SECURE** | **CRITICAL** | Restrict to `admin` / `owner` only via `withRoute` options. Enforce pagination cap. |
| `/api/treasury/cash-position` | Treasury | Global bank/cash balances & totals | Authenticated only (`withRoute` default) | **SECURE** | **CRITICAL** | Guard with `module: 'treasury'` in `withRoute`. |
| `/api/treasury/dashboard` | Treasury | Summed cashflows, recent ledger entries | Authenticated only (`withRoute` default) | **SECURE** | **CRITICAL** | Guard with `module: 'treasury'` in `withRoute`. |
| `/api/payroll` | Payroll / HR | Employee salaries, WPS SIF, GOSI, run logs | Authenticated only (`withRoute` default) | **SECURE** | **CRITICAL** | Guard with `module: 'hr'` (or `payroll`) in `withRoute`. Restrict write actions to finance managers. |
| `/api/saudi/mudad/compliance` | HR / Local | Compliance telemetry (Mudad/Qiwa) | Authenticated only | **SECURE** | **HIGH** | Guard with `module: 'hr'` in `withRoute`. |
| `/api/sales` (GET) | Sales | Sales invoices table, line-item pricing | Branch filter if user has branchId | **SECURE** | **HIGH** | Enforce `module: 'sales'` on GET. |
| `/api/sales` (POST) | Sales | Creates invoice, posts journal, logs audit | Authenticated only (idempotency key lock) | **SECURE** | **CRITICAL** | Enforce `module: 'sales'` with `canAdd` validation on POST. |
| `/api/sales` (PUT) | Sales | Records payment, alters ledger balance | Authenticated only (idempotency key lock) | **SECURE** | **CRITICAL** | Enforce `module: 'sales'` with `canEdit` validation on PUT. |
| `/api/purchase-orders` (GET) | Purchases | Purchase orders registry, supplier costs | Authenticated only | **SECURE** | **HIGH** | Guard with `module: 'purchases'` on GET. |
| `/api/purchase-orders` (POST)| Purchases | Executes saga, places orders, grn | Authenticated only | **SECURE** | **CRITICAL** | Guard with `module: 'purchases'` on POST. |
| `/api/fixed-assets` | Fixed Assets | Asset registries, book cost, depreciation | Authenticated only | **SECURE** | **CRITICAL** | Guard with `module: 'assets'` on GET/POST. |
| `/api/projects/evm` | Projects | Portfolio WBS metrics, CPI, SPI, consumed budgets | Authenticated only | **SECURE** | **CRITICAL** | Guard with `module: 'projects'` in `withRoute`. |
| `/api/crm/opportunities` | CRM | Opportunity sizes, deal pipelines, expected margins | Authenticated only | **SECURE** | **HIGH** | Guard with `module: 'crm'` in `withRoute`. |
| `/api/settings/roles` | Admin | Users & granular permissions map | Explicit `admin` / `owner` code check | **SECURE** | **LOW** | Centralize code check to `withRoute` options `{ roles: ['admin', 'owner'] }`. |

---

## 4. Operational Endpoints Analysis

### A. Confirmed Safe Endpoints (Fully Secure)
- **`/api/settings/roles` (GET/POST):** Hardened against non-admin bypasses using a strict code guard checking `user.role === 'admin' || user.role === 'owner'`.
- **`/api/sales` (DELETE):** Fully secured using `hasPermission(auth.userId, 'delete_invoices', prisma)`.
- **`/api/sales?action=delete_all` (DELETE):** Fully secured using `hasPermission(auth.userId, 'delete_all_sales', prisma)`.

### B. Risky Endpoints (Unprotected Read/Write)
- **`/api/audit-logs` (GET):** Lacks role restrictions. Any standard tenant employee can view the audit trail.
- **`/api/treasury/cash-position` & `dashboard` (GET):** Exposed globally to any logged-in user.
- **`/api/payroll?action=run` (POST):** Allows arbitrary salary run recalculations and event-bus execution by basic users.
- **`/api/fixed-assets` (GET/POST) & `/api/projects/evm` (GET):** Operational financial details can be listed or added without permission checks.
- **`/api/crm/opportunities` (GET/POST):** Pipeline deal sizes can be modified without CRM module permissions.

### C. Endpoints Requiring Manual Business Decision
- **`/api/saudi/qiwa/contracts`:** Should PMs or HR assistants have direct read-only access to contract endpoints, or should this be strictly limited to the HR manager role?
- **`/api/sales` (POST - Cashier Access):** Cashiers must be allowed to post sales invoices in POS mode, but they should not access general financial summaries. A clean distinction is required: Cashiers require `sales` module access, but only within POS/Cashier scopes.

---

## 5. Recommended Implementation Strategy

To secure the backend without adding duplicated authorization boilerplate code in over 100 route files, we suggest a centralized higher-order middleware enhancement.

### Step 1: Enhance `WithRouteOptions` in `src/lib/api/with-route.ts`
We will add a declarative `module` property:
```typescript
export interface WithRouteOptions {
  rateLimit?: RateLimitTier;
  requireAuth?: boolean;
  roles?: string[];
  tenantRequired?: boolean;
  module?: string; // ← Declarative module check
}
```

### Step 2: Inject centralized RBAC validation in `withRoute`
Inside the authentication verification logic in `withRoute`:
```typescript
if (requireAuth) {
  // ... [Existing user parsing and role check] ...
  
  if (options.module) {
    const { hasPermission } = await import('@/lib/auth');
    const isAllowed = await hasPermission(u.userId, options.module, prisma);
    if (!isAllowed) {
      httpRequestsTotal.inc({ method, status: '403', route: pathname });
      return NextResponse.json(
        { error: 'Forbidden', message: 'صلاحيات غير كافية للوصول إلى هذا الموديول' },
        { status: 403, headers: { 'X-Request-Id': requestId } }
      );
    }
  }
}
```

### Step 3: Decorate API routes declarative-style
Update the routes to pass the required module:
- **Treasury Dashboard:**
  ```typescript
  export const GET = withRoute(handler, { module: 'treasury' });
  ```
- **Audit Logs:**
  ```typescript
  export const GET = withRoute(handler, { roles: ['admin', 'owner'] });
  ```
- **Fixed Assets:**
  ```typescript
  export const GET = withRoute(handler, { module: 'assets' });
  ```
- **Projects EVM:**
  ```typescript
  export const GET = withRoute(handler, { module: 'projects' });
  ```

---

## 6. Suggested Commit Split for Implementation

If authorized to proceed to execution, the implementation should be executed in 4 highly isolated commits:

1. `feat(security): extend withRoute options to support declarative module permissions`
2. `feat(treasury-payroll): enforce backend RBAC on treasury and payroll endpoints`
3. `feat(business-apis): enforce backend RBAC on sales purchases assets crm and projects`
4. `feat(grc): harden audit logs API route with strict admin roles and limit protection`

---

## 7. Audit Verification Status & Statements

- **No code changed:** True. (This phase was strictly SCAN + PLAN. No functional application files were modified).
- **No schema changed:** True. (Prisma schema remains untouched, and no database migrations were generated).
- **No commits made:** True. (Local Git status is identical to baseline).

### Git Status After Scan:
```bash
?? tmp/phase-3-part-2-backend-enforcement-scan.md
```
*(The generated scan report resides safely as an untracked markdown document inside the workspace).*
