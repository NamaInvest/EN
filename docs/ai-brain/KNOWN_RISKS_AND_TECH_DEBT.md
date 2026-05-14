
# Known Risks & Tech Debt
**Generated At:** 2026-05-14T11:46:55.234Z

## Legacy Routes
- `_ice_archive` contains legacy code. Do not revive without audit.

## Decimal Math
- JS floating point math is dangerous. Always use `Decimal.js` or integer cents for totals and taxes.

## Database Migrations
- The local shadow DB is corrupt due to early historic migration modifications. Future migrations MUST use `migrate diff` manually or reset the DB if absolutely necessary.
