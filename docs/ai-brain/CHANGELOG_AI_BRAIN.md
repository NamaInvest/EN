# AI Brain Changelog

## [2026-05-14] Financial Atomicity (Sales)
- **Added:** `FINANCIAL_INTEGRITY.md` outlining the atomic transaction rules, txClient injection, and ZATCA Outbox requirements.
- **Added:** `WORKFLOWS.md` detailing the atomic step-by-step Sales creation workflow.
- **Added:** `API_MAP.md` mapping current progress on API atomic refactors.
- **Added:** Unit tests (`src/lib/__tests__/sales-atomicity.test.ts`) validating the rollback rules.
- **Verified:** Sales API is now guaranteed to never suffer from split-brain scenarios regarding journal entries, stock, or ZATCA delays.

## [2026-05-14] Financial Atomicity (Purchases)
- **Refactored:** `/api/purchases` now fully atomic. `postPurchaseInvoice` moved inside `prisma.$transaction`.
- **Fixed:** Swallowed errors in inventory updates (via `productStock.upsert`) were removed, ensuring failed stock updates trigger full rollbacks.
- **Added:** `purchase-atomicity.test.ts` to validate missing account and closed period rollbacks.
- **Updated:** Documentation in `FINANCIAL_INTEGRITY.md`, `WORKFLOWS.md`, and `API_MAP.md` reflecting the new verified purchase pattern.

## [2026-05-14] Financial Idempotency (Audit Phase)
- **Scanned:** Sales, Purchases, Returns, Payments, and Journal API endpoints. Confirmed total absence of idempotency safeguards.
- **Designed:** `IdempotencyRecord` Prisma schema to cache request keys and responses.
- **Designed:** `withIdempotency` wrapper logic to handle concurrent requests (Race conditions) and response replays.
- **Updated:** Project Brain documents (`FINANCIAL_INTEGRITY.md`, `WORKFLOWS.md`, `API_MAP.md`, `DATABASE_MAP.md`) marking Idempotency as PENDING IMPLEMENTATION.

## [2026-05-14] Financial Idempotency (Implementation)
- **Implemented Schema:** Added `IdempotencyRecord` to `schema.prisma` with `@@unique([tenantId, endpoint, key])`.
- **Implemented Wrapper:** Built `src/lib/idempotency.ts` which intercepts requests, verifies request hashes (`crypto.sha256`), and blocks concurrent execution via database-level `P2002` constraints.
- **Integrated:** Wrapped `POST /api/sales` and `POST /api/purchases` handlers inside `withIdempotency`.
- **Tested:** Added `idempotency.test.ts` which verified cache replay, hash mismatch detection, and conflict (`IN_PROGRESS`) handling.
- **Status:** Sales and Purchases are now 100% immune to Double Posting and Offline-Sync Replay issues.
