# Soft Lock Period Enforcement Report

## 1. Existing Period Close Logic
- There is a `period-lock-engine.ts` that uses an undefined `periodLock` model with statuses (`OPEN`, `LOCKED`, `TEMP_UNLOCKED`) and fails silently using `.catch(() => null)`.
- The actual `schema.prisma` has `FinancialPeriod` model which perfectly aligns with the requirement:
  ```prisma
  model FinancialPeriod {
    id         Int                   @id @default(autoincrement())
    tenantId   String                @map("tenant_id")
    period     String                // YYYY-MM
    status     FinancialPeriodStatus @default(OPEN) // OPEN, SOFT_LOCKED, HARD_LOCKED
    ...
  }
  ```
- Additionally, `FiscalPeriod` is also present for fiscal year configurations. 

## 2. Where Mutations Occur (To Protect)
Financial mutations that involve dates are primarily executed in:
1. **Journal Posting**: `src/lib/auto-journal.ts` (AutoJournalEngine)
2. **Treasury Payments**: `src/lib/treasury/payment-application-engine.ts` or `src/app/api/treasury/payments/route.ts`
3. **Sales Invoices**: `src/app/api/sales/invoices/route.ts`
4. **Procurement GRN/AP**: `src/app/api/procurement/grn/route.ts` and `src/app/api/procurement/ap-ocr/route.ts`
5. **Period Close**: `src/lib/period-close-engine.ts`

## 3. Best Centralized Point for `assertPeriodWritable`
To enforce tenant isolation, atomicity, and financial integrity, the enforcement should be placed at the **Service Layer (Engines)** right before they invoke `prisma.$transaction`. 

## 4. Gaps
- `period-lock-engine.ts` is outdated and ignores `FinancialPeriodStatus`.
- There is no central reusable middleware-like guard for period states.
- Mutations currently trust `new Date()` or user-provided dates without checking if the fiscal period is `SOFT_LOCKED` or `HARD_LOCKED`.

## 5. Next Steps
1. Create `src/lib/governance/period-lock.ts` containing `assertPeriodWritable` based on `FinancialPeriod`.
2. Secure the top 5 high-risk mutations.
3. Test enforcement.
