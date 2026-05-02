# تحليل الفجوات الجديد — Namasoft ERP
**تاريخ:** 2026-05-02
**النطاق:** مسح حديث كامل، يتجاوز التقرير القديم في GLOBAL_ERP_GAP_ANALYSIS.md
**المرجعيات:** SAP S/4HANA, Oracle Fusion, NetSuite, Dynamics 365 F&O, Odoo 17, Sage Intacct + IFRS 15/16/9 + ZATCA Phase 2 + SOCPA + نظام العمل السعودي

---

## 1. الوضع الحالي (Snapshot)

| البند | العدد | ملاحظة |
|-------|-------|--------|
| Prisma models | **220** | زيادة ملحوظة عن التقرير السابق (157) |
| API route.ts | **317** ملف | 107 موديول رئيسي |
| محركات في `src/lib/` | **71+** ملف | معظمها production-ready |
| Dashboard pages | **110+** | 50+ موديول مغطى |
| Test files | **10** فقط | تغطية ضعيفة |
| Auto-journal scenarios | **13** سيناريو | شامل لـ AR/AP/INV/MFG |

---

## 2. ما تم إنجازه فعلياً (مكتمل أو شبه مكتمل)

### 2.1 المحاسبة الأساسية (≈ 85%)
- ✅ شجرة حسابات + قيود يدوية وآلية
- ✅ `auto-journal.ts` يغطي 13 سيناريو (Sales/Purchase + VAT + Landed Cost + PPV + Returns + Transfer/Transit + Stocktake + GRN/IR + WIP + MO Close + Material Issue)
- ✅ Document State Machine (`document-state-machine.ts` ~300 سطر) موصول
- ✅ Field-Level Audit (`field-audit.ts` ~170 سطر) فعّال على الجداول الحساسة
- ✅ Numbering Sequences Engine (`numbering.ts`) مع SERIALIZABLE
- ✅ Period Close Engine (Soft + Hard close + Checklist)
- ✅ Approval Engine (Multi-level + delegation) موصول

### 2.2 معايير IFRS المتقدمة (≈ 70%)
- ✅ **IFRS 16 Leases** كامل: ROU Asset + Lease Liability + Amortization Schedule + monthly posting (`lease-accounting-engine.ts`)
- ✅ **IFRS 15 Revenue** كامل: Performance Obligations + Recognition Schedule + Deferred Revenue (`revenue-recognition.ts`)
- ✅ **IAS 16 Asset Revaluation + IAS 36 Impairment** عبر `ifrs-engines.ts`
- ⚠ IFRS 9 Expected Credit Loss — لم يُبنَ بعد
- ⚠ IAS 21 Multi-currency translation للقوائم المالية — ناقص

### 2.3 الأصول الثابتة (≈ 75%) — قفزة كبيرة
- ✅ 3 طرق إهلاك: SL, Declining, Double Declining
- ✅ AssetCategory + AssetTransaction + AssetImpairment + AssetRevaluation
- ✅ CWIP → Capitalization
- ✅ Disposal logic
- ⚠ ناقص: Multi-Book (Tax/Book/IFRS منفصلة)، Component Accounting، MACRS، Units of Production

### 2.4 الخزينة والبنوك (≈ 65%) — قفزة كبيرة
- ✅ MT940 + CSV import (`bank-statement-importer.ts` + `bank-parsers/mt940.ts`)
- ✅ 3-stage matching: Exact → Rule → Fuzzy (`bank-recon-engine.ts`)
- ✅ BankReconRule للمطابقة التلقائية
- ⚠ ناقص: CAMT.053, OFX, SWIFT, Cash Pooling, In-house Bank, FX Hedging

### 2.5 AR/AP المتقدم (≈ 60%) — قفزة كبيرة
- ✅ **Cash Application** بـ 4 استراتيجيات (FIFO/LIFO/Largest/By-Reference)
- ✅ **Open Items model** موصول (`open-items.ts`)
- ✅ **Three-Way Match** كامل (`three-way-match.ts` ~150 سطر) مع Tolerance Policies
- ✅ **Dunning Engine** متعدد المستويات
- ✅ Payment Terms Engine
- ⚠ ناقص: Customer Statements PDF، Bad Debt Provision (% aging)، Disputes/Deductions، Factoring، Payment Runs (F110-style)، WHT

