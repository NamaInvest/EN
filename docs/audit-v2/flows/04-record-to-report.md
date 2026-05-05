# BPF #4: Record-to-Report (R2R) — End-to-End

> **المرجعيات:** SAP S/4HANA Universal Journal، BlackLine、Workiva
> **الموديولات:** All sub-ledgers + GL + Period Close + Consolidation + Reports + Tax

---

## 1) الفلو

```
[Sub-ledger Activity]
   ↓ continuous
[Auto-Journal Entries]
   ↓ posted to GL
[General Ledger]
   ↓ throughout period
[Period Cut-off Tasks]
[Reconciliations] (banks, AR, AP, intercompany, GR-IR)
[Adjustments + Reclassifications]
[Accruals + Prepayments]
[FX Revaluation]
[Depreciation Run]
[Lease Amortization]
[Revenue Recognition]
[Allocations Run]
[Budget Variance]
   ↓ all complete
[Sub-ledger Close]
   ↓
[Trial Balance Final]
   ↓ if balanced
[Soft Close → Hard Close]
   ↓
[Statutory Reports]
[Management Reports]
[Tax Returns (VAT/Zakat/WHT)]
[Consolidation (Group)]
[Audit Package]
   ↓
[Year-End Close (annual)]
[Retained Earnings Rollover]
[Lock Fiscal Year]
```

**~30 tasks، 15 موديولات، fortnightly + monthly + quarterly + yearly cycles**

---

## 2) البرومنت

```
بناء R2R orchestration كامل:

موجود: GL, AR, AP, FA, Lease, RevRec, Multi-Book, Consolidation, Budget, Allocations, Year-End, Statutory Reports

النواقص:
A) Period Close Cockpit (one screen with all close tasks + status)
B) Sub-ledger to GL Reconciliation (real-time balance check)
C) Inter-company Eliminations Engine (group reporting)
D) Continuous Close (push tasks earlier, faster monthly close)
E) Close Calendar with dependencies (DAG of tasks)
F) Audit Package Auto-generation (everything auditor needs)
G) Roll-forward Reports (BS roll-forward, equity changes)

أنشئ:
- src/lib/r2r-orchestrator.ts
- src/lib/period-close-cockpit.ts
- prisma: PeriodCloseRun, PeriodCloseTask, ReconciliationStatus
- UI: /accounting/period-close-cockpit
- Tests: 25+ E2E
```

---

## 3) السيناريوهات (8)

### A — Standard Monthly Close (5-day)
```
Day -2 (last 2 days of month): pre-close prep
   - All AR/AP entries should be in
   - Inventory cycle counts
   - Bank reconciliations daily

Day +1: cut-off + sub-ledger close
   - AR sub-ledger close
   - AP sub-ledger close
   - Inventory close
   - Fixed assets close

Day +2: adjustments + accruals
   - Accruals + prepayments
   - FX revaluation
   - Inter-company reconciliation

Day +3: GL close + verification
   - Trial balance
   - Margin/variance review
   - Soft close (still reversible)

Day +4: reports
   - Generate management reports
   - Distribute to stakeholders

Day +5: hard close + finalization
   - Hard close
   - Lock period
   - Year-to-date roll-up
   - Tax provision
```

### B — Inter-company Elimination
```
Subsidiary A sells to Subsidiary B (same group):
- A: DR IC Receivable / CR Sales 100K
- B: DR Inventory / CR IC Payable 100K

Group Consolidation:
- Eliminate IC sales 100K vs IC payable 100K
- Inventory still on group balance sheet (until sold externally)

When B sells to external customer 120K:
- B: DR AR / CR Sales 120K (Sub level)
- Group level: profit recognized 120 - 100 = 20K (only after external sale)

If still in B inventory at period-end:
- Eliminate unrealized profit (10K of 20K profit if 50% sold)
```

### C — FX Revaluation
```
USD AR balance: 100K USD (recorded 375K SAR @ 3.75)
Period-end rate: 3.78
New SAR equivalent: 378K
Unrealized FX gain: 3K

JE: DR USD AR 3K / CR Unrealized FX Gain 3K
Auto-reverse next period (so realized happens on actual settlement)
```

### D — Depreciation Run
```
Cron monthly:
- Find all active assets
- Calculate depreciation per method
- Create JEs for each:
  DR Depreciation Expense / CR Accumulated Depreciation
- Update FA records (NBV, accum dep)
- Generate depreciation schedule report
```

### E — Allocation Run
```
Corporate IT cost: 100K/month
Allocation rule: distribute by headcount
- HR: 50/200 × 100K = 25K
- Sales: 80/200 = 40K
- Operations: 70/200 = 35K

JE:
DR HR-IT Allocated 25K
DR Sales-IT Allocated 40K
DR Operations-IT Allocated 35K
CR Corporate IT Recovery 100K
```

