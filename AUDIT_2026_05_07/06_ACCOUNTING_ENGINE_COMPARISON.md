# 06 — مقارنة محرك المحاسبة (Accounting Engine Comparison)

> فحص محرك المحاسبة الفعلي في Namasoft ومقارنته بـ **SAP S/4HANA Universal Journal، Oracle Fusion SLA، NetSuite، Microsoft Dynamics 365 F&O، Odoo 18 Enterprise**.
> المخرج: 18 فجوة محرك (Engine Gap) كل واحدة بـ **برومنت جاهز + سيناريو عمل + فلو بيانات + Schema + UI**.
> **الفحص قائم على قراءة الكود الفعلي** في `src/lib/auto-journal.ts` و`period-close.ts` و`year-end-engine.ts` و`wht-engine.ts` و`costing.ts`.

---

## ملخص تنفيذي

### الحالة العامة للمحرك

| الجانب | Namasoft | المعيار العالمي |
|---|---|---|
| الـ Schema | **8/10** — Universal Journal style (شبيه ACDOCA) مع dimensions كاملة، multi-book schema غني | يتفوق على Odoo، يقترب من Dynamics |
| المحرك التنفيذي | **3/10** — كثير من الـ schemas بدون engine code | فاصل كبير عن SAP/Oracle/NetSuite |
| الامتثال السعودي | **6/10** — ZATCA Phase 2 يعمل، WHT يحسب، VAT أساسي | متقدم على Odoo l10n_sa، تحت SAP DRC |
| الأداء | **غير مُختبر** — Float للأرصدة، تحديث خارج المعاملة | بعيد عن HANA-grade |
| **التقييم العام** | **5/10** | — |

### اكتشافات حرجة من قراءة الكود

1. **`period-close-engine.ts` ملف فارغ** — التنفيذ الفعلي في `period-close.ts` فقط.
2. **`YearEndCloseEngine` mock بالكامل** — كل المهام التلقائية (depreciation, FX reval, ECL, EOS, closing JE, rollover JE) تُعلَّم DONE بدون توليد قيد فعلي.
3. **`WHTEngine.applyWHT` يستخدم `accountId` صلب (2010 و 2050)** بدلاً من `code` — في multi-tenant DB هذه PKs محلية وقد لا تشير للحساب الصحيح. **خطأ كارثي محتمل**.
4. **`postPurchaseInvoice` يخصم Inventory مباشرة** بينما `postGRN` يستخدم GRNI — لو نُفّذا معاً → **Inventory مدين مرتين، GRNI لا يُصفّى**.
5. **`Account.balance` نوعه `Float` مُحدَّث خارج المعاملة** — مع ملايين القيود → انحراف دقّة + عدم اتساق عند الـ crash.
6. **`createJournalEntry` يقبل dimensions مختلفة على debit/credit بدون موازنة** — `DR PC1 100 / CR PC2 100` يمر، يكسر تقارير الشرائح.
7. **`autoReverseDate` و `isReversal` حقول يتيمة** — لا توجد دالة `reverseEntry()`.
8. **فحص الفترة عبر تحليل سلسلة `entryDate`** — لو الصيغة اختلفت (مثلاً `MM/DD/YYYY`) يمر بدون فحص.

---

## الجزء الأول — البصمة المحاسبية الحالية (Current Accounting Footprint)

### 1.1 ما يعمل في `auto-journal.ts` (12 دالة قيد آلي)

| الدالة | المحفِّز | القيد | النواقص |
|---|---|---|---|
| `createJournalEntry` | كل دالة أخرى | إطار قيد عام مع فحص توازن ±0.01 | لا يوجد reversal، لا يوجد per-dimension balancing |
| `postSalesInvoice` | فاتورة بيع/POS | DR Cash/Bank/AR، CR Sales، CR VAT_OUT، DR Discount، DR COGS / CR Inv | لا يمرر customerId/dimensions على lines، لا fx |
| `postPurchaseInvoice` | فاتورة شراء | DR Inv (+landed)، DR/CR PPV، DR VAT_IN، CR Cash/Bank/AP | **يتجاوز GRNI** — يخصم Inventory مباشرة |
| `postGRN` | استلام مخزني | DR Inventory / CR GRNI | **يدويًا مع `postPurchaseInvoice` → ازدواج** |
| `postExpense` | مصروف | DR Expense / CR Cash | لا يدعم AP أو Bank، 8 فئات بأكواد عربية صلبة |
| `postSalesReturn` | مرتجع بيع | DR Returns + DR VAT_OUT / CR Cash + DR Inv / CR COGS | يدفع Cash دائماً (لا AR) |
| `postSalary` | راتب | DR Salaries / CR Cash | **stub** — لا GOSI، لا EOS، لا allowances |
| `postStockTransfer` | تحويل مخزني | DR/CR IN_TRANSIT ↔ INVENTORY | لا dimensions على lines |
| `postPurchaseReturn` | مرتجع شراء | DR Cash / CR Inventory + CR VAT_IN | **لا يستخدم 5110 PURCHASE_RETURNS** |
| `postInventoryAdjustment` | جرد | DR/CR SHRINKAGE ↔ INVENTORY | حساب واحد للزيادة والنقصان |
| `postManufacturingCompletion` | اكتمال أمر تشغيل | DR FG / CR WIP / DR/CR MFG_VARIANCE | يعتمد على standard cost passed-in |
| `postMaterialIssueToWIP` | إصدار مواد | DR WIP / CR INVENTORY | بسيط جداً |

### 1.2 ما يوجد في الـ Schema لكن **لا engine يستخدمه**

| النموذج | الغرض المُصمَّم | الحالة |
|---|---|---|
| `AccountingBook` (PRIMARY/TAX/MGMT/GROUP/STATUTORY/REGULATORY) | Multi-book parallel ledgers | ✅ Schema جاهز / ❌ لا replication runtime |
| `AccountMapping` (PASS/EXCLUDE/AMOUNT_PCT/SPLIT/CURRENCY_TRANSLATE/CUSTOM_FORMULA) | Cross-GAAP mapping | ✅ Schema / ❌ لا engine |
| `BookComparison` | Delta reporting بين دفتريْن | ✅ Schema / ❌ لا UI |
| `JournalEntry.replicatedFromId` + `bookOnly` | Replication tracking | ✅ Schema / ❌ غير مفعّل |
| `JournalEntry.autoReverseDate` + `isReversal` | Auto-reversal accruals | ✅ Schema / ❌ orphan |
| `FxRevaluationRun` | تقييم العملات الدوري | ✅ Schema / ❌ لا engine |
| `IntercompanyTransaction` (PENDING/RECONCILED/ELIMINATED) | إلغاءات داخلية | ✅ Schema / ❌ لا elimination engine |
| `RevenueRecognitionLine` (IFRS 15) | Deferred revenue scheduling | ✅ Schema / ❌ لا engine |
| `LeaseContract` + `lease-accounting-engine.ts` | IFRS 16 | ⚠️ Engine منفصل، غير مُدمج بـ auto-journal |
| `ECLModel` (IFRS 9) | خسائر ائتمانية متوقعة | ✅ Schema / ❌ لا engine |
| `Encumbrance` | Commitment accounting | ✅ Schema / ❌ لا engine |
| `OpeningBalance` | أرصدة افتتاحية للسنة الجديدة | ✅ Schema / ❌ لا تُملأ تلقائياً |
| `ImmutableReport` (SHA-256) | تقارير مُختمة بصمياً | ✅ Schema / ❌ Mock فقط |
| `JournalTemplate` + frequency + autoReverse | قيود متكررة | ✅ Schema / ⚠️ runner منفصل |
| `CopaAllocationRule` (REVENUE/HEADCOUNT/EQUAL/CUSTOM_FORMULA) | تخصيصات CO-PA | ✅ Schema / ❌ لا engine |
| `Account.zakatCategory` (NONE/EQUITY/...) | تصنيف الزكاة | ✅ Schema / ❌ لا حاسبة Zakat base |

### 1.3 خريطة الحسابات الصلبة (Hardcoded `ACCOUNTS`)

```
1110 CASH        2100 PAYABLES     4100 SALES         5100 COGS
1120 BANK        2110 GRNI         4110 SALES_RETURNS 5110 PURCHASE_RETURNS
1200 RECEIVABLES 2300 VAT_OUTPUT   4120 SALES_DISCOUNT 5120 SHRINKAGE
1300 INVENTORY   1400 VAT_INPUT    4200 OTHER_REVENUE 5130 MFG_VARIANCE
1310 IN_TRANSIT                                       5140 PPV
1330 WIP                                              5200 SALARIES
1340 FINISHED_GOODS
```

