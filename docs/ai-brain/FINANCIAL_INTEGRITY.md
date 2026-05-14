
# Financial Integrity
**Generated At:** 2026-05-14T11:46:55.234Z

## Core Principles
1. **Zero Split-Brain:** All financial operations must occur inside a single atomic transaction. An invoice must never exist without its corresponding journal entry, and vice-versa.
2. **TxClient Injection:** Any service function that performs database updates (like `createJournalEntry`) MUST accept a `txClient` (Prisma Transaction Client) and use it exclusively.
3. **Hard Failures (Throw Errors):** Do not return soft `{ success: false }` inside atomic transactions. Throwing forces rollback.
4. **Inventory & Ledger Atomicity (No Swallowed Errors)**
**RULE**: Any module affecting both inventory and ledger (e.g., Sales, Purchases, Returns) **MUST** perform all updates inside a single `prisma.$transaction`.
**RULE**: **NEVER** use `.catch(() => null)` around inventory `upsert`, `stockMovement.create`, or `treasury.create` inside a transaction.
**RULE**: The `postSalesReturn`, `postPurchaseReturn`, `postSalesInvoice`, and `postPurchaseInvoice` functions **MUST** accept a `txClient` and execute the journal entry inside the same parent transaction. If the journal fails, the entire transaction (including invoice and stock) MUST rollback. to prevent financial split-brain.
13. **Treasury Atomicity (Strict Mode):** All treasury receipts and payments MUST include explicit GL mapping via `counterpartyAccountId`. Suspense accounts are forbidden. `POST /api/treasury` must execute inside a `prisma.$transaction`, bind `createJournalEntry`, and be protected by `withIdempotency`.
14. **Apply Payment Atomicity (Phase B.1):** `applyPayment` endpoints MUST be wrapped in `withIdempotency` to prevent double postings of payment allocations. The execution MUST occur within a unified `prisma.$transaction`. All updates (`openItem`, `itemApplication`) MUST explicitly filter by `tenantId` to enforce isolation. Swallowed errors are expressly forbidden.
15. **Payment Run Execute Atomicity (Phase B.2):** `executePayments` MUST be wrapped in `withIdempotency` to prevent double-execution of bank files. It MUST execute inside a single `prisma.$transaction` covering all line status changes and the main run status. Every database query MUST filter by `tenantId`. `catch(() => {})` is absolutely banned.
15. **Outbox Pattern:** External API calls (like ZATCA) must NEVER be made synchronously inside a financial transaction.
## Release Operations & Database Safety
- Modifying applied historic migrations is strictly prohibited.
- Use `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` to safely generate diffs bypassing broken shadow DBs.
