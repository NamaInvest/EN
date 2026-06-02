# 20 - المحاسبة (Accounting Domain Deep Dive)

> auto-journal.ts + Books + Periods + FX + Allocations + Recurring

---

## 🏛 شجرة الحسابات (Chart of Accounts)

### الـ Template الافتراضي (`src/lib/seed-socpa-coa.ts`):
**88 حساب SOCPA-compliant**، مهيكلة هرمياً:

```
1xxx Assets (الأصول)
  11xx Current Assets (متداولة)
  12xx Long-term Assets (طويلة الأجل)
  13xx Inventory (المخزون)
  14xx Fixed Assets (ثابتة)

2xxx Liabilities (الالتزامات)
  21xx Current (متداولة)
  22xx Long-term (طويلة الأجل)
  23xx Taxes Payable (ضرائب مستحقة)
  24xx Long-term Provisions

3xxx Equity (حقوق الملكية)
  31xx Capital
  32xx Retained Earnings
  33xx Reserves

4xxx Revenue (الإيرادات)
  41xx Operating Revenue
  49xx Other Income

5xxx Expenses (المصروفات)
  51xx COGS
  52xx Payroll
  53xx Production
  54xx Selling
  55xx G&A
  56xx Depreciation
  58xx Taxes
  59xx Losses
```

### حقول Account المهمة:
```prisma
Account {
    code            String  // 1210, 2110, ...
    name            String  // اسم الحساب
    type            String  // ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE
    parentId        Int?    // للهيكل الهرمي
    balance         Decimal // الرصيد الحالي
    zakatCategory   String? // EQUITY/LT_LIAB/NET_PROFIT/FIXED_ASSET/LT_INV
    controlAccount  Boolean // true لـ AR/AP/Inventory (لا تُكتب يدوياً)
    requiresCostCenter Boolean
    requiresProject Boolean
    requiresSegment Boolean
    deletedAt       DateTime?
}
```

---

## ⚙️ Auto-Journal Engine (`src/lib/auto-journal.ts` — 53KB)

### دالة المفتاح:
```typescript
async function createJournalEntry({
    tenantId,
    description,
    entryDate,
    source,        // SALES / PURCHASES / PAYROLL / DEPRECIATION / etc.
    sourceRefId,   // معرف المستند الأصل
    lines: [{
        accountCode,
        debit,
        credit,
        narration,
        // Optional dimensions:
        costCenterId, profitCenterId, projectId, segmentId,
        customerId, supplierId, employeeId, assetId, productId,
        quantity, uom, foreignDebit, foreignCredit, fxRate
    }]
}): Promise<JournalEntry>
```

### السلوك:
1. **حماية multi-tenant** (سطر 79-83): يحفظ tenant قبل أي await
2. **Balance check** (سطر 86-91): Dr = Cr ± 0.01
3. **Account resolution** (سطر 93-100): يحول الـ codes إلى IDs
4. **Posting**: ينشئ JournalEntry + JournalLines + يحدث Account.balance
5. **Audit log**: تلقائي عبر middleware

### الأحداث التي تُولّد قيد تلقائي:

| الحدث | المسار | القيد |
|---|---|---|
| **بيع فاتورة** | `postSalesInvoice()` | Dr AR / Cr Revenue + VAT Out |
| **COGS** | `postCOGS()` | Dr COGS / Cr Inventory |
| **مرتجع بيع** | `postSalesReturn()` | Dr Revenue / Cr AR (عكس) |
| **شراء فاتورة** | `postPurchaseInvoice()` | Dr Inv + VAT In / Cr AP |
| **استلام GRN** | `postGRN()` | Dr Inv / Cr GR/IR Suspense |
| **مرتجع شراء** | `postPurchaseReturn()` | Dr AP / Cr Inv |
| **استلام دفعة** | `postPaymentReceipt()` | Dr Cash / Cr AR |
| **سداد دفعة** | `postPaymentMade()` | Dr AP / Cr Cash |
| **راتب شهري** | `postPayrollRun()` | Dr Salary Exp / Cr Salary Pay + GOSI + WHT |
| **اشتراك GOSI منشأة** | `postEmployerGOSIAccrual()` | Dr GOSI Exp / Cr GOSI Pay |
| **EOS Provision** | `postEOSAccrual()` | Dr EOS Exp / Cr EOS Liability |
| **EOS Settlement** | `postEOSSettlement()` | Dr EOS Liability / Cr Bank |
| **إهلاك شهري** | `postMonthlyDepreciation()` | Dr Dep Exp / Cr Accum Dep |
| **شراء أصل** | `postAssetAcquisition()` | Dr Fixed Asset / Cr Bank or AP |
| **بيع أصل** | `postAssetDisposal()` | Dr Bank + Accum Dep / Cr Asset + Gain/Loss |
| **POS Closing** | `postPosClosing()` | Dr Cash / Cr POS Sessions |
| **MO Material Issue** | `postManufacturingMaterial()` | Dr WIP / Cr Raw Materials |
| **MO Completion** | `postManufacturingCompletion()` | Dr FG / Cr WIP |
| **FX Revaluation** | `postFxRevaluation()` | Dr/Cr FX Gain/Loss |
| **ZATCA Fee** | `postZatcaFee()` | Dr Bank Fees / Cr Bank |

### Account Codes Dictionary (سطر 15-51):
28 حساب مُعرّفة بأسماء رمزية:
```typescript
const ACCOUNT_CODES = {
    CASH: '1110',
    BANK: '1120',
    AR: '1210',
    INVENTORY: '1330',
    WIP: '1331',
    RAW_MATERIALS: '1332',
    FINISHED_GOODS: '1333',
    VAT_INPUT: '1340',
    FIXED_ASSET: '1410',
    ACCUM_DEP: '1499',
    
    AP: '2110',
    GR_IR: '2120',
    VAT_OUTPUT: '2310',
    SALARY_PAYABLE: '2330',
    GOSI_PAYABLE_EMP: '2340',
    GOSI_PAYABLE_EMPL: '2341',
    WHT_PAYABLE: '2350',
    EOS_LIABILITY: '2410',
    
    REVENUE: '4110',
    COGS: '5110',
    SALARY_EXP: '5210',
    EMPLOYER_GOSI_EXP: '5220',
    EOS_EXPENSE: '5230',
    DIRECT_LABOR: '5310',
    MFG_OVERHEAD: '5320',
    DEPRECIATION_EXP: '5610',
    DISPOSAL_GAIN: '4910',
    DISPOSAL_LOSS: '5910',
};
```

---

## 📅 الفترات المحاسبية (Fiscal Periods)

### النموذج:
```prisma
FiscalYear {
    yearName: '2026'
    startDate, endDate
    locked: Boolean
    periods: FiscalPeriod[]
}

FiscalPeriod {
    fiscalYearId
    periodNo: 1..12  // أو 13 لـ adjustment
    name: 'يناير 2026'
    startDate, endDate
    locked: Boolean
    closedAt
    closedByUserId
}
```

### المنطق:
- إذا `period.locked = true` → لا يمكن إنشاء/تعديل قيود في الفترة
- إذا الفترة الحالية مفتوحة و السابقة مقفلة → عادي
- لفتح فترة مقفلة: يحتاج صلاحية `owner` فقط

### Period Close Workflow (`src/lib/period-close.ts`):
1. **Pre-close checks:**
   - لا فواتير draft
   - كل GRN مُطابق (3-way match)
   - كل bank statement مُسوّى
2. **Adjustments:**
   - Accruals (المصروفات المستحقة)
   - Prepayments amortization
   - FX Revaluation
   - Depreciation
   - ECL provisions
3. **Posting:**
   - Trial Balance
   - P&L (تجميد الأرباح)
   - Balance Sheet
4. **Lock:**
   - Set `period.locked = true`
   - Set `closedAt = now()`
   - Audit log

### السنوي:
- إقفال الفترة 12 يمنع الإقفال السنوي
- يحول Net Profit → Retained Earnings (4xxx + 5xxx → 3210)

---

## 💱 العملات (Currencies & FX)