**ملاحظة:** هذه الأكواد مدمجة في الكود. لو tenant استخدم خريطة SOCPA مختلفة (مثلاً 1101 بدلاً من 1110) → القيود ستفشل بسبب `Account.findFirst({ code })`.

---

## الجزء الثاني — مقارنة جنباً إلى جنب

### 2.1 معمارية القيد (Journal Architecture)

| البُعد | Namasoft | SAP S/4HANA (ACDOCA) | Oracle Fusion (SLA) | NetSuite | Dynamics F&O | Odoo 18 |
|---|---|---|---|---|---|---|
| Single source of truth | ⚠️ JournalEntry/Line + Account.balance denormalized | ✅ ACDOCA = FI+CO+AA+ML+CO-PA في جدول واحد | ❌ GL منفصل عن SLA | ✅ Transaction unified | ⚠️ GL + subledger journals | ✅ account.move/line |
| Dimensions في JournalLine | ✅ 9 (PC, Project, Segment, Product, Customer, Vendor, Employee, Asset, Book) | ✅ ~340 column dimension في ACDOCA | ✅ 30 segments في accounting flexfield | ✅ Class+Dept+Location + custom | ✅ 20 financial dimensions | ⚠️ analytic plans (M2M) |
| توازن مُتعدد الأبعاد | ❌ global only | ✅ Document Splitting | ✅ Balancing segments | ❌ company only | ✅ per dimension set | ❌ company only |
| Posting concurrency | ⚠️ Prisma transactions + sequence | ✅ ENQUEUE locks + HANA MVCC | ✅ Document sequencing per ledger | ✅ Optimistic locking | ✅ Sequence framework | ⚠️ row locks + sequence (no_gap) |
| Float vs Decimal | ❌ **Account.balance: Float** | ✅ Decimal + 6 decimals on rates | ✅ Decimal | ✅ Decimal | ✅ Decimal | ✅ Decimal |

### 2.2 Multi-Book / Parallel Ledgers

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| عدد الدفاتر | ∞ (schema) | ∞ ledgers | ∞ ledgers | 2+ (Multi-Book SuiteApp) | 10 posting layers | 1 + شركات منفصلة |
| Replication runtime | ❌ يدوي فقط | ✅ atomic | ✅ SLA per ledger | ✅ per-book rules | ✅ per layer | ❌ |
| Cross-GAAP mapping | ✅ Schema (لا engine) | ✅ FI-AA depreciation areas | ✅ SLA rules per ledger | ✅ ARM per book | ✅ per layer | ❌ |
| Group/Statutory/Tax/Mgmt | ✅ types defined | ✅ leading/non-leading | ✅ Primary/Secondary/Reporting | ✅ Multi-Book | ✅ Operations/Tax/Current | ❌ |

**الحكم:** Schema Namasoft على مستوى SAP، لكن Engine مفقود → كأن لا multi-book عملياً.

### 2.3 Period Close

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| Period states | open/closed/locked | Open/Closed/Permanent | Never/Open/Closed/Permanent | Open/Locked/Closed | OnHold/Open/Closed | Open/Closed (lock date) |
| Granularity | فترة واحدة شاملة | per company × account type × period | per ledger × period | per subsidiary × period × txn type | per legal entity × module × period | per company + tax |
| Adjustment period | ❌ غير مدعوم | ✅ Periods 13–16 | ✅ Configurable | ❌ | ✅ Closing periods | ❌ |
| Soft vs Hard | ⚠️ متطابقان runtime | ✅ via period variant | ✅ Soft close cocoon | ⚠️ Lock by module | ✅ OnHold ≠ Closed | ⚠️ Adviser bypass |
| Close cockpit | ⚠️ Checklist بسيط | ✅ Financial Closing Cockpit | ✅ Close Manager | ✅ Period Close Mgmt | ✅ Period close workspace | ❌ |
| Validations قبل الإقفال | ❌ checklist completion فقط | ✅ TB balanced + sub-ledger reconciled + FX revalued | ✅ multi-step validation | ✅ checklist | ✅ checklist | ❌ |

### 2.4 Year-End Roll-Over

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| Closing JE (P&L → RE) | ❌ **mocked** | ✅ FAGLGVTR | ✅ Year-End Close program | ✅ Auto on FY start | ✅ Year-end close | ✅ Auto live (no journal) |
| Rollover JE | ❌ **mocked** | ✅ Balance carryforward | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto |
| OpeningBalance generation | ❌ Schema بدون engine | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multiple RE accounts | ⚠️ ممكن schema-wise | ✅ per ledger × PC | ✅ per balancing segment | ❌ one per subsidiary | ✅ per main account/dim | ❌ |

### 2.5 Reversal Mechanics

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| Same-period reversal | ❌ **API مفقود** | ✅ storno/negative | ✅ Reverse action | ✅ Void/Reverse | ✅ Storno/standard | ✅ Reverse button |
| Cross-period reversal | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-reverse next period | ❌ flag يتيم | ✅ Recurring reversal | ✅ Auto reversal program | ✅ Memorized reverse | ✅ Periodic auto-reverse | ✅ recurring + reverse |
| Reversal reason codes | ❌ | ✅ Mandatory | ✅ Reason | ⚠️ free text | ✅ Reason | ⚠️ free text |

### 2.6 Tax Engine

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| Tax code per line | ❌ taxValue رقم خام | ✅ Condition-based | ✅ E-Business Tax | ✅ SuiteTax | ✅ Tax engine | ✅ Per line |
| Multiple taxes per line (VAT+Excise+WHT) | ❌ | ✅ stack | ✅ regimes | ✅ multi tax | ✅ multi codes | ✅ multi taxes |
| WHT engine | ⚠️ يحسب لكن **AccountId hardcoded** | ✅ EWT | ✅ WHT engine | ⚠️ partner SuiteApps | ✅ WHT module | ✅ native |
| Reverse Charge VAT | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Zero-rated/Exempt/Out-of-scope | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ZATCA Phase 2 | ✅ runs (مع ثغرات سُجّلت في تقرير 04) | ✅ DRC | ⚠️ partner | ⚠️ partner | ✅ ER framework | ✅ l10n_sa_edi |
| Zakat 2.5% engine | ❌ Schema بدون حاسبة | ⚠️ manual journal | ⚠️ manual | ⚠️ manual | ⚠️ custom | ⚠️ manual |

### 2.7 Allocations / CO-PA

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| Step-down allocation | ❌ | ✅ Assessment cycles | ✅ Calc Manager | ⚠️ schedules sequenced | ✅ rules | ❌ |
| Reciprocal | ❌ | ✅ iterative | ✅ | ❌ | ❌ | ❌ |
| Driver-based | ⚠️ schema | ✅ Statistical key figures | ✅ Statistical balances | ✅ Statistical accounts | ✅ formulas | ⚠️ analytic plans |
| Preview before post | ❌ | ✅ Test run | ✅ Trial run | ✅ Preview | ✅ Draft | ✅ Draft |

### 2.8 Revenue Recognition + Lease

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| IFRS 15 5-step | ❌ schema بدون engine | ✅ RAR | ✅ Revenue Mgmt Cloud | ✅ ARM | ✅ Subscription Billing | ⚠️ deferred templates |
| Performance obligations | ⚠️ schema | ✅ Full POB | ✅ Full POB | ✅ Full POB | ⚠️ POB on contract | ❌ |
| IFRS 16 lease engine | ⚠️ منفصل، غير مُدمج | ✅ RE-FX | ✅ Fusion Lease | ✅ Lease SuiteApp (مجاني) | ✅ Asset Leasing | ⚠️ partial |
| ROU asset auto | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Effective interest amortization | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ |

### 2.9 Audit Trail + Immutability

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| Field-level على JE | ❌ field-audit موجود لكن لا hookup | ✅ CDHDR/CDPOS | ✅ Audit policies | ✅ System Notes | ✅ Database log | ✅ mail.thread |
| Posted JE immutability | ⚠️ status flag — لا حماية في الـ schema | ✅ enforced | ✅ enforced | ✅ enforced | ✅ enforced | ✅ enforced |
| Drill-down TB→source | ⚠️ partial | ✅ كامل | ✅ كامل | ✅ كامل | ✅ كامل | ✅ كامل |
| sourceDocumentType + Id على JE | ❌ ليس في schema | ✅ AWTYP/AWREF | ✅ source doc ref | ✅ Transaction link | ✅ Voucher link | ✅ ref + reconciled_invoice |

