# 🎯 Namasoft ERP — Master Audit Report

**التاريخ:** 2026-05-06
**نطاق الفحص:** كامل المشروع — كود + قاعدة بيانات + إنتاج Hetzner + امتثال سعودي + مقارنة عالمية

---

## 📊 ملخص تنفيذي

| البُعد | الحالة |
|-------|--------|
| **عدد الـ modules** | 83 (79 نشط + 4 مكسور) |
| **عدد الصفحات** | 316 page.tsx |
| **عدد API routes** | ~330 |
| **عدد Prisma models** | 376 |
| **النضج الإجمالي vs الأنظمة العالمية** | ~58% |
| **الامتثال السعودي** | 65% (ZATCA/GOSI/WPS مكتمل، Qiwa/PDPL/Zakat ناقص) |
| **مشاكل أمنية حرجة** | ✅ تم إصلاحها (12 ملف) |
| **TypeScript errors** | 195 خطأ (90 ملف) |
| **ESLint issues** | 3,829 (2,707 خطأ + 1,122 تحذير) |
| **Production DB** | 11 tenant DB، 19 role، Redis معطل (يحتاج reinstall) |

---

## ✅ ما تم إصلاحه في هذه الجلسة

### بنية تحتية (Production)
- ✅ إنشاء 8 PostgreSQL roles مفقودة (ahmedalyamicompany_db، nama_main_db، إلخ)
- ✅ تطبيق GRANT ALL على كل الـ 11 tenant DBs
- ✅ إصلاح صلاحيات `n1_db` (كانت user_select=f → t)
- ✅ إنشاء role `namadb` المفقود
- ✅ إعادة بناء `n1.namainvist.com/.env` (4 → 19 سطر)
- ✅ إضافة `n1-main` لـ PM2 (online)
- ✅ زيادة `vm.max_map_count=655300` و `vm.overcommit_memory=1`
- ⚠️ Redis: تم تشخيصه (symlink مكسور: `/usr/bin/redis-server -> redis-check-rdb`) — يحتاج purge كامل + reinstall نظيف

### الأمن (Critical)
أُزيلت كل **hardcoded credentials** من 12 ملف:
- `src/lib/prisma.ts`
- `src/lib/quotaGuard.ts` (موضعين)
- `src/app/api/auth/sso-redirect/route.ts`
- `src/app/api/auth/login-by-email/route.ts`
- `src/app/api/auth/find-tenant-by-email/route.ts` (موضعين)
- `src/app/api/tenant/trial-status/route.ts` (موضعين)
- `src/app/api/tenant/check-status/route.ts`
- `src/app/api/tenant/provision/route.ts` (3 مواضع: SSH host/user/pass + DB URL)
- `src/app/api/tenant/hidden-modules/route.ts`
- `src/app/api/branches/route.ts`
- `src/app/api/ice/toggle/route.ts`
- `src/app/api/ice/tenants/route.ts`

النمط المستخدم: `process.env.X || throw new Error('X is required')` بدلاً من fallback hardcoded.

تم تحديث `.env` بإضافة:
- `MASTER_DB_URL` (للتوجيه multi-tenant)
- placeholders لـ `PROVISION_SSH_*`

⚠️ **خطوات ضرورية بعدية:**
1. غيّر passwords الإنتاج (n1_pass123, n11_pass123, RootPassNama123)
2. امسح git history للـ creds القديمة (BFG Repo-Cleaner)
3. أضف `MASTER_DB_URL` و `PROVISION_SSH_*` إلى Hetzner .env

---

## 🏗️ ما هو موجود (الـ Modules النشطة — 79 module)

**التصنيف الكبير حسب الحجم والنضج:**

### 🔵 Very High Complexity (1000+ UI elements)
| Module | Pages | الميزات الأساسية |
|--------|-------|------------------|
| **manufacturing** | 24 | BOM، MRP، Routing، WO، QC، Capacity، OEE، Lean Kanban، Scheduler، Digital Twin، Blockchain Tracing |
| **accounting** | 26 | Multi-book GL، COA، Banks، Journals، Trial Balance، Period Close، Revenue Recognition، LC، Leases |
| **hr** | 19 | Payroll، Attendance، Leaves، Loans، Training، Recruitment، Evaluations، GOSI، WPS، Mudad |
| **finance** | 18 | Budget Control، Cash Flow، Consolidation، ECL، FX Reval، Variance، WHT، Dunning |
| **v3** | 34 | 8 verticals (Clinic، Construction، Distribution، Restaurant، Retail، School، Services) |

