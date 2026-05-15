
# Changelog: AI Brain
**Generated At:** 2026-05-14T11:46:55.234Z

## Version 1.1.1
- **Auto-Journal Reversal Engine (Phase 1.3.1):** Implemented `reverseJournalByReference` in `auto-journal.ts` to provide a standardized, idempotent, and atomic mechanism for reversing GL entries. Instead of hard-deleting records, the engine generates opposing contra-entries (Reversal Journals) ensuring absolute GL consistency. Included robust idempotency checks to prevent duplicate reversals of the same reference.

## Version 1.1.0
- **Sales Partial Payment Atomicity (Phase 1.2):** Implemented strict atomicity for `PUT /api/sales` using `withIdempotency`. Created `postSalesPayment` in `auto-journal.ts` mapping `CASH/BANK` to `RECEIVABLES`. Prevented overpayments by returning HTTP 400 *before* any transactions open. Ensured the Treasury in-flow and Journal Entry are securely generated inside a unified `prisma.$transaction`.

## Version 1.0.9
- **Purchase Partial Payment Atomicity (Phase 1.1):** Addressed the critical "split-brain" vulnerability in partial payments (`PUT /api/purchases`). Added `paymentType` enum (`cash` | `bank`) validation to prevent ambiguous operations. Implemented `postPurchasePayment` in `auto-journal.ts` capable of mapping `ACCOUNTS.PAYABLES` and the appropriate cash/bank accounts based on payment type. Wrapped the `PUT` endpoint in `withIdempotency` and bound the Treasury out-flow and the Journal Entry into a single strict `prisma.$transaction`.

## Version 1.0.8
- **FX Gain/Loss Accounting (Phase C.1):** Hardened `applyPayment` in `OpenItemsEngine` to calculate and materialize Realized FX adjustments. Introduced `FX_MATERIALITY_THRESHOLD` (0.01) with dynamic Directionality Matrix handling Vendor/Customer Gain/Loss scenarios symmetrically. Configured lazy-loaded Fail-Fast `FX_GAIN_GL_CODE`/`FX_LOSS_GL_CODE` settings extraction and synchronously executed an aggregated `JournalEntry` linked by `APP-PAY-<id>-FX` within the existing `prisma.$transaction`.

## Version 1.0.7
- **Payment Run GL & Treasury Binding (Phase B.3):** Upgraded `executePayments` in `PaymentRunEngine` to synchronously generate exactly one aggregated `Treasury` record and one aggregated `JournalEntry` per payment run execution. Enforced strict validation for source `bankAccountId` GL mapping. Modified journal logic to appropriately debit `ACCOUNTS.PAYABLES` partitioned by `vendorId`.

## Version 1.0.6
- **Payment Run Execute Atomicity (Phase B.2):** Wrapped `POST /api/finance/payment-runs/[id]/execute` in `withIdempotency` to prevent double-execution of bank files. Integrated mandatory `tenantId` checking and filtering. Executed `PaymentRunEngine.executePayments` within a strict `prisma.$transaction` encompassing both run status and line item updates. Banned `.catch(() => {})` usage.

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
