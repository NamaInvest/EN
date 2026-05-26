# Remediation Master Plan

Date: 2026-05-26

## Goal

Convert the current full audit into a controlled remediation program for Nama Invest ERP. The goal is not to patch symptoms only. Each fix must preserve:

- Financial integrity
- Tenant isolation
- Permission boundaries
- API contracts
- Existing ERP workflows
- Report accuracy
- Rollback safety

## Current Baseline

- Sidebar menu links: 289
- Dashboard pages: 470
- API routes: 866
- Report pages: 22
- Report APIs: 18
- Pages with static button/form/onClick signals: 399
- Runtime menu routes visited: 281
- Runtime flagged routes: 267
- Runtime page errors: 97
- Runtime console-error routes: 191
- Runtime timeout signals: 76
- Runtime hydration signals: 20
- Runtime HTTP 500 routes: 1
- Runtime explicit runtime-error-text routes: 2
- APIs missing `withRoute`: 72
- APIs with default tenant fallback: 94
- APIs with direct `new PrismaClient`: 26
- APIs with raw unsafe SQL helpers: 6
- Dashboard pages with explicit page permission guard detected: 0
- Sidebar modules missing from role assignment page: 6

## Already Fixed

### Login / Auth Bootstrap

Files changed:

- `src/app/login/page.tsx`

Local development data:

- Created or updated local `admin` user for development login.
- Ensured 35 admin permission records based on the existing project seed list.

Fixes:

- Removed Clerk hooks and Clerk import from `/login`.
- Routed owner SSO to `/sign-in`.
- Defaulted local/desktop login to the local username/password form.
- Increased login request timeout to 60 seconds.
- Added an explicit timeout abort reason.
- Prevented timeout abort from being logged as a noisy console error.
- Stopped pre-login `/api/settings` calls when no token exists.

Verified:

- `/login` renders without ClerkProvider runtime error.
- `admin/admin` logs in locally.
- `/api/auth/login` returns HTTP 200.
- Browser login redirects to `/dashboard`.
- No `AbortError` and no `signal is aborted without reason` in the final login run.
- `npx eslint --no-cache src/app/login/page.tsx` passed.

## Execution Principles

1. Fix in batches by risk, not by file order.
2. Do not touch posted journals, closed periods, ZATCA-cleared invoices, payroll postings, or inventory valuation without a separate financial rollback plan.
3. Do not add tenant fallbacks.
4. Do not bypass permissions.
5. Do not use a new direct `PrismaClient` in route logic.
6. Update this report and the specific audit file after every completed batch.
7. Every batch must include a verification record.

## Phase 1 - Runtime Stabilization

Status: in progress

Scope:

- Fix pages that fail to load, return 500, show runtime error text, or time out.
- Prioritize non-mutating page-load defects before button-click defects.

Priority routes:

- `/accounting/customer-statements` - HTTP 500 and runtime error text.
- `/smart-transfers` - runtime error text.
- Timeout routes including `/sales`, `/sales/smart-map`, `/purchase-orders`, `/purchases/grn`, `/ap/capture`, `/quality/inspections`, `/quality/ncrs`, `/hr/leaves`, `/hr/timesheet`, `/settings/bpm`, `/bi/dashboard`, `/reports/aging`.
- Known page-error example: `/treasury/bank-reconciliation` with `data.filter is not a function`.

Scenario:

1. Open route as authenticated admin in local dev.
2. Capture HTTP status, console errors, and page text.
3. Read page file and API calls used by the page.
4. Fix the smallest load-time cause.
5. Re-open the route.
6. Update `10-runtime-menu-audit.md` with fixed route, old symptom, new result.

Tests:

- Targeted Playwright route check.
- Targeted ESLint for changed files.
- `npm run typecheck` when practical; if it times out, record timeout.

Rollback:

- Revert only changed files in the route batch.

## Phase 2 - Page-Level Permissions

Status: pending

Scope:

- Add or standardize page-level permission enforcement for dashboard pages.
- Align sidebar permission module names with role assignment modules.

Known gaps:

- Dashboard pages with explicit page permission guard detected: 0.
- Sidebar modules missing from role assignment page:
  - `admin`
  - `compliance`
  - `contracts`
  - `fsm`
  - `hr`
  - `inventory`

Scenario:

1. Identify existing permission helper pattern.
2. Apply it to a small pilot group: settings/admin/read-only pages first.
3. Test allowed admin access and denied non-permitted user access.
4. Expand by domain only after pilot passes.

