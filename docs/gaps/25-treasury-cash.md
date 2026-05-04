# النقص #25: Treasury + Cash + Checks + Petty Cash — مواصفات تفصيلية

> **المرجعيات:** SAP TRM (Treasury & Risk Management)、Kyriba、ION Treasury、Bloomberg AIM、Trovata、SAP Cash Mgmt

---

## 1. البرومنت

```
وسّع Treasury لمستوى Kyriba/SAP TRM:

موجود: BankAccount, BankTransaction, CheckTransaction, PettyCashTransaction, PettyCashFund, BankReconciliation

النواقص:
A) Multi-bank cash position (real-time)
B) Cash flow forecasting (direct + indirect methods)
C) Liquidity planning (1d/7d/30d/90d/365d)
D) Inter-account transfers (with FX)
E) FX hedging (forwards/swaps - basic)
F) Loans management (received + given)
G) Investments tracking (FDs, bonds, money market)
H) Cash pooling (group treasury)
I) Bank guarantees (issued + received)
J) Letters of credit (treasury side)
K) Checks: full lifecycle (PDC, post-dated, returned, replaced)
L) Petty Cash: imprest system (auto top-up), expense capture, OCR receipts, multi-currency
M) Standing orders (recurring transfers)
N) Bank fees tracking + reconciliation
O) Open Banking integration (Lean/Tarabut)

APIs (50+), UI (20 pages), Tests 60+
```

---

## 2. السيناريوهات (8)

### A — Real-time Cash Position
```
- /treasury/dashboard shows:
  - 8 bank accounts across 3 currencies
  - Total SAR equivalent: 12.5M
  - By currency: SAR 8M, USD 1.2M (4.5M SAR), EUR 800K (3.2M SAR)
  - By bank: Al Rajhi 5M, NCB 3M, SAB 2M, others 2.5M
  - Trend: -300K vs yesterday
- Drill-down available
```

### B — Direct Cash Flow Forecast
```
- Forecast 90 days:
  - Inflows: AR collections (predicted from open items + history)
  - Outflows: AP + payroll + tax + lease payments
  - Net: -2M expected → liquidity crunch on Day 67
- Suggestions: accelerate collections, delay non-critical
```

### C — Inter-account Transfer with FX
```
- Move 500K SAR from Al Rajhi to USD account
- Rate: 0.267 USD/SAR → 133,500 USD
- JE: DR USD Account 133,500 (500K SAR @ 0.267) / CR SAR Account 500K
- Bank fees: 50 SAR
- Both accounts updated
```

### D — Post-Dated Check (PDC) — Issued
```
- Issue check #1234, amount 50K, due 2026-08-15 (post-dated)
- Status: PDC_ISSUED
- Customer holds it
- On 2026-08-15: presented to bank → cleared
- Status: CLEARED
- JE: DR Vendor / CR Bank
```

### E — Returned Check (Received)
```
- Customer's check 30K bounced
- Status changes: RECEIVED → DEPOSITED → BOUNCED
- Reverse JE
- Customer's open item reopened with bank fee
- Dunning re-triggered
- Customer notified
```

### F — Petty Cash Imprest
```
- Petty cash fund: 5,000 SAR (imprest)
- Spending throughout month: receipts + expenses
- Balance reduces to 800
- Custodian submits: 4,200 in receipts → reimbursement request
- Manager approves → top-up to 5,000
- JE: DR Various Expenses / CR Cash 4,200
```

### G — FD Investment
```
- Excess cash 5M placed in 6-month FD @ 5%
- Investment record: principal, rate, maturity
- Monthly accrual: interest = 5M × 5% / 12 = 20,833
  - JE: DR Interest Receivable / CR Interest Income
- At maturity: principal + interest credited
- JE: DR Bank / CR Investment + Interest Receivable
```

### H — Bank Guarantee
```
- Customer requires BG for 1M tender
- Apply to bank → BG issued
- Bank charges: 0.5% × 1M = 5,000 fee
- JE: DR BG Fee Expense / CR Bank
- Track BG in register (issuer, beneficiary, expiry, status)
- On expiry: release
- If called: JE for guarantee payment
```

---

## 3. تدفق البيانات

