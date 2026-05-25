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
- audit-data.json