### 🟢 High Complexity (500-1000 elements)
sales (15), inventory (10), enterprise (10), purchases (10), reports (17)

### 🟡 Medium Complexity (200-500 elements)
settings (12), procurement (4), school (7), tax (5), treasury (6)

### 🟠 Low Complexity (50-200 elements)
clinic (3), fleet (4), pos-demo (1), أكثر من 30 module CRUD بسيطة

### 🔴 المكسور (4 modules بدون page.tsx):
- `company-info` — بنية فقط، بدون UI
- `marketing` — folder فاضي
- `support` — لا يوجد ticketing UI
- `v3-master` — placeholder

### ⚠️ Frontend-only (15 module بدون API):
affiliates، ai-bank، ai-copilot، ai-scm، barcode، dashboard، docs، pos-dashboard، pos-demo، profile، receipt-vouchers، restaurant-tables، scm، shl، whatsapp-hub

---

## 🌍 المقارنة العالمية (vs SAP / Oracle / Dynamics / Odoo)

### نقاط القوة (تتقدم على NetSuite/Odoo):
- ✅ ZATCA Phase 2 e-invoicing مكتمل
- ✅ IFRS-9 (ECL Models)، IFRS-15 (Revenue Recognition + Performance Obligations)، IFRS-16 (Lease Accounting + ROU)
- ✅ Multi-book Accounting + Consolidation + FX Revaluation
- ✅ BPM Workflows + Saga Orchestration
- ✅ AI integration (CFO، Copilot، Vision-based stocktake، Fraud detection)
- ✅ Manufacturing مع OEE، Telemetry، Blockchain traceability

### النضج بالنطاق:
| النطاق | % | أهم فجوة | الجهد |
|--------|---|----------|-------|
| GL & Multi-currency | 70% | Universal Journal dimensions على JE lines | M |
| AR & Credit Mgmt | 65% | Real-time credit-limit check at SO entry | M |
| AP & Vendor Mgmt | 60% | OCR vendor invoice → auto-3WM → auto-post | M |
| Fixed Assets | 55% | Componentization (IFRS) + parallel tax/book books | M |
| Cash Mgmt | 60% | MT940/CAMT.053 import + multi-bank pooling | M |
| Budgeting | **35%** | Driver-based planning + rolling forecast + scenarios | L |
| Cost Accounting / CO-PA | **40%** | Profit center + ABC + margin by customer/product | L |
| Tax (VAT/WHT/Zakat) | 65% | Zakat engine + VAT auto-filing | M |
| Inventory | 70% | Multi-valuation (FIFO+StdCost concurrent) | M |
| Procurement | 70% | Category mgmt + spend analytics + e-auction | L |
| Sales / Q2C / CRM | 65% | CPQ + Rebate mgmt + Sales forecasting | L |
| Manufacturing | 65% | Finite-capacity APS scheduler + MES shop-floor | L |
| Project & Job Costing | **35%** | WBS hierarchy + EVM (CPI/SPI) + project billing | L |
| HR & Payroll | 70% | Qiwa + Muqeem + Nitaqat + LMS | M |
| Real Estate | 60% | Tenant portal + maintenance + utilities | M |
| Service / Maintenance | **45%** | SLA + field-service mobile + PM scheduler | L |
| WMS | 50% | Wave/zone picking + slotting + RF UI + yard | L |
| Quality Mgmt | **40%** | Inspection plans + SPC charts + calibration | M |
| Compliance & Audit | 60% | Real-time SoD alerts + tamper-evident hashing | M |
| Reporting & BI | 50% | Semantic cube + drill-down + persona dashboards | L |

**النضج الإجمالي:** ~58%

