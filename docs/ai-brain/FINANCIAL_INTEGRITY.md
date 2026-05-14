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

## Financial Idempotency — Audit Phase
**Audit Status:** PENDING DESIGN IMPLEMENTATION
**Risks Identified:**
1. **Double Posting:** A user double-clicking "Submit" on a slow network can trigger two simultaneous API requests, generating two invoices and two journal entries.
2. **Network Retries:** Mobile apps or POS offline-sync agents might retry a request that actually succeeded on the server but timed out on the client, resulting in duplicate records.
3. **No Safety Nets:** There is no mechanism in place (`Idempotency-Key` headers) to detect and replay successful responses for identical requests.

**Action Plan:**
1. Create an `IdempotencyRecord` table in `schema.prisma` with a compound unique constraint on `(tenantId, key)`.
2. Implement a `withIdempotency` API middleware.
3. Wrap `/api/sales`, `/api/purchases`, and other financial endpoints in this middleware to ensure strict exactly-once execution.
