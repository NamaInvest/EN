# النقص #26: Budgeting + Allocations + Encumbrance — مواصفات تفصيلية

> **المرجعيات:** SAP CO (Controlling)، Oracle EPM/Hyperion、Workday Adaptive Planning、Anaplan、SAP BPC

---

## 1. البرومنت

```
وسّع Budgeting + Allocations:

موجود: Budget, BudgetLine, Encumbrance, allocation-engine, budget-engine, budget-control

النواقص:
A) Budget Types: Operational, Capital, Project, Department, Fund
B) Budget Versions (Original, Revised, Forecast)
C) Multi-period budget (annual, quarterly, monthly)
D) Budget hierarchy (rolls up)
E) Encumbrance accounting (commit before spend)
F) Budget control modes: Strict (block), Soft (warn), Off
G) Budget transfers between lines
H) What-if scenarios
I) Allocation Rules:
   - Cost allocation (overhead → cost centers)
   - Revenue allocation (corporate → branches)
   - Step-down vs reciprocal
   - Drivers (headcount, sqft, revenue %, custom)
J) Driver-based budgeting

APIs (35+), UI (15 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Annual Budget Setup
```
1. Budget 2027 → Operational
2. Top-down: CFO sets total 100M revenue, 80M expenses
3. Distributed to departments (HR, Sales, Operations, IT)
4. Each dept distributes to accounts × cost centers × monthly
5. Aggregation back: 100M ✓
6. Approval workflow: CFO → Board
7. Locked → control begins
```

### B — Encumbrance on PR
```
- PR submitted: 50K consulting
- Budget check: available 100K → 50K reserved (encumbered)
- PR approved → PO sent (still encumbered)
- Vendor invoice arrives → encumbrance released, expense recognized
- Final actual: 48K (saved 2K)
- Available now: 102K
```

### C — Budget Transfer
```
- IT dept: training budget 20K (unspent), software budget over 15K
- Request: transfer 15K from training → software
- Workflow: dept head → CFO
- Approved → both lines updated
- Audit trail
```

### D — Strict Budget Control
```
- Sales clerk creates SO with discount that pushes commission > budget
- System blocks: "Budget exceeded for Sales Commission line"
- Options: reduce discount, request budget increase, get override
- Manager override possible (with reason)
```

### E — Allocation: Overhead to Cost Centers
```
- Corporate IT cost: 100K/month
- Allocation rule: distribute by headcount
  - HR: 50 employees → 50K ÷ X × 50
  - Sales: 80 → 80K
  - Operations: 70 → 70K
  - Total: 200 employees, 100K total → 500/employee
- JE: DR each dept's IT Allocated / CR Corporate IT Recovery
```

### F — Driver-Based Forecasting
```
- 2027 forecast based on drivers:
  - Revenue: prior year + 15% growth
  - Salaries: count × avg salary × 5% raise
  - Rent: prior + 3% inflation
  - Marketing: 10% of revenue
- Auto-calculated when drivers updated
- "What if growth is 10% instead?" → instant recalc
```

### G — Budget Variance Analysis
```
- Monthly close: actual vs budget
- Sales: 8M actual vs 9M budget = -1M (-11%)
- Drill: which products/regions/customers contributed?
- Forecast vs revised budget for remaining 11 months
```

### H — Capital Budget (CapEx)
```
- New equipment 500K planned
- Multi-year approval
- Cash flow planning
- On purchase → encumbrance released, FA created
- Depreciation begins
```

---

## 3. تدفق البيانات

```
[Create Budget]
POST /budgets { fiscalYearId, type, lines }
   ↓ create Budget + lines (account × period × dimension)
   ↓ approval workflow

[Encumber on PR/PO]
On PR submit:
   ↓ check budget available for line(s)
   ↓ if available → encumber + create Encumbrance record
   ↓ if not → reject (strict) or warn (soft)
On invoice receipt:
   ↓ release encumbrance
   ↓ record actual expense

[Allocation Run]
POST /allocations/run { ruleId, period }
   ↓ get source amount
   ↓ apply driver values
   ↓ distribute to targets
   ↓ create JEs
```

---

## 4. Schema (إضافات)

```prisma
model Budget {
  // ... existing
  budgetNumber    String    @unique
  name            String
  type            String    // 'OPERATIONAL' | 'CAPITAL' | 'PROJECT' | 'DEPARTMENT' | 'FUND'
  fiscalYearId    Int
  version         String    @default("V1")  // ORIGINAL | REVISED | FORECAST | FINAL
  versionNumber   Int       @default(1)
  
  parentBudgetId  Int?
  parentBudget    Budget?   @relation("BudgetHierarchy", fields: [parentBudgetId], references: [id])
  childBudgets    Budget[]  @relation("BudgetHierarchy")
  
  controlMode     String    @default("SOFT")  // STRICT | SOFT | OFF
  
  status          String    @default("DRAFT")  // DRAFT | UNDER_APPROVAL | APPROVED | LOCKED | CLOSED
  approvedAt      DateTime?
  
  totalAmount     Decimal?  @db.Decimal(20,4)
  
  lines           BudgetLine[]
  transfers       BudgetTransfer[]
}