### 2.10 Performance & Scale

| البُعد | Namasoft | SAP | Oracle | NetSuite | Dynamics | Odoo |
|---|---|---|---|---|---|---|
| Account.balance computation | ❌ Float denormalized + غير ذرّي | ✅ on-the-fly في HANA | ✅ GL_BALANCES rebuild | ✅ live | ✅ live | ✅ live (partial caching) |
| Real-time analytics | ❌ | ✅ ACDOCA columnar | ✅ OTBI | ✅ SuiteAnalytics | ✅ Power BI | ✅ Studio |
| Throughput claim | غير قابل للقياس | 100k+ lines/sec | 50k JE/hr batch | 1M txn/day | 20k JE/hr | 5–10k JE/hr |
| Archive strategy | ❌ | ✅ Data Aging | ✅ Purge programs | ⚠️ retention | ✅ DMF | ❌ |

---

## الجزء الثالث — فجوات المحرك (18 فجوة) مع برومنت + سيناريو + فلو

> ترتيب: من الأخطر للأقل خطورة. كل فجوة كاملة (Schema + UI + Prompt + Scenario + Flow).

---

### EG-01 · WHT Engine Hardcoded AccountId Bug (P0 — Critical Bug)

**الشدة:** 🔴 خطأ كارثي محتمل في multi-tenant
**المرجع في الكود:** `src/lib/wht-engine.ts` → `applyWHT()` يستخدم `accountId: 2010` و `accountId: 2050`

#### المشكلة
في multi-tenant DB، `Account.id` هو PK محلي للـ tenant. الكود يفترض أن الحساب رقم 2010 و 2050 يخصان "AP Reduction due to WHT" و "WHT Payable to ZATCA" — **هذا الافتراض خاطئ**:
- لو tenant جديد بدأ بـ COA مختلف → الـ ID قد يشير لحساب آخر تماماً.
- لو حُذف حساب وأُعيد إنشاؤه → ID جديد، الكود لا يعرف.

#### الإصلاح المطلوب
استخدام `code` (مثل سائر الدوال) بدلاً من `id`، مع إضافة codes جديدة للخريطة:
- `2400 WHT_AP_CLEARING` للتقاص من المورد
- `2410 WHT_PAYABLE_ZATCA` للمستحق لـ ZATCA

#### Schema (إضافة codes للـ Settings)

```prisma
// add to TenantSettings or hard codes
WHT_AP_CLEARING_CODE       = "2400"
WHT_PAYABLE_ZATCA_CODE     = "2410"
```

#### البرومنت

```
/erp-build-feature wht-engine-fix-accountid

اقرأ src/lib/wht-engine.ts وأصلح applyWHT() بالخطوات:

1. أضف ACCOUNTS map في wht-engine.ts:
   const WHT_ACCOUNTS = {
     AP_CLEARING: '2400',     // AP Reduction due to WHT
     PAYABLE: '2410',         // WHT Payable to ZATCA
   }

2. عدّل applyWHT() ليستخدم Account.findFirst({ where: { code, tenantId } })
   بدلاً من accountId: 2010/2050.

3. لو الحساب غير موجود → throw مع رسالة عربية واضحة:
   "حساب WHT غير موجود — أنشئه يدوياً أو شغّل Seed."

4. أضف seed migration:
   prisma/seeds/wht-accounts.ts ينشئ الحسابين 2400 و 2410 لكل tenant موجود.

5. اربط مع auto-journal.ts:
   import وأضف WHT codes للـ ACCOUNTS الرئيسية.

6. اكتب test:
   - tenant بدون الحسابين → applyWHT يفشل برسالة واضحة
   - tenant معه الحسابين → applyWHT ينجح ويضع code صحيح

7. أضف entryNumber صحيح من sequence engine (getNextNumber('JE')) بدلاً من
   `WHT-${whtTx.id}`.
```

#### سيناريو عمل
**Tenant جديد** يفعّل وحدة المشتريات → يستلم فاتورة من مورد أجنبي بـ خدمات استشارية. النظام يحاول applyWHT → **ينجح بسبب وجود حساب id=2010 في الـ tenant (لكنه ليس WHT — هو حساب "Other Payables"!)** → القيد يذهب لمكان خاطئ، التقارير تكون مشوّهة، الـ auditor يكتشفها بعد 6 أشهر.

#### فلو البيانات قبل/بعد الإصلاح

```
قبل (الخاطئ):
  applyWHT() → INSERT JournalLine accountId: 2010 (افتراض أعمى)
  → في tenant T1 = "Other Payables"
  → في tenant T2 = "WHT AP Clearing" (صحيح بالصدفة)

بعد (الصحيح):
  applyWHT()
    ↓
  Account.findFirst({ code: '2400', tenantId })
    ↓
  if !account → throw "حساب 2400 WHT_AP_CLEARING غير موجود"
    ↓
  INSERT JournalLine accountId: account.id (صحيح دائماً)
```

---

### EG-02 · GR/IR Double-Posting Bug (P0)

**الشدة:** 🔴 خطر مالي فعلي
**المرجع:** `postGRN` يستخدم GRNI، `postPurchaseInvoice` يخصم Inventory مباشرة

#### المشكلة
عند الاستلام (GRN) → `DR Inv 100 / CR GRNI 100` ✓
عند الفاتورة (Purchase Invoice) → `DR Inv 100 / CR AP 100` ❌
**النتيجة:** Inventory مدين 200، GRNI لا يُصفّى أبداً → الـ balance sheet مكسور.

#### الإصلاح المطلوب

التمييز بين سيناريوهين:
1. **PO → GRN → Invoice (3-way):** GRN يستخدم GRNI، Invoice يصفّي GRNI:
   - `postGRN`: DR Inventory / CR GRNI
   - `postPurchaseInvoice (3-way)`: DR GRNI / CR AP (لا inventory هنا)
2. **Invoice فقط (لا GRN):** Invoice يخصم Inventory مباشرة (الحالة الحالية).

#### Schema

```prisma
// extend PurchaseInvoice
model PurchaseInvoice {
  // existing fields
  isThreeWayMatch  Boolean @default(false)
  grnIds           String[]  // related GRN ids that this invoice clears
}
```

#### البرومنت

```
/erp-build-feature grn-ir-clearance-fix

أصلح ثنائية GR/IR في auto-journal.ts:

1. أضف flag isThreeWayMatch + grnIds[] على PurchaseInvoice schema.

2. عدّل postPurchaseInvoice():
   if (invoice.isThreeWayMatch && invoice.grnIds.length > 0):
     // استخدم GRNI clearance pattern
     for each grn:
       DR  2110 GRNI                 (grn.totalCost)
     CR  2100 AP                     (subtotal)
     DR  1400 VAT_INPUT              (taxValue)
     // الفرق invoice.subtotal - sum(grn.totalCost) = PPV → 5140
   else:
     // الحالة الحالية (لا GRN)
     DR  1300 INVENTORY              (subtotal)
     DR  1400 VAT_INPUT
     CR  2100 AP / 1110 CASH

3. عدّل API /api/purchases:
   عند إنشاء فاتورة → ابحث عن GRNs مرتبطة بـ PO → set isThreeWayMatch + grnIds

4. أضف view "GRNI Aging Report":
   src/app/(dashboard)/accounting/grni-aging/page.tsx
   يعرض GRNs التي عمرها > 30 يوم بدون فاتورة.

5. اكتب tests:
   - PO + GRN ثم Invoice → Inventory مدين مرة واحدة، GRNI = 0
   - Invoice بدون GRN → Inventory مدين مباشرة

6. cron monthly:
   كشف GRNI عمره > 60 يوم → ينبه CFO
```

#### سيناريو
- 5 مايو: استلام بضاعة 10,000 ر.س. → `DR Inv 10k / CR GRNI 10k`.
- 12 مايو: وصول الفاتورة 10,200 ر.س. (مع 200 PPV) → النظام يكتشف grnIds → `DR GRNI 10k، DR PPV 200 / CR AP 10,200`.
- النتيجة: Inventory = 10k (صحيح)، GRNI = 0 (مُصفّى)، PPV = 200 (محسوب).

#### فلو البيانات

