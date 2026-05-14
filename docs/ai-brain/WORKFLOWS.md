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

## Enterprise Idempotency Workflow — Audit Phase
**Proposed Flow:**
1. **Request Intercept:** HTTP Request received.
2. **Key Extraction:** Extract `Idempotency-Key` from Headers. If missing, proceed normally (or reject based on strictness).
3. **Database Check (Atomic):** 
   - Attempt to `create` an `IdempotencyRecord`.
   - If `P2002` (Unique Constraint) occurs, fetch existing record.
   - If existing record is `IN_PROGRESS`, return `409 Conflict`.
   - If existing record is `COMPLETED`, return cached `responseBody` with `200 OK`.
4. **Execution:** Proceed to the actual API Handler (e.g., Sales/Purchases).
5. **Completion:** On success, update record status to `COMPLETED` and save `responseBody`.
6. **Failure:** On failure, update record status to `FAILED`, allowing future retries.