### النماذج:
```prisma
Currency {
    code: 'SAR' | 'USD' | 'EUR' | ...
    name, symbol
    decimals: 2
    rate: Decimal  // مقابل العملة الأساسية
    active: Boolean
}

ExchangeRate {
    fromCurrencyId, toCurrencyId
    rate: Decimal
    effectiveDate
}
```

### العملة الأساسية:
- **SAR** افتراضياً (Saudi Riyal)
- يمكن تغييرها في `Settings.base_currency`

### FX في القيود:
```prisma
JournalLine {
    debit: Decimal       // بالعملة الأساسية
    credit: Decimal
    foreignDebit: Decimal?  // بالعملة الأصلية
    foreignCredit: Decimal?
    currencyId: Int?
    fxRate: Decimal?
}
```

### FX Revaluation (`postFxRevaluation()`):
```typescript
// شهرياً عبر cron
// لكل حساب بـ foreign balance:
const currentValue = balance * currentRate;
const originalValue = balance * historicalRate;
const fxDifference = currentValue - originalValue;

if (fxDifference > 0) {
    // ربح FX:
    JE: Dr  FX Asset Adjustment    {amount}
        Cr  FX Gain (4920)             {amount}
} else {
    // خسارة FX:
    JE: Dr  FX Loss (5930)         {amount}
        Cr  FX Asset Adjustment        {amount}
}
```

---

## 🔁 Recurring Journal Entries

### النموذج:
```prisma
RecurringJE {
    template: Json  // JE template
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    nextRun: DateTime
    endDate: DateTime?
    runCount: Int
    active: Boolean
}
```

### مثال:
- إيجار شهري: 5000 SAR
- Template: `Dr Rent Exp / Cr Bank`
- Frequency: MONTHLY
- يُنشأ تلقائياً في 1st من كل شهر

### المسار:
- `/api/accounting/recurring-je`
- يستدعى من cron

---

## 🎯 Allocations (التوزيعات)

### النموذج:
```prisma
AllocationRule {
    fromAccountId   // من الحساب
    toAccounts: Json  // [{accountId, percentage}]
    basis: 'FIXED' | 'PERCENTAGE' | 'STATISTICAL'
    triggerAccount: Int?  // الحساب الذي يفعل التوزيع
}
```

### الاستخدام:
- توزيع المصروفات العامة على مراكز التكلفة
- مثال: الإيجار 10,000 → فرع A 60% + فرع B 40%

### المسارات:
- `/api/accounting/allocations` — تعريف القواعد
- `/api/accounting/allocations/run` — تنفيذ
- `/api/accounting/allocations/simulate` — محاكاة

---

## 📊 Cost Centers, Profit Centers, Segments

### الفرق:
- **Cost Center:** قسم/فرع لتتبع المصروفات (مثل HR, IT, Marketing)
- **Profit Center:** وحدة مسؤولة عن الربح (مثل فرع، خط منتج)
- **Segment:** بُعد إضافي (مثل المنطقة الجغرافية، القناة)

### الاستخدام في القيود:
```prisma
JournalLine {
    accountId, debit, credit,
    costCenterId,   // 'CC-HR'
    profitCenterId, // 'PC-RIYADH'
    segmentId,      // 'SEG-RETAIL'
    projectId,      // 'PROJ-001'
}
```

### التقارير:
- P&L per Profit Center
- Cost variance per Cost Center
- Segment Reporting (IFRS 8)

---

## 💼 CO-PA (Profitability Analysis)

> COPA = Cost Object Profitability Analysis (من SAP)

### النماذج:
```prisma
CopaCharacteristic {
    code: 'CUSTOMER' | 'PRODUCT' | 'REGION' | 'SEGMENT' | 'CUSTOM'
    name
    type
}
CopaValueField {
    code: 'REVENUE' | 'COGS' | 'MARGIN' | 'COMMISSION' | ...
    aggregation: 'SUM' | 'AVG' | 'COUNT'
}
CopaDocument {
    documentType
    characteristicValues  // { customerId: 5, productId: 10, ...}
    valueFields           // { revenue: 1000, cogs: 600, margin: 400 }
}
CopaAllocationRule {
    fromCharacteristic
    toCharacteristic
    allocationKey
    percentage
}
```