### Roadmap عشري بترتيب الأولوية:
1. **Universal Journal dimensions** على كل JE line (cost-center، profit-center، project، segment، product) — أساس لكل شيء بعده
2. **Profitability Analysis (CO-PA)** — هامش حسب عميل × منتج × منطقة × مندوب
3. **Real-time credit check on SO** — يبلوك تأكيد الطلب لو exposure > limit
4. **OCR vendor invoice → auto-3WM → auto-post** — توفير عمالة AP
5. **Driver-based budgeting + rolling forecast** — نضج التخطيط
6. **Fixed-asset componentization + parallel books** — IFRS
7. **Zakat calculator + VAT auto-filing** — متطلب سعودي
8. **APS finite-capacity scheduler** — ميزة تصنيع
9. **Project WBS + EVM** — قطاع خدمات/إنشاءات
10. **Semantic BI + persona dashboards** — تسريع القرار

---

## 🇸🇦 الامتثال السعودي

| # | المنطقة | الحالة | الفجوة الحرجة | الغرامة |
|---|---------|--------|----------------|---------|
| 1 | ZATCA E-Invoicing | ✅ Implemented | لا يوجد retry queue للـ clearance | 5K-50K SAR / فاتورة |
| 2 | VAT 15% | 🟡 Partial | لا يوجد `VATCategory` (zero-rated/exempt/reverse) على line | 10K-50K + 5%/شهر |
| 3 | Zakat 2.5% | 🔴 **UI stub فقط** | لا يوجد engine ولا declaration | 25K SAR + تقدير |
| 4 | WHT | 🟡 Partial | لا يوجد foreign-vendor flag، لا Form 14 PDF | 1K-10K + 1%/شهر |
| 5 | GOSI | ✅ Implemented | لا يوجد reconciliation مع Mudad | 100/يوم/عامل |
| 6 | WPS (SIF) | ✅ Implemented | لا يوجد bank-rejection feedback loop | تعليق Qiwa |
| 7 | Mudad | 🟡 Partial | فقط WPS submit، لا contract auth ولا attendance | لا يدفع رواتب |
| 8 | **Qiwa** | 🔴 **Missing** | لا يوجد client أو Saudization/Nitaqat | تجميد visas |
| 9 | Saudi Labor Law / EOS | ✅ Implemented | Ramadan-hours auto-switch ناقص | EOS underpayment |
| 10 | **PDPL** | 🟡 Partial | لا data-subject-request، لا breach-notification | **5,000,000 SAR** |
| 11 | Real Estate / Ejar | 🔴 Missing | لا Ejar API، لا REGA validation | 100K SAR |
| 12 | Saudi Customs / FASAH | 🔴 Missing | لا HS-code، لا declarations | احتجاز شحنات |
| 13 | SOCPA Chart | ✅ Implemented | لا seeder template، لا notes | غرامات SOCPA |
| 14 | Hijri Calendar | 🟡 Partial | converter موجود لكن لا حقول مزدوجة | مخاطر تشغيلية |
| 15 | Arabic & RTL | ✅ Implemented | بعض models بدون `nameAr` | ZATCA يرفض الفاتورة |

### ⚡ أعجل 5 فجوات امتثالية يجب إغلاقها:
1. **Qiwa + Saudization** — أعلى مخاطر تشغيلية
2. **PDPL data-subject-rights + breach module** — أعلى غرامة (5 مليون)
3. **Zakat engine + annual declaration** — متطلب سنوي إجباري
4. **VAT classification fields + reverse-charge** — كل تصدير/استيراد حالياً خاطئ
5. **WHT foreign-vendor flag + Form 14** — مسؤولية شخصية إذا لم يُخصم

---

## 🐛 الأخطاء البرمجية المتبقية

### TypeScript (195 خطأ)
| الفئة | العدد | المشكلة |
|-------|------|---------|
| TS2344 | 87 | Next.js 16 params: `Promise<{ id }>` بدلاً من `{ id }` |
| TS2304 | 30 | imports مفقودة (`Button`, `ChevronRight`, ...) |
| TS2353 | 27 | حقول مش موجودة في schema (`assetName`, `totpSecret`, `productId_stockId`) |
| TS2339 | 18 | دوال مفقودة (`MfaEngine.verifyToken`, `WHTEngine.markAsPaid`, ...) |
| TS2551 | 7 | typo: `currentValue` → `currentBookValue` |