```
[Cash Position Refresh]
GET /treasury/position
   ↓ aggregate balances across all bank accounts
   ↓ apply latest FX rates
   ↓ return totals + breakdowns

[Transfer]
POST /treasury/transfer { from, to, amount, fxRate? }
   ↓ validate balances
   ↓ if cross-currency → fetch FX rate
   ↓ create transfer record
   ↓ create JE
   ↓ update both accounts

[Forecast]
POST /treasury/forecast { horizon, scenario }
   ↓ aggregate AR (collection probability)
   ↓ aggregate AP (due dates)
   ↓ recurring (rent, payroll, lease, tax)
   ↓ scheduled (PO commitments)
   ↓ output: daily projection + variance vs target
```

---

## 4. Schema (إضافات)

```prisma
model BankAccount {
  // ... existing
  bankName        String
  bankCode        String?
  accountNumber   String
  iban            String    @unique
  swift           String?
  
  currency        String
  glAccountId     Int       // linked GL account
  
  type            String    @default("CURRENT")  // CURRENT | SAVINGS | FD | LOAN | OVERDRAFT
  
  openingBalance  Decimal   @db.Decimal(20,4)
  currentBalance  Decimal   @db.Decimal(20,4)
  
  overdraftLimit  Decimal?  @db.Decimal(20,4)
  
  // Open Banking
  openBankingProvider String?
  openBankingAccountId String?
  
  branchId        Int?
  active          Boolean   @default(true)
  
  // Stats
  lastTransactionAt DateTime?
  monthlyAvgBalance Decimal? @db.Decimal(20,4)
}

model BankTransfer {
  id              Int       @id @default(autoincrement())
  transferNumber  String    @unique
  fromAccountId   Int
  toAccountId     Int
  
  amount          Decimal   @db.Decimal(20,4)
  fromCurrency    String
  toCurrency      String
  exchangeRate    Decimal?  @db.Decimal(20,8)
  toAmount        Decimal   @db.Decimal(20,4)
  
  fees            Decimal?  @db.Decimal(20,4)
  
  transferDate    DateTime
  reference       String?
  purpose         String?
  
  status          String    @default("PENDING")  // PENDING | EXECUTED | REVERSED | FAILED
  executedAt      DateTime?
  
  journalEntryId  Int?
  
  approvedByUserId String?
  performedByUserId String
}

model Check {
  // ... existing
  checkType       String    // 'ISSUED' | 'RECEIVED' | 'PDC_ISSUED' | 'PDC_RECEIVED'
  checkNumber     String
  checkDate       DateTime
  dueDate         DateTime?
  
  amount          Decimal   @db.Decimal(20,4)
  currency        String
  
  payeeName       String?
  drawerName      String?
  
  bankAccountId   Int?     // for issued
  bankName        String?  // for received
  
  status          String    @default("DRAFT")
  // DRAFT | ISSUED | RECEIVED | DEPOSITED | CLEARED | BOUNCED | RETURNED | CANCELLED | REPLACED | STOPPED
  
  clearedAt       DateTime?
  bouncedAt       DateTime?
  bounceReason    String?
  bankCharge      Decimal?  @db.Decimal(20,4)
  
  replacementCheckId Int?
  
  // Linked docs
  invoiceId       Int?
  customerId      Int?
  vendorId        Int?
  
  printedAt       DateTime?
  imageUrl        String?
}

model CheckBook {
  id              Int       @id @default(autoincrement())
  bankAccountId   Int
  
  bookNumber      String
  startCheckNumber String
  endCheckNumber  String
  totalChecks     Int
  
  receivedDate    DateTime
  status          String    @default("ACTIVE")  // ACTIVE | EXHAUSTED | LOST | ARCHIVED
  
  usedCount       Int       @default(0)
  voidedCount     Int       @default(0)
}

model PettyCashFund {
  // ... existing
  fundCode        String    @unique
  custodianEmployeeId Int
  branchId        Int?
  
  imprestAmount   Decimal   @db.Decimal(20,4)
  currentBalance  Decimal   @db.Decimal(20,4)
  
  glAccountId     Int
  currency        String    @default("SAR")
  
  active          Boolean   @default(true)
  lastReplenishmentAt DateTime?
  
  transactions    PettyCashTransaction[]
  replenishments  PettyCashReplenishment[]
}

model PettyCashTransaction {
  // ... existing
  fundId          Int
  fund            PettyCashFund @relation(fields: [fundId], references: [id])
  
  type            String    // 'EXPENSE' | 'INCOME' | 'TRANSFER_IN' | 'TRANSFER_OUT'
  amount          Decimal   @db.Decimal(20,4)
  
  expenseAccountId Int?
  description     String
  receiptUrl      String?
  receiptOcrData  Json?
  
  vendorName      String?
  costCenterId    Int?
  
  occurredAt      DateTime  @default(now())
  recordedByUserId String
}

model PettyCashReplenishment {
  id              Int       @id @default(autoincrement())
  fundId          Int
  fund            PettyCashFund @relation(fields: [fundId], references: [id])
  
  requestedAt     DateTime  @default(now())
  amount          Decimal   @db.Decimal(20,4)
  expensesIncluded Json?    // breakdown
  
  status          String    @default("REQUESTED")  // REQUESTED | APPROVED | DISBURSED | REJECTED
  approvedByUserId String?
  approvedAt      DateTime?
  disbursedAt     DateTime?
  
  journalEntryId  Int?
}

model TreasuryInvestment {
  id              Int       @id @default(autoincrement())
  investmentNumber String   @unique
  
  type            String    // 'FD' | 'BOND' | 'MONEY_MARKET' | 'STOCK' | 'MUTUAL_FUND'
  
  bankInstitution String
  principalAmount Decimal   @db.Decimal(20,4)
  currency        String
  
  startDate       DateTime
  maturityDate    DateTime?
  
  interestRate    Decimal?  @db.Decimal(8,4)
  interestType    String?   // 'FIXED' | 'FLOATING' | 'STEP_UP'
  paymentFrequency String?  // 'MONTHLY' | 'QUARTERLY' | 'AT_MATURITY'
  
  currentValue    Decimal?  @db.Decimal(20,4)
  totalInterestAccrued Decimal @default(0) @db.Decimal(20,4)
  totalInterestReceived Decimal @default(0) @db.Decimal(20,4)
  
  status          String    @default("ACTIVE")  // ACTIVE | MATURED | EARLY_REDEEMED | CANCELLED
  
  glAccountId     Int
  interestAccountId Int
}

model TreasuryLoan {
  id              Int       @id @default(autoincrement())
  loanNumber      String    @unique
  
  type            String    // 'RECEIVED' | 'GIVEN'
  counterparty    String
  
  principalAmount Decimal   @db.Decimal(20,4)
  outstandingAmount Decimal @db.Decimal(20,4)
  currency        String
  
  startDate       DateTime
  maturityDate    DateTime
  
  interestRate    Decimal   @db.Decimal(8,4)
  interestType    String    // 'FIXED' | 'FLOATING'
  paymentFrequency String   // 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'BULLET'
  
  schedule        TreasuryLoanSchedule[]
  
  status          String    @default("ACTIVE")  // ACTIVE | PAID_OFF | DEFAULTED | RESTRUCTURED
  
  collateralDescription String?
  guarantorName   String?
}

model TreasuryLoanSchedule {
  id              Int       @id @default(autoincrement())
  loanId          Int
  loan            TreasuryLoan @relation(fields: [loanId], references: [id])
  
  installmentNumber Int
  dueDate         DateTime
  principalDue    Decimal   @db.Decimal(20,4)
  interestDue     Decimal   @db.Decimal(20,4)
  totalDue        Decimal   @db.Decimal(20,4)
  
  paid            Boolean   @default(false)
  paidAmount      Decimal?  @db.Decimal(20,4)
  paidDate        DateTime?
  paymentJournalId Int?
}

model BankGuarantee {
  id              Int       @id @default(autoincrement())
  guaranteeNumber String    @unique
  
  type            String    // 'BID_BOND' | 'PERFORMANCE_BOND' | 'ADVANCE_PAYMENT' | 'PAYMENT' | 'CUSTOMS'
  direction       String    // 'ISSUED' | 'RECEIVED'
  
  bankInstitution String
  amount          Decimal   @db.Decimal(20,4)
  currency        String
  
  beneficiary     String
  applicant       String?
  
  issueDate       DateTime
  expiryDate      DateTime
  
  fees            Decimal?  @db.Decimal(20,4)
  
  status          String    @default("ACTIVE")  // ACTIVE | EXPIRED | CALLED | RELEASED | CANCELLED
  
  documentUrl     String?
  notes           String?
}

model CashFlowForecast {
  id              Int       @id @default(autoincrement())
  forecastDate    DateTime  @default(now())
  horizonDays     Int
  
  scenario        String    @default("REALISTIC")  // OPTIMISTIC | REALISTIC | PESSIMISTIC
  
  data            Json      // [{date, openingBal, inflows, outflows, closingBal}]
  
  generatedByUserId String
}

model StandingOrder {
  id              Int       @id @default(autoincrement())
  orderNumber     String    @unique
  
  fromAccountId   Int
  toAccountIban   String
  toAccountName   String
  
  amount          Decimal   @db.Decimal(20,4)
  currency        String
  frequency       String    // 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  
  startDate       DateTime
  endDate         DateTime?
  
  active          Boolean   @default(true)
  
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  totalRuns       Int       @default(0)
  totalSent       Decimal   @default(0) @db.Decimal(20,4)
}
```