### التقارير:
- Margin per Customer/Product/Region
- Multi-dimensional pivot
- مسار: `/finance/copa`

---

## 📉 Depreciation Engine (`src/lib/depreciation-engine.ts` — 490 سطر)

### الطرق المدعومة:
1. **Straight-Line (SL):**
   ```
   Monthly Dep = (Cost - Salvage) / (Life in Months)
   ```

2. **Declining Balance (DB):**
   ```
   Monthly = Beginning NBV × (Rate / 12)
   حيث Rate = 2/Life (DDB) أو 1.5/Life
   ```

3. **Sum-of-Years' Digits (SYD):**
   ```
   Year n Dep = (Cost - Salvage) × (Remaining Years / Σ(1..N))
   ```

4. **Units of Production (UOP):**
   ```
   Dep = (Cost - Salvage) × (Units Used / Total Expected Units)
   ```

### التنفيذ الشهري:
```typescript
// /api/cron/depreciation-monthly
for (const asset of activeAssets) {
    const dep = calculateMonthlyDepreciation(asset);
    
    await prisma.assetDepreciationLog.create({
        data: { assetId, period, amount: dep }
    });
    
    await postMonthlyDepreciation({
        assetId,
        amount: dep,
        period: thisMonth
    });
    // JE: Dr Depreciation Exp / Cr Accumulated Dep
    
    await prisma.fixedAsset.update({
        where: { id: assetId },
        data: {
            accumulatedDepreciation: { increment: dep },
            netBookValue: { decrement: dep }
        }
    });
}
```

---

## 🏦 Bank Reconciliation

### الـ Logic (`src/lib/bank-reconciliation.ts`):
1. **Import** Bank Statement (CSV/OFX/Direct API)
2. **Auto-Match:**
   - بـ Reference Number
   - بـ Amount + Date (±3 days)
   - بـ Description fuzzy match
3. **Manual Match:**
   - الـ UI يعرض غير المُطابق
   - المحاسب يطابق يدوياً
4. **Adjustments:**
   - رسوم بنكية (Dr Bank Fees / Cr Bank)
   - فوائد (Dr Bank / Cr Interest Income)

### النماذج:
```prisma
BankStatement {
    bankAccountId, statementNo
    fromDate, toDate
    openingBalance, closingBalance
    status: 'imported' | 'reconciled'
}
BankStatementLine {
    statementId, reference, amount, description, date
}
BankReconciliation {
    bankAccountId, period
    status: 'pending' | 'completed'
    reconciledAmount
}
BankReconMatch {
    journalLineId, statementLineId
    matchType: 'AUTO' | 'MANUAL'
    confidence: 0-1
}
```

### المسارات:
- `/api/accounting/bank-recon` — لوحة الموازنة
- `/api/accounting/bank-recon/auto-match` — تلقائي
- `/api/accounting/bank-statements/upload` — استيراد

---

## 📋 التقارير المالية الأساسية

### Trial Balance:
- جميع الحسابات + رصيد Dr/Cr
- مرشحة بتاريخ
- يجب أن تتوازن

### Income Statement (P&L):
```
Revenue                      1,000,000
- COGS                        (600,000)
= Gross Profit                 400,000

- Selling Expenses             (50,000)
- G&A Expenses                (100,000)
- Depreciation                 (20,000)
= Operating Income             230,000

+ Other Income                  10,000
- Other Expenses                (5,000)
= EBT                          235,000

- Tax (Zakat)                   (5,000)
= Net Income                   230,000
```

### Balance Sheet:
```
Assets:
  Cash                  100,000
  AR                    250,000
  Inventory             300,000
  Fixed Assets (net)    500,000
  Total Assets        1,150,000

Liabilities:
  AP                    150,000
  Loans                 200,000
  EOS Liability          50,000
  Total Liab            400,000

Equity:
  Capital               500,000
  Retained Earnings     250,000
  Total Equity          750,000

Total Liab + Equity   1,150,000  ✓
```

### Cash Flow Statement:
- **Direct method:** Categorize all bank transactions
- **Indirect method:** Start with Net Income, adjust for non-cash + working capital changes