### ESLint (3,829 issue)
- **2,321** `no-explicit-any` (كثير `any` غير ضروري)
- **969** `no-unused-vars`
- **128** `react-hooks/exhaustive-deps`
- **62** `react-hooks/immutability` ⚠️ **runtime crashes محتملة** (مثل `fetchData()` قبل التعريف)
- **4** `react-hooks/rules-of-hooks` ⚠️ **crashes أكيدة** في `src/app/admin/saas/page.tsx`

### المسارات المعطلة Runtime (يستدعي دوال غير موجودة):
- `src/app/api/auth/2fa/*` — `MfaEngine` ينقصه `setupTOTP`، `verifyToken`، `verifyAndEnableTOTP`، `generateBackupCodes`
- `src/app/api/finance/wht/*` — `WHTEngine` ينقصه `getPendingWHTTransactions`، `markAsPaid`
- `src/app/api/finance/dunning/*` — `DunningEngine` ينقصه `getDunningHistory`، `runDunningCron`
- `src/app/api/finance/payment-runs/[id]/execute/*` — `PaymentRunEngine` ينقصه `executePayments`
- `src/app/api/assets/depreciate/*` — `prisma.depreciation` لا يوجد (الصحيح `prisma.assetDepreciationLog`)
- `src/app/api/fixed-assets/[id]/depreciate/*` — يستخدم `currentValue`/`purchaseCost`/`assetName` (الصحيح `currentBookValue`/`acquisitionCost`/`name`)

### Migrations معلقة
- `20260501_add_manufacturing_accounts`
- `20260501_add_numbering_sequences`

---

## 🚀 برومتات + سيناريوهات + فلوهات (للفجوات الأهم)

### النمط: لكل فجوة تجد:
- **الهدف** (1 سطر)
- **البرومت الجاهز** (تنفذه بأمر `/erp-build-feature`)
- **سيناريو الاستخدام** (مثال عملي)
- **فلو البيانات** (ASCII)

---

### 🔥 فجوة 1: Qiwa Integration + Nitaqat Engine
**الهدف:** ربط النظام بمنصة قوى لتسجيل العقود وحساب نطاقات السعودة

**البرومت الجاهز:**
```
أنشئ موديول Qiwa integration كامل:
1. Schema: Add to prisma/schema.prisma:
   - GovApiCredentials (provider='QIWA', clientId, clientSecret, scope, accessToken, expiresAt)
   - SaudizationSnapshot (id, periodMonth, totalEmployees, saudiCount, totalWeight, saudiWeight, nitaqatBand, color, calculatedAt)
   - Employee.qiwaContractId (string?)
   - Employee.qiwaContractStatus (NEW|AUTHENTICATED|TERMINATED)

2. Create src/lib/saudi-gov/qiwa.ts:
   - authenticate() → OAuth2 token
   - registerEmployee(empId)
   - authenticateContract(empId, contractData)
   - terminateContract(empId, reason)
   - getNitaqatStatus()

3. Create src/lib/saudization-engine.ts:
   - Nitaqat weights: Saudi female=2, Saudi male=1, expat=0
   - Nitaqat bands: Platinum/Green/Yellow/Red per business size
   - Calculate monthly snapshot

4. APIs:
   - POST /api/hr/qiwa/contracts/[employeeId]/authenticate
   - POST /api/hr/qiwa/contracts/[employeeId]/terminate
   - GET /api/hr/qiwa/saudization/current
   - POST /api/hr/qiwa/saudization/snapshot

5. UI:
   - src/app/(dashboard)/hr/qiwa/page.tsx (lookup employee + sync)
   - src/app/(dashboard)/hr/saudization/page.tsx (Nitaqat dashboard)

6. Cron job: nightly snapshot + alert if band < Green

اتبع منهجية CLAUDE.md: قراءة الفلو → schema → API → UI → tests.
لا تكتب على الحسابات الرقابية يدوياً (لا توجد قيود محاسبية لهذه الميزة).
```

**سيناريو:**
1. شركة Acme توظف موظف سعودي جديد → الـ HR يفتح صفحة الموظف ويضغط "ربط بقوى"
2. النظام يستدعي `qiwa.registerEmployee()` ويسجّل العقد
3. آخر الشهر: cron يحسب snapshot — إذا Nitaqat صار أصفر، تنبيه للـ HR Manager
4. Dashboard يبين النسبة الحالية + الموظفين المطلوب توظيفهم للوصول لـ Green