### 2.6 الموارد البشرية والامتثال السعودي (≈ 80%) — قفزة كبيرة
- ✅ **GOSI 2024**: حسابات سعودي/غير سعودي + SANED + Risk
- ✅ **WPS SIF** متوافق SAMA + IBAN validation
- ✅ **EOS** وفق المواد 84/85/87 من نظام العمل (إنهاء/استقالة/فصل)
- ⚠ ناقص: Mudad/Qiwa/Absher API integration، Leave accrual engine، OKRs، LMS، T&E (Concur-style)

### 2.7 المخزون والتصنيع (≈ 65%)
- ✅ FIFO/LIFO/Avg + Lot/Batch + Serial
- ✅ Landed Cost distribution
- ✅ Drop-shipping workflow (نموذج جديد)
- ✅ MRP basic + BOM multi-level explosion + Where-Used
- ✅ Material Issuance + WIP + Manufacturing variances
- ⚠ ناقص: Standard Cost + variance posting، Material Ledger، Product Variants، Subcontracting، MPS, S&OP, APS، DDMRP، QM (CAPA/NCR)، WMS Pick/Putaway strategies

### 2.8 ZATCA & الضرائب (≈ 85%)
- ✅ Phase 1 + Phase 2 + UBL 2.1 + signing + ICV/PIH
- ✅ Statutory Reports Engine (ZATCA VAT)
- ⚠ ناقص: Reverse Charge، Excise Tax، Zakat calculation، Group VAT، WHT certificates

### 2.9 الحوكمة والـ BPM (≈ 50%)
- ✅ Governance Engine (SoD + Field-level permissions)
- ✅ BPM Engine (220 سطر) يدير APPROVAL_TASK / CONDITION / AUTO_ACTION
- ⚠ ناقص: Rule Engine متقدم، BPMN visual designer، SLA tracking، Escalation auto

---

## 3. الفجوات الحقيقية المتبقية (الأهم)

### 🔴 فجوات حادة (Critical Gaps)

| الفجوة | الحالة الفعلية | الأثر |
|--------|----------------|-------|
| **Consolidation Engine** | stub 47 سطر، لا يحسب TBs ولا eliminations فعلياً | لا يصلح لمجموعات شركات |
| **Allocation Engine** | stub 36 سطر فقط | لا يدعم cascading allocations |
| **FX Revaluation** | 73 سطر، لا يولد قيود FX gain/loss فعلية | تقارير العملات غير دقيقة |
| **Cash Flow Forecasting** | stub 44 سطر | لا توقعات حقيقية |
| **Budget vs Actual + Variance** | Budget/BudgetLine موجودان، لكن لا dashboard فعلي | لا تحكم بالميزانية |
| **IFRS 9 ECL (Expected Credit Loss)** | غير موجود | non-compliance لمعايير بنكية |
| **Customer/Vendor Statements PDF** | غير موجود | عملية شائعة جداً |
| **Payment Runs (Batch Payments)** | غير موجود | F110 SAP equivalent |
| **WHT (Withholding Tax)** | غير موجود | إجباري للموردين الأجانب |

### 🟠 فجوات متوسطة (Important Gaps)

| الفجوة | ما يلزم |
|--------|---------|
| Multi-Book / Multi-GAAP | كتاب IFRS + كتاب Zakat منفصلين على نفس القيود |
| Standard Cost + Variance Posting | للمصنّعين بنموذج Std Cost |
| Product Variants (size/color/SKU) | تجارة التجزئة والـ Marketplace |
| Subcontracting (Job Work) | TM للتصنيع المخصص |
| QM: CAPA / NCR | جودة صناعية حقيقية |
| Recurring JE auto-reversing | Period-end accruals |
| RMA / Warranty Management | خدمة العملاء |
| Sales Pipeline / Opportunities | CRM حقيقي (الموجود Lead فقط) |
| Custom Fields (User-defined) | NetSuite-style customization |
| SSO (SAML/OAuth/OIDC) + Real 2FA | Enterprise security |
| Mudad/Qiwa/Absher API | Saudi compliance حديث |
| Test Coverage | 10 ملفات فقط لـ 71 محرك (≈ 14%) |

