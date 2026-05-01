# تقرير تحليل الفجوات الشامل ومقارنة بالأنظمة العالمية
# Global ERP Gap Analysis & Implementation Master Prompt

> **تاريخ التقرير:** 2026-05-01
> **نطاق الفحص:** d:\namasoft9-3-main (نظام Namasoft ERP - Next.js 16)
> **الأنظمة المرجعية:** SAP S/4HANA, Oracle Fusion Cloud ERP, NetSuite, Microsoft Dynamics 365 F&O, Odoo, QuickBooks Advanced, Sage Intacct, Xero
> **المعايير المرجعية:** IFRS, US GAAP, Saudi SOCPA, ZATCA Phase 2, IFRS 15/16/9, ASC 606/842

---

## الفهرس

1. [الملخص التنفيذي](#1-الملخص-التنفيذي)
2. [الملاحظة الكلية على البنية](#2-الملاحظة-الكلية-على-البنية)
3. [التقييم بحسب الموديول الرئيسي](#3-التقييم-بحسب-الموديول-الرئيسي)
4. [مقارنة جدولية شاملة بالأنظمة العالمية](#4-مقارنة-جدولية-شاملة-بالأنظمة-العالمية)
5. [البرومنت الكامل لتطوير النظام (Master Implementation Prompt)](#5-البرومنت-الكامل-لتطوير-النظام)
6. [خارطة الطريق المرتبة حسب الأولوية](#6-خارطة-الطريق-المرتبة-حسب-الأولوية)

---

## 1. الملخص التنفيذي

### الوضع الحالي
نظامك يحتوي على **157 نموذج بيانات** و**~300 API endpoint** و**~60 صفحة Dashboard**. هو نظام محترم البنية ومتقدم في:
- ZATCA Phase 1 & 2 (84% اكتمال)
- البنية التحتية متعددة المستأجرين (Multi-tenant)
- ميزات الذكاء الاصطناعي (AI CFO, AI Auditor, AI SCM)
- POS متقدم
- التصنيع الأساسي (BOM, MRP, WIP, QC)

### الفجوة الإجمالية
| المجال | النسبة الحالية | الفجوة عن العالمية |
|--------|----------------|---------------------|
| المحاسبة الأساسية (GL/JE) | 65% | 35% |
| AR/AP وإدارة الائتمان | 35% | 65% |
| الخزينة والبنوك | 25% | 75% |
| الأصول الثابتة | 18% | 82% |
| المخزون المتقدم | 34% | 66% |
| التصنيع (Industrial) | 40% | 60% |
| الموارد البشرية والرواتب | 45% | 55% |
| التقارير المالية | 50% | 50% |
| الامتثال السعودي (غير ZATCA) | 18% | 82% |
| **الإجمالي العام** | **~37%** | **~63%** |

### النتيجة
نظامك صالح لشركات صغيرة ومتوسطة، لكنه **يحتاج 4 مراحل تطوير ضخمة** ليصل لمستوى SAP/Oracle/NetSuite.

---

## 2. الملاحظة الكلية على البنية

### نقاط قوة جوهرية يجب الحفاظ عليها
1. **Schema Prisma متعدد المستأجرين** - مرن وقابل للتوسع.
2. **محرك القيود التلقائية** `src/lib/auto-journal.ts` يخدم 8 سيناريوهات.
3. **التحقق من توازن القيد** بـ tolerance 0.01.
4. **منع الكتابة على حسابات المراقبة** (Receivables, Payables, Inventory).
5. **ZATCA Phase 2** كامل (CSR, CSID, ICV, PIH, UBL 2.1, signing).
6. **AI Layer** متقدم (Gemini OCR للفواتير, AI Bank Reconciliation).

### نقاط ضعف بنيوية يجب علاجها أولاً
1. **لا يوجد Universal Journal Pattern** (موجود في SAP) — كل شيء يدخل GL مع dimensions كثيرة.
2. **لا يوجد Subledger Accounting (SLA) Framework** — كل مصدر له auto-journal مختلف.
3. **لا يوجد Sub-Ledger Open Items** (AR/AP open items model).
4. **لا يوجد Multi-GAAP / Multi-Book Accounting** (NetSuite, Oracle ميزة أساسية).
5. **لا يوجد Period Closing Engine** كامل (checklist, sequence, lock).
6. **لا يوجد Audit Trail على مستوى الحقل** (field-level history).
7. **لا يوجد Numbering Sequences Engine** قابل للتكوين لكل نوع وثيقة.
8. **لا يوجد Document Status State Machine** موحد.
9. **لا يوجد Reservation Engine** للمخزون والائتمان.
10. **لا يوجد Workflow Engine** عام (BPMN-like) مطبق فعلياً.

---

## 3. التقييم بحسب الموديول الرئيسي

### 3.1 شجرة الحسابات (Chart of Accounts)

| البند | الحالة | المرجع العالمي |
|------|--------|---------------|
| أنواع الحسابات الخمسة الرئيسية | ✓ | جميع الأنظمة |
| التصنيف الفرعي (Current/Non-current/Operating) | ✗ | SAP, Oracle, NetSuite |
| شجرة هرمية متعددة المستويات (5+) | ⚠ 3 مستويات | NetSuite يدعم unlimited |
| Account Categories مرنة | ✗ | Oracle Fusion (مرن جداً) |
| Cash Flow Tag لكل حساب | ✗ | QuickBooks, Xero |
| Tax Group Tag | ✗ | SAP |
| Default Currency per Account | ✗ | Oracle |
| Statistical Accounts | ✗ | SAP |
| Inactive/Archive logic | ⚠ active flag فقط | جميع الأنظمة |
| Account Templates (IFRS/SOCPA) | ✗ | Odoo (templates per country) |
| Reconciliation flag | ✗ | Odoo |
| Account merge / split | ✗ | NetSuite |
| Opening balance entry tool | ✗ | جميع الأنظمة |
| Account reclassification engine | ✗ | SAP |

### 3.2 القيود اليومية (General Journal)

| البند | الحالة | المرجع |
|------|--------|--------|
| Manual JE | ✓ | — |
| Auto JE من المصادر | ✓ 8 مصادر | SAP يوجد له ~200 مصدر |
| Multi-line + balanced validation | ✓ | — |
| Period Locking | ✓ basic | SAP بدقيقة |
| Reversal entry | ✓ | — |
| **Recurring JE (templates)** | ✗ | جميع الأنظمة |
| **Reversing JE (auto next period)** | ✗ | جميع الأنظمة |
| **Standard Templates / Memorized** | ✗ | QuickBooks, Xero |
| **Approval Workflow على JE** | ⚠ models exist, not wired | Oracle, SAP |
| **Posting/Unposting** | ✗ (always posted) | SAP, Oracle |
| **Inter-company Eliminations** | ✗ | SAP S/4HANA Group Reporting |
| **Journal Sources Catalog** | ⚠ free-text | SAP |
| **Adjusting Entries (period-end)** | ✗ | جميع الأنظمة |
| **Reclassification Entries** | ✗ | جميع الأنظمة |
| **Drill-Down to Source Doc** | ⚠ partial | SAP, Oracle (full) |
| **Multi-currency JE with FX gain/loss line** | ⚠ amounts only, no FX line | SAP, Oracle |
| **Mass Reverse / Mass Post** | ✗ | NetSuite |

### 3.3 الإقفال (Period Close)

| البند | الحالة | المرجع |
|------|--------|--------|
| Soft close | ⚠ basic | جميع الأنظمة |
| Hard close | ✗ | جميع الأنظمة |
| Closing checklist / runbook | ✗ | BlackLine, Oracle ARCS |
| Year-end closing entries (auto) | ✗ | جميع الأنظمة |
| Retained earnings rollover | ✗ | جميع الأنظمة |
| Period reopen with audit | ✗ | SAP |
| Cut-off entries | ✗ | — |
| Sub-ledger close before GL | ✗ | Oracle, SAP |
| Multi-currency revaluation at period end | ✗ | SAP FAGL_FC_VAL |
| Allocation engine (overhead) | ✗ | SAP CO, Oracle Allocation |

### 3.4 الحسابات المدينة (AR)

| البند | الحالة | المرجع |
|------|--------|--------|
| Customer master | ⚠ basic | — |
| Multi-ship-to / multi-bill-to | ✗ | جميع الأنظمة |
| Contact persons multiple | ✗ | جميع الأنظمة |
| Customer hierarchy (parent/sub) | ✗ | SAP, NetSuite |
| Customer category/segment | ✗ | جميع الأنظمة |
| Payment Terms engine (Net 30, 2/10 Net 30, EOM) | ✗ | جميع الأنظمة |
| Credit Limit + Credit Hold | ✓ | — |
| Credit Risk scoring | ✗ | SAP FSCM Credit Mgmt |
| AR Aging (30/60/90/120+) | ✓ | — |
| Customer statements | ✗ | جميع الأنظمة |
| Dunning letters (multi-level) | ✗ | SAP, Oracle |
| Dunning fee/interest | ✗ | SAP F-28 |
| Cash Application engine (auto-match) | ✗ | High Radius, Oracle |
| Partial payment allocation | ⚠ | جميع الأنظمة |
| Open Items model | ✗ | SAP (open/cleared) |
| Bad debt provision (% aging) | ✗ | جميع الأنظمة |
| Bad debt write-off | ✗ | جميع الأنظمة |
| Refunds processing | ⚠ | جميع الأنظمة |
| Customer disputes / deductions | ✗ | SAP FSCM Dispute |
| Promissory Notes | ✓ model exists | — |
| Factoring (debt sale) | ✗ | SAP |
| Customer deposits/advances | ⚠ | جميع الأنظمة |
| Recurring billing | ⚠ | Zuora, NetSuite ARM |
| Subscription billing | ⚠ | Zuora, Stripe Billing |
| Late fees automation | ✗ | جميع الأنظمة |
| Customer self-service portal | ⚠ flag only | NetSuite |

### 3.5 الحسابات الدائنة (AP)

| البند | الحالة | المرجع |
|------|--------|--------|
| Vendor master | ⚠ shared with Customer | جميع الأنظمة بنموذج مستقل |
| Vendor categories | ✗ | جميع الأنظمة |
| Vendor approval workflow / AVL | ✗ | جميع الأنظمة |
| Vendor compliance (CR, VAT, certificates) | ⚠ DocumentArchive | SAP MM |
| Vendor scorecards (KPIs) | ✓ basic | — |
| Three-way matching (auto) | ✗ | جميع الأنظمة |
| Two-way matching | ✗ | — |
| Tolerance limits | ✗ | جميع الأنظمة |
| Invoice OCR | ✓ Gemini | Tradeshift, Stampli |
| Vendor advance | ✗ | جميع الأنظمة |
| Withholding Tax (WHT) | ✗ | SAP, Oracle |
| Payment runs (batch payments) | ✗ | جميع الأنظمة |
| Payment proposal | ✗ | SAP F110 |
| Bank file generation (SEPA/ACH/SWIFT) | ✗ | جميع الأنظمة |
| Vendor self-service portal | ✗ | SAP Ariba, Coupa |
| Spend analysis | ✗ | Coupa, SAP Ariba |
| AP open items | ✗ | SAP |

### 3.6 الخزينة (Treasury & Cash Management)

| البند | الحالة | المرجع |
|------|--------|--------|
| Multi-bank cash position | ⚠ | Kyriba, SAP TRM |
| Bank statement import (MT940/CAMT.053/OFX) | ✗ | جميع الأنظمة |
| Auto reconciliation engine (rule-based) | ⚠ AI basic | Trovata, Kyriba |
| Manual reconciliation | ✓ | — |
| Outstanding checks tracking | ✗ | — |
| Deposits in transit | ✗ | — |
| Bank charges auto-post | ✗ | — |
| Inter-bank transfer | ✗ | — |
| SWIFT / Open Banking | ✗ | Kyriba, SAP TRM |
| Cash flow forecasting (Direct method) | ✗ | جميع الأنظمة |
| Liquidity planning | ✗ | SAP TRM |
| FX hedging (forwards/swaps) | ✗ | SAP TRM |
| Loans management | ⚠ employee only | جميع الأنظمة |
| Investments (TBills, Bonds, MM) | ✗ | SAP TRM |
| Cash pooling | ✗ | Kyriba |
| In-house bank | ✗ | SAP TRM |

### 3.7 الشيكات (Checks)

| البند | الحالة | المرجع |
|------|--------|--------|
| Issued (PAYABLE) checks | ✓ | — |
| Received (RECEIVABLE) checks | ✓ | — |
| Post-dated handling | ⚠ dueDate only | الأنظمة العربية |
| Bounced (returned) | ✓ status | — |
| Check book management | ✗ | الأنظمة العربية (Onyx, Aliphia) |
| Check printing template | ✗ | QuickBooks |
| Stop payment | ✗ | — |
| Replacement | ✗ | — |
| Bank guarantee on check | ✗ | — |

### 3.8 العهد المالية (Petty Cash)

| البند | الحالة | المرجع |
|------|--------|--------|
| Petty cash funds | ✓ | — |
| Custodian | ✓ | — |
| Imprest system (auto top-up) | ✗ | جميع الأنظمة |
| Multi-currency petty cash | ✗ | SAP |
| Mobile expense capture | ✗ | Concur, Expensify |
| Receipt OCR | ✗ | Concur |

### 3.9 الأصول الثابتة (Fixed Assets) — أكبر فجوة 82%

| البند | الحالة | المرجع |
|------|--------|--------|
| Asset master basic | ✓ | — |
| Asset Categories with default GL | ✗ | جميع الأنظمة |
| Asset hierarchy (parent/component) | ✗ | SAP AA |
| **Component accounting (IFRS)** | ✗ | SAP, Oracle |
| **CWIP (Capital Work in Progress)** | ✗ | جميع الأنظمة |
| **Capitalization from CWIP** | ✗ | SAP |
| **Asset additions (subsequent costs)** | ✗ | جميع الأنظمة |
| **Asset transfers (location/dept)** | ✗ | جميع الأنظمة |
| **Asset disposal (sale/scrap)** | ✗ | جميع الأنظمة |
| **Gain/Loss on disposal calculation** | ✗ | جميع الأنظمة |
| **Asset impairment (IAS 36)** | ✗ | جميع الأنظمة |
| **Asset revaluation (IAS 16)** | ✗ | جميع الأنظمة |
| **Insurance tracking + claims** | ✗ | — |
| **Asset count / physical verification** | ✗ | — |
| Barcode/RFID | ⚠ | — |
| **Depreciation methods**: |  |  |
| - Straight Line | ✓ | — |
| - Declining Balance | ✗ | جميع الأنظمة |
| - Double Declining | ✗ | — |
| - Sum of Years' Digits | ✗ | — |
| - Units of Production | ✗ | — |
| - MACRS | ✗ | US-GAAP |
| **Multi-book depreciation (Tax vs Book vs IFRS)** | ✗ | NetSuite, Oracle |
| **Half-year / Mid-month convention** | ✗ | — |
| **Catch-up depreciation** | ✗ | — |
| **Bonus depreciation / Section 179** | ✗ | US |
| **Asset retirement obligations (ARO)** | ✗ | IFRS |

### 3.10 عقود الإيجار (Leases — IFRS 16 / ASC 842)

| البند | الحالة | المرجع |
|------|--------|--------|
| Lease contract master | ⚠ basic | — |
| ROU Asset recognition | ✗ | IFRS 16 mandatory |
| Lease Liability recognition | ✗ | IFRS 16 mandatory |
| Discount rate / IBR | ✗ | — |
| Lease modification | ✗ | — |
| Lease termination | ✗ | — |
| Sub-lease | ✗ | — |
| Lessor accounting | ✗ | — |
| Variable lease payments | ✗ | — |
| Short-term/Low-value exemption | ✗ | — |

### 3.11 المخزون (Inventory)

| البند | الحالة | المرجع |
|------|--------|--------|
| Multi-warehouse | ✓ | — |
| Multi-location (Zone/Rack/Bin) | ✓ models | SAP EWM |
| Multi-UOM with conversion | ✓ | — |
| **Product variants (size/color)** | ✗ | Shopify, Odoo, NetSuite |
| **Item attributes engine** | ✗ | Odoo, NetSuite |
| **Item alternatives/substitutes** | ✗ | SAP MM |
| **HS Codes / Country of Origin** | ✗ | SAP GTS |
| **Hazmat classification** | ✗ | — |
| **Storage conditions / temperature** | ✗ | SAP EWM |
| **Min/Max + Reorder Point + Reorder Qty** | ⚠ min only | جميع الأنظمة |
| **Safety stock + Lead time** | ✗ | — |
| **ABC/XYZ Analysis** | ✗ | SAP, Oracle |
| **Slow-moving / Dead stock report** | ✗ | جميع الأنظمة |
| **Demand forecasting** | ✗ | SAP IBP, Oracle Demantra |
| **Putaway / Pick strategies (FEFO, FIFO)** | ✗ | SAP EWM, Manhattan |
| **Wave picking** | ✗ | WMS systems |
| **Cycle count plans** | ✗ | جميع الأنظمة |
| **Stock reservation engine** | ✗ | جميع الأنظمة |
| **In-transit inventory** | ✗ | جميع الأنظمة |
| **Negative stock control** | ✗ | جميع الأنظمة |
| **Inventory write-off / write-down (NRV)** | ✗ | IAS 2 |
| **Costing methods**: FIFO, LIFO, Weighted Avg | ✓ | — |
| **Standard Cost with variance posting** | ✗ | SAP CO-PC |
| **Material ledger (multi-currency cost)** | ✗ | SAP S/4HANA |
| **Landed cost allocation** | ✓ model | — |
| **Lot/Batch tracking + expiry** | ✓ | — |
| **Serial number tracking** | ✓ | — |
| **Consignment inventory** | ✗ | جميع الأنظمة |
| **VMI (Vendor Managed Inventory)** | ✗ | SAP |
| **Drop shipping** | ✗ | NetSuite, Odoo |
| **Kit/Bundle items** | ✗ | NetSuite, Shopify |

### 3.12 التصنيع (Manufacturing & Planning)

| البند | الحالة | المرجع |
|------|--------|--------|
| Single-level BOM | ✓ | — |
| **Multi-level BOM with explosion** | ⚠ structure only | SAP, Oracle |
| **Phantom BOM** | ✗ | جميع الأنظمة |
| **BOM versioning + ECO** | ✗ | SAP PLM, Oracle PLM |
| **BOM where-used** | ✗ | SAP |
| Routing (operations) | ✓ | — |
| **Alternative routings** | ✗ | SAP |
| Work centers + capacity | ✓ | — |
| **Setup/Run/Wait/Move time** | ⚠ duration only | SAP |
| Manufacturing Order | ✓ | — |
| **Material issuance to WO** | ✗ | جميع الأنظمة |
| **Backflushing** | ✗ | SAP |
| **Co-products / By-products / Scrap** | ✓ | — |
| **Rework orders** | ✗ | SAP |
| **MRP (Material Requirements Planning)** | ✓ basic | — |
| **MPS (Master Production Schedule)** | ✗ | SAP, Oracle |
| **CRP (Capacity Requirements Planning)** | ✗ | SAP |
| **DDMRP** | ✗ | DDMRP-certified ERPs |
| **Demand Forecasting algorithms** | ✗ | SAP IBP |
| **S&OP** | ✗ | Oracle Cloud SCM |
| **APS (Advanced Planning & Scheduling)** | ✗ | OPCENTER, Asprova |
| **Finite/Infinite scheduling** | ✗ | — |
| **Standard cost / variance analysis** | ✗ | SAP CO-PC |
| **WIP valuation** | ✓ | — |
| **Job costing** | ⚠ partial | جميع الأنظمة |
| **Process costing** | ✗ | SAP |
| **ABC costing** | ✗ | SAP |
| **OEE** | ✗ | MES systems |
| **MTBF/MTTR** | ✗ | SAP PM |
| **Predictive maintenance** | ⚠ telemetry only | SAP IoT |
| **Subcontracting (job work)** | ✗ | SAP MM |
| **Quality plans / specifications** | ⚠ basic | SAP QM |
| **NCR / CAPA** | ✗ | SAP QM |

### 3.13 الموارد البشرية والرواتب (HR & Payroll)

| البند | الحالة | المرجع |
|------|--------|--------|
| Employee master | ✓ | — |
| **Org chart / hierarchy** | ✗ | جميع الأنظمة |
| **Position management** | ⚠ field only | SAP HCM, Workday |
| **Job grades / pay scales** | ✗ | جميع الأنظمة |
| **Departments (separate)** | ✗ | جميع الأنظمة |
| **Reporting manager hierarchy** | ✗ | جميع الأنظمة |
| **Dependents / family tracking** | ✗ | جميع الأنظمة |
| **Emergency contacts** | ✗ | — |
| **Skills matrix / certifications** | ✗ | Workday |
| **Document expiry alerts (Iqama, Visa)** | ⚠ field only | الأنظمة السعودية |
| Attendance manual | ✓ | — |
| Face ID attendance | ✓ | — |
| **GPS-based / Geofencing** | ✗ | الأنظمة الحديثة |
| **Multi-shift scheduling** | ⚠ | جميع الأنظمة |
| **Overtime rules engine** | ✗ | جميع الأنظمة |
| Leave types (multi) | ⚠ generic | — |
| **Leave accrual / balance / carry-forward** | ✗ | جميع الأنظمة |
| **Leave encashment** | ✗ | الأنظمة الخليجية |
| **Public holiday calendar** | ✗ | جميع الأنظمة |
| Salary structure (allowances/deductions) | ✓ | — |
| GOSI deduction | ✓ | — |
| **End of Service (EOS) Saudi Labor Law** | ✗ | الأنظمة السعودية (must) |
| **Final settlement** | ✗ | — |
| Employee loans | ✓ | — |
| **Bonus / variable pay** | ✗ | — |
| Commission posted to payroll | ✓ | — |
| Payroll runs | ✓ | — |
| Payslip PDF | ✓ | — |
| **WPS file (Mudad/Bank)** | ✗ | الأنظمة السعودية (must) |
| **GOSI file generation** | ⚠ basic | — |
| **Mudad / Qiwa / Absher / Muqeem APIs** | ✗ | الأنظمة السعودية الحديثة |
| **Multi-currency payroll** | ⚠ | — |
| **Off-cycle payroll** | ✗ | — |
| **Pro-rata for joiners/leavers** | ⚠ | — |
| Recruitment - Job postings | ✓ | — |
| Recruitment - ATS | ⚠ | Greenhouse, Lever |
| **Onboarding workflow** | ✗ | جميع الأنظمة |
| Performance evaluation | ✓ | — |
| **OKRs / Goals** | ✗ | Workday, BambooHR |
| Training courses | ✓ | — |
| **LMS integration** | ✗ | — |
| **Travel & Expense management** | ✗ | Concur, Expensify |
| **Self-service portal** | ✗ | جميع الأنظمة |
| **Mobile employee app** | ⚠ | — |

### 3.14 المبيعات (Sales)

| البند | الحالة | المرجع |
|------|--------|--------|
| Quote → SO → DN → Invoice → Payment | ✓ | — |
| Quote revisions / versions | ⚠ | جميع الأنظمة |
| Quote → SO conversion | ⚠ | جميع الأنظمة |
| Partial deliveries | ✓ | — |
| **Backorders** | ✗ | جميع الأنظمة |
| **Drop ship** | ✗ | NetSuite, Odoo |
| **Blanket orders / Standing orders** | ✗ | SAP, Oracle |
| **RMA workflow** | ✗ | جميع الأنظمة |
| **Warranty management** | ✗ | SAP CS, NetSuite |
| **Multi-ship-to per order** | ✗ | جميع الأنظمة |
| **Sales territory** | ✓ Route | — |
| **Customer hierarchy** | ✗ | SAP, NetSuite |
| Sales rep assignment | ✓ | — |
| Commission rules | ✓ | — |
| Sales targets | ✓ | — |
| **Sales forecast** | ✗ | Salesforce, HubSpot |
| **Multiple Price Lists** | ✗ | جميع الأنظمة |
| **Tier pricing engine** | ⚠ basic | — |
| **Customer-specific pricing** | ✗ | جميع الأنظمة |
| **Contract pricing** | ✗ | SAP, Oracle |
| Promotions (BOGO, %, $, time) | ✓ | — |
| Coupons | ✓ | — |
| Gift cards | ✓ | — |
| Loyalty program | ✓ | — |
| **Cashback / store credit** | ✗ | — |

### 3.15 المشتريات (Purchasing & Procurement)

| البند | الحالة | المرجع |
|------|--------|--------|
| PR → RFQ → PO → GRN → Invoice | ✓ | — |
| PR approval | ⚠ status | SAP, Coupa |
| RFQ comparison | ⚠ | SAP Ariba |
| PO approval workflow | ⚠ | جميع الأنظمة |
| PO acknowledgment | ✗ | — |
| **Blanket PO** | ✗ | SAP |
| **Contract PO** | ⚠ supplier contract | SAP |
| **Standing PO** | ✗ | — |
| GRN | ✓ | — |
| Partial receipt | ✓ | — |
| **Over-receipt with tolerance** | ✗ | جميع الأنظمة |
| Quality inspection on receipt | ⚠ | SAP QM |
| **Three-way matching automated** | ✗ | جميع الأنظمة |
| **Tolerance limits (price/qty)** | ✗ | — |
| Vendor returns (debit memo) | ✓ | — |
| Landed cost | ✓ | — |
| **Import shipments / customs** | ⚠ | SAP GTS |
| **Subcontracting PO** | ✗ | SAP MM |
| Service PO | ⚠ | — |
| **Spend analysis** | ✗ | Coupa, Ariba |
| **e-Procurement marketplace** | ✗ | Ariba Network |

### 3.16 CRM والعلاقات

| البند | الحالة | المرجع |
|------|--------|--------|
| Leads | ✓ | — |
| **Opportunities** | ✗ | Salesforce |
| **Pipeline / stages** | ✗ | Salesforce, HubSpot |
| **Activities (calls, meetings)** | ✗ | Salesforce |
| **Tasks** | ✗ | جميع الأنظمة |
| **Won/Lost analysis** | ✗ | — |
| **Customer 360 view** | ⚠ | جميع الأنظمة |
| **NPS / surveys** | ✗ | — |
| WhatsApp integration | ✓ | — |
| Telegram bot | ✓ | — |
| **Email campaigns / Marketing automation** | ✗ | HubSpot, Mailchimp |

### 3.17 الضرائب والامتثال

| البند | الحالة | المرجع |
|------|--------|--------|
| **VAT engine (rates, types)** | ⚠ basic | جميع الأنظمة |
| **Reverse charge mechanism** | ✗ | SAP |
| **VAT return generation** | ✗ | جميع الأنظمة |
| **VAT return XML for ZATCA** | ✗ | الأنظمة السعودية الحديثة |
| **Withholding tax** | ✗ | SAP, Oracle |
| **Excise tax** | ✗ | السعودية |
| **Customs duties** | ⚠ landed cost | SAP GTS |
| **Income tax / Zakat** | ✗ | الأنظمة السعودية |
| ZATCA Phase 1 (QR) | ✓ | — |
| ZATCA Phase 2 (XML, signing, ICV/PIH) | ✓ | — |
| **ZATCA Clearance vs Reporting modes** | ⚠ | — |
| ZATCA Sandbox/Production switch | ✓ | — |
| ZATCA Credit/Debit Notes | ⚠ | — |
| **Multi-VAT registration / group VAT** | ✗ | — |

### 3.18 التقارير المالية والذكية

| البند | الحالة | المرجع |
|------|--------|--------|
| Trial Balance | ✓ | — |
| Trial Balance comparative | ✗ | جميع الأنظمة |
| Balance Sheet | ✓ | — |
| Income Statement (P&L) | ✓ | — |
| **P&L by Cost Center / Project / Segment** | ⚠ | جميع الأنظمة |
| Cash Flow (Indirect) | ✓ | — |
| **Cash Flow (Direct)** | ✗ | جميع الأنظمة |
| **Statement of Changes in Equity** | ✗ | IFRS-mandatory |
| **Notes to Financial Statements** | ✗ | — |
| **Comparative reports (PY vs CY)** | ⚠ | — |
| **Consolidated Financial Statements** | ✗ | SAP Group Reporting, Oracle FCCS |
| **Segment reporting (IFRS 8)** | ✗ | — |
| GL detailed | ✓ | — |
| AR/AP Aging | ✓ | — |
| **Sub-ledger reports complete** | ⚠ | — |
| **Custom Report Builder** | ✗ | NetSuite SuiteAnalytics |
| **Pivot / Drill-down** | ⚠ | جميع الأنظمة |
| **Scheduled report email** | ✗ | جميع الأنظمة |
| **BI dashboard** | ✓ basic | — |
| **Excel/PDF export** | ✓ | — |

### 3.19 الميزانيات

| البند | الحالة | المرجع |
|------|--------|--------|
| Budget per CC / Account | ✓ | — |
| Budget vs Actual | ✓ | — |
| Variance | ⚠ basic | — |
| **Multi-version (baseline/revised)** | ✗ | جميع الأنظمة |
| **Rolling forecast** | ✗ | جميع الأنظمة |
| **Budget approval workflow** | ⚠ | Oracle EPBCS |
| **Encumbrance accounting** | ✗ | Oracle Public Sector |
| **Budget alerts on breach** | ✗ | جميع الأنظمة |

### 3.20 الحوكمة والنظام

| البند | الحالة | المرجع |
|------|--------|--------|
| Audit Log | ✓ | — |
| **Field-level audit (before/after)** | ✗ | SAP, Oracle |
| **Login history / failed attempts** | ⚠ | جميع الأنظمة |
| RBAC | ⚠ basic | — |
| **Field-level permissions** | ✗ | جميع الأنظمة |
| Approval workflow | ⚠ models, partial wiring | جميع الأنظمة |
| **Multi-level approval** | ⚠ | جميع الأنظمة |
| **Approval delegation** | ✗ | جميع الأنظمة |
| **Segregation of Duties (SoD) matrix** | ✗ | SAP GRC |
| Multi-company | ✓ | — |
| Multi-tenant | ✓ | — |
| Multi-currency | ✓ | — |
| Multi-language (RTL) | ✓ | — |
| **Multi-time zone** | ✗ | جميع الأنظمة |
| **Backup / Restore** | ✗ | جميع الأنظمة |
| **Custom fields / labels** | ✗ | NetSuite, Salesforce |
| **SSO (SAML/OAuth/OIDC)** | ✗ | جميع الأنظمة |
| **2FA** | ⚠ TOTP fields | جميع الأنظمة |
| **API rate limiting** | ✗ | جميع الأنظمة |
| **API keys management** | ✗ | جميع الأنظمة |
| **Webhooks (configurable)** | ⚠ | جميع الأنظمة |
| **Numbering sequences engine** | ✗ | جميع الأنظمة |

---

## 4. مقارنة جدولية شاملة بالأنظمة العالمية

### 4.1 القدرات الأساسية

| القدرة | نظامك | SAP S/4HANA | Oracle Fusion | NetSuite | Odoo | QuickBooks |
|--------|-------|-------------|----------------|----------|------|------------|
| Universal Journal | ✗ | ✓✓✓ | ✓✓ | ✓ | ✗ | ✗ |
| Multi-Book / Multi-GAAP | ✗ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ⚠ | ✗ |
| Subledger Accounting Framework | ✗ | ✓✓✓ | ✓✓✓ | ✓✓ | ⚠ | ✗ |
| Cash Application Engine | ✗ | ✓✓ | ✓✓ | ✓✓ | ⚠ | ⚠ |
| Three-way matching | ✗ | ✓✓ | ✓✓ | ✓✓ | ✓ | ⚠ |
| Period close engine | ✗ | ✓✓✓ | ✓✓✓ | ✓✓ | ⚠ | ⚠ |
| FX revaluation | ✗ | ✓✓✓ | ✓✓ | ✓✓ | ✓ | ⚠ |
| Group/Consolidation | ✗ | ✓✓✓ | ✓✓✓ | ✓✓ | ⚠ | ✗ |
| Allocation engine | ✗ | ✓✓✓ | ✓✓ | ✓ | ⚠ | ✗ |
| Revenue recognition (IFRS 15) | ✗ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ⚠ | ✗ |
| Lease accounting (IFRS 16) | ✗ | ✓✓ | ✓✓ | ✓✓ | ⚠ | ✗ |
| **النتيجة (max 33)** | **0** | **33** | **30** | **24** | **9** | **3** |

### 4.2 المخزون والتصنيع

| القدرة | نظامك | SAP | Oracle | NetSuite | Odoo |
|--------|-------|-----|--------|----------|------|
| FIFO/LIFO/Avg | ✓ | ✓ | ✓ | ✓ | ✓ |
| Standard Cost + Variance | ✗ | ✓✓✓ | ✓✓ | ✓✓ | ⚠ |
| Material Ledger | ✗ | ✓✓✓ | ✗ | ✗ | ✗ |
| Variants | ✗ | ✓✓ | ✓✓ | ✓✓ | ✓✓ |
| Multi-level BOM explosion | ⚠ | ✓✓✓ | ✓✓ | ✓✓ | ✓✓ |
| ECO/PLM | ✗ | ✓✓✓ | ✓✓ | ✓ | ⚠ |
| MRP | ⚠ | ✓✓✓ | ✓✓ | ✓✓ | ✓✓ |
| MPS / S&OP | ✗ | ✓✓✓ | ✓✓✓ | ⚠ | ⚠ |
| WMS (Bin/Pick/Putaway) | ⚠ | ✓✓✓ | ✓✓ | ✓ | ✓ |
| QM (CAPA/NCR) | ✗ | ✓✓✓ | ✓✓ | ⚠ | ⚠ |
| OEE/MES integration | ✗ | ✓✓ | ✓ | ✗ | ⚠ |
| Subcontracting | ✗ | ✓✓✓ | ✓✓ | ⚠ | ✓ |

### 4.3 الموارد البشرية والامتثال السعودي

| القدرة | نظامك | SAP HCM | Workday | الأنظمة السعودية (Aliphia, DEXEF, Onyx) |
|--------|-------|---------|---------|--------------------------------------------|
| Org chart | ✗ | ✓✓✓ | ✓✓✓ | ✓ |
| EOS calculation | ✗ | ✓ | ⚠ | ✓✓✓ |
| WPS file | ✗ | ⚠ | ⚠ | ✓✓✓ |
| GOSI integration | ⚠ | ⚠ | ⚠ | ✓✓✓ |
| Mudad / Qiwa | ✗ | ✗ | ✗ | ✓✓ |
| Iqama/Visa expiry | ⚠ | ✓ | ✓ | ✓✓ |

---

## 5. البرومنت الكامل لتطوير النظام
## (Master Implementation Prompt — استخدم هذا مع AI لتطوير كل شيء)

### كيفية الاستخدام
> انسخ كل قسم على حدة وأرسله للذكاء الاصطناعي (Claude/GPT) في جلسة منفصلة لتنفيذ ذلك القسم دون تجاوز سعة المحادثة. كل قسم ذاتي الكفاية ويذكر الملفات المتأثرة والـ schema المطلوب.

---

### 🔵 المرحلة 0 — الأساسات الهيكلية (Foundation Layer)

```
[Prompt-0.1: Numbering Sequences Engine]
أضف نموذج NumberingSequence إلى prisma/schema.prisma بحقول:
{ id, code (JE, INV, PO, GRN, PR, RFQ, SO, DN, FA, EMP, SAL, ...), 
  prefix, suffix, padLength, current, resetFrequency (never|yearly|monthly), 
  branchId, fiscalYear, lastReset, isActive }
أنشئ:
- src/lib/numbering.ts بدالة generateNextNumber(code, branchId?, date?) مع transaction lock
- API: src/app/api/system/numbering/route.ts للـ CRUD
- Migration script يحول جميع الأماكن التي تستخدم Date.now() أو counter في الكود الحالي إلى استدعاء generateNextNumber()
- Seed data للأكواد الأساسية
المتطلبات: Concurrency-safe, atomic increment via Prisma $transaction with SERIALIZABLE.
```

```
[Prompt-0.2: Universal Document Status State Machine]
أنشئ src/lib/document-state-machine.ts:
- enum DocumentStatus { DRAFT, PENDING_APPROVAL, APPROVED, POSTED, PARTIALLY_FULFILLED, FULFILLED, CANCELLED, REVERSED }
- transitions table لكل document type (Invoice, JE, PO, SO, GRN, ...)
- function canTransition(from, to, docType, userPermissions) -> boolean
- function transition(docId, docType, toStatus, userId) -> creates audit row
طبق هذا على: SalesInvoice, PurchaseInvoice, JournalEntry, PurchaseOrder, SalesOrder, GoodsReceiptNote, DeliveryNote.
أضف middleware يمنع تعديل document بعد POSTED ما لم يحدث reversal أولاً.
```

```
[Prompt-0.3: Universal Audit Trail (Field-Level)]
أضف نموذج FieldAuditLog:
{ id, entityType, entityId, fieldName, oldValue, newValue, 
  userId, userEmail, ipAddress, userAgent, changedAt, transactionId }
أنشئ Prisma extension في src/lib/prisma-audit.ts يلتقط كل update/create/delete على الجداول الحساسة:
JournalEntry, JournalLine, Account, FixedAsset, Customer, Vendor, 
Product, Salary, FiscalPeriod, Setting.
أضف API: src/app/api/system/audit-trail/route.ts مع filters (entity, user, dateRange).
```

```
[Prompt-0.4: Period Close Engine]
أضف نماذج:
- PeriodCloseChecklist { id, fiscalPeriodId, taskName, sequence, owner, status, completedAt, notes }
- PeriodCloseTaskTemplate { id, name, sequence, applicableModule, isMandatory }
- PeriodLockLog { id, fiscalPeriodId, lockedBy, lockedAt, reopenedBy, reopenedAt, reason }
أنشئ API:
- POST /api/accounting/period-close/start (creates checklist from templates)
- POST /api/accounting/period-close/[periodId]/complete-task
- POST /api/accounting/period-close/[periodId]/soft-close
- POST /api/accounting/period-close/[periodId]/hard-close (locks all sub-ledgers)
- POST /api/accounting/period-close/[periodId]/reopen (with reason + admin)
سلسلة الإغلاق:
1. توقف القيود الفرعية (POs, GRNs, Invoices, Stock movements)
2. تشغيل revaluation للعملات
3. تشغيل allocations
4. تشغيل depreciation run
5. تشغيل accruals (auto-reversing بداية الفترة التالية)
6. مطابقة sub-ledgers مع GL
7. إنشاء closing entries (year-end)
8. ترحيل retained earnings
9. قفل الفترة
أضف dashboard في src/app/(dashboard)/accounting/period-close/page.tsx.
```

```
[Prompt-0.5: Generic Approval Workflow Engine]
الـ models موجودة (ApprovalRule, ApprovalRequest, ApprovalStep) لكن غير موصلة.
أنشئ src/lib/approval-engine.ts:
- registerApprovableType(type, getAmount, getRequester, getRouteAccounts)
- requestApproval(docType, docId, amount) -> creates ApprovalRequest + first ApprovalStep
- evaluateRule(rule, doc) -> matches by amount thresholds, account types, branch
- approve/reject(stepId, userId, comment)
- delegate(stepId, fromUser, toUser, until)
- escalate(stepId, after_hours)
طبق على: JournalEntry > $5000, PO, Vendor master changes, Salary > X, Stock adjustments.
أضف email/push notification عند كل خطوة.
```

---

### 🔵 المرحلة 1 — المحاسبة المتقدمة

```
[Prompt-1.1: Recurring Journal Entries + Templates]
أضف نماذج:
- JournalTemplate { id, name, description, lines: JournalTemplateLine[], isRecurring, frequency, nextRunDate, endDate, autoReverse }
- JournalTemplateLine { id, templateId, accountId, debitFormula, creditFormula, description, costCenterId }
صيغ الحساب: تدعم متغيرات مثل {prevMonthSales}, {fixedAmount:1000}, {%5_of_account:6100}.
أنشئ:
- src/lib/recurring-journal-runner.ts (يعمل عبر cron يومياً)
- API: src/app/api/accounting/journal-templates/route.ts
- UI: صفحة لإدارة templates مع معاينة القيد
أضف "Reverse on first day of next period" tick box للـ accruals.
```

```
[Prompt-1.2: Multi-Currency FX Revaluation]
أضف نموذج:
- FxRevaluationRun { id, fiscalPeriodId, runDate, accountIds, exchangeRateUsed, totalGain, totalLoss, journalEntryId, status, createdBy }
أنشئ:
- src/lib/fx-revaluation.ts
- function revaluate(accountIds, period, rateAtPeriodEnd, fxGainAcct, fxLossAcct):
  لكل حساب يحمل foreign balance، احسب:
  - Functional value at booking rate vs rate at period end
  - Difference -> JE: DR/CR account, opposite to FxGain/Loss
- API: POST /api/accounting/fx-revaluation/run
- Dashboard: عرض النتائج قبل الترحيل (preview)
أضف: تخصيص spot/average/closing rate types في ExchangeRate model.
```

```
[Prompt-1.3: Inter-Company & Consolidation]
أضف نماذج:
- IntercompanyTransaction { id, sourceCompanyId, targetCompanyId, sourceJEId, targetJEId, status, reconciledAt }
- ConsolidationGroup { id, name, parentCompanyId, subsidiaries: [{ companyId, ownership%, consolidationMethod }] }
- ConsolidationRun { id, groupId, fiscalPeriodId, eliminations: ConsolidationElimination[], status }
- ConsolidationElimination { id, runId, type (intercompany_AR_AP, intercompany_revenue, intercompany_dividend), amount, debitAcctId, creditAcctId }
أنشئ:
- src/lib/consolidation-engine.ts
- runConsolidation(groupId, periodId): 
  1. جمع TB لكل شركة بنفس currency (عبر FX)
  2. تطبيق eliminations
  3. تطبيق minority interest
  4. توليد Consolidated TB / BS / IS
- API: src/app/api/accounting/consolidation/*
- UI: شاشة لإدارة المجموعات + تشغيل التوحيد
```

```
[Prompt-1.4: Cost Allocations (Overhead/Service)]
أضف نماذج:
- AllocationRule { id, name, sourceCostCenterId, targetCostCenters: AllocationTarget[], basis (fixed_%|headcount|sqft|revenue|custom), schedule }
- AllocationTarget { ruleId, costCenterId, percentage }
- AllocationRun { id, ruleId, fiscalPeriodId, sourceAmount, journalEntryId, status }
أنشئ:
- src/lib/allocation-engine.ts
- runAllocation(ruleId, period): يقرأ تكاليف المركز المصدر ويوزعها بناءً على basis ويولد JE
- API و UI
```

```
[Prompt-1.5: Revenue Recognition (IFRS 15 / ASC 606)]
أضف نماذج:
- RevenueArrangement { id, customerId, salesOrderId, contractValue, currency, startDate, endDate }
- PerformanceObligation { id, arrangementId, name, allocatedAmount, recognitionMethod (point_in_time|over_time_straight|over_time_percent|milestone), startDate, endDate, milestones }
- RevenueSchedule { id, obligationId, period, recognizedAmount, journalEntryId }
- DeferredRevenueBalance (computed view)
أنشئ:
- src/lib/revenue-recognition.ts
- function generateSchedule(obligation): يولد جدول الاعتراف بالإيراد
- function runRecognition(period): يولد JE تلقائي:
  DR: Deferred Revenue
  CR: Revenue
- API و UI لإدارة العقود متعددة الأداءات
```

---

### 🔵 المرحلة 2 — AR/AP المتقدم

```
[Prompt-2.1: Payment Terms Engine]
أضف نموذج:
- PaymentTerm { id, code, name, type (net|due_on_receipt|installments|EOM_plus|2_10_net_30), netDays, discountDays, discountPercent, installments: PaymentTermInstallment[] }
- PaymentTermInstallment { id, termId, daysAfterInvoice, percentOfTotal }
- ربط customerId.paymentTermId و supplierId.paymentTermId
أنشئ:
- src/lib/payment-terms.ts: function calculateDueSchedule(invoice, term) -> [{dueDate, amount}]
- عند إصدار فاتورة، أنشئ تلقائياً InvoiceDueSchedule
- adjust aging logic to use due dates
```

```
[Prompt-2.2: Open Items & Cash Application Engine]
أضف نماذج:
- OpenItem { id, partyId, partyType (customer|vendor), documentType (invoice|payment|credit_note|debit_note|advance), documentId, amount, currency, openAmount, dueDate, status, agingBucket }
- ItemMatch { id, matcherUserId, matchedAt, items: [openItemId, appliedAmount], journalEntryId }
أنشئ:
- src/lib/open-items.ts
- عند POSTED للفاتورة/الدفعة: insert OpenItem
- function autoApply(payment, customerId): يحاول مطابقة الدفعة مع invoices حسب القواعد (oldest first, exact amount, by reference)
- function manualApply(matchData): تطبيق يدوي
- جزئي/كامل/over-payment
- API و UI للـ matching workbench
```

```
[Prompt-2.3: Customer Statements & Dunning Letters]
أضف نماذج:
- CustomerStatement { id, customerId, periodFrom, periodTo, openingBalance, closingBalance, items: [], generatedAt }
- DunningPolicy { id, name, levels: DunningLevel[] }
- DunningLevel { policyId, level, daysOverdue, action (email|sms|whatsapp|letter|call|legal), template, fee, interestRate }
- DunningRun { id, runDate, customerId, level, channelsUsed, status }
أنشئ:
- src/lib/dunning-engine.ts (cron daily)
- function runDunning(): يبحث عن fatura متأخرة، يحدد level، يرسل + يضيف fee/interest كـ open item
- generateStatement(customerId, period): PDF و email
- UI لإعداد سياسات + تتبع
```

```
[Prompt-2.4: Three-Way Matching Engine]
أنشئ:
- src/lib/three-way-match.ts
- function match(invoiceId): 
  - يجد PO المرتبط
  - يجد GRNs المرتبطة
  - يقارن: السعر (PO.price vs Invoice.price ± tolerance)
  - يقارن: الكمية (sum(GRN.qty) vs Invoice.qty ± tolerance)
  - يقارن: الإجمالي
  - status: matched | hold_price | hold_qty | hold_total | manual_review
- إذا hold: تجميد الدفع تلقائياً + إنشاء ApprovalRequest
- API و UI
- إعداد tolerance system في Settings
```

```
[Prompt-2.5: Withholding Tax (WHT)]
أضف نماذج:
- WithholdingTaxRule { id, code, name, rate, applicableTo (services|royalties|interest|dividends|rent), country, threshold, deductFrom (gross|net) }
- WithholdingTaxApplication { id, invoiceId, ruleId, baseAmount, withheldAmount, certificateNumber, paidToAuthorityDate }
على المدفوعات للموردين الأجانب أو حسب القاعدة، احسم WHT تلقائياً وأنشئ JE:
DR: Vendor (full amount)
CR: Cash (net)
CR: WHT Payable (withheld)
أنشئ تقرير WHT شهري للسلطات (ZATCA لمن يطبق).
```

```
[Prompt-2.6: Payment Runs (Batch Payments)]
أضف نماذج:
- PaymentBatch { id, runDate, paymentDate, currencyId, totalAmount, totalCount, status, bankAccountId, fileGenerated, fileFormat (SEPA|ACH|SWIFT|CSV) }
- PaymentBatchItem { batchId, vendorId, invoices: [openItemId, amount], totalToPay, paymentMethod }
أنشئ:
- src/lib/payment-run.ts
- function proposePayments(criteria: { dueWithinDays, vendors, minAmount, ...}): يولد proposal
- function approveBatch(batchId, userId)
- function generateBankFile(batchId): يولد ملف SEPA XML / SAR-WPS / ACH NACHA
- API + UI
```

---

### 🔵 المرحلة 3 — الخزينة والبنوك

```
[Prompt-3.1: Bank Statement Import]
أضف نماذج:
- BankStatement { id, bankAccountId, statementDate, openingBalance, closingBalance, fileFormat, fileName, importedAt, lines: BankStatementLine[] }
- BankStatementLine { id, statementId, valueDate, description, reference, debit, credit, balance, matchedTransactionId, matchStatus }
أنشئ parser لـ:
- MT940 (SWIFT)
- CAMT.053 (ISO 20022)
- OFX
- CSV (configurable mapping)
- src/lib/bank-statement-parsers/*.ts
```

```
[Prompt-3.2: Auto Bank Reconciliation Engine]
أنشئ:
- src/lib/bank-recon-engine.ts
- function autoMatch(statementId):
  لكل سطر:
  1. مطابقة بالـ exact amount + date ± 3 days + reference
  2. fuzzy match على الوصف (Gemini AI fallback)
  3. أنشئ tentative match — يحتاج موافقة المستخدم إن كانت confidence < 95%
- قواعد قابلة للتكوين (BankReconciliationRule):
  - "إذا وصف يحتوي 'STC' → حساب 5500 (مصروفات اتصالات)"
  - "إذا debit 100-200 من البنك X → bank charges 5800"
- UI: شاشة matching workbench
- بعد match: posting JE تلقائياً
```

```
[Prompt-3.3: Cash Flow Forecast]
أضف نماذج:
- CashFlowForecast { id, name, fromDate, toDate, currency, scenarios: CashFlowScenario[] }
- CashFlowScenario { id, forecastId, name (best|expected|worst), assumptions }
- CashFlowLine { scenarioId, date, category (operating|investing|financing), source, amount, certainty }
أنشئ:
- src/lib/cash-flow-forecast.ts: يجمع من
  - Open AR (expected receipts based on payment terms + history)
  - Open AP (expected payments)
  - Recurring (rent, salaries, utilities)
  - Forecasted sales orders
  - Capex pipeline
- UI: 13-week rolling forecast graph
- AI integration: استخدم Gemini لتحليل السيناريوهات
```

```
[Prompt-3.4: Loans & Investments]
أضف نماذج:
- Loan { id, type (received|given), counterpartyId, principal, currencyId, interestRate, interestType (simple|compound), startDate, maturityDate, paymentSchedule, accountId, balance }
- LoanPayment { loanId, paymentDate, principalAmount, interestAmount, journalEntryId }
- Investment { id, type (TBill|Bond|MM|Equity), counterpartyId, principal, yieldRate, purchaseDate, maturityDate, accruedInterest, marketValue }
أنشئ schedule generation (amortization) + monthly accrual JE.
```

```
[Prompt-3.5: Inter-Bank Transfers]
أنشئ:
- API POST /api/treasury/transfers مع: fromAccountId, toAccountId, amount, currency, fees, valueDate
- لو same currency: JE: DR ToBank, CR FromBank
- لو different currency: JE مع FX gain/loss
- multi-step approval لو > threshold
```

---

### 🔵 المرحلة 4 — الأصول الثابتة (الفجوة الأكبر 82%)

```
[Prompt-4.1: Asset Master Refactor]
أعد تصميم prisma schema للأصول:
- AssetCategory { id, code, name, defaultGLAccount (cost), defaultAccumulatedDepAccount, defaultDepExpenseAccount, defaultDisposalGainAccount, defaultDisposalLossAccount, defaultUsefulLifeYears, defaultDepMethod, defaultSalvagePercent }
- AssetClass { id, code, name } (Tangible/Intangible/Investment Property)
- FixedAsset (refactor):
  + categoryId, classId, parentAssetId (component accounting)
  + custodianEmployeeId, locationId, departmentId, costCenterId
  + acquisitionDate, capitalizationDate, retirementDate
  + acquisitionCost, salvageValue, usefulLifeMonths, depreciationStartDate
  + status (cwip|active|under_maintenance|disposed|impaired|fully_depreciated)
  + barcodes, photos, insurance fields, warranty
  + isLeased, leaseContractId
- AssetEvent { assetId, eventType (acquisition|capitalization|addition|transfer|impairment|revaluation|disposal|insurance_claim|maintenance|count), date, amount, journalEntryId, details }
- AssetBook { id, assetId, bookType (book|tax|ifrs|us_gaap), depMethod, usefulLife, salvage, basis }  ← multi-book
- DepreciationSchedule { id, assetBookId, period, plannedDep, actualDep, accumDep, netBookValue, journalEntryId, status }
```

```
[Prompt-4.2: Depreciation Methods Engine]
أنشئ src/lib/depreciation/*.ts:
- straightLine(book, periodIndex)
- decliningBalance(book, periodIndex, factor=2 for double)
- sumOfYearsDigits(book, periodIndex)
- unitsOfProduction(book, periodUnits, totalEstUnits)
- macrs(book, periodIndex, recoveryClass)
- groupDepreciation
كل دالة ترجع periodAmount + cumulativeAmount.
function generateSchedule(assetBookId): يولد كامل الجدول.
function runDepreciation(period): لكل asset, لكل book, يقفل period:
  - يحسب dep
  - posting JE: DR Dep Expense, CR Accumulated Dep
  - يحدث NBV
- conventions: half-year, mid-month, full-month, pro-rata
- catch-up depreciation
- bonus depreciation flag
```

```
[Prompt-4.3: CWIP & Capitalization]
أنشئ نموذج:
- CWIPProject { id, name, plannedCost, status, startDate, expectedCompletionDate }
- CWIPCost { projectId, date, sourceType (PO|Expense|Labor|Internal), amount, glAccountId, journalEntryId }
عند الاكتمال: 
- function capitalize(projectId, assetCategory, capitalizationDate): يولد FixedAsset, JE:
  DR: Asset (cost) 
  CR: CWIP (sum of accumulated)
- يبدأ depreciation
```

```
[Prompt-4.4: Asset Disposal & Retirement]
أنشئ:
- AssetDisposal { id, assetId, disposalType (sale|scrap|donation|theft|transfer_out), disposalDate, proceeds, customerId, journalEntryId }
- function disposeAsset:
  - posting JE:
    DR: Cash/AR (proceeds)
    DR: Accumulated Depreciation
    DR: Loss on Disposal (if loss)
    CR: Asset (cost)
    CR: Gain on Disposal (if gain)
  - حدث status للأصل
- API + UI
```

```
[Prompt-4.5: Asset Impairment & Revaluation (IAS 36, IAS 16)]
أضف:
- ImpairmentTest { assetId, testDate, recoverableAmount, carryingAmount, impairmentLoss, journalEntryId }
- Revaluation { assetId, valuationDate, fairValue, previousNBV, gain (OCI) | loss (P&L) }
دالة impairment: لو NBV > recoverable: post loss
دالة revaluation: post gain to OCI revaluation surplus.
دالة reversal of impairment (capped).
```

```
[Prompt-4.6: Lease Accounting (IFRS 16 / ASC 842)]
أضف نماذج:
- LeaseContract (refactor):
  + leaseType (operating_old|finance_old|ifrs16_rou)
  + commencementDate, leaseTermMonths
  + monthlyPayment, paymentFrequency, paymentTimingUpfront
  + discountRate (IBR), variablePaymentRules
  + isShortTerm, isLowValue (exemptions)
- ROUAsset { contractId, initialMeasurement, depreciation }
- LeaseLiability { contractId, initialMeasurement, openingBalance, payments[] }
- LeasePaymentSchedule { liabilityId, period, openingLiab, interest, principal, payment, closingLiab }
- LeaseEvent (modification|termination|extension)
أنشئ:
- function initializeLease(contract): present value calc, posting:
  DR: ROU Asset
  CR: Lease Liability
- monthly run: 
  DR: Interest Expense, CR: Lease Liability (interest)
  DR: Lease Liability, CR: Cash (payment principal)
  DR: Depreciation Expense, CR: Accumulated Dep ROU (ROU dep)
- modifications recalculate.
```

---

### 🔵 المرحلة 5 — المخزون المتقدم

```
[Prompt-5.1: Product Variants Engine]
أضف:
- ProductTemplate { id, name, code }
- ProductAttribute { id, name (Color, Size, Material) }
- ProductAttributeValue { attributeId, value, code }
- ProductVariant { id, templateId, attributeValues: [], sku, barcode, price, cost, ... }
حول Product الحالي ليكون template + variants متعددة.
```

```
[Prompt-5.2: Reorder Planning + Safety Stock]
أضف:
- ReorderRule { productId, warehouseId, minStock, maxStock, reorderPoint, reorderQty, safetyStock, leadTimeDays, supplierId }
- ReorderProposal { id, runDate, items: [], status }
- function runReorderPlanning(): فحص الكل ويولد proposal للـ POs
- function classifyABC(period): تصنيف ABC حسب revenue / volume / quantity
- function classifyXYZ(period): تصنيف XYZ حسب variance
- reports: slow-moving (no movement > 90 days), dead stock (> 365 days)
```

```
[Prompt-5.3: Stock Reservation Engine]
أضف نموذج StockReservation { productId, warehouseId, quantity, sourceType (SO|MO|Transfer), sourceId, reservedAt, expiresAt, status }.
عند تأكيد SO: reserve stock.
ProductStock يستعرض available = onHand - reserved.
عند shipment: convert reservation to issuance.
عند cancel SO: release reservation.
```

```
[Prompt-5.4: Standard Costing + Variance Analysis]
أضف:
- StandardCost { productId, effectiveDate, materialCost, laborCost, overheadCost, totalStdCost }
- VarianceTransaction { type (purchase_price|material_usage|labor_efficiency|overhead), productId, period, amount, journalEntryId }
عند GRN بسعر مختلف عن standard:
DR: Inventory (at standard)
DR: Purchase Price Variance
CR: GR/IR Clearing
عند MO consumption أكثر من BOM:
DR: Material Usage Variance
CR: Inventory
```

```
[Prompt-5.5: Cycle Counting Plans]
أضف:
- CycleCountPlan { id, name, frequency, abcClassFilter, warehouses, schedule }
- CycleCountSession { planId, date, items: [productId, expected, counted, variance, reason], status }
ABC-based: A daily, B weekly, C monthly.
```

```
[Prompt-5.6: Consignment, VMI, Drop Ship, Kit/Bundle]
- Consignment: نوع inventory ownership (own|customer_consigned|vendor_consigned)
- VMI: agreement + auto-replenishment trigger
- Drop ship: SO يولد PO مباشرة من vendor للعميل، لا يدخل المخزون
- Kit: BOM-like لكن للبيع؛ عند بيع Kit يقلص مكوناته
```

---

### 🔵 المرحلة 6 — التصنيع المتقدم

```
[Prompt-6.1: Multi-Level BOM Explosion]
أنشئ:
- function explodeBOM(productId, qty, level=0, results=[]): recursion يطبع كل المواد الخام مع المستوى
- where-used: function findUsages(componentProductId)
- BOM versioning: BOMVersion { recipeId, versionNumber, effectiveFrom, effectiveTo, status }
- ECO: EngineeringChangeOrder { id, productId, fromBomVersion, toBomVersion, reason, approvals, effectiveDate }
```

```
[Prompt-6.2: MPS, CRP, S&OP]
- MPS: Plan { period, productId, demandForecast, plannedProduction, projectedInventory }
- CRP: لكل MPS بند ، احسب workCenter loading vs capacity → bottleneck warning
- S&OP: aggregate planning بمستوى product family
```

```
[Prompt-6.3: Subcontracting]
أضف:
- SubcontractWorkOrder { id, vendorId, parentMOId, materialsToSend, expectedFinishedProduct, jobCharge }
- إرسال المواد: stock movement (مخزون vendor)
- استلام المنتج النهائي: GRN + JE للـ subcontracting cost
- يدخل cost في WIP
```

```
[Prompt-6.4: OEE / Downtime / NCR / CAPA]
- MachineDowntimeLog { machineId, startTime, endTime, reason (planned|breakdown|setup|material_shortage|labor), description }
- ProductionLog { moId, machineId, plannedRunTime, actualRunTime, plannedOutput, actualOutput, goodOutput, defectOutput }
- OEE = (Availability × Performance × Quality)
- NCR { id, sourceType (production|inventory|customer|vendor), description, severity, status }
- CAPA { ncrId, rootCauseAnalysis, correctiveAction, preventiveAction, owner, dueDate, effectivenessReview }
```

---

### 🔵 المرحلة 7 — الموارد البشرية المتقدمة (سعودي)

```
[Prompt-7.1: Org Structure & Position Management]
أضف:
- Department { id, code, name, parentDeptId, costCenterId, managerId }
- Position { id, code, title, deptId, jobGradeId, payScale, reportsToPositionId }
- JobGrade { id, code, level, salaryRangeMin, salaryRangeMax }
- ربط Employee.positionId
- Org chart visualization
```

```
[Prompt-7.2: End of Service (EOS) — Saudi Labor Law]
أضف function calculateEOS(employee, terminationDate, terminationReason):
- خدمة < 2 سنة: لا
- 2-5 سنوات: نصف شهر لكل سنة
- > 5 سنوات: نصف شهر لأول 5 + شهر كامل لكل سنة بعدها
- إذا استقالة: 1/3 إذا 2-5 سنوات، 2/3 إذا 5-10، كامل إذا > 10
- إذا فصل لخطأ: لا يوجد
- على آخر راتب أساسي + بدلات (housing, transport)
أنشئ FinalSettlement document مع:
- EOS calculation
- vacation balance encashment
- pending salaries
- loan deductions
- final JE
```

```
[Prompt-7.3: WPS (Wages Protection System)]
أنشئ:
- function generateWPSFile(payrollMonth, bankCode, format='SAR'):
  ينتج SIF File (Salary Information File) بصيغة:
  - Header: company info, total amount, count
  - Records: employee IBAN, salary, allowances
  - Trailer: hash
- format compliance with Saudi WPS / Mudad portal upload
- API: POST /api/payroll/wps/generate
```

```
[Prompt-7.4: GOSI / Mudad / Qiwa Integration]
- GOSI: 
  - calculate contributions: 9% employee + 9% employer + 2% unemployment SANED
  - monthly file generation
  - API integration if available (otherwise manual upload)
- Mudad: WPS + contracts upload
- Qiwa: contracts + employment status queries
- Absher / Muqeem: iqama validity API checks
```

```
[Prompt-7.5: Leave Engine]
أضف:
- LeaveType { code, name, isPaid, accrualBasis (per_year|per_service_period|fixed), accrualRate, carryForwardAllowed, maxCarryForward, encashable, halfDayAllowed }
- LeaveBalance { employeeId, leaveTypeId, fiscalYear, opening, accrued, taken, encashed, closing }
- LeaveRequest workflow: draft → pending → approved → taken
- public holidays calendar per location
- compensatory off
- annual leave: 21 يوم سعودي < 5 سنوات، 30 يوم > 5
- maternity, sick, hajj, bereavement
```

```
[Prompt-7.6: Travel & Expense (T&E)]
أضف:
- TravelRequest { employeeId, destination, fromDate, toDate, purpose, estimatedCost, advance }
- ExpenseClaim { id, employeeId, claimDate, lines: [{ category, date, amount, currency, receiptUrl, project, costCenter }], status }
- mobile receipt upload + OCR
- reimbursement runs
```

---

### 🔵 المرحلة 8 — المبيعات والمشتريات المتقدمة

```
[Prompt-8.1: Price Lists & Pricing Engine]
- PriceList { id, name, currency, validFrom, validTo, customerSegment, items: PriceListItem[] }
- PriceListItem { listId, productId, price, minQty, maxQty }
- PricingRule { id, condition (customer|segment|product|category|date|qty), action (override_price|discount_%|discount_$), priority }
- function calculateLinePrice(customer, product, qty, date): يطبق القواعد بالأولوية
```

```
[Prompt-8.2: Backorder & Drop Ship]
- عند SO بدون stock كافي: backorder line
- ETA based on supplier lead time
- auto-fulfill عند وصول stock
```

```
[Prompt-8.3: RMA & Warranty]
- ReturnMerchandiseAuthorization { id, customerId, originalInvoiceId, items, reason, status, refundMethod }
- WarrantyContract { productSerialId, customerId, warrantyType, periodMonths, startDate, claims }
- WarrantyClaim { contractId, issueDate, description, resolution (replace|repair|refund), cost }
```

```
[Prompt-8.4: Vendor Onboarding & Approved List]
- VendorOnboardingRequest { vendorData, attachedDocs, status, approvals }
- ApprovedVendorList per category
- Vendor compliance docs with auto-expiry alerts (CR, VAT cert, ISO, insurance)
```

```
[Prompt-8.5: Spend Analysis Dashboard]
- spend by vendor / category / period
- top 10 vendors
- price trend analysis
- savings opportunities (consolidation suggestions via AI)
```

---

### 🔵 المرحلة 9 — التقارير والامتثال

```
[Prompt-9.1: Comparative & Multi-Period Reports]
- TB / BS / IS مع أعمدة (current, previous, variance %, YTD, prior YTD)
- monthly trend
- multi-currency presentation
- consolidation
```

```
[Prompt-9.2: Statement of Changes in Equity & Cash Flow Direct]
- SCE: opening capital + share issuances - dividends + retained + OCI - treasury = closing
- Cash Flow Direct method: classify all cash movements directly
```

```
[Prompt-9.3: Custom Report Builder]
- User-defined queries
- Drag-drop dimensions/measures
- Save & share reports
- Schedule email delivery
- Excel/PDF export
- Drill-down to source documents
```

```
[Prompt-9.4: Statutory Reports]
- VAT Return (Saudi ZATCA format)
- WHT Return
- Zakat Calculation
- IFRS-formatted Financial Statements package
- SOCPA-compliant Saudi format
```

```
[Prompt-9.5: Notes to Financial Statements]
- مصمم Notes templates
- auto-fill from data
- significant accounting policies
- contingencies disclosure
```

---

### 🔵 المرحلة 10 — الحوكمة والأمان

```
[Prompt-10.1: SoD Matrix]
- conflict pairs (e.g., Vendor master change + Payment posting)
- matrix UI
- live conflict detection on user role assignment
```

```
[Prompt-10.2: Field-Level Permissions + Custom Fields]
- per role: visible fields, editable fields, masked fields
- CustomField { entityType, fieldName, dataType, validations, defaultValue }
- dynamic form rendering
```

```
[Prompt-10.3: SSO / 2FA / API Keys / Rate Limiting]
- SSO: SAML 2.0, OAuth, OIDC (Microsoft, Google, Okta)
- 2FA: complete TOTP, SMS, biometric webauthn
- ApiKey { id, ownerId, key (hashed), scopes, rateLimitPerMinute, lastUsed, expiresAt }
- middleware: rate limit per key, per IP, per user
```

```
[Prompt-10.4: Backup & Disaster Recovery]
- automated daily backups (PostgreSQL pg_dump → S3)
- point-in-time recovery
- restore validation
- DR runbook
- per-tenant export/import
```

---

### 🔵 المرحلة 11 — التكامل والذكاء الاصطناعي

```
[Prompt-11.1: AI-Powered Modules]
- AI Cash Application: Gemini يطابق المدفوعات بالفواتير من نص بنكي
- AI Anomaly Detection: على القيود اليومية (Z-score على المبالغ)
- AI Forecast: ARIMA / Prophet للمبيعات والمصروفات
- AI Document Understanding: تصنيف الفواتير الواردة تلقائياً
- AI Chatbot: للموظفين والعملاء (data grounding)
```

```
[Prompt-11.2: Open Banking & Payment Gateways]
- Tarabut Gateway / Lean (Saudi)
- Mada / SADAD / STC Pay
- HyperPay / PayTabs / Moyasar
- Stripe / PayPal للدولي
```

```
[Prompt-11.3: Webhook System & Public API]
- WebhookSubscription { ownerId, eventTypes, url, secret, retryPolicy }
- emit events: invoice.created, payment.received, ...
- HMAC signature
- public REST API documentation (OpenAPI 3.0 spec)
- API explorer UI
```

---

## 6. خارطة الطريق المرتبة حسب الأولوية

### الأولوية 1 (3 أشهر) — أساسات لا تستقيم بدونها
1. Numbering Sequences Engine (Prompt 0.1)
2. Document State Machine (Prompt 0.2)
3. Field-Level Audit (Prompt 0.3)
4. Period Close Engine (Prompt 0.4)
5. Approval Workflow Engine (Prompt 0.5)
6. Open Items + Cash Application (Prompt 2.2)
7. Three-Way Matching (Prompt 2.4)
8. Payment Terms Engine (Prompt 2.1)
9. EOS + WPS (Prompts 7.2, 7.3)
10. Asset Master refactor + multi-method depreciation (Prompts 4.1, 4.2)

### الأولوية 2 (3-6 أشهر) — قدرات الشركات المتوسطة
1. Bank Statement Import + Auto-Recon (Prompts 3.1, 3.2)
2. Recurring/Reversing JE (Prompt 1.1)
3. FX Revaluation (Prompt 1.2)
4. Customer Statements + Dunning (Prompt 2.3)
5. WHT (Prompt 2.5)
6. Payment Runs (Prompt 2.6)
7. Asset Disposal/Impairment/Revaluation (Prompts 4.4, 4.5)
8. Lease IFRS 16 (Prompt 4.6)
9. Product Variants (Prompt 5.1)
10. Reorder Planning + ABC/XYZ (Prompt 5.2)
11. Standard Costing + Variance (Prompt 5.4)
12. Multi-Level BOM (Prompt 6.1)
13. Subcontracting (Prompt 6.3)
14. Org structure + Leave engine (Prompts 7.1, 7.5)
15. Price Lists Engine (Prompt 8.1)
16. Comparative reports + Cash Flow Direct (Prompts 9.1, 9.2)

### الأولوية 3 (6-12 شهر) — التميّز التنافسي
1. Inter-Company + Consolidation (Prompt 1.3)
2. Allocations Engine (Prompt 1.4)
3. Revenue Recognition IFRS 15 (Prompt 1.5)
4. Cash Flow Forecast + Loans + Investments (Prompts 3.3, 3.4)
5. Stock Reservation + Cycle Count (Prompts 5.3, 5.5)
6. Consignment/VMI/Drop Ship/Kits (Prompt 5.6)
7. MPS/CRP/S&OP (Prompt 6.2)
8. OEE/CAPA (Prompt 6.4)
9. T&E Management (Prompt 7.6)
10. RMA/Warranty (Prompt 8.3)
11. Custom Report Builder (Prompt 9.3)
12. Statutory Reports (VAT/WHT/Zakat) (Prompt 9.4)
13. SoD Matrix (Prompt 10.1)
14. SSO + API Keys + Rate Limit (Prompt 10.3)

### الأولوية 4 (12+ شهر) — أنظمة القمة
1. Multi-GAAP / Multi-Book Universal Journal
2. Material Ledger
3. Group Reporting / Consolidation متقدم
4. Treasury Management كامل (cash pooling, in-house bank, hedging)
5. APS (Advanced Planning & Scheduling)
6. PLM/ECM متكامل
7. ماركت بليس وموردين B2B
8. AI-driven CFO insights متقدم

---

## 7. ملاحظات ختامية

### مقاييس النجاح
- تطبيق المرحلة 1 وحدها يرفع نسبة الاكتمال من 37% إلى ~55%
- المرحلة 2 ترفعه إلى ~75%
- المرحلة 3 ترفعه إلى ~88%
- المرحلة 4 تجعله منافساً لـ NetSuite/Odoo Enterprise

### التوصيات النهائية
1. **لا تبدأ بالـ "حسن الشكل"** — ابدأ بالـ Foundation Layer (المرحلة 0). كل ميزة لاحقة تستفيد منها.
2. **اختبر على tenant واحد فقط أولاً** قبل النشر على جميع العملاء.
3. **حافظ على backwards compatibility** خلال الانتقال — الـ auto-journal الحالي يجب أن يستمر بالعمل.
4. **أنشئ regression test suite** قبل أي migration كبير.
5. **وثق كل تغيير في schema** مع migration plan مكتوب.
6. **استعن بمحاسب قانوني سعودي (SOCPA)** لمراجعة منطق EOS, GOSI, WPS, ZATCA.
7. **تكلفة الإنجاز:** فريق 3-4 مطورين Full-Stack + محاسب لمدة 12-15 شهراً.

---

**نهاية التقرير**
