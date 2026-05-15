
# AI Project Memory
**Generated At:** 2026-05-14T11:46:55.234Z

## Welcome, AI Agent!
You are operating inside **Nama Invest ERP**. This system is highly complex, multi-tenant, and financially sensitive.
Before writing any code, YOU MUST read the relevant files in the `docs/ai-brain` directory.

## Core Directories
- `/docs/ai-brain/PROJECT_BRAIN.md`: Executive Overview
- `/docs/ai-brain/SYSTEM_MAP.md`: Architecture & Folders
- `/docs/ai-brain/DOMAIN_MAP.md`: Business Domains
- `/docs/ai-brain/FINANCIAL_INTEGRITY.md`: ⚠️ CRITICAL FINANCIAL RULES
- `/docs/ai-brain/AI_AGENT_RULES.md`: ⚠️ CRITICAL AGENT INSTRUCTIONS

## Architectural Updates Log
- **2026-05-15**: Enforced **Phase 1.4.2 - Stock Adjustments Atomicity**. Refactored `POST /api/stock/adjustments` to enforce strict financial atomicity. Removed the error-swallowing `try/catch` block around `postInventoryAdjustment` and directly passed `txClient: tx`. The physical inventory adjustment and the financial GL adjustment are now fully bound within a single `prisma.$transaction`. Any failure in the journal creation (e.g., closed fiscal period) now correctly rolls back the physical stock change, permanently eliminating Stock-to-GL desync vulnerabilities.
- **2026-05-15**: Enforced **Phase 1.4.1 - Ledger Posting Atomicity**. Refactored the `PATCH /api/accounting/journal/[id]` endpoint to wrap the entire document state `transition` and manual journal line account balance updates (`account.update`) within a single strict `prisma.$transaction`. This definitively eliminates the Ledger Split-Brain vulnerability where a partial execution could modify some balances but leave the journal in a DRAFT state.
- **2026-05-15**: Enforced **Phase 1.3.3 - Purchases DELETE Atomicity**. Refactored `DELETE /api/purchases` to safely reverse the General Ledger instead of leaving orphaned journals. Migrated to using `reverseJournalByReference` to generate contra-entries for both the primary purchase journal (`PUR-`) and any partial payment journals (`PUR-PAY-`). All reversals, stock un-reservation, and treasury deletions are securely bound within the single `prisma.$transaction`.
- **2026-05-15**: Enforced **Phase 1.3.2 - Sales DELETE Atomicity**. Refactored `DELETE /api/sales` to completely eliminate `journalEntry.deleteMany`. Implemented safe GL reversal via `reverseJournalByReference` for both the main invoice (`SALE-`) and any partial payments (`SAL-PAY-`). Maintained existing `Treasury` record deletions within the same `prisma.$transaction`.
- **2026-05-15**: Enforced **Phase 1.3.1 - Auto-Journal Reversal Engine**. Added `reverseJournalByReference` to `auto-journal.ts` to replace hard-deletes (`deleteMany`). Established atomic GL reversal by generating explicit contra-entries (Reversal Journals) wrapped in `txClient`. Integrated idempotency check to safely block duplicate reversals of the same reference.
- **2026-05-15**: Enforced **Phase 1.2 - Sales Partial Payment Atomicity**. Implemented `PUT /api/sales` with `withIdempotency` wrapper. Bound Treasury generation and `postSalesPayment` accounting journal directly into a strict `prisma.$transaction`. Prevented overpayments natively and blocked out-of-order execution.
- **2026-05-15**: Enforced **Phase 1.1 - Purchase Partial Payment Atomicity**. Closed "split-brain" vulnerability in partial payments by strictly limiting `paymentType` to `cash` and `bank`, and executing `postPurchasePayment` journal generation inside the exact same `prisma.$transaction` as the treasury record. Enforced `withIdempotency` exclusively on `PUT /api/purchases` to prevent double-spending and ensure atomic rollback.
- **2026-05-14**: Enforced **Phase C.1 - FX Gain/Loss Accounting**. Implemented atomic Realized FX generation inside `applyPayment`. Configured symmetrical Directionality Matrix (Vendor/Customer vs Gain/Loss). Introduced strict `FX_MATERIALITY_THRESHOLD` (0.01) and lazy Settings load (Fail-Fast). Stored `fxGainLossAccountId` securely inside `ItemApplication` while tying the aggregated FX `JournalEntry` to reference `APP-PAY-<id>-FX` without schema drift.
- **2026-05-14**: Enforced **Phase B.3 - Payment Run GL & Treasury Binding**. Upgraded `executePayments` to generate an aggregated `Treasury` record and a corresponding aggregated `JournalEntry` within the same transaction. The journal strictly debits `ACCOUNTS.PAYABLES` per supplier (using `vendorId`) and credits the source bank account. Explicit validation fails-fast if the source `bankAccountId` lacks a GL code. FX handling remains deferred to Phase C.
- **2026-05-14**: Enforced **Phase B.2 - Payment Run Execute Atomicity**. Refactored `executePayments` in `PaymentRunEngine` to use strict `tenantId` isolation and wrap the entire process (bank file generation, `paymentRunLine` updates, and `paymentRun` status) inside a single `prisma.$transaction`. Removed highly dangerous `catch(() => {})` logic. GL, Treasury, and FX remain deferred risks.
- **2026-05-14**: Enforced **Phase B.1 - Apply Payment Atomicity**. Wrapped `applyPayment` in `withIdempotency` to prevent double-posting. Added explicit `tenantId` boundaries to all `openItem` queries and `itemApplication` creation within `OpenItemsEngine`. Removed latent missing context inside `apply-payment/route.ts`. GL and FX integration are staged for later.
- **2026-05-14**: Enforced **Treasury Strict Mode (Phase A)** on `POST /api/treasury`. Required strict `counterpartyAccountId` mapping for manual treasury entries, ensuring zero split-brain journal records. Integrated `withIdempotency` and synchronous `createJournalEntry` execution within a unified `prisma.$transaction`. Fallback to suspense accounts is expressly forbidden.
- **2026-05-14**: Refactored `Purchase Returns` module for strict atomicity. Integrated `withIdempotency`, executed journal posting inside Prisma `$transaction`, added dynamic details/items parsing with hard inventory deductions (`product.currentStock`, `productStock`, `stockMovement`), and enforced tenant-level validation for parent invoices.
- **2026-05-14**: Refactored `Sales Returns` module to enforce atomic financial integrity. Integrated `withIdempotency` wrapper, established exact tenant scoping, restored missing stock movement tracking, executed `postSalesReturn` journal entry synchronously within Prisma `$transaction`, and eliminated `.catch(() => null)` masked errors. ZATCA Event Outbox added as a TODO.
- **2026-05-14**: Refactored `Sales` inventory module. Eliminated swallowed errors inside Prisma transaction (`productStock.upsert`, `stockMovement.create`). Any inventory failure now safely rolls back the entire invoice and treasury record.

## Your Mandate
1. Check the Brain.
2. Write Code.
3. Validate via `tsc --noEmit`.
4. Update the Brain if architecture changes.