### 🟡 فجوات منخفضة الأولوية

- Demand Forecasting (SAP IBP-style)
- DDMRP
- OEE / MTBF
- Lessor accounting (الجانب الآخر من IFRS 16)
- Sub-lease
- Cash Pooling / In-house Bank
- e-Procurement marketplace
- ATS متقدم (Greenhouse-style)

---

## 4. التقييم النهائي مقارنة بالعالمية

| الموديول | التقرير القديم | الآن (مايو 2026) | SAP/Oracle/NetSuite |
|----------|----------------|-------------------|----------------------|
| GL / JE | 65% | **85%** | 100% |
| AR / AP | 35% | **60%** | 100% |
| Treasury / Banks | 25% | **65%** | 100% |
| Fixed Assets | 18% | **75%** | 100% |
| Leases (IFRS 16) | 0% | **80%** | 100% |
| Revenue (IFRS 15) | 0% | **75%** | 100% |
| Inventory | 34% | **65%** | 100% |
| Manufacturing | 40% | **55%** | 100% |
| HR / Payroll السعودي | 45% | **80%** | 70% (وعالمية تأخذ 70 لأنها لا تغطي Mudad/WPS) |
| ZATCA / VAT | 84% | **85%** | n/a |
| Period Close / Approval / Audit | 20% | **80%** | 100% |
| Consolidation | 0% | **15%** | 100% |
| Budgeting / Forecasting | 30% | **35%** | 100% |
| **الإجمالي** | **~37%** | **~65%** | **100%** |

**الخلاصة:** قفزة من 37% إلى ≈ 65% — النظام تجاوز مرحلة "صالح للصغيرة/المتوسطة" ودخل مرحلة "صالح للمؤسسات المتوسطة الكبيرة محلياً". الوصول إلى SAP/Oracle يحتاج **مرحلتين تطوير محددتين** لا أكثر.

---

## 5. البرومنت الكامل (Master Implementation Prompt)

> **الاستخدام:** انسخ كل بلوك على حدة في جلسة AI منفصلة. كل بلوك ذاتي الكفاية ويذكر الملفات المتأثرة والـ schema.
> **التركيز:** الفجوات المتبقية فقط — لا تكرار لما تم إنجازه.

---

### 🔴 المرحلة A — إغلاق الفجوات الحادة (Critical Closure)

#### Prompt A.1 — Consolidation Engine حقيقي
```
أعد بناء src/lib/consolidation-engine.ts بدلاً من الـ stub الحالي (47 سطراً).

المتطلبات:
1. ConsolidationEngine.runConsolidation(groupId, fiscalPeriodId, userId):
   - اجمع TB لكل شركة فرعية في المجموعة
   - حوّل عملة كل فرع إلى عملة المجموعة عبر ExchangeRate (current rate للأصول/الخصوم، avg rate للإيراد/المصروف)
   - طبّق Chart-of-Accounts mapping (subsidiary account → group account)
   - اقرأ IntercompanyTransaction PENDING وولّد قيود الحذف:
     * AR/AP بين الشركات
     * Sales/COGS داخل المجموعة
     * Unrealized profit في المخزون المتبادل (eliminate gross margin)
     * Investment in subsidiary vs Equity
   - احسب Non-Controlling Interest (NCI) بنسبة الملكية
   - أنشئ ConsolidationRun + ConsolidationLine لكل قيد حذف
2. CTA (Currency Translation Adjustment) → OCI account
3. أضف API: /api/accounting/consolidation/run، /commit، /reverse
4. صفحة dashboard: شجرة الشركات + TBs قبل/بعد الحذف + قائمة الـ eliminations

Schema needed (إن لم يوجد):
- ConsolidationLine { id, runId, type (ELIMINATION|TRANSLATION|NCI), debitAccount, creditAccount, amount, sourceCompanyId, targetCompanyId, description }
- اضف ownershipPct على Company

اكتب tests: scenario لـ 3 شركات، 2 IC transactions، NCI 20%.
```

