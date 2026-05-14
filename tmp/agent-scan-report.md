# Treasury & Payments Atomicity Scan Report

## 1. Scope & Objective
**Objective:** Perform a DEEP SCAN LEVEL 3 to identify atomicity, double-posting, and ledger mismatch vulnerabilities within the Treasury and Payments domains.

## 2. Files Scanned & Analyzed
- `src/app/api/treasury/route.ts` (Manual Treasury Receipts/Payments)
- `src/app/api/accounting/open-items/apply-payment/route.ts` (AR/AP Open Items Payment Application)
- `src/lib/open-items.ts` (Open Items Core Logic)
- `src/app/api/payments/charge/route.ts` (Payment Gateways)
- `src/app/api/finance/treasury/route.ts` (Realized FX & Cash Position)
- `src/app/api/finance/payment-runs/[id]/execute/route.ts` (Bulk Payment Execution)

## 3. Related Domains Affected
- **Treasury (Cash/Bank management)**
- **Accounting (General Ledger & Journal Entries)**
- **Accounts Receivable / Accounts Payable (Open Items)**
- **Tenant Isolation Boundaries**

## 4. Root Cause & Architectural Flaws Identified

### A. Missing General Ledger Synchronization (Split-Brain Ledger Mismatch)
**Location:** `src/app/api/treasury/route.ts` (POST)
- **Issue:** The API allows users to create manual treasury records (`in`/`out`) inside a `prisma.$transaction`. However, **it NEVER calls `createJournalEntry` or `postDeposit`/`postExpense`**. 
- **Risk:** High (Critical). A user can receive cash into the treasury (showing a higher balance in the Treasury module), but the `account.balance` in the GL remains unchanged. This will completely destroy the trial balance integrity.

### B. Missing Idempotency (Double Posting Risk)
**Locations:**
- `src/app/api/treasury/route.ts`
- `src/app/api/accounting/open-items/apply-payment/route.ts`
- `src/app/api/payments/charge/route.ts`
- `src/app/api/finance/payment-runs/[id]/execute/route.ts`
- **Issue:** None of these financial endpoints are wrapped with the new `withIdempotency` utility.
- **Risk:** High. A user double-clicking "Apply Payment" or "Save Treasury Receipt" will execute the action twice, creating duplicate payments and duplicate stock/open-item reductions.

### C. Open Items FX Gain/Loss Ledger Gap
**Location:** `src/lib/open-items.ts` (`applyPayment` function)
- **Issue:** The function correctly calculates `totalFxGainLoss`, creates an `itemApplication` record, and updates `openAmount`, all within a `$transaction`. BUT it does not post the FX Gain/Loss to the General Ledger.

### D. Missing Tenant Guard Validation
- Most treasury endpoints rely on `body.branchId` or query params, but do not strictly enforce `tenantId` isolation via headers the way we did for `purchase-returns`.

## 5. Execution Plan (Suggested Fixes)
To achieve Enterprise-grade Treasury Atomicity, the following plan is recommended:

**Phase 1: Idempotency & GL Binding for Treasury**
1. Modify `src/app/api/treasury/route.ts` to use `withIdempotency`.
2. Extract the `tenantId` from headers.
3. Import `createJournalEntry` inside the Prisma `$transaction`.
4. Dynamically map the treasury action to a GL entry (Debit Cash/Bank, Credit Source/Customer/Income) ensuring exact atomicity.

**Phase 2: Payment Allocations Atomicity**
1. Modify `src/app/api/accounting/open-items/apply-payment/route.ts` to use `withIdempotency`.
2. Update `OpenItemsEngine.applyPayment` to accept a `txClient`.
3. If an FX Gain/Loss exists, trigger an automatic Journal Entry inside the same transaction.

## 6. Testing Plan
- Execute `npm run build` after modifications to catch any TypeScript/Zod mapping errors.
- Test double-posting to the treasury endpoint to confirm 409 Conflict.
- Verify that manual treasury receipts automatically update the GL trial balance simultaneously.

*This report is generated for user approval prior to any code modifications.*