---

## 5. Forms (10)

A: Bank Account Master
B: Inter-account Transfer (with FX)
C: Check Issue / Receive
D: Petty Cash Expense
E: Petty Cash Replenishment
F: Investment Setup (FD/Bond)
G: Loan Setup (with schedule)
H: Bank Guarantee Application
I: Standing Order
J: Cash Flow Forecast Setup

---

## 6. Tables (10)

A: Bank Accounts (with balances)
B: Bank Transactions
C: Inter-account Transfers
D: Checks (filtered by status)
E: Check Books (with usage)
F: Petty Cash Funds + Balances
G: Investments
H: Loans (Schedule)
I: Bank Guarantees (with expiry alerts)
J: Standing Orders

---

## 7. Buttons (35+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-bank-account-add | + حساب بنكي | 🟢 cfo |
| btn-bank-account-deactivate | تعطيل | 🔴 cfo |
| btn-transfer-between-accounts | تحويل بين حسابات | 🟦 treasury |
| btn-transfer-execute | تنفيذ | 🟢 treasury_mgr |
| btn-check-issue | إصدار شيك | 🟢 ap |
| btn-check-print | طباعة | ⬜ ap |
| btn-check-stop | إيقاف صرف | 🔴 cfo + reason |
| btn-check-replace | استبدال | 🟡 ap |
| btn-check-deposit | إيداع | 🟦 ar |
| btn-check-bounce | تسجيل ارتجاع | 🔴 ar |
| btn-check-cleared | تسجيل صرف | 🟢 ar/ap |
| btn-checkbook-add | + دفتر شيكات | 🟢 ap |
| btn-petty-cash-fund-create | + عهدة | 🟢 cfo |
| btn-petty-cash-expense | + مصروف | 🟢 custodian |
| btn-petty-cash-receipt-ocr | OCR إيصال | 🟦 custodian |
| btn-petty-cash-replenish-request | طلب استعاضة | 🟦 custodian |
| btn-petty-cash-replenish-approve | موافقة الاستعاضة | 🟢 manager |
| btn-petty-cash-close | إغلاق العهدة | 🔴 cfo |
| btn-investment-add | + استثمار | 🟢 treasury |
| btn-investment-mature | تسجيل الاستحقاق | 🟢 treasury |
| btn-investment-early-redeem | استرداد مبكر | 🟡 cfo |
| btn-loan-add | + قرض | 🟢 cfo |
| btn-loan-pay-installment | دفع قسط | 🟦 ap |
| btn-loan-restructure | إعادة هيكلة | 🔴 cfo |
| btn-bg-apply | تقديم BG | 🟦 treasury |
| btn-bg-extend | تمديد | 🟡 treasury |
| btn-bg-release | تحرير | 🟢 treasury |
| btn-standing-order-create | + standing order | 🟢 treasury |
| btn-standing-order-pause | إيقاف | 🟡 treasury |
| btn-cash-position-refresh | تحديث المركز النقدي | 🟦 treasury |
| btn-forecast-generate | توليد التوقع | 🟦 treasury |
| btn-forecast-scenarios | سيناريوهات | ⬜ treasury |
| btn-export-treasury | تصدير | ⬜ treasury |
| btn-bank-fee-classify | تصنيف الرسوم | 🟦 ar |

