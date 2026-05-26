# Full UI / Permissions / Reports Audit - 2026-05-25

## Scope
Static audit of sidebar navigation, dashboard pages, report pages, API boundaries, permission modules, and UI actions/buttons. Dynamic browser audit is still required for click-by-click proof.

## Counts
- Sidebar menu links: 289
- Unique permission modules from sidebar: 79
- Dashboard pages: 470
- API routes: 866
- Report pages: 22
- Report APIs: 18
- Pages with buttons/forms/onClick: 399

## Gaps / Missing Items
- Menu links without matching dashboard page: 0
- Report menu links without matching dashboard page: 0
- Dashboard pages not reachable from sidebar menu: 190
- API routes without withRoute wrapper: 72
- API routes with default tenant fallback patterns: 94
- API routes using direct new PrismaClient: 26
- API routes using raw unsafe SQL helpers: 6

## Report Files
- 01-sidebar-menu.md
- 02-dashboard-pages.md
- 03-permission-modules.md
- 04-reports-inventory.md
- 05-api-security-audit.md
- 06-ui-actions-buttons.md
- 07-missing-gaps.md
- 08-permissions-audit.md
- 09-critical-actions-audit.md
- 10-runtime-menu-audit.md
- 11-remediation-master-plan.md
- audit-data.json

## Remediation Status
- Login/desktop auth bootstrap: fixed and verified on 2026-05-26.
- `/login` no longer imports Clerk or calls Clerk hooks.
- Local `admin/admin` login verified against `/api/auth/login` and browser redirect to `/dashboard`.
- Login timeout AbortError fixed by extending timeout and adding an explicit abort reason.
- Pre-login `/api/settings` 401 noise removed by skipping the protected call until a token exists.
- Full remediation plan created in `11-remediation-master-plan.md`.

## Current Runtime Baseline
- Runtime menu routes visited: 281
- Runtime flagged routes: 267
- Runtime page-error routes: 97
- Runtime console-error routes: 191
- Runtime timeout signals: 76
- Runtime hydration signals: 20
- Runtime HTTP 500 routes: 1
- Runtime explicit runtime-error-text routes: 2
