
# Changelog: AI Brain
## Version 1.1.17
- **POS Atomicity & Accounting Fix (Phase 1.9):** Completely overhauled the `api/pos/route.ts` point-of-sale endpoint to integrate it fully with the accounting and inventory engines. Addressed the "Financial Blackhole" by generating automatic `Treasury` receipts for cash/bank payments and invoking `postSalesInvoice` to record Revenue, COGS, and VAT into the General Ledger. Addressed the "Inverse Split-Brain" by enforcing synchronous deductions of both global `currentStock` and `ProductStock` within a strict `prisma.$transaction`.

## Version 1.1.16
- **Delivery Notes Stock Consistency (Phase 1.8):** Refactored `api/sales/delivery-notes` to extract the `stockId` from the request payload and fully synchronize physical stock deductions. The endpoint now atomically applies the quantity decrement to both global `currentStock` and warehouse-specific `ProductStock`, while recording a `StockMovement` explicitly linked to the chosen `stockId`. This completely eliminates the hardcoded `stockId: 1` split-brain vulnerability during outbound delivery processing.

## Version 1.1.15
- **Manufacturing Completion Atomicity (Phase 1.7.2):** Sealed the remaining split-brain vulnerabilities in `api/manufacturing/work-orders` during the `in_progress -> completed` transition. Migrated finished goods inventory additions, warehouse allocation (`ProductStock.upsert`), detailed `StockMovement` creation, and the final manufacturing journal (`postManufacturingCompletion`) directly into the `prisma.$transaction`. Financial failure now halts physical state mutations.

## Version 1.1.14
- **Manufacturing Material Issue Atomicity (Phase 1.7.1):** Hardened the Work Orders endpoint (`api/manufacturing/work-orders`) during the `draft -> in_progress` transition. Integrated physical stock deduction (`product.currentStock`), warehouse inventory (`ProductStock`), and `StockMovement` creation directly into the main `prisma.$transaction`. Also injected the transaction client (`txClient`) into `postMaterialIssueToWIP`, ensuring that if the accounting journal entry fails, the physical raw materials are safely rolled back, eliminating split-brain vulnerabilities in the manufacturing module.

## Version 1.1.13
- **Products Import Phantom Stock Guard (Phase 1.6.2A):** Hardened the `api/products/import` endpoint to prevent users from injecting "phantom stock" via Excel bulk import. If an imported product has `currentStock > 0`, the system automatically zeroes it out during creation and appends a warning message instructing the user to use the Stocktake module. This prevents untracked stock from bypassing `ProductStock` allocation, `StockMovement` logging, and opening balance journal generation.

## Version 1.1.12
- **Stocktake Atomic Inventory Correction (Phase 1.6.1):** Hardened the `api/stocktake` endpoint by enclosing the inventory correction loop within a `prisma.$transaction`. Fixed a severe bug where `currentStock` was updated but warehouse-specific `ProductStock` was ignored, `StockMovement` logs were not created, and the `postInventoryAdjustment` accounting journal was never generated. Now, all four operations execute atomically, preventing inventory and general ledger desynchronization.

## Version 1.1.11
- **Immediate Purchase Receive GRN Posting (Phase 1.5.2D):** Refactored `POST /api/purchases` to safely close the Ghost Balance vulnerability when creating purchase invoices with immediate receipt (`receiptStatus = 'received'`). The endpoint now executes `postPurchaseInvoice` (Dr GRNI) and immediately follows with `postGRN` (Cr GRNI, Dr INVENTORY) within the same `prisma.$transaction`. This ensures all immediate receipts are correctly tracked in both the physical inventory and the GL without bypassing the 3-Way Match GRNI clearing logic.