---

## 8. Search & Filters

- Bank accounts: bank, currency, type, active
- Transactions: account, type, date, amount range
- Checks: type, status, due date, amount range, payee
- Petty cash: fund, custodian, status
- Investments: type, maturity date, status
- Loans: type, status, maturity
- BGs: type, expiring soon, status

---

## 9. Reports

- Cash Position (live)
- Cash Flow Forecast (90/180/365)
- Bank Balance History
- Check Register (issued + received)
- PDC Aging
- Petty Cash Status (per fund)
- Investment Portfolio
- Loan Schedule + Outstanding
- Bank Guarantee Register
- Bank Fees Analysis
- FX Exposure
- Liquidity Risk

---

## 10. Dashboards

- KPIs: Total Cash / FX Exposure / Outstanding Checks / PDC due / Investment Returns
- Charts: Cash trend, Currency mix, Forecast vs actual
- Lists: PDC due tomorrow, BG expiring 30d, Bounced checks, Maturing investments

---

## 11. Notifications

- PDC due tomorrow
- Check bounced
- BG expiring (90/30/7d)
- Investment maturing
- Loan installment due
- Standing order failed
- Petty cash low balance
- Cash position critical
- Large transaction alert (CFO)

---

## 12. Permissions

| Action | AR/AP | Treasury | CFO | Custodian | Super |
|--------|-------|----------|-----|-----------|-------|
| Issue check | ✓ | ✓ | ✓ | ✗ | ✓ |
| Stop check | ✗ | ✗ | ✓ | ✗ | ✓ |
| Transfer between accts | ✗ | ✓ | ✓ | ✗ | ✓ |
| Add investment | ✗ | ✗ | ✓ | ✗ | ✓ |
| Add loan | ✗ | ✗ | ✓ | ✗ | ✓ |
| Petty cash expense | ✗ | ✗ | ✗ | ✓ | ✓ |
| Approve replenishment | ✗ | ✗ | ✓ | ✗ | ✓ |
| BG application | ✗ | ✓ | ✓ | ✗ | ✓ |
| Forecast | ✗ | ✓ | ✓ | ✗ | ✓ |

