# System Workflows

## Sales & ZATCA Workflow (Atomic)
1. **Request Reception:** `POST /api/sales` receives invoice data.
2. **Quota & Validation:** Verify tenant limits and Zod schema.
3. **Transaction Start:** Open `prisma.$transaction(tx)`.
4. **Data Creation:** 
   - Invoice + Details created.
   - Stock deducted + StockMovement logged.
5. **State Audit:** Audit log entry created.
6. **ZATCA Outbox:** 
   - Check `zatca_enabled` setting.
   - If enabled, generate basic Phase 1 QR.
   - Write `ZATCA_REPORT_JOB` to `EventLog` table with `status="PENDING"`.
7. **Auto-Journal Integration:** 
   - Call `postSalesInvoice(..., txClient: tx)`.
   - `createJournalEntry` builds double-entry ledger.
   - Updates account balances immediately.
8. **Commit / Rollback:** 
   - If ANY step fails (or throws), everything rolls back.
   - If successful, transaction commits.
9. **Background Processing (ZATCA):** BullMQ worker polls `EventLog`, signs XML, and communicates with ZATCA Phase 2 APIs.

*This workflow pattern MUST be applied to Purchases and Returns.*

## Purchase Invoice & Auto-Journal Workflow (Atomic)
1. **Request Reception:** `POST /api/purchases` receives invoice data.
2. **Transaction Start:** Open `prisma.$transaction(tx)`.
3. **Data Creation:** 
   - Invoice + Details created via `tx`.
   - Stock incremented and `productStock` upserted via `tx`.
   - Audit `stockMovement` created via `tx`.
4. **State & Match:** 3-Way match created, state transition audited via `tx`.
5. **Auto-Journal Integration:** 
   - `postPurchaseInvoice(..., txClient: tx)` is called BEFORE transaction ends.
   - Journal Entry is created dynamically matching GRN or Direct Inventory.
6. **Commit / Rollback:** 
   - If the journal entry fails or inventory fails, an explicit error is thrown, and the transaction is fully rolled back, leaving zero split-brain trace.

## Enterprise Idempotency Workflow
**Status:** IMPLEMENTED FOR SALES AND PURCHASES
**Execution Flow:**
1. **Request Intercept:** HTTP Request is intercepted by `withIdempotency` wrapper.
2. **Key Extraction:** Extract `Idempotency-Key` from Headers or `body.idempotencyKey`. If missing, the request executes normally without idempotency guarantees.
3. **Database Check (Atomic):** 
   - Attempt to `create` an `IdempotencyRecord`.
   - If `P2002` (Unique Constraint) occurs, it means the request is a duplicate.
   - If existing record is `IN_PROGRESS`, return `409 Conflict`.
   - If existing record is `COMPLETED`, check the `requestHash`. If it matches, return the cached `responseBody` with its original status code. If it differs, return `400 Bad Request`.
4. **Execution:** Proceed to the actual API Handler.
5. **Completion:** On success, update record status to `COMPLETED` and save `responseBody`.
6. **Failure:** On failure (or unhandled throw), update record status to `FAILED`, allowing future retries with the same key.
