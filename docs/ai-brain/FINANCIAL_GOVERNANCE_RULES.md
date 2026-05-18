# Financial Governance Rules

*Last Updated: 2026-05-18*

This document outlines the mandatory architectural rules for the Financial Period Lock and Governance system in Nama Invest ERP. These rules apply to all modules touching financial data, inventory valuation, treasury, payroll, and year-end closing.

## 1. Scope of Protection
The Financial Governance Architecture strictly enforces that no transactional or valuation data can be mutated inside a closed fiscal period.
- **Protected Paths**: AP/AR Posting, Treasury Settlement, Sales & Purchase Returns, Inventory Movements, Inventory Adjustments, Cycle Counts, Payroll Generation, Payroll Runs, Year-End Closing, Opening Balance Carry-Forwards.
- **Enforcement Layer**: `FinancialPeriodService.requireOpenPeriod(date)`

## 2. Rule of Transaction Atomicity
- Any business action that produces a financial side-effect (e.g., `journalEntry`, `salary`, `stockMovement`) MUST be executed inside `prisma.$transaction` (or `runFinancialTx`).
- The `FinancialPeriodService` must be instantiated *inside* the transaction using the transactional Prisma client (`tx`) to prevent race conditions.
- Example pattern:
  ```typescript
  await runFinancialTx(prisma, async (tx) => {
    const periodService = new FinancialPeriodService(tx, ctx);
    await periodService.requireOpenPeriod(businessDate);
    // ... complete business logic ...
  });
  ```

## 3. Anti-Bypass Rules
- **No System Date Defaulting**: Period validation MUST be executed against the actual business document date (e.g., `payment.documentDate`, `payrollDate` as the last day of the month), NEVER against `new Date()` unless strictly applicable to the creation of a net-new instant transaction.
- **No Orphan Mutations**: You cannot delete, reverse, or update the status of any financial record without first running it through the Period Lock check for its original posting date.

## 4. Reopen Governance (Strict Logging)
Reopening a closed period is a highly sensitive action.
- **Rule 1**: It must ALWAYS record a `periodLockLog` entry.
- **Rule 2**: The log must contain the `reopenedBy` (User ID), `reason` for reopening, and an immutable timestamp.
- **Rule 3**: Reopen operations MUST be tenant-scoped (`where: { id: fiscalPeriodId, tenantId }`). Never trust `fiscalPeriodId` alone.

## 5. Year-End Closing (Immutable Rollup)
- **Carry-Forward**: Rolling over opening balances must be transactional and tenant-scoped.
- **Tenant Isolation Guarantee**: All Year-End engine functions (`validateYearReadiness`, `buildChecklist`, `previewClosingJE`, `postClosingJE`, `rolloverOpeningBalances`, `lockFiscalYear`, `generateClosingReports`) MUST accept and enforce `tenantId` in all Prisma queries.
- **Immutability**: Reports generated during year-end close (`TRIAL_BALANCE`, etc.) are hashed and stored in `ImmutableReport` to prevent post-close tampering.

## 6. Forbidden Implementation Patterns
- 🚫 **DO NOT** use `prisma.$transaction` without including the `tenantId` context in every nested query.
- 🚫 **DO NOT** run `FinancialPeriodService` outside of the database transaction context. If validation passes outside but the transaction is delayed, a race condition can violate the lock.
- 🚫 **DO NOT** use `any` bypasses on financial rules. If a module requires posting to a closed period, it is an architectural violation and must be redesigned, not bypassed.

## 7. Known Limitations & Remaining Risks
- **Schema Sync**: `YearEndCloseRun` schema availability in `schema.prisma` relies on DevOps manual sync or migration execution. Ensure `prisma generate` is aligned before relying on immutable reporting in production.
- **Master Admin Bypasses**: Currently, there is no separate "SOFT_LOCK" level that allows only Master Admins to post while blocking standard users. The lock is binary (OPEN/CLOSED). Future enhancements may introduce RBAC-aware soft locks.