---

## 13. Integrations

- Bank APIs (Open Banking)
- Lean Technologies / Tarabut
- SAMA reporting
- Bloomberg / Reuters (rates)
- Investment platforms

---

## 14. Shortcuts

- `Ctrl+T` Transfer
- `Ctrl+K` Issue check
- `Ctrl+P` Petty cash expense

---

## 15. Mobile / Print

- Mobile: petty cash with camera receipt
- Print: check (formatted), petty cash sheet

---

## 16. Audit

- All transfers logged
- Check status changes
- Petty cash transactions
- Investment additions
- Loan changes

---

## 17. Tests

```typescript
describe('Cash Position', () => { /* aggregation across accounts/currencies */ })
describe('Transfer', () => { /* same currency, cross-currency, fees */ })
describe('Checks', () => { /* lifecycle, PDC, bounce, replace */ })
describe('Petty Cash Imprest', () => { /* expense, replenish, balance */ })
describe('Investments', () => { /* accrual, maturity, early redemption */ })
describe('Forecast', () => { /* AR/AP/recurring aggregation */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Check on closed account | reject |
| PDC date in past | reject |
| Bounce after cleared | manual reverse + alert |
| Petty cash overdrawn | block + alert |
| Investment FX | translate at maturity |
| BG expired but unreleased | manual close |
| Standing order on closed account | suspend |
| Two transfers same time exceed balance | optimistic lock |

---

**نهاية #25** • 8 سيناريوهات • 13 جداول • 10 forms • 10 grids • 35 button • 12 reports
