# AI Project Memory

## Active Phase: Financial Atomicity & Stability

### Verified Patterns
**Sales Invoice Atomicity (txClient Injection)**
- **Status:** Verified and implemented.
- **Pattern Details:** 
  - `src/lib/auto-journal.ts` now accepts `txClient` injection into `postSalesInvoice` and `createJournalEntry`.
  - All Sales Invoice operations (Invoice Creation, Stock Deduction, ZATCA Event Outbox, and Journal Entry Creation) run inside a single `prisma.$transaction(async tx => { ... })`.
  - If the Journal Entry fails (e.g., unbalanced, account missing, closed period), it throws a hard error which bubbles up and automatically rolls back all prior operations in the transaction.
  - ZATCA Phase 2 calls are completely decoupled from the critical path using `EventLog` (Outbox pattern). ZATCA operations are triggered asynchronously via Background Workers.

**Purchase Invoice Atomicity (txClient Injection)**
- **Status:** Verified and implemented.
- **Pattern Details:** 
  - `src/lib/auto-journal.ts` now accepts `txClient` injection into `postPurchaseInvoice`.
  - All Purchase Invoice operations (Invoice Creation, Stock Addition, Audit Logging, and Journal Entry Creation) run inside a single `prisma.$transaction`.
  - Swallowed errors during Inventory (`productStock.upsert`) were eliminated. If inventory fails, the entire transaction rolls back.
  - Throws explicit error if the journal fails to create, ensuring strict atomic synchronization with GL.
- **Next Steps:** Replicate this identical pattern to `Sales Returns` and `Purchase Returns`.