**فلو البيانات:**
```
HR User → Qiwa Page → POST /api/hr/qiwa/.../authenticate
                            ↓
                     qiwa-client.ts (OAuth2)
                            ↓
                     Qiwa.gov.sa API
                            ↓
              Update Employee.qiwaContractId
                            ↓
                  AuditLog entry created
                            ↓
                     Return success → UI

[Nightly]
Cron 00:00 → saudization-engine.ts.calculateSnapshot()
           → Read all active employees from current tenant
           → Group by gender/nationality
           → Compute weights → Determine band
           → Insert SaudizationSnapshot
           → If band < Green: AlertEngine.notify(HR_MGR)
```

---

### 🔥 فجوة 2: PDPL Compliance Module
**الهدف:** تطبيق نظام حماية البيانات السعودي (الغرامة 5 مليون)

**البرومت الجاهز:**
```
أنشئ moduel PDPL كامل:

1. Schema:
   - DataSubjectConsent (id, userId, purpose, granted, grantedAt, revokedAt, ipAddress, userAgent)
   - DataSubjectRequest (id, userId, type=ACCESS|RECTIFY|ERASE|PORTABILITY, status=NEW|IN_PROGRESS|COMPLETED, requestedAt, dueDate (=requestedAt + 30 days), completedAt, response: Json)
   - BreachIncident (id, detectedAt, type, severity, affectedUsers (count), description, notifiedAuthorityAt, notifiedUsersAt, slaDueAt (=detectedAt + 72h), status)
   - User.dpoFlag (boolean) — Data Protection Officer

2. APIs:
   - POST /api/pdpl/consent (record consent)
   - DELETE /api/pdpl/consent/[id] (revoke)
   - POST /api/pdpl/dsr (data subject request — access/rectify/erase/portability)
   - GET /api/pdpl/dsr/[id] (status)
   - POST /api/pdpl/breach (report breach)
   - GET /api/pdpl/breach/active (list with SLA)

3. Engine: src/lib/pdpl-engine.ts
   - registerConsent(userId, purpose)
   - processAccessRequest(userId) → exports user PII as JSON
   - processErasureRequest(userId) → anonymize records (set to '<REDACTED>')
   - processPortabilityRequest(userId) → CSV export of all related records
   - reportBreach(...) → triggers 72h SLA timer + alerts

4. UI:
   - src/app/(dashboard)/admin/pdpl/page.tsx (DPO dashboard)
   - src/app/profile/data-rights/page.tsx (user-facing: view/export/delete)

5. Cron: hourly check breach SLA — if 70% of 72h elapsed, alert DPO
```

**سيناريو:**
1. عميل يطلب نسخة من بياناته → Profile > Data Rights > Request Access
2. النظام ينشئ DSR بـ `dueDate = now + 30 days`
3. DPO يرى الطلب في dashboard، يشغل export → JSON ينزل على عميل
4. تسرب أمني: مدير IT يفتح PDPL > Report Breach → Timer 72h يبدأ، تنبيهات مستمرة

**فلو البيانات:**
```
User → /profile/data-rights → POST /api/pdpl/dsr
                                    ↓
                         pdpl-engine.processAccessRequest(userId)
                                    ↓
                Read User + SalesInvoice + JournalEntry + AuditLog
                                    ↓
                         Compile JSON → Save as DSR.response
                                    ↓
                              Status = COMPLETED
                                    ↓
                           Email user with download link

[Breach Flow]
DPO → /admin/pdpl → Report Breach Form
                          ↓
            BreachIncident created (slaDueAt = now + 72h)
                          ↓
                    AlertEngine: notify CEO + Legal
                          ↓
            Cron hourly: if (now > slaDueAt - 24h) → CRITICAL alert
                          ↓
            DPO files report to NDMO → updates notifiedAuthorityAt
```

---

### 🔥 فجوة 3: Zakat Engine
**الهدف:** حساب وعاء الزكاة وتقديم الإقرار السنوي

