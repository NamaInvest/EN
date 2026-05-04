# Namasoft ERP — تقرير الفحص الشامل والبرومنتات الجاهزة

**تاريخ الفحص:** 2026-05-04
**الطريقة:** قراءة فعلية لكود الـ APIs والـ Pages والـ Engines
**النطاق:** ~283 موديول/مكون عبر 4 قطاعات
**المرجعيات للمقارنة:** SAP S/4HANA، Oracle Fusion، NetSuite، Odoo، Shopify، Workday، Salesforce، HubSpot، الأنظمة السعودية (Aliphia/DEXEF/Onyx)

---

## ملفات هذا التقرير

| الملف | المحتوى |
|------|--------|
| **تقارير الفحص** | |
| `01_finance_audit.md` | حالة كل موديول مالي/محاسبي (35 موديول) |
| `02_commerce_audit.md` | حالة المبيعات/المشتريات/المخزون/التصنيع (28 موديول) |
| `03_hr_crm_pos_audit.md` | حالة HR/CRM/POS/Portals/Fleet (40 مكون) |
| `04_system_ai_audit.md` | حالة النظام/AI/Admin/Security (~80 موديول) |
| **البرومنتات الجاهزة** | |
| `10_PROMPTS_FINANCE.md` | 15 برومنت + سيناريو + فلو للفجوات المالية |
| `11_PROMPTS_COMMERCE.md` | 12 برومنت للتجارة والتصنيع |
| `12_PROMPTS_HR.md` | 10 برومنتات للموارد البشرية |
| `13_PROMPTS_POS_CRM.md` | 8 برومنتات للـ POS/CRM/Portals |
| `14_PROMPTS_SYSTEM.md` | 12 برومنت للنظام/AI/Security |

**المجموع:** **57 برومنت جاهز** = 57 فجوة محددة بدقة، لكل واحدة سيناريو + فلو + Schema + API + UI + Tests.

---

## النتيجة الإجمالية للفحص

| الحالة | العدد التقريبي | النسبة |
|------|------|------|
| ✅ FULL (جاهز للإنتاج) | ~148 | 53% |
| 🟡 PARTIAL (يحتاج إكمال) | ~109 | 39% |
| 🔴 STUB (إطار بدون منطق) | ~18 | 6% |
| ⚪ NOT_FOUND | ~8 | 2% |
| **الإجمالي** | **~283** | 100% |

---

## فهرس البرومنتات الـ 57

### 1️⃣ المالية والمحاسبة (15 برومنت في `10_PROMPTS_FINANCE.md`)

| رقم | الفجوة | الأولوية |
|---|------|------|
| F-01 | FX Revaluation حقيقي (الأسعار حالياً hardcoded!) | 🔴 |
| F-02 | Payment Run Engine + ملفات بنكية (SEPA/SWIFT/WPS) | 🔴 |
| F-03 | Dunning Engine + Email/SMS/WhatsApp + late fees | 🔴 |
| F-04 | IFRS 9 Expected Credit Loss | 🟠 |
| F-05 | Customer/Vendor Statement PDF محسن + email scheduler | 🔴 |
| F-06 | WHT كامل + Certificates + Monthly XML for ZATCA | 🟠 |
| F-07 | Bank Statement Import (CAMT.053 + OFX) | 🟠 |
| F-08 | Multi-Book Accounting (IFRS / Tax / Zakat) | 🟠 |
| F-09 | Component Depreciation + Multi-Book Asset Books | 🟡 |
| F-10 | Period Close متقدم (Auto-Reverse + RE + Sub-ledger Recon) | 🟠 |
| F-11 | Customer/Vendor Hierarchy + Multi-Ship/Bill-To | 🟡 |
| F-12 | Recurring JE + Templates + Auto-Reverse | 🟡 |
| F-13 | Cost Allocation متقدم (Step-down + Reciprocal) | 🟡 |
| F-14 | IFRS 15 Revenue متقدم (Performance Obligations + Milestones) | 🟡 |
| F-15 | Lessor Accounting + Lease Modification + Sub-lease | 🟡 |