```
قبل:
GRN: DR Inv 10k / CR GRNI 10k                    [Inv=10k, GRNI=10k]
PI:  DR Inv 10k, DR VAT 1.5k / CR AP 11.5k      [Inv=20k ❌, GRNI=10k ❌]

بعد (3-way):
GRN: DR Inv 10k / CR GRNI 10k                    [Inv=10k, GRNI=10k]
PI:  DR GRNI 10k, DR VAT 1.5k / CR AP 11.5k     [Inv=10k ✓, GRNI=0 ✓]

PPV (لو الفاتورة 10.2k):
PI:  DR GRNI 10k, DR PPV 200, DR VAT 1.53k / CR AP 11.73k
```

---

### EG-03 · Account Balance Float + Non-Atomic Updates (P0)

**الشدة:** 🔴 خطر دقّة + عدم اتساق
**المرجع:** `Account.balance: Float` + تحديث في loop خارج المعاملة

#### المشكلة
1. `Float` يفقد الدقة بعد ملايين القيود (مثلاً 0.1 + 0.2 = 0.30000000000000004).
2. تحديث الأرصدة خارج معاملة الـ JE → crash مُمكن يترك:
   - JE مُسجَّل
   - بعض الحسابات حُدِّثت، البعض لا
   - الميزانية لا توازن

#### الإصلاح المطلوب

1. حوّل `Account.balance` لـ `Decimal @db.Decimal(18,4)`.
2. اجعل التحديث داخل **نفس** الـ Prisma transaction الذي ينشئ JE.
3. أضف Reconciliation cron يومي يقارن `Account.balance` مع `SUM(JL.debit-credit)` ويصلح أي انحراف.

#### Schema

```prisma
model Account {
  // change
  balance Decimal @default(0) @db.Decimal(18, 4)  // was Float
}

model AccountBalanceReconLog {
  id            String @id @default(cuid())
  tenantId      String
  accountId     String
  reconciledAt  DateTime
  cachedBalance Decimal @db.Decimal(18,4)
  computedBalance Decimal @db.Decimal(18,4)
  drift         Decimal @db.Decimal(18,4)
  fixed         Boolean
}
```

#### البرومنت

```
/erp-build-feature account-balance-decimal-atomic

1. Migration: ALTER COLUMN Account.balance to Decimal(18,4).
   Backfill: UPDATE Account SET balance = (SELECT SUM(...) FROM JournalLine ...).

2. عدّل createJournalEntry في auto-journal.ts:
   ضع تحديث الأرصدة داخل prisma.$transaction(async tx => {
     const entry = await tx.journalEntry.create({...})
     for line of resolvedLines:
       await tx.account.update({
         where: { id: line.accountId },
         data: { balance: { increment/decrement: amount } }
       })
   })

3. أنشئ AccountBalanceReconLog model.

4. Cron يومي 03:00:
   src/app/api/cron/balance-reconciliation/route.ts
   لكل tenant × account:
     computed = SUM(debit-credit) من JournalLine حيث status=posted
     if abs(cached - computed) > 0.01:
       INSERT log + UPDATE Account.balance = computed
       notify CFO

5. اكتب test:
   - 1000 قيد في 100 thread متوازي → جميع الأرصدة صحيحة
   - تحطيم العملية في المنتصف → rollback كامل (لا قيد، لا تحديث)
```

#### سيناريو
**اختبار stress:** 100 مستخدم يصدرون فواتير في نفس الثانية → كل قيد ينشأ في معاملة واحدة → الأرصدة دائماً مُتسقة. لو حدث crash في تحديث الحساب رقم 5 من 8 → الـ Prisma يـ rollback كل شيء، JE نفسه لم يُسجل، يُعاد المحاولة.

#### فلو

```
قبل (غير ذرّي):
tx.create(JE) ← committed
loop tx.update(Account) ← غير محمي
  if crash @ iter 5: JE موجود، 5 حسابات حُدّثت، 3 لا → كسر الميزانية

بعد (ذرّي):
prisma.$transaction(async tx => {
  await tx.journalEntry.create
  for each line:
    await tx.account.update  // كله أو لا شيء
})
  ↓
on commit: كل الأرصدة + JE مُحدّثة معاً
on error: rollback كامل
  ↓
Daily cron 03:00:
  for each account:
    computed = SUM(JL) لكل القيود posted
    if drift > 0.01:
      log + fix + notify
```

---

### EG-04 · Year-End Engine Mocked (P0)

**الشدة:** 🔴 ميزة معلَن عنها لا تعمل
**المرجع:** `year-end-engine.ts` → `executeAutoTask` يضع DONE فوراً، `finalizeClose` يقفل بدون JE

#### المشكلة
- 28 مهمة تلقائية لا تنفِّذ شيئاً (depreciation، FX reval، ECL، EOS، closing JE، rollover JE).
- الـ schema يحتوي `closingJournalId` و `rolloverJournalId` لكن لا يُملأان.
- `OpeningBalance` table فارغ دائماً.

#### المطلوب
بناء engine حقيقي يستدعي:
1. **Depreciation Engine:** posts شهر ديسمبر للأصول.
2. **FX Revaluation:** يقيم العملات الأجنبية.
3. **ECL:** يحسب IFRS 9 expected credit loss.
4. **EOS Provision:** يحسب EoS لكل موظف.
5. **Closing JE:** Net Income → Retained Earnings.
6. **Rollover JE:** ينشئ OpeningBalance للسنة الجديدة لكل حساب BS.

#### Schema (الموجود يكفي، نحتاج تطبيق فقط)

```prisma
// existing — تأكد من تفعيلها
model YearEndCloseRun {
  // ... existing
  closingJournalId  String?
  rolloverJournalId String?
}

model OpeningBalance {
  // existing — يجب أن يُملأ من rollover
}
```

#### البرومنت

```
/erp-build-feature year-end-engine-real

استبدل المحتوى Mock في src/lib/year-end-engine.ts بمحرك حقيقي:

1. عدّل executeAutoTask(taskCode):
   switch (taskCode):
     case 'DEP_01': await DepreciationEngine.runForPeriod(period)
     case 'FX_01':  await FxRevalEngine.run(period)
     case 'ECL_01': await EclEngine.run(period)
     case 'EOS_01': await EosProvisionEngine.run(period)
     case 'CLO_01': await closeProfitAndLoss(year)
     case 'ROL_01': await rolloverToNewYear(year)

2. ابن closeProfitAndLoss(year):
   // ينقل صافي ربح/خسارة لحساب أرباح مرحّلة
   netIncome = SUM(Revenue) - SUM(Expense) للـ fiscal year
   create JournalEntry status=posted entryDate=year.endDate:
     for each Revenue account with balance:
       DR Revenue / CR Income Summary
     for each Expense account with balance:
       DR Income Summary / CR Expense
     CR Retained Earnings (3300) for netIncome
   set YearEndCloseRun.closingJournalId = entry.id

3. ابن rolloverToNewYear(year):
   nextYear = year+1
   for each BS account (Asset/Liability/Equity):
     create OpeningBalance(fiscalYearId: nextYear, accountId, amount: balance)
   create JournalEntry status=posted entryDate=nextYear.startDate description="Opening Balances":
     for each BS account: DR/CR according to balance + offset to Opening Equity Clearing 3999
   set YearEndCloseRun.rolloverJournalId = entry.id

4. ابن DepreciationEngine.runForPeriod, FxRevalEngine.run, EclEngine.run, EosProvisionEngine.run
   (كل واحد engine منفصل، يستخدم post* helpers لتسجيل القيد)

5. عدّل finalizeClose:
   تأكد أن closingJournal و rolloverJournal تم إنشاؤهما قبل LOCKED.
   else throw "لا يمكن إقفال السنة دون قيود الإقفال والترحيل."

6. ابن ImmutableReport بمحتوى حقيقي:
   - TRIAL_BALANCE: SQL pull TB
   - INCOME_STATEMENT: revenue - expense
   - BALANCE_SHEET: A = L + E
   payload = JSON, hash = SHA-256(JSON)

7. اكتب tests شاملة:
   - افتراض 12 شهر بيانات، شغّل YE → P&L = 0 في السنة الجديدة
   - OpeningBalance entries = عدد BS accounts
   - Retained Earnings زاد بقدر صافي الربح
```