**البرومت الجاهز:**
```
أنشئ Zakat module:

1. Schema:
   - ZakatDeclaration (id, fiscalYear, status=DRAFT|SUBMITTED, baseAmount, zakatDue (=base * 0.025), filedAt, certificateNumber)
   - ZakatBaseLine (id, declarationId, source: ENUM, amount, sign: ADD|SUBTRACT)

2. Engine: src/lib/zakat-engine.ts
   Zakat Base = (Equity + Long-term Liabilities) − (Fixed Assets - Accumulated Depreciation) − Long-term Investments
   - calculateBase(fiscalYear) → ZakatDeclaration with breakdown lines
   - exportDeclaration(declarationId) → Saudi tax-ZATCA XML/PDF format
   - autoFile(declarationId) → POST to ZATCA Zakat API

3. APIs:
   - POST /api/zakat/calculate (year)
   - GET /api/zakat/declarations
   - POST /api/zakat/declarations/[id]/submit
   - GET /api/zakat/declarations/[id]/certificate

4. UI: src/app/(dashboard)/tax/zakat/page.tsx (موجودة كـ stub — توسعتها)
   - Year selector
   - Base calculation breakdown (drill-down to JE lines)
   - "Submit to ZATCA" button (requires final approval)
   - Certificate preview/download

5. Use auto-journal.ts to post Zakat liability:
   Debit: Zakat Expense
   Credit: Zakat Payable
```

**سيناريو:**
1. مدير مالي يفتح Tax > Zakat > Calculate for FY2026
2. النظام يحسب Base = SUM(Equity) + SUM(LT-Liabilities) − SUM(Fixed Assets net) − SUM(LT-Investments)
3. يطلع breakdown مع drill-down لكل JE line ساهمت في الحساب
4. مدير يضغط Submit → POST لـ ZATCA → certificate رقم يُحفظ

**فلو البيانات:**
```
CFO → Tax > Zakat > Calculate(2026)
            ↓
   zakat-engine.calculateBase(2026)
            ↓
   Read Account where category='EQUITY' or 'LT_LIAB' or 'FIXED_ASSET' or 'LT_INVEST'
            ↓
   For each: SUM journal_lines for FY2026
            ↓
   Compute base via formula → Generate ZakatBaseLine[] breakdown
            ↓
   Insert ZakatDeclaration (status=DRAFT, zakatDue = base * 0.025)
            ↓
   UI shows full table with drill-down

[Submit Flow]
CFO → Submit Declaration
            ↓
   Validate: status=DRAFT, base > 0
            ↓
   auto-journal.postZakat(declarationId)
   → JE: Debit Zakat Expense / Credit Zakat Payable
            ↓
   Call ZATCA Zakat API → certificateNumber
            ↓
   Update status=SUBMITTED, filedAt, certificateNumber
```

---

### 🔥 فجوة 4: Universal Journal Dimensions
**الهدف:** كل JE line تحمل cost-center، profit-center، project، segment، product (أساس لكل reporting متقدم)

**البرومت:**
```
أضف للـ JournalLine model:
- costCenterId Int? @relation
- profitCenterId Int? @relation (model جديد ProfitCenter)
- projectId Int? @relation
- segmentId Int? @relation (model جديد BusinessSegment)
- productId Int? @relation
- customerId Int? @relation
- vendorId Int? @relation

Migration: backfill من source documents:
- Sales invoice JE → set customerId, productId from invoice details
- Purchase invoice JE → set vendorId, productId
- Asset JE → set costCenterId from asset.costCenterId
- Payroll JE → set costCenterId from employee.costCenterId

Update src/lib/auto-journal.ts ليحفظ الأبعاد عند توليد كل JE.
أضف indexes على (costCenterId, profitCenterId, projectId).

UI: في صفحة Journal Entry، أضف dimensions في كل line.
Reports: profitability slice-by-dimension.
```

**فلو:**
```
Sales Invoice Created → auto-journal.postSale(invoiceId)
                              ↓
For each line in invoice:
   Generate JE line with:
   - debit/credit
   - accountId
   - **customerId** (from invoice header)
   - **productId** (from line)
   - **costCenterId** (from branch.costCenterId)
   - **projectId** (if invoice.projectId set)

→ Reports: SELECT account, SUM(debit-credit) GROUP BY costCenterId
   = P&L by cost center, drill-down to JE → invoice
```

---

### 🔥 فجوة 5: CO-PA (Profitability Analysis)
**الهدف:** هامش ربح حسب عميل × منتج × منطقة × مندوب