### 2️⃣ التجارة والتصنيع (12 برومنت في `11_PROMPTS_COMMERCE.md`)

| رقم | الفجوة | الأولوية |
|---|------|------|
| C-01 | E-Commerce Frontend (لا يوجد!) | 🔴 |
| C-02 | Subscription Billing / Recurring Invoices إنتاجي | 🟠 |
| C-03 | Quote-to-Invoice + Quote Versions | 🟠 |
| C-04 | Product Variants (Size/Color/Material) | 🟠 |
| C-05 | Lot Lifecycle (Expiry/Quarantine/FEFO) | 🟠 |
| C-06 | Bin-Level WMS (Putaway + Pick Strategies) | 🟡 |
| C-07 | Quality Management (NCR/CAPA/Inspection) | 🟠 |
| C-08 | Production Scheduling + Capacity Planning (MPS/CRP/APS) | 🔴 |
| C-09 | Subcontracting (Job Work) | 🟡 |
| C-10 | Receipt Printing + POS Session + Card Payment | 🔴 |
| C-11 | RMA / Warranty Management | 🟠 |
| C-12 | Three-Way Match Workbench | 🟡 |

### 3️⃣ الموارد البشرية والرواتب (10 برومنتات في `12_PROMPTS_HR.md`)

| رقم | الفجوة | الأولوية |
|---|------|------|
| H-01 | Mudad / Qiwa / Absher / Muqeem API Integration | 🔴 |
| H-02 | Leave Approval Workflow (Manager → HR → Finance) | 🟠 |
| H-03 | Org Chart / Departments / Reporting Manager | 🟠 |
| H-04 | Performance Mgmt (OKRs / Goals / 360) | 🟡 |
| H-05 | Travel & Expense (Concur-style) | 🟡 |
| H-06 | Employee Self-Service Portal | 🟠 |
| H-07 | Multi-Shift Scheduling + Overtime Rules | 🟠 |
| H-08 | Selective Payroll + PDF Slip + Bank Batch | 🟠 |
| H-09 | GOSI Auto-Detect Nationality + Special Categories | 🔴 |
| H-10 | Recruitment ATS + Onboarding Workflow | 🟡 |

### 4️⃣ POS / CRM / Portals (8 برومنتات في `13_PROMPTS_POS_CRM.md`)

| رقم | الفجوة | الأولوية |
|---|------|------|
| P-01 | CRM Pipeline + Opportunities + Activities | 🔴 |
| P-02 | Customer Self-Service Portal (B2B) | 🟠 |
| P-03 | Restaurant Tables + KDS + Reservations | 🟠 |
| P-04 | Fleet GPS + Preventive Maintenance | 🟡 |
| P-05 | Marketing Automation / Email Campaigns | 🟠 |
| P-06 | Loyalty Tiers + Cashback | 🟡 |
| P-07 | Field Service / Repair Tickets | 🟡 |
| P-08 | Payment Gateway Integration (Mada/Apple Pay/STC) | 🔴 |

### 5️⃣ النظام / الأمان / AI / التكاملات (12 برومنت في `14_PROMPTS_SYSTEM.md`)

| رقم | الفجوة | الأولوية |
|---|------|------|
| S-01 | TOTP حقيقي (الحالي وهمي يقبل أي 6 أرقام!) | 🔴 |
| S-02 | AI Privacy Filter (يُرسل البيانات الكاملة لـ Gemini الآن!) | 🔴 |
| S-03 | Custom Fields Engine (Builder UI) | 🟠 |
| S-04 | Custom Report Builder (Dynamic) | 🟠 |
| S-05 | Distributed Job Queue (Bull/Redis) | 🟠 |
| S-06 | Redis Caching Layer | 🟠 |
| S-07 | API Keys + Rate Limiting | 🟠 |
| S-08 | Outgoing Webhooks Configurable | 🟡 |
| S-09 | Backup/Restore Automation + DR | 🔴 |
| S-10 | Enterprise SSO + NAFATH | 🟡 |
| S-11 | Multi-Time-Zone Support | 🟡 |
| S-12 | Observability / APM (Sentry/Grafana) | 🟠 |

