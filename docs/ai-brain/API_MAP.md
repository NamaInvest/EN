# API Map

## Core Financial Endpoints
- `POST /api/sales`: (Refactored) Implements full ACID atomic transaction with `txClient` injection. Outbox pattern used for ZATCA.
- `POST /api/purchases`: (Refactored) Implements full ACID atomic transaction with `txClient` injection.

## Library Functions
- `src/lib/auto-journal.ts`
  - `createJournalEntry`: Centralized double-entry function. **Supports `txClient` parameter to participate in existing transactions.**
  - `postSalesInvoice`: Receives and passes `txClient`.
  - `postPurchaseInvoice`: (Refactored) Receives and passes `txClient`.

## Purchase Invoice Atomicity
**Status:** IMPLEMENTED AND VERIFIED.
- `src/app/api/purchases/route.ts`: Transaction boundary extended to encompass `postPurchaseInvoice` with strict rollback on inventory or GL failure.
- `src/lib/auto-journal.ts`: `postPurchaseInvoice` uses `txClient` injection.

## Financial Idempotency
**Status:** IMPLEMENTED AND VERIFIED.
- Target endpoints: `/api/sales`, `/api/purchases` are fully wrapped and protected.
- Pending endpoints: `/api/payments`, `/api/journal`, Returns.
- Helper required: `src/lib/idempotency.ts` (`withIdempotency` wrapper).