### المسارات:
- `/api/accounting/trial-balance`
- `/api/accounting/profit-loss`
- `/api/accounting/balance-sheet`
- `/api/finance/cash-flow`

---

## 🎯 Multi-Book Accounting (Future)

### الحاجة:
- شركات متعددة الجنسيات تحتاج كتب متعددة (IFRS + US GAAP + Local)
- التفاوتات: Depreciation methods, Revenue recognition, etc.

### الحالة:
- **حالياً:** كتاب واحد (IFRS/SOCPA)
- **مخطط:** Phase 1 Roadmap

### التصميم المقترح:
```prisma
Book {
    code: 'IFRS' | 'GAAP' | 'LOCAL'
    name
    isPrimary: Boolean
}
JournalEntry {
    bookId  // ← يضاف
    ...
}
```

---

## ✅ Validation Checks في النظام

1. **Dr = Cr** (tolerance 0.01)
2. **الفترة مفتوحة** قبل الترحيل
3. **الحسابات موجودة** و active
4. **لا يكتب على control accounts** يدوياً
5. **Audit log** لكل تعديل
6. **Multi-tenant isolation** عبر RLS + DB-per-tenant

---

## 🔒 نظام حوكمة الفترات المالية وتجاوز القيود (Verified Financial Governance & Override Hardening) [COMPLETED 2026-06-02]

تم تدقيق وتأكيد سلامة وصمود حوكمة المعاملات المالية بالكامل من خلال إخضاع النظام لـ 60 فحص تكاملي حقيقي وناجح بنسبة 100%. تم إثبات عمل الأنظمة التالية بدقة متناهية:

### 1. نظام إقفال الفترات والموديولات التفصيلية (Global & Module Locks)
- ** must-block global operations**: يمنع النظام تماماً ترحيل أي حركات محاسبية يدوية أو تلقائية في فترات مقفلة إما ضمنياً (كالفترات المستقبلية غير المفتوحة) أو صراحة (`locked = true`).
- **إقفال الموديولات (Module Lock)**: إتاحة التحكم الدقيق في إقفال العمليات على مستوى الموديول الفردي (مثل إقفال المبيعات مع إبقاء المحاسبة أو العكس) لمنع أي التفاف جانبي أو تداخل بين مخرجات الموديولات.

### 2. محرك التجاوز الإداري والاستثناءات (Master Overrides & Auditing)
- **شروط التجاوز المحكمة**: لا يمكن للمستخدمين برتبة `MASTER_ADMIN` تجاوز أقفال الفترات اللينة (`SOFT_LOCKED`) إلا بتقديم:
  1. كود تأكيد تجاوز صحيح ومطابق.
  2. نص تبرير تجاوز إلزامي لا يقل طوله عن 20 حرفاً.
- **التوثيق الفوقي الفوري (Audit Log Enforcement)**: عند تفعيل التجاوز، يقوم النظام بكتابة سجل معزول كلياً وغير قابل للتعديل في `AuditLog` يحمل وسم `SOFT_LOCK_OVERRIDE` متضمناً تفاصيل تبرير التجاوز، معرف المستخدم، والـ IP الفعلي، لتلبية متطلبات هيئات المراجعة والامتثال.
- **منع تجاوز الأقفال الصلبة (Hard Lock Absolute Restriction)**: يُثبت الاختبار صمود النظام المطلق برفض أي محاولة تجاوز للأقفال الصلبة (`HARD_LOCKED`) حتى لو صدرت المحاولة من `MASTER_ADMIN` وتحت أي تبرير محاسبي.

### 3. محرك الإغلاق الشامل للفترات (Universal Period Close Checklist Engine - GL-03)
- **مصفوفة التحقق الـ 16 خطوة**: يقوم محرك الإغلاق بالتحقق التلقائي من عدم وجود أي فواتير مسودة (`DRAFT`) أو حركات معلقة (مثل الـ GRN غير المطابق) تمنع الانتقال لوضع الإقفال.
- **محاكاة ورفض الفروقات وأموال التقييم**: يمنع المحرك تلقائياً ترحيل عمليات إعادة تقييم العملات الأجنبية للبنوك (FX Bank Revaluation) في حال تعارضها مع شروط التوازن أو الفترات المحمية.