#### Prompt A.2 — FX Revaluation Engine حقيقي
```
أعد بناء src/lib/fx-revaluation.ts (الحالي 73 سطر — جزئي).

المنطق المطلوب:
1. revalueOpenItems(periodEndDate, baseCurrency):
   - لكل فاتورة AR/AP بعملة أجنبية ومفتوحة في periodEndDate:
     * احسب OldRate (rate وقت الفاتورة) و NewRate (rate في periodEndDate)
     * delta = (NewRate - OldRate) × outstanding amount
     * ولّد قيد:
       - AR foreign: Debit/Credit AR + Credit/Debit Unrealized FX Gain/Loss (P&L)
       - AP foreign: عكسي
2. revalueBankAccounts(periodEndDate): نفس المنطق على أرصدة البنوك بعملات أجنبية
3. autoReverseNextPeriod: القيود يجب أن تُعكس تلقائياً في 1st day of next period
4. اربط مع period-close.ts كخطوة #3 (بعد الإغلاق الناعم وقبل القاسي)

Settings: fxRevaluationGainAccount, fxRevaluationLossAccount في Settings model.
API: POST /api/accounting/fx-revaluation/run
Tests: 3 سيناريوهات (gain on AR، loss on AP، bank balance).
```

#### Prompt A.3 — Allocation Engine متعدد المستويات
```
أعد بناء src/lib/allocation-engine.ts (الحالي 36 سطر).

نموذج Allocation Rule:
- AllocationRule { id, name, sourceAccount, sourceCostCenter?, basis (FIXED_PCT|HEADCOUNT|REVENUE|SQFT|MACHINE_HOURS|CUSTOM), period, isActive }
- AllocationTarget { id, ruleId, targetCostCenter, targetAccount?, percentage?, customWeight? }
- AllocationRun { id, ruleId, fiscalPeriodId, status, runAt, journalEntryId? }

Engine:
1. runAllocation(ruleId, fiscalPeriodId, userId):
   - اقرأ رصيد source account/CC للفترة
   - احسب الأوزان من basis (مثلاً: عدد الموظفين لكل CC)
   - وزّع المبلغ على الأهداف بالنسب
   - ولّد قيد JE: Credit source CC، Debit each target CC
   - دعم cascading: target CC قد يكون source لقاعدة أخرى → نفّذها بترتيب الأولوية
2. simulateAllocation(): preview بدون ترحيل
3. UI: drag-drop لبناء قواعد التوزيع

API: /api/accounting/allocations/{rules,run,simulate,history}
Tests: 3 cascading levels.
```

#### Prompt A.4 — Cash Flow Forecasting حقيقي
```
أعد بناء src/lib/cash-flow-forecasting.ts (الحالي 44 سطر — stub).

CashFlowForecast model:
- ForecastPeriod { id, periodStart, periodEnd, granularity (DAILY|WEEKLY|MONTHLY) }
- ForecastLine { id, periodId, category (AR_COLLECTION|AP_PAYMENT|PAYROLL|TAX|LOAN|CAPEX|OTHER), expectedDate, amount, confidence, sourceDocId?, sourceDocType? }

Engine:
1. generateForecast(horizonDays, granularity):
   - AR: لكل فاتورة مفتوحة، expectedDate = invoiceDate + paymentTerms × historicalDelayFactor
   - AP: نفس المنطق للموردين
   - Payroll: من جدول الرواتب القادم
   - Tax: VAT due dates، Zakat، GOSI
   - Recurring: من Recurring JE templates
   - CAPEX: من PO المعتمدة لأصول ثابتة
2. Direct method cash flow report
3. Sensitivity analysis: best/expected/worst case
4. Variance tracking: actual vs forecast بعد انتهاء الفترة

Dashboard: chart line مع shaded confidence band، جدول bottom للـ assumptions.
```

