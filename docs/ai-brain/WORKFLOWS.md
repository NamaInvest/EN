
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

## Idempotency Flow
- Check DB for existing `[tenantId, endpoint, key]`.
- If `COMPLETED`, return cached response.
- If `IN_PROGRESS`, return 409 Conflict.
- Run handler -> Update record on success/fail.