#### سيناريو
**31 ديسمبر 2026:** CFO يفتح Year-End Close. يضغط Run All Auto Tasks:
1. Depreciation runs لجميع الأصول → DR Depreciation Expense / CR Accumulated Depreciation.
2. FX Reval لجميع الحسابات بعملات أجنبية → DR/CR FX Gain/Loss.
3. ECL: يحسب IFRS 9 على AR → DR ECL Expense / CR Provision.
4. EOS: لكل موظف → DR EOS Expense / CR EOS Liability.
5. Closing JE: ينقل كل P&L لـ Retained Earnings.
6. Rollover JE: ينشئ Opening Balances للسنة 2027.
7. ImmutableReport: TB + IS + BS مُختمة بـ SHA-256.
8. FiscalYear.status = LOCKED.

**1 يناير 2027:** أول قيد للسنة الجديدة → الأرصدة الافتتاحية موجودة، السنة السابقة مقفلة، لا يمكن التعديل عليها.

#### فلو

```
finalizeClose Year 2026:
  ↓
runAllAutoTasks (DEP, FX, ECL, EOS) — ينتج قيود تعديل
  ↓
closeProfitAndLoss:
  netIncome = Σ Revenue − Σ Expense = 1,200,000
  JE-ClosingP&L:
    DR all Revenue accounts (zero them out)
    CR all Expense accounts (zero them out)
    CR Retained Earnings 1,200,000
  ↓
rolloverToNewYear (FY 2027):
  for each BS account with balance:
    OpeningBalance(FY=2027, account, amount=balance)
  JE-OpeningBalances (date=2027-01-01):
    DR/CR balanced from BS
  ↓
ImmutableReport (TB, IS, BS) hashed
  ↓
FiscalYear 2026 LOCKED
FiscalYear 2027 OPEN with opening balances
```

---

### EG-05 · No Reversal API (P0)

**الشدة:** 🔴 ميزة محاسبية أساسية مفقودة
**المرجع:** `JournalEntry.isReversal` و `autoReverseDate` orphan

#### المطلوب
- `reverseEntry(entryId, reason, reversalDate)` ينشئ قيد عكسي.
- `autoReverseAccruals` cron يبحث عن `autoReverseDate <= today` ويُنشئ العكس.

#### Schema (إضافة)

```prisma
model JournalEntry {
  // existing
  reversalReasonCode String?
  reversedById       String?     // FK to JournalEntry
  reversedAt         DateTime?
  reversedBy         String?
}

model ReversalReasonCode {
  id          String @id @default(cuid())
  tenantId    String
  code        String  // ERR | ADJ | DUP | CXL | ACR
  description String
  arDescription String
  active      Boolean
}
```

#### البرومنت

```
/erp-build-feature reversal-engine

1. أضف ReversalReasonCode + extend JournalEntry بـ reversalReasonCode + reversedById.

2. ابن src/lib/reversal-engine.ts:
   reverseEntry(entryId, reasonCode, reversalDate?, userId)
     - validate entry.status === 'posted'
     - validate fiscal period for reversalDate is open
     - inside transaction:
       create new JE entryDate=reversalDate description="Reversal of " + original.entryNumber
       isReversal=true reversedById=null reversalReasonCode=reasonCode
       lines: SWAP debit↔credit (DR becomes CR and vice versa)
       update original: reversedById=newEntry.id, reversedAt=now()
       update Account.balance accordingly

3. autoReverseAccruals cron:
   src/app/api/cron/auto-reverse-accruals/route.ts
   daily 00:30:
     SELECT JE WHERE autoReverseDate <= today AND reversedById IS NULL AND status='posted'
     for each → reverseEntry(je.id, 'ACR', autoReverseDate)

4. UI:
   - في صفحة JE detail: button "Reverse Entry" (مع dropdown reason)
   - في accounting/journal page: filter "Show reversed only"

5. APIs:
   - POST /api/accounting/journal/:id/reverse
   - POST /api/accounting/reversal-reasons (CRUD)

6. integrate with state-machine: لا يمكن reverse قيد سبق reversed.

7. tests:
   - reverse posted JE → arrange new JE balanced + original linked
   - reverse في فترة مقفلة → fail
   - autoReverseDate cron → ينفذ يومياً
```

#### سيناريو
**نهاية مارس:** المحاسب يسجل accrual للكهرباء 5,000 ر.س. (لم تصل الفاتورة) → JE مع `autoReverseDate = 2026-04-01`.
**1 أبريل 00:30:** Cron يجد القيد → ينشئ reversal → الـ accrual يُعكس قبل وصول الفاتورة الفعلية.
**5 أبريل:** الفاتورة تصل بـ 4,800 ر.س. → تُسجَّل عادي → النتيجة الصافية = 4,800 (دقيق).

#### فلو

```
JE-100 (March 31):
  DR Utility Expense  5000
  CR Accrued Liability 5000
  autoReverseDate = April 1
  ↓
April 1 cron 00:30:
  finds JE-100
  ↓
reverseEntry(100, 'ACR', '2026-04-01'):
  prisma.transaction:
    create JE-101:
      DR Accrued Liability 5000
      CR Utility Expense   5000
      isReversal=true reversedById=null
    update JE-100: reversedById=101, reversedAt=now
    update balances accordingly
  ↓
April 5 actual invoice:
  JE-105: DR Utility Expense 4800 / CR AP 4800
  ↓
Net P&L impact for utility = +5000 (Mar) -5000 (Apr) +4800 (Apr) = 4800 ✓
```

---

### EG-06 · No Document Splitting / Per-Dimension Balancing (P1)

**الشدة:** 🟠 يكسر تقارير الشرائح
**المرجع:** `createJournalEntry` يفحص توازن global فقط

#### المطلوب
- Validation: لكل dimension flagged كـ "balancing" → DR = CR.
- Auto-split lines (intercompany / clearing entries) لتحقيق التوازن.

#### Schema

```prisma
model BalancingDimension {
  id        String @id @default(cuid())
  tenantId  String
  dimensionType String  // PROFIT_CENTER | SEGMENT | PROJECT | BOOK
  required  Boolean
  clearingAccountCode String?  // for auto-balancing
}
```

#### البرومنت

```
/erp-build-feature document-splitting

1. أضف BalancingDimension model + seed (PROFIT_CENTER required).

2. عدّل createJournalEntry:
   بعد global balance check → فحص per balancing dimension:
   for each balancing dim:
     groupBy line.{dim} → check Σdebit = Σcredit per group
   if not balanced AND clearingAccount configured:
     auto-add lines to balance via clearing account
   if not configured:
     throw "Document not balanced per {dim}"

3. UI:
   Settings → Accounting → Balancing Dimensions:
   - tick which dims must balance
   - assign clearing account per dim

4. اكتب tests:
   - DR PC1 100 / CR PC2 100 + balancing on PC → fail OR auto-split
   - DR PC1 100 + Clearing 100 / CR PC2 100 + Clearing 100 (auto-split version)

5. تقارير: P&L by Profit Center تصبح 100% accurate.
```

#### سيناريو
شركة بـ 3 profit centers (Riyadh, Jeddah, Dammam). فاتورة بيع تخص Riyadh لكن المحصِّل من Jeddah (بنك Jeddah). بدون splitting: AR في Riyadh، Cash في Jeddah → كل PC غير متوازن. بعد splitting: النظام يضيف auto:
- DR Cash (Jeddah) / CR Inter-PC Clearing (Jeddah)
- DR Inter-PC Clearing (Riyadh) / CR Cash (Riyadh)
- DR Cash (Riyadh) / CR AR (Riyadh)
كل PC الآن متوازن، تقرير P&L by PC صحيح.

#### فلو

```
Original entry:
  DR Cash @PC=Jeddah 1000
  CR AR   @PC=Riyadh 1000

Validation: PC=Jeddah net = +1000 (DR), PC=Riyadh net = -1000 (CR) → NOT balanced

Auto-split (with clearing account 1999 Inter-PC):
  DR Cash    @PC=Jeddah 1000
  CR Inter-PC@PC=Jeddah 1000   ← added
  DR Inter-PC@PC=Riyadh 1000   ← added
  CR AR      @PC=Riyadh 1000
  ↓
Each PC: DR=CR ✓
Inter-PC clearing accounts net to zero (consolidate).
```

---

### EG-07 · No Multi-Book Replication Runtime (P1)

**الشدة:** 🟠 schema غني بدون engine
**المرجع:** `AccountingBook` + `AccountMapping` schemas exist، `auto-journal` لا يُنفّذ replication