model BudgetLine {
  // ... existing
  budgetId        Int
  budget          Budget    @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  
  accountId       Int
  costCenterId    Int?
  projectId       Int?
  branchId        Int?
  departmentId    Int?
  
  // Period breakdown (12 months or 4 quarters)
  amounts         Json      // {2027-01: 5000, 2027-02: 5000, ...}
  totalAmount     Decimal   @db.Decimal(20,4)
  
  // Tracking
  allocatedAmount Decimal   @default(0) @db.Decimal(20,4)
  encumberedAmount Decimal  @default(0) @db.Decimal(20,4)
  spentAmount     Decimal   @default(0) @db.Decimal(20,4)
  
  notes           String?
}

model BudgetTransfer {
  id              Int       @id @default(autoincrement())
  transferNumber  String    @unique
  budgetId        Int
  budget          Budget    @relation(fields: [budgetId], references: [id])
  
  fromLineId      Int
  toLineId        Int
  amount          Decimal   @db.Decimal(20,4)
  
  reason          String    @db.Text
  status          String    @default("PENDING")  // PENDING | APPROVED | REJECTED
  
  requestedByUserId String
  approvedByUserId String?
  approvedAt      DateTime?
}

model Encumbrance {
  // ... existing
  encumbranceNumber String  @unique
  budgetLineId    Int
  
  sourceType      String    // 'PR' | 'PO' | 'CONTRACT' | 'MANUAL'
  sourceId        Int
  
  amount          Decimal   @db.Decimal(20,4)
  
  status          String    @default("ACTIVE")  // ACTIVE | PARTIAL | RELEASED | EXPIRED
  
  encumberedAt    DateTime  @default(now())
  releasedAt      DateTime?
  releasedAmount  Decimal   @default(0) @db.Decimal(20,4)
  
  expiresAt       DateTime?
}

model AllocationRule {
  id              Int       @id @default(autoincrement())
  ruleNumber      String    @unique
  name            String
  description     String?
  
  type            String    // 'COST' | 'REVENUE' | 'RECIPROCAL'
  
  sourceAccountId Int?
  sourceCostCenterId Int?
  
  targets         Json      // [{costCenterId, percent}] or [{costCenterId, formula}]
  
  driverType      String?   // 'FIXED_PCT' | 'HEADCOUNT' | 'SQFT' | 'REVENUE' | 'TRANSACTIONS' | 'CUSTOM'
  driverFormula   String?
  
  active          Boolean   @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  
  priority        Int       @default(100)
  
  runs            AllocationRun[]
}

model AllocationRun {
  id              Int       @id @default(autoincrement())
  ruleId          Int
  rule            AllocationRule @relation(fields: [ruleId], references: [id])
  
  fiscalPeriodId  Int
  
  sourceAmount    Decimal   @db.Decimal(20,4)
  driverValues    Json
  distributions   Json      // [{costCenterId, amount}]
  
  journalEntryId  Int?
  
  runAt           DateTime  @default(now())
  runByUserId     String
  reversed        Boolean   @default(false)
}

model BudgetDriver {
  id              Int       @id @default(autoincrement())
  driverCode      String    @unique
  name            String
  
  type            String    // 'METRIC' | 'PERCENTAGE' | 'FORMULA'
  formula         String?   // e.g., "headcount * avg_salary"
  
  values          Json?     // per period values
  source          String?   // where to fetch from
}