Tests:

- Unit tests for permission module mapping.
- Browser checks for allowed and denied roles.
- API must remain independently protected.

Rollback:

- Revert permission guard wrapper changes by batch.

## Phase 3 - API Security Boundary

Status: pending

Scope:

- Normalize APIs missing `withRoute`.
- Remove unsafe tenant fallbacks.
- Replace direct `new PrismaClient` in route logic with central prisma access where appropriate.
- Audit raw SQL helpers.

Risk groups:

- Public/intentionally unauthenticated APIs: keep public only when documented.
- Cron APIs: must require cron secret and tenant-aware behavior when touching tenant data.
- Financial APIs: require separate financial impact notes before modification.
- ICE/Desktop APIs: require desktop sync and local backup analysis.

Scenario:

1. Classify APIs into public, auth-required, cron, desktop, tenant, financial.
2. Fix non-financial low-risk APIs first.
3. For financial routes, write a per-route financial impact note before code changes.
4. Verify unauthenticated requests fail and authenticated requests succeed.

Tests:

- `npm run test:integration` for API/security batches where available.
- Targeted route request tests with and without token.
- Tenant leakage checks for affected routes.

Rollback:

- Revert route wrapper changes by API group.

## Phase 4 - Tenant Isolation

Status: pending

Scope:

- Remove `tenantId ?? "default"` and equivalent fallbacks from tenant-scoped APIs.
- Ensure tenant context comes from auth/request context, not arbitrary query params.

High-risk domains:

- Accounting
- Finance
- Treasury
- Payroll
- Inventory valuation
- Sales/Purchases
- ZATCA

Scenario:

1. Pick one domain at a time.
2. Trace tenant source from middleware/auth to route to database query.
3. Replace fallback with required tenant context or explicit public/demo logic.
4. Add tests for missing tenant, valid tenant, and cross-tenant access attempt.

Tests:

- Targeted integration tests.
- Tenant boundary assertions.
- Financial domain tests when route touches postings or valuation.

Rollback:

- Revert tenant-source changes by domain.

## Phase 5 - Reports

Status: pending

Scope:

- Validate 22 report pages and 18 report APIs.
- Fix report APIs with tenant fallback.
- Validate filters, exports, empty states, and permission behavior.

Scenario:

1. Open report page.
2. Confirm page loads without runtime errors.
3. Call backing API with authenticated admin.
4. Validate empty dataset and populated dataset behavior.
5. Validate export endpoints where available.

Tests:

- Browser route check for each report.
- API request check for each report API.
- Snapshot or schema assertion for report payloads.

Rollback:

- Revert report fixes by report group.

## Phase 6 - Buttons and Actions

Status: pending

Scope:

- Move from static button inventory to safe click-by-click E2E.
- Do not click destructive or financial-posting buttons until test data and rollback are defined.

Action classes:

- Safe UI-only: tabs, filters, search, open modal, close modal.
- Safe read-only API: refresh, preview, load.
- Mutating non-financial: create/update demo records.
- Financial/inventory/high-risk: posting, approval, delete, reset, ZATCA, period close, payroll, stock adjustment.

Scenario:

1. Generate button inventory per route.
2. Classify each action by risk.
3. Execute safe UI-only actions first.
4. Execute mutating actions only in a dedicated demo tenant/data set.
5. Execute financial actions only with explicit per-action accounting impact and rollback plan.

Tests:

- Playwright click scenarios.
- API assertion after click.
- Database assertion only for demo records.

Rollback:

- Delete only demo records created by the scenario when safe.
- For financial actions, use application-level reversal flows, not direct database deletion.

## Phase 7 - Documentation and Brain Update

Status: pending

Scope:

- Update audit reports after every batch.
- Update AI Brain only after verified implementation batches.

Files to update:

- `00-summary.md`
- `10-runtime-menu-audit.md`
- `11-remediation-master-plan.md`
- Domain-specific notes if a financial or tenant-sensitive domain is changed.

Brain update candidates:

- `/login` must stay Clerk-free in desktop/local mode.
- Owner SSO belongs in `/sign-in`.
- Login timeout must tolerate first dev compile latency.
- API tenant fallback removal policy.
- Page-level permission enforcement pattern once established.

## Definition of Done

A batch is complete only when:

- Root cause is documented.
- Files changed are listed.
- Tests or verification are recorded.
- Reports are updated.
- Remaining risks are listed.
- Rollback path is documented.