#### Prompt A.5 — Budget Control + Variance + Encumbrance
```
الموجود: Budget + BudgetLine في Schema، لكن لا control فعلي.

أنشئ src/lib/budget-control.ts:
1. checkBudgetAvailability(account, costCenter, amount, fiscalPeriodId):
   - رصيد متبقي = budget - actual - encumbered - pending
   - return { allowed: boolean, available, breachPct }
2. createEncumbrance(docType, docId, account, costCenter, amount): 
   - عند اعتماد PO/PR → احجز المبلغ
3. releaseEncumbrance(docType, docId): عند GRN/Invoice → حرّر الحجز
4. budgetBreachAlert: notification إذا تجاوز 80% / 100%
5. Variance Analysis: actual vs budget شهري + تحليل favorable/unfavorable

Schema:
- Encumbrance { id, sourceDocType, sourceDocId, account, costCenter, amount, status, createdAt, releasedAt }

اربط مع: Purchase Orders, Expense Claims, Manual JE > threshold.
API: /api/budgeting/{check,encumbrances,variance-report}
Dashboard: heatmap للـ variances.
```

---

### 🟠 المرحلة B — معايير IFRS الناقصة + AR/AP

#### Prompt B.1 — IFRS 9 Expected Credit Loss
```
أنشئ src/lib/ifrs9-ecl.ts.

Schema:
- ECLModel { id, customerSegment, stage1Pct, stage2Pct, stage3Pct, lookbackMonths }
- ECLAssessment { id, customerId, fiscalPeriodId, exposure, stage (1|2|3), probabilityOfDefault, lossGivenDefault, eclAmount, runAt }

Engine:
1. assessCustomer(customerId, asOfDate):
   - DSO الحالي + days past due
   - Stage 1: < 30 DPD → 12-month ECL
   - Stage 2: 30-90 DPD → Lifetime ECL
   - Stage 3: > 90 DPD أو credit-impaired → Lifetime ECL + interest على net
2. runPortfolioECL(fiscalPeriodId): لكل عميل → احسب → سجّل
3. ولّد قيد provision:
   - Debit: Bad Debt Expense
   - Credit: Allowance for ECL (contra to AR)
4. Reversal/adjustment في الفترة التالية

Tests: customer segments × 3 stages.
Reference: IFRS 9 Section 5.5
```

#### Prompt B.2 — Customer/Vendor Statements + Payment Runs
```
1. Customer Statement Generator:
   - src/lib/customer-statement.ts
   - generateStatement(customerId, fromDate, toDate, format: 'PDF'|'EXCEL'):
     * Opening balance + كل الحركات + Closing
     * Aged breakdown (current/30/60/90/120+)
     * Filter: open items only / all items
   - API: POST /api/customers/[id]/statement
   - Email scheduler: إرسال شهري تلقائي
   - PDF template عربي/إنجليزي مع شعار الشركة

2. Payment Runs (SAP F110 equivalent):
   - PaymentRun { id, runDate, paymentMethod (CHECK|TRANSFER|WIRE), bankAccountId, status, totalAmount }
   - PaymentRunLine { id, runId, vendorId, invoiceIds[], amount, status }
   - proposePayments(runId, criteria):
     * فواتير due ≤ runDate + nextPaymentDate
     * تطبيق early payment discounts
     * تطبيق tolerance على التقريب
     * grouping per vendor + per bank
   - executePayments(runId): توليد:
     * SEPA XML / SWIFT MT103 / WPS SIF / Check files
     * قيود JE تلقائياً (Debit AP, Credit Bank)
   - UI: 3-step wizard (Propose → Review → Execute)
```

#### Prompt B.3 — Withholding Tax (WHT) Engine
```
src/lib/wht-engine.ts.

Schema:
- WHTRule { id, countryCode, serviceType, residentRate, nonResidentRate, effectiveFrom, treatyOverrides JSON }
- WHTTransaction { id, vendorId, invoiceId, baseAmount, whtRate, whtAmount, certificateNumber?, paidToZATCA? }

Engine:
1. calculateWHT(invoice):
   - من vendor: residentStatus + serviceType
   - rule lookup → rate
   - baseAmount × rate = whtAmount
2. عند الدفع للمورد: Net = invoice - WHT، WHT يذهب لحساب WHT Payable
3. WHT Certificate generation (PDF) للمورد
4. Monthly WHT return XML for ZATCA

Saudi rates:
- Royalties: 15%
- Management fees: 20%
- Technical services: 5%
- Rent: 5%
- Dividends: 5%
- Loans interest: 5%

Tests: 3 service types × resident/non-resident.
```