model WhatIfScenario {
  id              Int       @id @default(autoincrement())
  name            String
  baseBudgetId    Int
  
  changes         Json      // {drivers: {...}, lineOverrides: {...}}
  
  resultsCached   Json?
  generatedAt     DateTime  @default(now())
  generatedByUserId String
}
```

---

## 5. Forms (8)

A: Budget Setup (top-down or bottom-up wizard)
B: Budget Line Editor (with period breakdown)
C: Budget Transfer Request
D: Budget Approval (multi-level)
E: Allocation Rule Definition
F: Driver Setup
G: What-If Scenario Builder
H: Encumbrance Manual Adjustment

---

## 6. Tables (8)

A: Budgets (versions tree)
B: Budget Lines vs Actual (with variance %)
C: Encumbrances (active + history)
D: Allocation Rules
E: Allocation Run History
F: Drivers Catalog
G: Budget Transfers
H: What-If Scenarios

---

## 7. Buttons (30+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-budget-create | + موازنة | 🟢 cfo |
| btn-budget-version | إصدار جديد | 🟦 cfo |
| btn-budget-import | استيراد Excel | ⬜ cfo |
| btn-budget-distribute | توزيع تلقائي | 🟦 cfo |
| btn-budget-submit-approval | تقديم للاعتماد | 🟦 cfo |
| btn-budget-approve | موافقة | 🟢 board |
| btn-budget-lock | قفل | 🔴 cfo |
| btn-budget-revise | مراجعة | 🟡 cfo |
| btn-line-edit | تعديل سطر | ⬜ cfo |
| btn-transfer-request | + تحويل ميزانية | 🟢 dept head |
| btn-transfer-approve | موافقة التحويل | 🟢 cfo |
| btn-encumber-create | + حجز يدوي | 🟦 controller |
| btn-encumber-release | تحرير | 🟦 controller |
| btn-encumber-expire | انتهاء صلاحية | 🟡 system |
| btn-allocation-rule-create | + قاعدة توزيع | 🟢 cfo |
| btn-allocation-simulate | محاكاة | 🟦 cfo |
| btn-allocation-run | تشغيل التوزيع | 🟢 cfo |
| btn-allocation-reverse | عكس | 🔴 cfo + reason |
| btn-driver-update | تحديث المؤشر | 🟦 controller |
| btn-driver-recalc | إعادة حساب | ⬜ controller |
| btn-whatif-create | + سيناريو | 🟢 cfo |
| btn-whatif-compare | مقارنة | ⬜ cfo |
| btn-variance-analyze | تحليل التباين | ⬜ controller |
| btn-budget-vs-actual | فعلي مقابل موازنة | ⬜ controller |
| btn-rolling-forecast | توقع متجدد | 🟦 cfo |
| btn-export-budget | تصدير | ⬜ cfo |
| btn-export-variance | تصدير التباين | ⬜ controller |
| btn-budget-control-toggle | تبديل وضع التحكم | 🟡 cfo |
| btn-period-budget-close | إقفال الفترة | 🔴 cfo |
| btn-budget-rollover | ترحيل للسنة الجديدة | 🔴 cfo |

---

## 8. Search & Filters

- Budgets: type, version, status, fiscal year
- Lines: account, cost center, dept, project, variance > X%
- Encumbrances: status, source type, expired
- Allocations: rule, period, reversed

---

## 9. Reports

- Budget vs Actual (variance)
- Encumbrance Report
- Available Budget by Line
- Allocation Audit Trail
- Driver Trend Analysis
- What-If Comparison
- Multi-period Forecast
- Rolling Forecast (12-month forward)
- Budget Utilization %
- Capex Planning

---

## 10. Dashboards

- KPIs: Budget Utilization / Available / Encumbered / Variance
- Charts: Budget burn rate, Variance heatmap by dept
- Lists: Lines over budget, Pending transfers, Expiring encumbrances

---

## 11. Notifications

- Budget approaching limit (80%, 95%, 100%)
- Budget exceeded (strict block)
- Transfer awaiting approval
- Encumbrance expiring
- Allocation run completed
- Variance > threshold

---

## 12. Permissions

| Action | Dept Head | Controller | CFO | Board |
|--------|-----------|-----------|-----|-------|
| Edit own dept | ✓ | ✓ | ✓ | ✓ |
| Approve dept | ✗ | ✓ | ✓ | ✓ |
| Approve total | ✗ | ✗ | ✓ | ✓ |
| Lock budget | ✗ | ✗ | ✓ | ✓ |
| Transfer between lines | ✓ same dept | ✓ | ✓ | ✓ |
| Approve transfer | ✗ | ✓ | ✓ | ✓ |
| Allocation rules | ✗ | ✓ | ✓ | ✓ |
| Override budget | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- Anaplan / Workday Adaptive (sync)
- Excel import/export
- BI tools
- Approval workflows

---

## 14. Shortcuts

- `Ctrl+B` New budget
- `Ctrl+T` Transfer
- `Ctrl+A` Allocation run

---

## 15. Mobile / Print

- Mobile: budget approvals
- Print: budget book, variance report

---

## 16. Audit

- All budget changes versioned
- Transfers fully audited
- Allocation runs immutable
- Encumbrance lifecycle

---

## 17. Tests

```typescript
describe('Budget Hierarchy', () => { /* roll-up correct */ })
describe('Encumbrance', () => { /* PR creates, invoice releases */ })
describe('Strict Control', () => { /* blocks over budget */ })
describe('Allocation', () => { /* drivers applied correctly */ })
describe('What-If', () => { /* scenario calc */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Period closed mid-encumbrance | release on next open period |
| Allocation source = 0 | skip + log |
| Driver unavailable | use last value + warn |
| Transfer to closed line | reject |
| Multiple encumbrances same PR | aggregate |
| Negative budget | rare, allow with approval |

---

**نهاية #26** • 8 سيناريوهات • 8 جداول • 8 forms • 8 grids • 30 button • 10 reports
