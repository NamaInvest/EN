
# Changelog: AI Brain
**Generated At:** 2026-05-14T11:46:55.234Z

## Version 1.0.5
- **Apply Payment Atomicity (Phase B.1):** Wrapped `POST /api/accounting/open-items/apply-payment` in `withIdempotency`. Implemented explicit `tenantId` boundaries in `OpenItemsEngine.applyPayment`, `markAsDisputed`, and `recordPromiseToPay`. Ensured complete `prisma.$transaction` execution for apply payment operations.

## Version 1.0.4
- **Treasury Strict Mode (Phase A):** Hardened `POST /api/treasury` with strict `counterpartyAccountId` validation for manual entries. Integrated `createJournalEntry` via `txClient` inside the atomic `prisma.$transaction`. Removed legacy split-brain vulnerabilities and banned temporary suspense accounts.

## Version 1.0.3
- **Purchase Returns Atomicity:** Complete overhaul of `src/app/api/purchase-returns/route.ts` to implement strict atomicity. Implemented dynamic `details/items` parsing and actual `PurchaseReturnDetail` insertion. Fixed missing inventory deductions (`product.currentStock`, `productStock`) and `stockMovement` logging. Placed treasury creation and auto-journal (`postPurchaseReturn`) within the Prisma `$transaction`, forcing hard failures upon errors.

## Version 1.0.2
- **Sales Returns Atomicity:** Refactored `src/app/api/sales-returns/route.ts` to implement strict atomicity. Included `withIdempotency` wrapper, established `tenantId` usage, fixed missing stock movement creation, placed auto-journal inside the Prisma `$transaction`, and removed masked errors (`.catch(() => null)`).

## Version 1.0.1
- **Sales Inventory Fail-Safe:** Removed swallowed error try/catch blocks in `src/app/api/sales/route.ts` around `productStock.upsert` and recipe ingredient deductions to ensure true transaction atomicity and fail-safe financial rollbacks.

## Version 1.0.0
- Initial automated generation of the 16-file AI Brain structure.
- Extracted system overview, financial integrity rules, idempotency logic, and tenant isolation constraints.
