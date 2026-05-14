# Workflows
**Generated At:** 2026-05-14T11:46:55.234Z

## Sales Invoice Lifecycle
1. User submits invoice.
2. `withIdempotency` intercepts to check for duplicate `Idempotency-Key`.
3. `prisma.$transaction` begins.
4. `SalesInvoice` inserted.
5. Inventory deducted (`productStock`, `StockMovement`, `recipe ingredients`). If any inventory component fails, the entire transaction rolls back.
6. `createJournalEntry` called inside transaction.
7. Audit Log recorded.
8. ZATCA Event added to `EventLog` (Outbox pattern).
13. Transaction commits.

## Treasury Manual Receipt/Payment Lifecycle (Strict Mode)
- **API**: `POST /api/treasury`
- **Idempotency**: Protected by `withIdempotency`.
- **Flow**:
  1. Zod runtime validation includes optional `counterpartyAccountId`.
  2. For `manual` reference types, exact mapping is enforced: if `treasuryAccountId` or `counterpartyAccountId` is missing, API throws HTTP 400.
  3. `prisma.$transaction` creates the `Treasury` record.
  4. Synchronously executes `createJournalEntry` via injected `txClient`. Debit/Credit is determined by `type` ('in' or 'out').
  5. Transaction commits, ensuring zero possibility of an orphan treasury record without its corresponding general ledger double-entry.

## Apply Payment Lifecycle (Phase B.1)
- **API**: `POST /api/accounting/open-items/apply-payment`
- **Idempotency**: Protected by `withIdempotency`.
- **Flow**:
  1. `applyPayment` engine accepts `paymentOpenItemId` and `allocations`.
  2. `tenantId` is strictly injected into the engine from API headers.
  3. `prisma.$transaction` wraps the entire operation.
  4. All `openItem` retrieval and updating strictly scope by `tenantId`.
  5. Payment remaining amount is reduced, and invoice `openAmount` is cleared or reduced.
  6. Transaction commits safely. No swallowed errors are permitted.

## Payment Run Execute Lifecycle (Phase B.2)
- **API**: `POST /api/finance/payment-runs/[id]/execute`
- **Idempotency**: Protected by `withIdempotency`.
- **Flow**:
  1. API extracts `tenantId` from headers and blocks requests lacking it.
  2. Engine uses `prisma.$transaction` to guarantee atomicity.
  3. Validates `tenantId` against the `paymentRun`.
  4. Generates bank transfer file (SADAD/ISO 20022).
  5. Iterates through lines and updates status to `PAID`.
  6. Updates parent `paymentRun` to `SENT_TO_BANK`.
  7. Commits or rolls back entirely (GL/Treasury logic is intentionally deferred).

## Sales Returns Lifecycle (Atomic)
- **API**: `POST /api/sales-returns`
- **Validation**: Verifies original invoice belongs to `tenantId` & validates items.
- **Transaction Start**:
  - Creates `SalesReturn`.
  - Increments `product.currentStock` and `productStock.quantity` (Hard fail).
  - Creates `stockMovement` (Type: `in`) for returned items.
  - Creates `treasury` refund entry.
  - Calls `postSalesReturn` (passing `txClient`) to create Journal Entry.
- **Commit**: Either ALL pass, or ALL rollback.
- **Post-Commit**: ZATCA Event Outbox creation (TODO).

## Purchase Returns Lifecycle (Atomic)
- **API**: `POST /api/purchase-returns`
- **Validation**: Validates input schema and items array. Verifies `originalInvoiceId` is associated with the active tenant.
- **Transaction Start**:
  - Creates `PurchaseReturn` and nested `PurchaseReturnDetail` items.
  - Decrements `product.currentStock` and `productStock.quantity` (Hard fail).
  - Creates `stockMovement` (Type: `out`) for the returned items.
  - Creates `treasury` refund entry.
  - Calls `postPurchaseReturn` (passing `txClient`) to create Journal Entry.
- **Commit**: Either ALL pass, or ALL rollback. No swallowed errors.

## Idempotency Flow
- Check DB for existing `[tenantId, endpoint, key]`.
- If `COMPLETED`, return cached response.
- If `IN_PROGRESS`, return 409 Conflict.
- Run handler -> Update record on success/fail.
