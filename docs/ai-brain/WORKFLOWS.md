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
9. Transaction commits.

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