**البرومت:**
```
بعد ما تكون Universal Journal Dimensions موجودة (فجوة 4)، أنشئ:

1. View/Materialized View: profitability_facts
   SELECT customerId, productId, salesmanId, regionId,
          SUM(revenue) AS revenue,
          SUM(cogs) AS cogs,
          SUM(revenue - cogs) AS gross_margin
   FROM journal_lines WHERE accountType IN ('REVENUE', 'COGS')
   GROUP BY ...

2. Refresh schedule: nightly via cron

3. UI: src/app/(dashboard)/finance/profitability/page.tsx
   - Pivot table: rows=customer, cols=product, value=margin
   - Filters: period, region, salesman
   - Drill-down to invoice → JE line

4. API: GET /api/finance/profitability?dim1=customer&dim2=product&period=Q1
```

---

### 🔥 فجوة 6: Real-time Credit Check on Sales Order
**الهدف:** بلوك تأكيد الطلب لو exposure + new amount > limit

**البرومت:**
```
1. Schema:
   - Customer.creditLimit (Decimal already exists)
   - CreditCheckLog (id, customerId, soId, exposureAtCheck, limit, decision: APPROVED|HOLD|BLOCKED, checkedAt, checkedBy)

2. Engine: src/lib/credit-check.ts (موجود — توسعته)
   - getExposure(customerId): SUM(open AR) + SUM(unpaid SOs)
   - check(customerId, newAmount): { decision, reason }

3. Hook: في POST /api/sales-orders/route.ts قبل INSERT:
   const exposure = await creditCheck.getExposure(customerId);
   if (exposure + total > limit) {
     return 403 'Credit hold' — unless user has 'OVERRIDE_CREDIT_HOLD' permission
   }

4. Auto-release: في payment posting trigger:
   - Check if customer has SOs in HOLD
   - Re-evaluate exposure
   - If under limit: auto-release latest HOLD SO
```

---

### 🔥 فجوة 7: AP OCR + Auto Three-Way Match
**الهدف:** فاتورة مورد → OCR → مطابقة تلقائية → ترحيل قيد

**البرومت:**
```
1. Setup OCR pipeline:
   - Use existing Gemini integration (GEMINI_API_KEY)
   - POST /api/purchases/invoices/ocr (multipart upload PDF/image)
   - Returns parsed: vendor, invoiceNumber, date, lineItems[{ description, qty, unitPrice }]

2. Auto-match logic in src/lib/three-way-match.ts:
   - Find PO by vendor + closest amount/date
   - Find GRN linked to PO
   - Compare: invoice qty/price vs GRN qty / PO price
   - If within tolerance (already in TolerancePolicy): MATCHED
   - Else: EXCEPTION → assign to AP clerk

3. Flow: OCR → 3WM → if matched: auto-create PurchaseInvoice + post via auto-journal
```

---

### 🔥 فجوة 8: Driver-Based Budgeting + Rolling Forecast
**الهدف:** Budget ديناميكي مرتبط بـ drivers (sales × margin %)

**البرومت:**
```
1. Schema:
   - BudgetDriver (id, name, formula: string, dependsOn: string[], scenarioId)
   - BudgetScenario (id, name, type: BASE|OPTIMISTIC|PESSIMISTIC, parentId)
   - BudgetLine: add formulaId Int? (replaces hardcoded amount with computed)

2. Engine: src/lib/budgeting-engine.ts
   - evaluateBudget(scenarioId, period): walks dependency graph, computes lines
   - rollForward(): copies last quarter's actuals into next quarter's forecast

3. UI: src/app/(dashboard)/finance/budget/scenarios/page.tsx
   - Side-by-side: Base / Optimistic / Pessimistic
   - Edit formulas inline

4. Variance dashboard: actual vs budget for current period
```

---

### 🔥 فجوة 9: Project Management + EVM
**الهدف:** WBS + Earned Value (CPI/SPI)