### F — Tax Provision (Monthly)
```
Calculate VAT payable:
- Output tax (sales): 75K
- Input tax (purchases): 45K
- Net VAT: 30K

JE accrual:
DR Tax Expense / CR VAT Payable

When filed (quarterly):
DR VAT Payable / CR Bank
```

### G — Reconciliations
```
At period-end, all of these must reconcile:
1. Bank Reconciliation: bank statement vs book
2. AR Sub-ledger: AR control = sum of customer balances
3. AP Sub-ledger: AP control = sum of vendor balances
4. GR-IR: receipts vs invoices
5. Intercompany: A's IC AR = B's IC AP
6. Fixed Asset: NBV = sum of asset card NBVs
7. Inventory: GL inventory = sum of stock × cost

Any mismatch → investigate before close
```

### H — Year-End Close
```
End of fiscal year:
1. Validate readiness (covered in 02-year-end-close.md)
2. Run all monthly closes for Dec
3. Year-end specific:
   - Bonus accrual
   - Final tax provision
   - Annual depreciation review
   - EOS provision review
4. Close P&L → transfer net income to Retained Earnings
5. Roll-forward balance sheet to new year
6. Lock fiscal year
7. Generate annual reports (statutory + management + audit package)
```

### sad-1 — Out-of-Balance Trial Balance
```
TB shows 1,000 SAR off
Investigation: a JE was posted with wrong sign in inter-company line
Fix: reverse + repost
TB now balanced
Audit log preserves error trace
```

### sad-2 — Late Entry After Close
```
Soft close completed, then audit finds an error
Soft close → can reverse
Make correction
Re-close
If hard close already → reopen requires CFO + audit approval
```

---

## 4) JEs Roll-Up

Throughout R2R, dozens of JEs aggregate to:
- **Trial Balance**: every account's total debits + credits
- **Income Statement**: revenue + expenses → net income
- **Balance Sheet**: assets + liabilities + equity (must balance)
- **Cash Flow Statement**: operating + investing + financing → net change in cash
- **Statement of Equity Changes**: opening + earnings + distributions → closing

Cross-checks:
- BS Cash = Bank account balances + Petty cash
- Net income (P&L) = Retained Earnings change in BS (equity section)
- Cash Flow Cash → matches BS Cash change

---

## 5) Schema (Orchestration)

```prisma
model PeriodCloseRun {
  id              Int       @id @default(autoincrement())
  fiscalPeriodId  Int
  
  type            String    // 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AD_HOC'
  
  startedAt       DateTime  @default(now())
  startedByUserId String
  completedAt     DateTime?
  
  status          String    @default("IN_PROGRESS")  // IN_PROGRESS | COMPLETED | FAILED | ROLLED_BACK
  closeMode       String    @default("SOFT")  // SOFT | HARD
  
  totalTasks      Int
  completedTasks  Int       @default(0)
  failedTasks     Int       @default(0)
  
  tasks           PeriodCloseTask[]
  reconStatus     ReconciliationStatus[]
  
  finalizationLevel String? // 'TRIAL_BALANCE' | 'SOFT_CLOSE' | 'HARD_CLOSE' | 'LOCKED'
}

model PeriodCloseTask {
  id              Int       @id @default(autoincrement())
  runId           Int
  run             PeriodCloseRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  category        String    // 'PRE_CLOSE' | 'SUB_LEDGER_CLOSE' | 'ADJUSTMENTS' | 'PROVISIONS' | 'TAX' | 'INTER_COMPANY' | 'CLOSING_ENTRIES' | 'REPORTING'
  taskCode        String
  taskName        String
  sequenceNumber  Int
  
  autoExecutable  Boolean   @default(false)
  dependencies    String[]  // taskCodes
  
  status          String    @default("PENDING")
  
  assigneeUserId  String?
  startedAt       DateTime?
  completedAt     DateTime?
  
  evidenceFileId  Int?
  notes           String?
  result          Json?
  errorMessage    String?
  
  @@unique([runId, taskCode])
}

model ReconciliationStatus {
  id              Int       @id @default(autoincrement())
  runId           Int
  run             PeriodCloseRun @relation(fields: [runId], references: [id])
  
  reconType       String    // 'BANK' | 'AR_SUB_LEDGER' | 'AP_SUB_LEDGER' | 'GR_IR' | 'INTERCOMPANY' | 'FIXED_ASSETS' | 'INVENTORY' | 'TAX'
  
  glAccountId     Int?
  expectedBalance Decimal   @db.Decimal(20,4)
  actualBalance   Decimal   @db.Decimal(20,4)
  difference      Decimal   @db.Decimal(20,4)
  withinTolerance Boolean
  
  reconciledByUserId String?
  reconciledAt    DateTime?
  
  notes           String?
}

model AuditPackage {
  id              Int       @id @default(autoincrement())
  fiscalYearId    Int
  
  generatedAt     DateTime  @default(now())
  generatedByUserId String
  
  // Sections (each is a generated file)
  trialBalanceUrl String?
  incomeStatementUrl String?
  balanceSheetUrl String?
  cashFlowUrl     String?
  equityChangesUrl String?
  
  jeListingUrl    String?
  reconciliationsUrl String?
  
  notesUrl        String?  // notes to FS
  
  externalAuditorEmail String?
  sentAt          DateTime?
}
```