---

## ⚠️ أخطر 7 فجوات (يجب معالجتها فوراً)

| # | الفجوة | الموقع | لماذا حرجة؟ |
|---|------|------|------|
| 1 | TOTP وهمي | S-01 | يقبل أي 6 أرقام = اختراق سهل |
| 2 | AI يرسل البيانات الكاملة لـ Gemini | S-02 | تسرب بيانات عملاء وأرصدة |
| 3 | FX Rates مرمزة في الكود | F-01 | تقارير العملات غلط دائماً |
| 4 | E-Commerce Frontend غير موجود | C-01 | يفقد قطاع كامل من الإيرادات |
| 5 | Payment Gateway غير متكامل | P-08 | لا يمكن الدفع أونلاين |
| 6 | Backup يدوي | S-09 | فقدان بيانات لو حصل عطل |
| 7 | Mudad/Qiwa API غير متكاملة | H-01 | عمليات WPS يدوية = أخطاء امتثال |

---

## كيفية الاستخدام

### السيناريو 1: "أريد إصلاح فجوة معينة"
1. افتح ملف الفحص (01-04) → احصل على الحالة الحالية الدقيقة.
2. افتح ملف البرومنتات (10-14) → اختر الفجوة.
3. انسخ البرومنت كاملاً.
4. ألصقه في جلسة Claude Code جديدة.
5. الـ Claude سيُنفِّذ: Schema + Migration + API + UI + Tests.

### السيناريو 2: "أريد خطة عمل لـ 3 شهور"
ابدأ بالـ 7 الحرجة (Top 7) ثم اتبع الترتيب:
- **الشهر 1:** S-01, S-02, S-09, F-01, F-05 (أمن + خصوصية + بنية تحتية)
- **الشهر 2:** F-02, F-03, P-08, C-10, H-01 (المالية والمدفوعات)
- **الشهر 3:** C-01, P-01, F-06, F-07, H-09 (نمو الإيرادات + امتثال)

### السيناريو 3: "أريد المقارنة بنظام معين"
كل برومنت يذكر النظام المرجع (SAP / Oracle / NetSuite / Odoo / Workday / Salesforce / Aliphia/DEXEF) ضمن "السيناريو العالمي".

---

## أكثر القطاعات نضوجاً (FULL ≥ 70%)

1. ZATCA E-Invoicing (Phase 1 + 2)
2. Manufacturing core (BOM Explosion + MRP + Material Issuance)
3. Inventory core (FIFO/LIFO/Avg + Multi-warehouse + Batch + Serial)
4. ZATCA-related Audit + Numbering Engines
5. WPS SIF generation (Saudi)
6. EOS calculation (Saudi Labor Law 84-87)
7. Document Expiry Alerts (16 doc types)
8. Auto-Journal coverage (13 سيناريو)
9. AI Copilot UI (Gemini)
10. Petty Cash + Treasury basics

## أكثر القطاعات احتياجاً للتطوير (PARTIAL/STUB ≥ 50%)

1. E-Commerce Frontend (لا يوجد فعلياً)
2. Production Scheduling / Capacity Planning
3. Multi-Book Accounting
4. CRM Pipeline / Opportunities
5. Self-Service Portals (Customer + Employee)
6. Marketing Automation
7. Subscription Billing
8. Quality Management (NCR/CAPA)
9. Fleet GPS Real-time
10. AI Privacy Layer

---

## مرجع للتحقق

كل تقييم في الملفات 01-04 مبني على:
- ✅ قراءة كاملة لـ `route.ts` المعني (وليس مجرد الاسم).
- ✅ قراءة كاملة لـ `page.tsx` المعنية.
- ✅ قراءة كاملة لـ `engine.ts` في `src/lib/`.
- ✅ مقارنة بأنظمة عالمية محددة.

**فحص بدون استخدام أي وثائق سابقة** (Gap Analysis القديمة تم تجاهلها كما طلب المستخدم) — كل التقييمات من قراءة الكود الحالي مباشرة.
