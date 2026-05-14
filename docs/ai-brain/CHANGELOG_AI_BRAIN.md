
# Changelog: AI Brain
**Generated At:** 2026-05-14T11:46:55.234Z

## Version 1.0.2
- **Sales Returns Atomicity:** Refactored `src/app/api/sales-returns/route.ts` to implement strict atomicity. Included `withIdempotency` wrapper, established `tenantId` usage, fixed missing stock movement creation, placed auto-journal inside the Prisma `$transaction`, and removed masked errors (`.catch(() => null)`).

## Version 1.0.1
- **Sales Inventory Fail-Safe:** Removed swallowed error try/catch blocks in `src/app/api/sales/route.ts` around `productStock.upsert` and recipe ingredient deductions to ensure true transaction atomicity and fail-safe financial rollbacks.

## Version 1.0.0
- Initial automated generation of the 16-file AI Brain structure.
- Extracted system overview, financial integrity rules, idempotency logic, and tenant isolation constraints.