#### المطلوب
عند post في PRIMARY book → النظام يستدعي AccountMapping للـ books الأخرى (TAX, MGMT, GROUP, STATUTORY) → ينشئ replicated entries مع `replicatedFromId` set.

#### البرومنت

```
/erp-build-feature multi-book-replication

1. ابن src/lib/multi-book-engine.ts:
   replicateToAllBooks(primaryEntryId)
     - SELECT all AccountingBook WHERE replicateOnPost=true AND sourceBookId=primary
     - for each derived book:
       for each line in primary entry:
         resolve via AccountMapping (rules: PASS, EXCLUDE, AMOUNT_PCT, SPLIT, CURRENCY_TRANSLATE, CUSTOM_FORMULA)
       if currency != book.baseCurrency: translate using book.exchangeRateMethod
       create JE with bookId=derivedBook.id, replicatedFromId=primary.id, bookOnly=false

2. عدّل createJournalEntry:
   بعد insert JE primary:
   if entry.bookId is primary AND any book.replicateOnPost:
     await replicateToAllBooks(entry.id)

3. UI:
   - settings/accounting/books page (CRUD)
   - settings/accounting/account-mappings page (mapping rules)
   - reports/book-comparison page (delta between two books)

4. tests:
   - SOCPA primary + IFRS secondary → posting → ينعكس في الاثنين
   - مع mapping CURRENCY_TRANSLATE → IFRS بـ USD، SOCPA بـ SAR
   - mapping SPLIT (50/50) → line تُقسم على حسابيْن في الـ secondary
```

#### سيناريو
شركة سعودية لها:
- **PRIMARY:** SOCPA SAR (للزكاة وZATCA)
- **SECONDARY:** IFRS USD (للمستثمرين الأجانب)

فاتورة بيع 10,000 ر.س. → النظام يُسجّل في SOCPA → فوراً يـ replicate إلى IFRS بـ USD (sevr SAMA daily rate). مع mapping config:
- حساب 4100 SALES في SOCPA → 4000 REVENUE في IFRS
- 2300 VAT → 2210 SALES_TAX_PAYABLE في IFRS

#### فلو

```
User posts SO Invoice → postSalesInvoice (SOCPA, SAR)
  ↓
JE-1000 (bookId=SOCPA, currency=SAR):
  DR Cash 11500 / CR Sales 10000 / CR VAT 1500
  ↓
auto-trigger: replicateToAllBooks(JE-1000)
  ↓
For book IFRS:
  for each line:
    resolve mapping: 1110 → 1110 (PASS), 4100 → 4000 (PASS), 2300 → 2210 (PASS)
  translate SAR → USD @ 0.2667 today's rate
  ↓
JE-1001 (bookId=IFRS, currency=USD, replicatedFromId=JE-1000):
  DR Cash 3066.67 USD / CR Revenue 2666.67 USD / CR Sales Tax 400.00 USD
  ↓
Both books reconciled
```

---

### EG-08 · No FX Revaluation Engine (P1)

**الشدة:** 🟠 IFRS 21 violation محتمل
**المرجع:** `FxRevaluationRun` schema بدون code

#### البرومنت

```
/erp-build-feature fx-revaluation-engine

1. ابن src/lib/fx-reval-engine.ts:
   runRevaluation(periodId, exchangeRateDate, userId)
     - SELECT all FX-denominated accounts (Account.currencyId != base)
       OR any line with foreign amounts on monetary accounts
     - for each:
       currentBookValue (in base) = Account.balance
       foreignBalance = SUM(JL.foreignDebit - foreignCredit)
       targetRate = ExchangeRate(currency, base, exchangeRateDate)
       newBookValue = foreignBalance × targetRate
       diff = newBookValue - currentBookValue
       if diff > 0: gain (CR 4900 FX_GAIN)
       if diff < 0: loss (DR 5900 FX_LOSS)
       offsetting line to the FX account itself
     - create JE in batch
     - mark FxRevaluationRun status=POSTED
     - if YE: gains/losses → P&L
     - if monthly: gains/losses → OCI (unrealized)

2. UI:
   src/app/(dashboard)/finance/fx-revaluation/page.tsx (already STUB):
     - select period + rate date + run button
     - preview → list of accounts with diff
     - post button

3. cron monthly: trigger reval at period close
```

#### سيناريو
شركة لديها وديعة USD 100,000 (= SAR 375,000 عند الإيداع بسعر 3.75). نهاية أبريل، السعر صار 3.78 → الوديعة تساوي 378,000 → unrealized gain 3,000. النظام يُنشئ:
- DR USD Bank Account 3,000 / CR Unrealized FX Gain (OCI) 3,000

#### فلو

```
Monthly cron 28th:
  ↓
For each FX account (currency != base):
  cached SAR balance = Account.balance
  foreign balance = SUM(foreignDebit - foreignCredit)
  current rate = ExchangeRate(USD→SAR, today)
  new SAR value = foreign × current rate
  diff = new - cached
  ↓
Aggregate all diffs into single JE:
  for each account with diff > 0: DR Account / CR FX Gain (4900)
  for each account with diff < 0: DR FX Loss (5900) / CR Account
  ↓
INSERT FxRevaluationRun(status=POSTED, totalGain, totalLoss, journalEntryId)
```

---

### EG-09 · No Tax Code Abstraction (P1)

**الشدة:** 🟠 لا يمكن دعم zero-rated/exempt/RCM
**المرجع:** `auto-journal` يأخذ `taxValue: number` خام

#### المطلوب
استبدال `taxValue` بـ `lines: [{taxCodeId, taxableAmount, taxAmount}]` تسمح بـ multi-tax + zero-rate + exempt.

#### Schema

```prisma
model TaxCode {
  id            String @id @default(cuid())
  tenantId      String
  code          String  // VAT15, VAT0, EXEMPT, OOS, RCM15, EXCISE100, EXCISE50
  name          String
  arName        String
  rate          Decimal @db.Decimal(7,4)  // 0.15
  type          String  // STANDARD | ZERO | EXEMPT | OOS | REVERSE_CHARGE | EXCISE
  vatBoxNumber  String?  // box on VAT return
  outputAccountCode String?  // 2300
  inputAccountCode  String?  // 1400
  active        Boolean
}

model JournalLineTax {
  id          String @id @default(cuid())
  journalLineId String
  taxCodeId   String
  taxableAmount Decimal @db.Decimal(18,4)
  taxAmount   Decimal @db.Decimal(18,4)
}
```

#### البرومنت

```
/erp-build-feature tax-code-engine

1. Schema: TaxCode + JournalLineTax (above)
2. Seed standard codes:
   - VAT15 (15% standard)
   - VAT0 (0% zero-rated)
   - EXEMPT (exempt)
   - OOS (out of scope)
   - RCM15 (reverse charge 15%)
   - EXCISE100/50 (excise tax)

3. عدّل postSalesInvoice + postPurchaseInvoice:
   instead of taxValue: number
   accept lines: [{accountCode, amount, taxCodeId?, taxableAmount?}]
   for each line with taxCodeId:
     resolve TaxCode → output/inputAccount
     create main line + tax line + JournalLineTax record

4. RCM logic for imported services:
   when supplier.isForeign AND service tax = RCM15:
     DR Service Expense 100, DR Input VAT 15, CR AP 100, CR Output VAT 15

5. UI:
   - settings/tax-codes page
   - in invoice form: dropdown tax code per line

6. Reports:
   reports/zatca-vat page → groupBy taxCode.vatBoxNumber → VAT Return form

7. tests:
   - sale with RCM → both DR Input + CR Output VAT
   - exempt sale → no VAT lines
   - zero-rated → 0 VAT amount but reported in box
```

#### سيناريو
شركة استشارية تستلم خدمة من مورد أجنبي (Adobe Cloud) بـ 1,000 ر.س. → النظام يطبق RCM:
- DR Subscription Expense 1,000 / CR AP 1,000
- DR Input VAT 150 / CR Output VAT 150 (تقاص في VAT Return)

#### فلو

```
postPurchaseInvoice with line {amount: 1000, taxCodeId: RCM15}:
  ↓
resolve TaxCode → type=REVERSE_CHARGE, rate=0.15
  ↓
Generate lines:
  DR Subscription Expense  1000
  CR AP                    1000
  DR Input VAT (1400)       150  (RCM input)
  CR Output VAT (2300)      150  (RCM output)
  ↓
INSERT JournalLineTax for each tax line for VAT return reporting
  ↓
At month end VAT Return:
  Box "RCM Inputs" = SUM(taxAmount where taxCode=RCM15 input)
  Box "RCM Outputs" = SUM(taxAmount where taxCode=RCM15 output)
  Net VAT = Output - Input + RCM net (zero in this case)
```