---

## 6) Forms (8)

A: Period Close Initiator
B: Task Status Update
C: Reconciliation Form (per type)
D: Adjustment JE Entry
E: Accrual Entry
F: Reclassification Entry
G: Audit Package Configuration
H: Reopen Period Request

---

## 7) Tables

A: Period Close Cockpit (live status)
B: Reconciliation Status (all 7 types)
C: Pending Adjustments
D: Cross-period Cumulative Balances
E: Roll-forward Statement
F: Variance Analysis (vs budget, prior period)

---

## 8) Buttons (cross-module)

| ID | الزر | الموديول الذي يفعّله |
|----|------|----------------------|
| btn-r2r-start-close | بدء إقفال | All sub-ledgers |
| btn-r2r-fx-reval | تقييم العملة | Treasury + GL |
| btn-r2r-depreciation-run | إهلاك | FA |
| btn-r2r-lease-amort | استهلاك إيجار | Lease |
| btn-r2r-revrec-run | اعتراف الإيراد | RevRec |
| btn-r2r-allocations | توزيعات | Allocation |
| btn-r2r-recon-bank | مطابقة بنكية | Treasury |
| btn-r2r-recon-ar | مطابقة AR | AR |
| btn-r2r-recon-ap | مطابقة AP | AP |
| btn-r2r-recon-intercompany | مطابقة IC | Multi-entity |
| btn-r2r-tb-generate | ميزان مراجعة | GL |
| btn-r2r-soft-close | إقفال مرن | All |
| btn-r2r-hard-close | إقفال صارم | All + lock |
| btn-r2r-generate-package | حزمة المراجعين | Multi-modules |
| btn-r2r-distribute-reports | توزيع التقارير | Reports + Email |

---

## 9) Reports (R2R Output)

**Standard:**
- Trial Balance (working + final)
- Income Statement (P&L)
- Balance Sheet
- Cash Flow Statement (direct + indirect)
- Statement of Changes in Equity
- Notes to FS

**Per Sub-ledger:**
- AR Aging
- AP Aging
- Inventory Valuation
- Fixed Assets Roll-forward
- Lease Maturity Analysis

**Tax:**
- VAT Return
- Zakat Calculation
- WHT Summary

**Management:**
- Budget vs Actual
- Variance Analysis
- KPI Dashboard
- Cost Center Reports

**Group:**
- Consolidated FS
- Eliminations Schedule
- Multi-currency Translations

---

## 10) Notifications

- Period close started
- Task assigned
- Task overdue
- Reconciliation breach
- Soft close achieved
- Hard close achieved
- Reports generated
- Audit package sent

---

## 11) Permissions

| Action | Acct | Sr Acct | Controller | CFO | Auditor |
|--------|------|---------|-----------|-----|---------|
| Post adjustments | ✓ | ✓ | ✓ | ✓ | ✗ |
| Run depreciation | ✓ | ✓ | ✓ | ✓ | ✗ |
| Reconcile | ✓ | ✓ | ✓ | ✓ | ✗ |
| Soft close | ✗ | ✗ | ✓ | ✓ | ✗ |
| Hard close | ✗ | ✗ | ✗ | ✓ | ✗ |
| Reopen | ✗ | ✗ | ✗ | ✓ super | ✗ |
| Generate audit package | ✗ | ✓ | ✓ | ✓ | request |
| View all reports | ✗ | ✓ | ✓ | ✓ | ✓ |

---

## 12) Tests

```typescript
describe('R2R End-to-End', () => {
  test('monthly close 5-day cycle')
  test('all reconciliations within tolerance')
  test('intercompany eliminations balance')
  test('FX revaluation auto-reverses next period')
  test('depreciation creates JE per asset')
  test('allocations distribute correctly')
  test('TB balanced after close')
  test('roll-forward to new year preserves balances')
})
```

---

## 13) Edge Cases

| Case | Behavior |
|------|----------|
| Late entry after soft close | reverse + reopen task + repost |
| Reconciliation breach during close | block soft close + investigate |
| Hard-closed period needs correction | requires CFO + super admin + audit |
| Multi-currency revaluation with manual override | log + audit |
| Tax law changes mid-period | apply prospectively |
| Group entity added mid-year | partial consolidation |

---

## 14) إحصائيات BPF #4

- 15 موديولات • 30 tasks • dozens of JEs aggregated
- 4 جداول orchestration • 8 forms • 6 grids • 15 buttons
- 8 سيناريوهات + 2 sad paths

---

**انتهى BPF #4 / 8.**