**البرومت:**
```
1. Schema:
   - ProjectTask: add parentTaskId (hierarchy), plannedValue, earnedValue, actualCost
   - ProjectMilestone (id, projectId, name, plannedDate, completedDate, billingTrigger: bool)

2. Engine: src/lib/evm-engine.ts
   - calculatePV(taskId, asOf) // planned value
   - calculateEV(taskId, asOf) // earned = planned * % complete
   - calculateAC(taskId, asOf) // actual cost
   - CPI = EV/AC (cost performance)
   - SPI = EV/PV (schedule performance)

3. Billing types: T&M / Milestone / Fixed-Price
   - On milestone completion: trigger SO/Invoice generation
   - T&M: weekly invoice from timesheets

4. UI: project Gantt + EVM dashboard
```

---

### 🔥 فجوة 10: Semantic BI + Persona Dashboards
**الهدف:** dashboard لكل دور (CFO/CEO/COO/Plant Mgr)

**البرومت:**
```
1. Build pre-aggregated cubes (materialized views, refreshed nightly):
   - sales_cube (date, customer, product, region, qty, revenue, margin)
   - ar_cube (asOfDate, customer, aging_bucket, balance)
   - inventory_cube (date, warehouse, product, qty, value)
   - pl_cube (period, costCenter, accountGroup, amount)

2. UI: persona-driven dashboards
   - /dashboards/cfo: cash position, AR aging, P&L vs budget, cash flow forecast
   - /dashboards/ceo: KPIs (revenue YoY, margin, headcount, top customers)
   - /dashboards/coo: production OEE, on-time delivery, inventory turns
   - /dashboards/plant: work order status, machine downtime, scrap %

3. Drill-down: every KPI card clickable → underlying records
```

---

## 📋 الإجراءات الموصى بها (مرتبة)

### 🚨 خلال 24 ساعة:
1. غيّر passwords الإنتاج (n11_pass123, n1_pass123, RootPassNama123)
2. أعد تثبيت Redis نظيفاً (apt purge + reinstall — symlink مكسور)
3. أضف `MASTER_DB_URL` و `PROVISION_SSH_*` إلى Hetzner .env
4. اعمل push للتعديلات الأمنية (الـ 12 ملف)

### 🔴 خلال أسبوع:
5. أصلح `MfaEngine` و `WHTEngine` و `DunningEngine` و `PaymentRunEngine` (دوال مفقودة)
6. أصلح `currentValue → currentBookValue` في 7 أماكن (depreciation routes)
7. حل 4 `rules-of-hooks` errors في `src/app/admin/saas/page.tsx`
8. أضف imports المفقودة (Button, ChevronRight)
9. مسح git history للـ creds القديمة (BFG)

### 🟠 خلال شهر:
10. ترقية signature لـ Next.js 16 params (87 موضع)
11. حل 62 `react-hooks/immutability` errors (runtime crashes محتملة)
12. تطبيق migrations معلقة
13. تنظيف 25 ملف Python سكراتش من الجذر
14. ابدأ بناء فجوة 1 (Qiwa) — أعلى أولوية

### 🟡 خلال ربع سنة:
15. فجوات 2-5 (PDPL، Zakat، Universal Journal، CO-PA)
16. تنظيف `any` تدريجي (2,321 → < 500)
17. حذف modules مكسورة (company-info، marketing، support، v3-master) أو إكمالها

---

## 📦 الملفات المُنشأة في هذه الجلسة
- `MASTER_AUDIT_REPORT.md` (هذا الملف)
- `check_remote_db.js` (أداة فحص + إصلاح production)
- `fix_run.log` (سجل تنفيذ الإصلاحات)
- `sync_check.log` (سجل مزامنة — لو شغّلته)

## 📦 الملفات المُعدّلة (Security)
- `src/lib/prisma.ts`
- `src/lib/quotaGuard.ts`
- `src/app/api/auth/{sso-redirect,login-by-email,find-tenant-by-email}/route.ts`
- `src/app/api/tenant/{trial-status,check-status,provision,hidden-modules}/route.ts`
- `src/app/api/branches/route.ts`
- `src/app/api/ice/{toggle,tenants}/route.ts`
- `.env` (إضافة MASTER_DB_URL + PROVISION_SSH_*)

---

**إجمالي وقت الجلسة:** عمل متواصل
**الوكلاء المُستخدَمون:** Explore, erp-architect, saudi-compliance
**معايير المرجعية:** SAP S/4HANA, Oracle Fusion, NetSuite, Dynamics 365, Odoo Enterprise

— نهاية التقرير —