---

### EG-10 · No Source Document Linkage on JE (P1)

**الشدة:** 🟠 يمنع drill-down الكامل
**المرجع:** `JournalEntry` لا يحوي `sourceDocumentType` + `sourceDocumentId`

#### Schema

```prisma
model JournalEntry {
  // add
  sourceDocumentType String?  // SALES_INVOICE | PURCHASE_INVOICE | GRN | PAYMENT_RUN | PAYROLL | etc.
  sourceDocumentId   String?
  @@index([sourceDocumentType, sourceDocumentId])
}
```

#### البرومنت

```
/erp-build-feature je-source-link

1. Migration: add sourceDocumentType + sourceDocumentId to JournalEntry.
2. عدّل كل دالة post* في auto-journal.ts لتمرر:
   sourceDocumentType: 'SALES_INVOICE', sourceDocumentId: invoice.id
3. UI:
   - في JE detail page: button "View Source Document" → ينقل لصفحة الفاتورة/الـ GRN/...
   - في صفحة الفاتورة: تبويب "Journal Entries" يعرض كل JEs المرتبطة
4. drill-down:
   reports/trial-balance → اضغط على account → list JEs → اضغط JE → source doc
```

#### سيناريو
Auditor يفتح TB → يرى Sales 1,000,000 → يضغط → list JEs → يضغط JE معين → ينتقل مباشرة لصفحة الفاتورة الأصلية مع QR ZATCA + customer + lines. تتبع كامل.

#### فلو

```
User clicks Account in TB:
  ↓
GET /api/accounting/account/:id/journal-lines?period
  ↓
Returns lines + JE info
  ↓
User clicks JE row:
  ↓
JE detail page renders + button "View Source"
  ↓
User clicks View Source:
  switch (sourceDocumentType):
    case 'SALES_INVOICE': router.push(/sales/invoices/${sourceDocumentId})
    case 'PURCHASE_INVOICE': router.push(/purchases/${sourceDocumentId})
    case 'PAYROLL': router.push(/hr/payroll-process/${sourceDocumentId})
    ...
```

---

### EG-11 · Recurring Journal Auto-Posting (P1)

**الشدة:** 🟠 templates exist، runner منفصل غير موثوق
**المرجع:** `JournalTemplate` schema + frequency

#### البرومنت

```
/erp-build-feature recurring-journal-runner

1. تأكد من schema JournalTemplate + JournalTemplateLine:
   frequency (DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY)
   nextRunDate, endDate, autoReverse, autoReverseDays

2. cron daily 00:15:
   src/app/api/cron/recurring-journals/route.ts
   SELECT JournalTemplate WHERE active AND nextRunDate <= today
   for each:
     create JournalEntry from template lines (substitute {{period}}, {{date}} placeholders)
     status = template.autoPost ? 'posted' : 'draft'
     if autoReverse: set autoReverseDate = entryDate + autoReverseDays
     update template.nextRunDate = nextOccurrence(frequency)
     log to RecurringJournalLog

3. UI:
   - settings/recurring-journals page (CRUD)
   - dashboard widget "Recurring Journals due this week"
   - approval flow if autoPost=false (uses approval engine)

4. tests:
   - monthly rent template → 12 entries في السنة
   - autoReverse + autoReverseDays=30 → reverse بعد 30 يوم
```

#### سيناريو
المحاسب ينشئ template "Monthly Rent" يعمل أول كل شهر:
- DR Rent Expense (5300) 12,000
- CR Rent Payable (2300) 12,000
- frequency=MONTHLY, nextRunDate=2026-06-01

كل شهر تلقائياً → الإيجار يُسجَّل بدون تدخل.

#### فلو

```
cron 00:15 daily:
  SELECT templates WHERE active AND nextRunDate <= today
  ↓
For each template:
  build JE from lines (substitute placeholders with current date)
  create entry status='posted' (if autoPost)
  if template.autoReverse:
    JE.autoReverseDate = entryDate + autoReverseDays
  update template.nextRunDate = nextOccurrence based on frequency
  log
  ↓
Day 1 every month: rent JE auto-created
```

---

### EG-12 · No Allocation Engine (Step-Down/Reciprocal) (P1)

**الشدة:** 🟠 cost accounting basic
**المرجع:** `CopaAllocationRule` schema بدون runtime

#### البرومنت

```
/erp-build-feature allocation-engine

1. schema موجود (CopaAllocationRule). أضف:
   AllocationRun (id, ruleId, periodId, status, totalAllocated, journalEntryId, runBy, runAt)

2. ابن src/lib/allocation-engine.ts:
   runAllocation(ruleId, periodId, simulate=false):
     load rule (basis=REVENUE/HEADCOUNT/EQUAL/CUSTOM_FORMULA)
     load source pool (cost center IT = 100,000)
     load drivers per target (revenue per CC, headcount per CC, ...)
     compute allocation per target
     if simulate: return preview
     else: create JE with auto-balance

3. step-down:
   sequence rules → run في الترتيب → output rule N = input لـ rule N+1

4. reciprocal (iterative):
   matrix solver until convergence (Excel Solver style)

5. UI:
   - finance/allocation page (already STUB):
     - rule designer (source pool + drivers + targets)
     - simulate button → preview
     - run button → post JE
   - run history + drill-down

6. tests:
   - simple allocation by revenue → IT cost موزع على PCs
   - step-down cycle of 3 rules → الناتج صحيح
   - reciprocal 2 service depts → convergence achieved
```

#### سيناريو
IT department تكاليفها 100,000 ر.س. شهرياً. تريد توزيعها على Sales/Marketing/Operations حسب headcount (Sales=20, Mkt=10, Ops=70) → توزيع 20K/10K/70K. بعد simulate وتأكيد → JE يُنشأ:
- DR Sales OH 20K, DR Mkt OH 10K, DR Ops OH 70K / CR IT Cost Pool 100K

#### فلو

```
runAllocation(rule_IT, May 2026):
  ↓
sourcePool = SUM(JE) WHERE costCenter=IT, period=May 2026 = 100,000
  ↓
loadDrivers (HEADCOUNT):
  Sales: 20, Mkt: 10, Ops: 70 → total 100
  ↓
allocations:
  Sales = 100,000 × 20/100 = 20,000
  Mkt   = 100,000 × 10/100 = 10,000
  Ops   = 100,000 × 70/100 = 70,000
  ↓
create JE:
  DR Sales OH 20K (CC=Sales)
  DR Mkt OH   10K (CC=Mkt)
  DR Ops OH   70K (CC=Ops)
  CR IT Cost Pool 100K (CC=IT)
```

---

### EG-13 · IFRS 15 Revenue Recognition Engine (P1)

**الشدة:** 🟠 IFRS 15 mandatory في KSA
**المرجع:** `RevenueRecognitionLine` schema، لا engine

#### البرومنت

```
/erp-build-feature ifrs15-revenue-recognition

1. تأكد schemas: PerformanceObligation, RevenueRecognitionLine, VariableConsiderationUpdate

2. ابن src/lib/revenue-recognition-engine.ts:
   على إنشاء contract/SO:
     identify performance obligations (POBs)
     allocate transaction price to POBs by SSP (standalone selling price)
     determine timing (over time / point in time)
     create RevenueRecognitionLine per POB per period

   monthly cron:
     for each line where recognitionDate <= month:
       JE: DR Deferred Revenue / CR Revenue (POB.amount)

3. variable consideration:
   - cumulative catch-up adjustment when estimate changes

4. contract modifications:
   - prospective vs reallocate based on rules

5. UI:
   - accounting/revenue-recognition page (STUB → fill):
     - POB tracker
     - schedule view
     - manual override + audit trail

6. tests:
   - SaaS subscription 12 months → revenue recognized monthly
   - bundled hardware + service → SSP allocation + recognition split
```

---

### EG-14 · IFRS 16 Lease Engine Integration (P1)

**الشدة:** 🟠 lease engine منفصل غير مُدمج بـ auto-journal
**المرجع:** `LeaseContract` schema + `lease-accounting-engine.ts`

#### البرومنت