#### Prompt B.4 — IFRS 16 Lessor Accounting + Sub-lease
```
الـ lease engine الحالي يدعم Lessee فقط. أضف Lessor side:

Schema additions:
- LeaseContract: leaseRole (LESSEE|LESSOR_OPERATING|LESSOR_FINANCE)
- LeaseReceivable schedule
- ResidualValueGuarantee, UnguaranteedResidual

Engine extensions in lease-accounting-engine.ts:
1. Operating lease (Lessor): قيد إيراد إيجار خطي عبر مدة العقد
2. Finance lease (Lessor):
   - DR: Lease Receivable (PV of payments + unguaranteed residual)
   - CR: Asset (derecognize)
   - Recognize Selling Profit/Loss
   - Interest income على outstanding receivable
3. Sub-lease (Intermediate Lessor):
   - تقييم: هل sub-lease finance أم operating بناءً على head-lease ROU
   - معالجة منفصلة للـ head-lease (lessee) و sub-lease (lessor)
4. Variable lease payments: index/rate-based remeasurement
5. Lease modification: scope increase/decrease/term change → remeasure

Tests: operating lease + finance lease + sub-lease scenarios.
```

---

### 🟡 المرحلة C — التصنيع والمخزون المتقدم

#### Prompt C.1 — Standard Cost + Variance Posting
```
src/lib/standard-cost-engine.ts.

Schema:
- StandardCostVersion { id, productId, effectiveFrom, materialCost, laborCost, overheadCost, totalStdCost, isActive }
- VarianceCategory enum: PURCHASE_PRICE, MATERIAL_USAGE, LABOR_RATE, LABOR_EFFICIENCY, OVERHEAD_VOLUME, OVERHEAD_SPEND
- VarianceTransaction { id, type, productId, manufacturingOrderId?, amount, dr, cr, postedAt }

Engine:
1. عند GRN: PPV = (actualPrice - stdPrice) × qty → DR/CR Purchase Price Variance
2. عند Material Issue للـ MO: Material Usage Variance = (actualQty - stdQty) × stdPrice
3. عند Labor confirmation: Rate variance + Efficiency variance
4. Overhead absorption: applied vs actual → Volume + Spend variances
5. عند MO close: settle variances إلى:
   - COGS (إذا sold)
   - Inventory (إذا on hand) — pro-rated
6. Period-end: variance analysis report

Tests: 4 variance types × scenarios.
```

#### Prompt C.2 — Product Variants + Item Attributes
```
schema:
- ProductVariant { id, parentProductId, sku, attributes JSON ({size, color, ...}), barcode, price, cost, isActive }
- AttributeGroup { id, name, values JSON } e.g., {Sizes: [S,M,L,XL], Colors: [Red, Blue]}
- ProductAttributeAssignment

Logic:
1. Parent product يحدد attribute groups
2. توليد variants تلقائياً من cartesian product
3. Inventory tracked per variant
4. POS UI: اختر size→ color → variant
5. Pricing: per-variant price overrides
6. Reports: sales by variant attribute

API: /api/products/[id]/variants/{generate,list,update}
Migration: convert existing products with size/color fields → variant model.
```

#### Prompt C.3 — Subcontracting (Job Work)
```
Schema:
- SubcontractingPO { id, vendorId, productToReceive, productsToSend[], expectedDate, status }
- SubcontractMovement { id, scPoId, type (ISSUE|RETURN|RECEIVE_FINISHED), qty, postedAt }

Logic:
1. Issue raw materials to subcontractor (stock movement, خصم من المخزون لكن يظل ownership)
2. Track at subcontractor location (sub-stock area)
3. Receive finished goods → reverse materials consumption + add finished
4. Subcontractor invoice for service (post to COGS Manufacturing)
5. Material variance: if actual consumed ≠ expected per BOM

Compliance: ZATCA — هل service فاتورة منفصلة؟ نعم.
```