## Version 1.1.10
- **Purchases Receive Atomic GRN Posting (Phase 1.5.2C):** Refactored the `PUT /api/purchases/[id]/receive` endpoint to encapsulate physical stock increments and financial GRN journal creation within a strict `prisma.$transaction`. Removed all `try/catch` blocks that previously swallowed inventory update errors. The endpoint now reliably calls `postGRN` to transition balances from `GRNI` to `INVENTORY` atomically, guaranteeing GL integrity during post-invoice stock receipts.

## Version 1.1.9
- **Purchase GRNI Normalization (Phase 1.5.2B):** Standardized the `postPurchaseInvoice` accounting logic to unconditionally debit `GRNI` (Goods Received Not Invoiced) rather than varying between `INVENTORY` and `GRNI` based on receipt status. This enforces a strict 3-Way Match paradigm, setting the foundation to safely implement atomic stock receipts without risking Double Journal anomalies.

## Version 1.1.8
- **GRN Atomicity Enforcement (Phase 1.5.1):** Hardened the `POST /api/grn` endpoint to eliminate Stock-to-GL desync vulnerabilities. The `postGRN` financial journal creation is now fully bound within the primary `prisma.$transaction`. Removed all error-swallowing `.catch()` blocks from physical inventory updates, ensuring that any failure in the accounting layer (e.g., closed fiscal periods) definitively aborts the entire receiving process and rolls back physical stock adjustments.

## Version 1.1.7
- **Stock Adjustments Warehouse Sync (Phase 1.4.4):** Hardened the `POST /api/stock/adjustments` endpoint to ensure warehouse-level consistency. The schema now accepts an optional `stockId` parameter. The transaction now includes a `productStock.upsert` operation to update the physical location balance synchronously with the global `currentStock`, fixing a discrepancy where physical stock counts were only recorded globally and defaulted to warehouse 1.

## Version 1.1.6
- **Manual Stock Movements Atomicity (Phase 1.4.3):** Hardened the `POST /api/stock-movements` endpoint. The creation of `stockMovement` records and the modification of `product.currentStock` are now unified under a strict `prisma.$transaction`. Additionally, `productStock.upsert` was implemented within the transaction to ensure that location-specific warehouse balances (`stockId`) are synchronously tracked, closing a loophole where only the global item stock was updated.

## Version 1.1.5
- **Stock Adjustments Atomicity (Phase 1.4.2):** Refactored `POST /api/stock/adjustments` and `postInventoryAdjustment` in `auto-journal.ts` to strictly enforce GL atomicity. Removed the `try/catch` wrapper that previously swallowed journal creation failures, and passed the `txClient` directly into the journal generation function. This guarantees that if the financial journal cannot be posted (e.g. closed fiscal period), the physical stock adjustment will safely rollback, resolving a major Stock-to-GL desync vulnerability.

## Version 1.1.4
- **Ledger Posting Atomicity (Phase 1.4.1):** Addressed a critical Ledger Split-Brain vulnerability in the `PATCH /api/accounting/journal/[id]` endpoint. The manual journal posting mechanism, including the document state `transition` and iterative `account.update` logic, is now safely encapsulated inside a strict `prisma.$transaction`. This prevents partial balance updates if the server fails mid-execution.

## Version 1.1.3
- **Purchases DELETE Atomicity (Phase 1.3.3):** Refactored `DELETE /api/purchases` to safely reverse the General Ledger instead of leaving orphaned journals. Migrated to using `reverseJournalByReference` to generate contra-entries for both the primary purchase journal (`PUR-`) and any partial payment journals (`PUR-PAY-`). All reversals, stock un-reservation, and treasury deletions are securely bound within the single `prisma.$transaction`.
## Version 1.1.2
- **Sales DELETE Atomicity (Phase 1.3.2):** Refactored `DELETE /api/sales` to completely eliminate the usage of `journalEntry.deleteMany`. Migrated to using `reverseJournalByReference` to safely generate contra-entries for both the primary sales journal (`SALE-`) and any partial payment journals (`SAL-PAY-`). All reversals, along with the standard stock un-reservation and treasury record deletions, are securely bound within the single `prisma.$transaction`.

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