```
/erp-build-feature ifrs16-lease-integration

1. تأكد lease-accounting-engine.ts يتكامل مع auto-journal:
   on lease contract activation:
     create JE: DR ROU Asset (1700) / CR Lease Liability (2700)
   monthly:
     amortization: DR Depreciation Expense / CR Accumulated Depreciation
     interest: DR Interest Expense / CR Lease Liability
     payment: DR Lease Liability / CR Cash

2. modifications/remeasurements:
   on rent index change → recalc liability + adjust ROU

3. practical expedients toggle:
   short-term (< 12 months) + low-value (< 5K) → expense directly

4. UI:
   - accounting/leases page (STUB → activate):
     - contract list + abstraction form
     - schedule view (year × payment / interest / principal / balance)
     - modification button

5. tests:
   - 5-year lease, 3% rate → liability schedule صحيح بـ effective interest
   - mid-lease modification → remeasurement
```

---

### EG-15 · IFRS 9 ECL Engine (P1)

**الشدة:** 🟠 ECL mandatory في IFRS 9
**المرجع:** `ECLModel` schema، لا engine

#### البرومنت

```
/erp-build-feature ifrs9-ecl-engine

1. schemas exist: ECLModel, ECLAssessment, ECLStage

2. ابن src/lib/ecl-engine.ts:
   monthly run:
     for each AR open invoice:
       compute days past due
       assign Stage (1: 0-30, 2: 31-90, 3: 90+)
       compute PD (probability of default) per stage
       compute LGD, EAD
       ECL = PD × LGD × EAD
       create JE: DR ECL Expense / CR ECL Provision

3. macro overlays:
   adjust PD by oil price, GDP, CPI scenarios

4. UI:
   - finance/ecl page (STUB → activate)
   - per-customer ECL drill-down
   - scenario comparison

5. tests:
   - aged AR → correct stages
   - 90+ days → Stage 3 → lifetime ECL
   - macro adjustment → PD changes
```

---

### EG-16 · Zakat Calculation Engine (P1)

**الشدة:** 🟠 Saudi mandatory
**المرجع:** `Account.zakatCategory` taxonomy، لا engine

#### البرومنت

```
/erp-build-feature zakat-calculation-engine

1. تأكد Account.zakatCategory: NONE | EQUITY | LT_LIAB | LT_INV | FIXED_ASSET | NET_PROFIT | ADJ_ADD | ADJ_DEDUCT

2. ابن src/lib/zakat-engine.ts:
   computeZakatBase(fiscalYearId):
     sources = SUM(account.balance) WHERE zakatCategory IN (EQUITY, LT_LIAB, NET_PROFIT)
     deductions = SUM(account.balance) WHERE zakatCategory IN (LT_INV, FIXED_ASSET)
     adjustments = ADJ_ADD - ADJ_DEDUCT
     zakatBase = sources - deductions + adjustments
     zakatDue = zakatBase × 0.025

3. supports Hijri vs Gregorian fiscal year option (per P0-16 in 02_GLOBAL_GAPS_P0_P1.md)

4. ZakatAssessment posting:
   DR Zakat Expense / CR Zakat Payable

5. UI:
   - tax/zakat page (STUB → activate)
   - assessment workflow + ZATCA filing button

6. tests:
   - sample data → matches manual calculation
   - Hijri year option → adjustment for 354 vs 365 days
```

---

### EG-17 · Field-Level Audit Trail on JE (P1)

**الشدة:** 🟠 SOCPA/ZATCA audit requirement
**المرجع:** `field-audit.ts` exists، لا hookup مع JE

#### البرومنت

```
/erp-build-feature je-field-audit

1. middleware: src/lib/audit-trail.ts (per P0-07 in 02_GLOBAL_GAPS_P0_P1.md)

2. apply to JournalEntry + JournalLine:
   any update → log old/new value to FieldAuditTrail
   any delete attempt on posted → block (immutability)

3. UI:
   - JE detail page → tab "Change History"
   - entity-level: customer/vendor/account audit trail

4. retention 7 years for ZATCA/SOCPA
```

---

### EG-18 · Posted JE Immutability Lock (P1)

**الشدة:** 🟠 يمكن تعديل JE بعد post
**المرجع:** `JournalEntry.status` flag، لا حماية في schema/code

#### البرومنت

```
/erp-build-feature posted-je-immutability

1. عدّل كل update/delete API على JournalEntry/JournalLine:
   if existing.status === 'posted': throw "Cannot modify posted entry. Use reverse."
   only allow: void in same period (with permission), reverse in any period.

2. عدّل auto-journal.ts createJournalEntry:
   if status='posted' is passed → set postedAt + postedBy + lock

3. UI:
   - posted JE: edit/delete buttons hidden
   - reverse button replaces them

4. database trigger (optional, defense in depth):
   PREVENT DELETE OR UPDATE on JournalEntry/JournalLine WHERE status='posted'
```

---

## الجزء الرابع — خارطة طريق إصلاح المحرك (3 أشهر)

### الشهر 1 — إصلاح الأخطاء الحرجة

| الأسبوع | الفجوة | المرجع |
|---|---|---|
| 1 | EG-01: WHT AccountId Bug | `/erp-build-feature wht-engine-fix-accountid` |
| 1 | EG-02: GR/IR Double-Posting | `/erp-build-feature grn-ir-clearance-fix` |
| 2 | EG-03: Float→Decimal + Atomic Updates | `/erp-build-feature account-balance-decimal-atomic` |
| 2 | EG-05: Reversal API | `/erp-build-feature reversal-engine` |
| 3 | EG-04: Year-End Engine Real | `/erp-build-feature year-end-engine-real` (الجزء الأول: closing JE + rollover) |
| 4 | EG-04: completion (DEP/FX/ECL/EOS sub-engines) | يكمل |

### الشهر 2 — البنية المتقدمة

| الأسبوع | الفجوة |
|---|---|
| 1 | EG-09: Tax Code Engine |
| 1 | EG-10: Source Document Linkage |
| 2 | EG-08: FX Revaluation Engine |
| 2 | EG-11: Recurring Journal Runner |
| 3 | EG-06: Document Splitting |
| 4 | EG-17: Field-Level Audit on JE |
| 4 | EG-18: Posted JE Immutability |

### الشهر 3 — IFRS + Saudi

| الأسبوع | الفجوة |
|---|---|
| 1 | EG-07: Multi-Book Replication |
| 2 | EG-13: IFRS 15 Revenue Recognition |
| 3 | EG-14: IFRS 16 Lease Integration |
| 3 | EG-15: IFRS 9 ECL |
| 4 | EG-12: Allocation Engine |
| 4 | EG-16: Zakat Calculation |

---

## الخلاصة

### بعد 3 أشهر التنفيذ المتوقع

| الجانب | اليوم | بعد 3 شهور |
|---|---|---|
| Schema | 8/10 | 9/10 |
| Engine | 3/10 | **8/10** |
| Saudi compliance | 6/10 | 8/10 |
| Performance | غير مُختبر | Decimal atomic + reconcile cron |
| **التقييم العام** | **5/10** | **8.5/10** |

### القدرة التنافسية بعد التنفيذ

- يتفوق على **Odoo 18** في: multi-book، document splitting، allocation engine، Zakat، WHT.
- يتساوى مع **NetSuite** في: revenue recognition، lease accounting، ECL، tax codes.
- يقترب من **Dynamics F&O** في: posting layers، dimensional reporting.
- يبقى دون **SAP S/4HANA** في: HANA-grade performance، Universal Journal columnar analytics.

### القاعدة الذهبية

> **لا تبدأ ميزة جديدة قبل إنهاء EG-01 و EG-02 و EG-03.**
> الـ WHT يضع قيود في حسابات خاطئة، الـ GR/IR يخصم Inventory مرتين، الـ Float يفقد الدقة. هذه ثلاثية كافية لإفساد المراجعة الخارجية.

---

**كيف تستخدم هذا الملف:**

```
1. اقرأ القسم الأول (البصمة الحالية) — 5 دقائق
2. اقرأ الجزء الثاني (الجداول المقارنة) — 10 دقائق
3. اختر EG-XX من الجزء الثالث
4. انسخ البرومنت الجاهز
5. ابدأ chat جديد:
   "اقرأ d:/namasoft9-3-main/AUDIT_2026_05_07/06_ACCOUNTING_ENGINE_COMPARISON.md
    ونفّذ EG-01 (WHT AccountId Fix) كاملاً"

ملاحظة: البرومنتس مكتوبة كأمر مباشر — Schema migrations + tests + UI.
```

---

**نهاية مقارنة محرك المحاسبة — 2026-05-07**