#### Prompt C.4 — Quality Management (CAPA / NCR)
```
src/lib/quality-management.ts.

Schema:
- QualitySpec { id, productId, parameters JSON (e.g., {moisture: {min: 2, max: 5}}) }
- QualityInspection { id, sourceDocType (GRN|MO|Random), sourceDocId, productId, inspectedQty, results JSON, status (PASS|FAIL|REWORK), inspectorId, inspectedAt }
- NonConformanceReport (NCR) { id, inspectionId, severity, description, dispositionType (USE_AS_IS|REWORK|RETURN_VENDOR|SCRAP), costImpact }
- CorrectiveAction (CAPA) { id, ncrId, rootCause, action, owner, dueDate, status, effectivenessReview }

Workflow:
1. عند GRN → trigger inspection (if QM enabled على product)
2. Inspector يدخل نتائج → auto evaluate vs spec
3. FAIL → NCR → CAPA workflow
4. Statistics: First-pass yield، defect rates، vendor scorecards

Dashboard: NCR aging, CAPA status, vendor quality trends.
```

---

### 🟡 المرحلة D — الأمان والمرونة المؤسسية

#### Prompt D.1 — Multi-Book / Multi-GAAP Accounting
```
Goal: نفس المعاملة، قيود مختلفة لكل كتاب (IFRS / Tax / Zakat / Management).

Schema:
- AccountingBook { id, code (IFRS|TAX|ZAKAT|MGMT), baseCurrency, isPrimary, fiscalYearStart }
- JournalEntry: أضف bookId
- AccountMapping { id, sourceBookId, targetBookId, sourceAccountId, targetAccountId, transformRule? }

Engine:
1. عند auto-journal: ولّد قيد لكل كتاب نشط
2. Differences:
   - Depreciation method قد يختلف (IFRS SL vs Tax MACRS)
   - Revenue recognition timing (IFRS 15 vs cash for tax)
   - Lease (IFRS 16 vs operating tax)
   - Asset capitalization threshold
3. تقارير لكل كتاب منفصلة
4. Reconciliation report: book-to-book differences

Migration: existing entries → bookId = IFRS book.
Tests: depreciation example showing 3 books.
```

#### Prompt D.2 — Real SSO + 2FA
```
1. SSO providers: Google, Microsoft, Saudi NAFATH (national ID)
   - استخدم next-auth أو Clerk's built-in providers
   - SAML 2.0 + OIDC support
2. Real 2FA:
   - TOTP (Google Authenticator/Authy) — الجداول موجودة، نفّذها
   - SMS OTP via Unifonic/Twilio
   - WebAuthn (FIDO2) للهاردوير keys
3. Session policies:
   - Force MFA لـ admin/finance roles
   - Trusted devices (30-day skip)
   - Step-up auth للعمليات الحساسة (JE > X, Vendor master change)

API: /api/auth/{mfa-setup, mfa-verify, sso-callback}
UI: profile → Security tab.
Compliance: PDPL Article 18.
```

#### Prompt D.3 — Custom Fields Engine (User-Defined)
```
Schema:
- CustomFieldDefinition { id, entityType (Customer|Product|Invoice|...), fieldName, fieldLabel, fieldType (TEXT|NUMBER|DATE|DROPDOWN|CHECKBOX|REFERENCE), validationRule JSON, isRequired, displayOrder, sectionName, isActive }
- CustomFieldValue { id, definitionId, entityId, value (stored as JSON to preserve type) }

UI:
1. Admin → Customization → اختر entity → Add Field (drag-drop builder)
2. الحقل يظهر تلقائياً في:
   - النموذج (form)
   - List view (optional column)
   - Search filters
   - Reports (selectable column)
3. Validation: required, regex, min/max, dropdown values from query

Tests: 5 field types × 3 entities.
NetSuite-style customization.
```

