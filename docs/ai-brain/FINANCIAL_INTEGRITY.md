# Financial Integrity Guidelines

## Core Principles
1. **Zero Split-Brain:** All financial operations must occur inside a single atomic transaction. An invoice must never exist without its corresponding journal entry, and vice-versa.
2. **TxClient Injection:** Any service function that performs database updates (like `createJournalEntry` or `postSalesInvoice`) MUST accept a `txClient` (Prisma Transaction Client) and use it exclusively for all database operations within its scope.
3. **Hard Failures (Throw Errors):** Do not return soft `{ success: false }` without a corresponding `throw new Error()` in the caller if the operation is part of an atomic transaction. A transaction only rolls back when an unhandled exception is thrown.
4. **Outbox Pattern:** External API calls (like ZATCA integration) must NEVER be made synchronously inside a financial transaction. Instead, record an event (e.g., `ZATCA_REPORT_JOB`) in the `EventLog` table inside the same transaction.

## Sales Invoice Atomicity — Verified Pattern
The Sales Invoice API (`src/app/api/sales/route.ts`) now adheres strictly to these guidelines:
- Uses `prisma.$transaction(async (tx) => { ... })`
- Creates Invoice and Details using `tx.salesInvoice.create`.
- Modifies Stock and logs Stock Movements using `tx`.
- Logs state changes to AuditLog using `tx`.
- Defers ZATCA calls by writing to `EventLog` using `tx`.
- Injects `tx` into `postSalesInvoice(..., txClient: tx)`.
- `postSalesInvoice` injects `tx` into `createJournalEntry`.
- If `createJournalEntry` fails, the route explicitly throws an error to force a full Rollback.

## Purchase Invoice Atomicity — Verified Pattern
**Audit Status:** IMPLEMENTED AND VERIFIED
**Modifications Applied:**
1. **Split-Brain Resolved:** `postPurchaseInvoice` is now executed entirely inside the `prisma.$transaction`.
2. **Strict Inventory Exceptions:** Removed `try-catch` blocks that swallowed errors during `productStock.upsert`. An inventory failure now reliably rolls back the entire invoice.
3. **Fiscal Period Protection:** Because the auto-journal is now synchronous inside the transaction, creating an invoice in a closed period correctly blocks the invoice creation.
4. **TxClient Injection:** `postPurchaseInvoice` accepts and passes the `txClient` correctly down to `createJournalEntry`.

## Financial Idempotency
**Audit Status:** IMPLEMENTED AND VERIFIED FOR SALES AND PURCHASES.
**Modifications Applied:**
1. **Schema Added:** `IdempotencyRecord` table with `@@unique([tenantId, endpoint, key])` enforcing database-level race condition prevention.
2. **Hash Validation:** Request body is hashed. If the same key is reused with a different hash, a 400 Bad Request is returned to prevent tampering.
3. **Response Replay:** Requests with a `COMPLETED` record instantly receive their cached response instead of reprocessing.
4. **Integration:** Applied wrapper `withIdempotency` to `/api/sales` and `/api/purchases`.