#### Prompt D.4 — Mudad / Qiwa / Absher API Integration
```
src/lib/saudi-gov-apis.ts.

1. Mudad: WPS submission API بدلاً من ملف يدوي
   - Endpoint: https://api.mudad.com.sa/...
   - OAuth2 flow
   - Submit batch → poll status → reconcile rejections
2. Qiwa: contract management
   - عند إنشاء عقد عمل في النظام → push to Qiwa
   - استلام updates (probation, termination notifications)
3. Absher: employee verification
   - Iqama validity check
   - Visa status query
4. ZATCA EGS: device registration للـ POS

Schema:
- GovApiCredentials { id, provider (MUDAD|QIWA|ABSHER|ZATCA), apiKey, secret, env (sandbox|prod) }
- GovApiTransaction { id, provider, endpoint, request, response, status, errorMessage, createdAt }

Compliance: encrypt credentials at rest، audit every call.
```

---

### 🟢 المرحلة E — جودة ومراقبة (Quality & Monitoring)

#### Prompt E.1 — رفع تغطية الاختبارات إلى 60%
```
Current: 10 test files for 71 engines (~14%).

أضف tests إلى:
- consolidation-engine (after rebuild)
- fx-revaluation (after rebuild)
- allocation-engine (after rebuild)
- lease-accounting-engine (lessee + lessor scenarios)
- revenue-recognition (point-in-time + over-time)
- three-way-match (within tolerance + breach)
- cash-application (4 strategies)
- gosi-engine (Saudi/non-Saudi)
- saudi-eos-engine (Article 84/85/87)
- wps-generator (SIF format validation)
- bank-recon-engine (3 match types)
- dunning-engine (multi-level escalation)
- approval-engine (multi-step + delegation)
- field-audit (sensitive entities)
- period-close (soft + hard + reopen)
- bom-engine (multi-level explosion + circular detect)
- mrp-engine (net requirements + lead time)
- standard-cost-engine (after build) — variance scenarios
- ifrs9-ecl (after build) — 3 stages
- budget-control (after build) — encumbrance lifecycle

Use vitest. Mock prisma via vi.mock.
Target: 60% line coverage.
```

#### Prompt E.2 — Observability + Performance
```
1. APM: integrate Sentry or DataDog
2. Slow query logger (Prisma middleware): log queries > 500ms
3. Audit dashboard: top 10 slowest endpoints, error rates per route
4. Health endpoints: /api/health/{db, cache, queue, gov-apis}
5. Backup automation: daily Postgres dump → S3 with 30-day retention
6. Disaster recovery runbook
7. Rate limiting: Redis-backed على /api/* (100 req/min default)
8. API key management: tenant-level keys مع scopes

Compliance: PDPL Article 7 (data security).
```

---

## 6. خارطة طريق مقترحة (3-6 شهور)

| الشهر | التركيز | الأثر المتوقع على النسبة |
|-------|---------|---------------------------|
| 1 | A.1, A.2, A.4 (Consolidation, FX, Forecasting) | 65% → 72% |
| 2 | A.3, A.5, B.2 (Allocation, Budget Control, Statements/Payments) | 72% → 78% |
| 3 | B.1, B.3, B.4 (ECL, WHT, Lessor) | 78% → 82% |
| 4 | C.1, C.4 (Std Cost, QM) | 82% → 86% |
| 5 | D.1, D.2 (Multi-Book, SSO/2FA) | 86% → 90% |
| 6 | C.2, C.3, D.3, D.4, E.* (Variants, Subcon, Custom Fields, Gov APIs, Tests) | 90% → 95% |

**الهدف النهائي:** الوصول إلى 95%+ تكافؤ مع NetSuite/Sage Intacct خلال 6 شهور.
الوصول إلى SAP S/4HANA كامل (100%) يحتاج 12-18 شهر إضافي للموديولات الصناعية الثقيلة (PLM، APS، Material Ledger، EWM).

---

**ملاحظة:** لا تكرر بناء أي محرك من المرحلة A إلا إذا تأكدت أنه stub فعلاً. راجع `wc -l src/lib/<engine>.ts` أولاً.
