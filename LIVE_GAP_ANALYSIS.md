# تحليل الحالة الحيّة لمشروع Namasoft ERP
## (Live Gap Analysis — مستخرَج من graphify على شجرة `src/` كاملة)

**التاريخ:** 2026-05-11
**المصدر:** `graphify-out/graph.json` (8,449 عقدة، 19,296 حافة) + `graphify-out/structure.json`
**المنهج:** تجاهل التقييمات السابقة. مسح الكود الفعلي → استخراج بنية حقيقية → مقارنة بـ SAP / Oracle / NetSuite → فجوات + برومنتات تنفيذية.

---

## 📊 القسم 1 — ما كشفه graphify عن مشروعك

### 1.1 الأرقام الفعلية

| المقياس | القيمة |
|---|---|
| إجمالي الملفات في `src/` | **1,856 ملف كود** |
| إجمالي العقد في الرسم | **8,449 عقدة** (دوال، صفوف، schemas) |
| إجمالي الحواف | **19,296 علاقة** بين العقد |
| نقاط نهاية API | **767** نقطة في **158** فئة |
| صفحات Dashboard | **378** صفحة في **100** فئة |
| Services classes | **124** |
| Engines (محرّكات أعمال) | **189** |
| UI Components (shadcn/ui) | **15** |
| Hooks (مخصصة) | **5** |
| ملفات يتيمة (degree ≤ 1) | **73 فقط** (صحّة بنيوية جيدة) |
| Communities (مجموعات منطقية) | **623** |

### 1.2 العلاقات المعنوية الفريدة التي اكتشفها الرسم

#### العلاقة #1 — العمود الفقري للنظام: Event Bus
- `services/shared/event-bus.service.ts` لديها **reach = 62** (أعلى وصول لأي خدمة)
- معظم المحرّكات تنشر/تستقبل أحداث من خلالها (auto-journal, period-close, qiwa, pdpl)
- **معناه:** أي تغيير في event-bus سيُؤثّر على 21 محرّكاً على الأقل. **اختبار التراجع إجباري.**

#### العلاقة #2 — التجريدات المركزية (God Nodes)
| العقدة | عدد الحواف | المعنى |
|---|---|---|
| `logger` | 1,115 | استدعاء logger في كلّ مكان (طبيعي) |
| `getPrisma()` | 1,098 | كلّ عملية DB تمر من هنا — refactor مستحيل |
| `withRoute()` | 701 | middleware موحّد لكل API route |
| `getUserFromRequest()` | 770 | auth coupling شامل |
| `useTranslation()` | 750 | i18n في كلّ صفحة (RTL سليم) |

**النمط:** أنماط معمارية صحّيّة (Middleware، DI، Cross-cutting). **مخاطرها:** أي خطأ في `withRoute()` يُسقط 701 نقطة نهاية.

#### العلاقة #3 — تسرّبات الموديولات (Cross-Module Bleed)
| من | إلى | عدد الاستدعاءات | الحكم |
|---|---|---|---|
| `accounting` | `finance` | 19 | 🟠 تداخل — هل هما نفس الموديول؟ |
| `sales` | `accounting` | 8 | ✅ طبيعي (POS → GL) |
| `wht` | `payroll` | 6 | ✅ طبيعي (WHT على رواتب الأجانب) |
| `wht` | `sales` | 6 | ✅ طبيعي (WHT على فواتير الخارج) |
| `accounting` | `zakat` | 6 | ✅ طبيعي |
| `clinic` | `v3` | 7 | 🟠 v3 = نسخة جديدة؟ legacy؟ |

**التوصية:** ادمج `accounting` و `finance` تحت **GL Module** واحد، أو افصل صراحةً ما هو GL وما هو Treasury.

#### العلاقة #4 — المحرّكات حسب التأثير
أعلى 20 محرّك (engines) من حيث الـ reach في الرسم:
1. event-bus.service (62)
2. qiwa-engine (18) ← السعودة/Nitaqat
3. mfa-engine (18) ← Multi-factor Auth
4. pdpl-engine (17) ← خصوصية البيانات
5. hedge-accounting-engine (17) ← محاسبة التحوّط
6. approval-engine (16) ← workflow اعتماد
7. wht-engine (15) ← ضريبة استقطاع
8. leave-engine (15) ← إجازات
9. saudi-eos-engine (14) ← مكافأة نهاية الخدمة
10. period-close-engine (13) ← إقفال الفترة
11. payment-run-engine (13) ← دفع دفعي للموردين
12. inventory-analytics-engine (13)
13. financial-statements-engine (13)
14. zakat-engine (12)
15. open-items-engine (12) ← AR/AP aging
16. nlq-engine (12) ← Natural Language Query (AI)
17. consolidation-engine (12) ← توحيد القوائم
18. asset-lifecycle-engine (12)
19. cash-flow-forecasting (21 ملف)
20. document-expiry-engine (19 ملف)

**هذا أعمق من ادّعاءات `104_modules_checklist.md`.** أنت تملك **محرّكات حقيقية**، ليس فقط CRUD.

---

## 🗂️ القسم 2 — البنية الجاهزة (مُستخرَجة من الكود فعلياً)

> القائمة الكاملة بالأرقام موجودة في `graphify-out/structure.json`. هنا أهمّ الفئات.

### 2.1 API Endpoints — أعلى 20 فئة
| الفئة | عدد المسارات | حالة الموديول |
|---|---|---|
| `accounting` | 78 | 🟢 شجرة حسابات + قيود + تقارير + ميزان + open items |
| `finance` | 58 | 🟢 hedge + consolidation + payment runs + COPA + scenarios |
| `manufacturing` | 39 | 🟢 BOM + WO + MRP + work centers + scrap + quality |
| `hr` | 39 | 🟢 موظفين + إجازات + تقييم + WPS + Mudad |
| `auth` | 23 | 🟢 MFA + SSO + sessions + trust device + recovery |
| `settings` | 23 | 🟢 شركة + ضرائب + branding + custom-fields + workflows |
| `crm` | 23 | 🟠 جزئي — leads + tickets + campaigns + whatsapp |
| `sales` | 21 | 🟢 فواتير + مرتجعات + POS + price-quotes |
| `cron` | 17 | 🟢 jobs دورية: document-expiry, billing, audit |
| `procurement` | 16 | 🟠 RFQ + PR + PO + 3-way-match (ينقص landed costs آلي) |
| `purchases` | 16 | 🟢 فواتير شراء + GRN + debit notes |
| `inventory` | 17 | 🟢 batches + lot + serial + transfers + adjustments |
| `treasury` | 12 | 🟢 bank-statements + recon + cash-position + checks |
| `system` | 12 | 🟢 backup + tenants + master-panel |
| `ai` | 13 | 🟢 evaluator + bridge + tools + langchain + rag |
| `pos` | 11 | 🟢 checkout + cashout + receipt + returns |
| `reports` | 11 | 🟠 PDF/Excel — ينقص report-builder ديناميكي |
| `payroll` | 10 | 🟢 GOSI + ESO + سلف + خصومات |
| `enterprise` | 9 | 🟢 projects + contracts (متقدّم) |
| `platform` | 9 | 🟢 multi-tenant routing |

### 2.2 Dashboard Pages — أعلى 15 فئة
| الفئة | عدد الصفحات |
|---|---|
| `v3` | 34 (نسخة جديدة من بعض الموديولات) |
| `accounting` | 32 |
| `manufacturing` | 25 |
| `hr` | 22 |
| `finance` | 22 |
| `reports` | 19 |
| `settings` | 17 |
| `sales` | 16 |
| `admin` | 14 |
| `inventory` | 12 |
| `enterprise` | 11 |
| `purchases` | 10 |
| `treasury` | 8 |
| `school` | 7 |
| `crm` | 6 |

### 2.3 المحرّكات الموجودة (Engines)
**موجود وفعّال:**
- ✅ `auto-journal-engine` — القيود التلقائية (محور النظام)
- ✅ `approval-engine` — workflow اعتماد
- ✅ `event-bus.service` — naqil الرسائل
- ✅ `period-close-engine` — إقفال soft/hard
- ✅ `payment-run-engine` — دُفعات الدفع للموردين
- ✅ `open-items-engine` — AR/AP aging
- ✅ `bank-recon-engine` + `bank-statement-parser` — تسوية بنكية + قراءة MT940/CAMT053/CSV
- ✅ `cash-application-engine` — تطبيق الدفعات على الفواتير
- ✅ `consolidation-engine` — توحيد قوائم
- ✅ `financial-statements-engine` — قوائم مالية (BS, IS, CF)
- ✅ `cash-flow-forecasting` — تنبؤ بالتدفقات
- ✅ `hedge-accounting-engine` — IFRS 9
- ✅ `asset-lifecycle-engine` — أصول ثابتة
- ✅ `qiwa-engine` — السعودة/Nitaqat
- ✅ `mudad-api` — WPS
- ✅ `gosi-service` (3 ملفات) — onboarding + reconciliation + API
- ✅ `saudi-eos-engine` — مكافأة نهاية الخدمة
- ✅ `wht-engine` — ضريبة استقطاع
- ✅ `zakat-engine` — حسابات الزكاة
- ✅ `pdpl-engine` — DSR + breach
- ✅ `leave-engine` — إجازات + accrual
- ✅ `document-expiry-engine` — تنبيهات الإقامات/الرخص
- ✅ `state-machine` (RMA + invoice + leave + PO transitions)
- ✅ `document-state-machine` — حالات وثائق التصنيع
- ✅ `rag-pipeline` + `rag/citations/tracker` — RAG ذاتي
- ✅ `mcp-bridge` + `langchain-chains` + `erp-tools` — وكلاء AI
- ✅ `nlq-engine` — استعلام بلغة طبيعية
- ✅ `telegram-bot` (24 ملف) — بوت تيليجرام لإدخال المصاريف
- ✅ `lot-engine` — batch + FEFO
- ✅ `bank-statement-parser` — MT940/CAMT053/CSV
- ✅ `bank-recon-exceptions` — معالجة استثناءات التسوية
- ✅ `inventory-analytics-engine`
- ✅ `cfo-report-worker` + `daily-audit-worker` (background jobs)

---

## 🔴 القسم 3 — الفجوات المؤكدة (مفقودة بالاسم في الكود)

> هذه فجوات **مُتحقّق منها** بالبحث في 8,449 عقدة. ليست اقتراحات نظرية.

### 3.1 الفجوات الحرجة (Hard Gaps — مفقودة كلياً)

| # | الفجوة | الأثر | الحالة |
|---|---|---|---|
| G1 | **Cash Flow Indirect Method** | لا يمكن إصدار قائمة التدفق غير المباشر | ✅ **منجز** — `financial-statements-engine.ts` |
| G2 | **IFRS 16 Lease Accounting** | ROU + Lease Liability + Interest Unwinding | ✅ **منجز** — `ifrs16-lease-engine.ts` + API + Cron |
| G3 | **Rolling Budget Engine** | Rolling 12-month + Driver-based + Variance | ✅ **منجز** — `rolling-budget-engine.ts` + API |
| G4 | **Driver-Based Forecasting** | مدمج في G3 (units, headcount, FX drivers) | ✅ **منجز** — ضمن Rolling Budget Engine |
| G5 | **Reverse Charge VAT** | فواتير الخارج + Boxes 8-10 لإقرار ZATCA | ✅ **منجز** — `reverse-charge-vat.ts` + API |
| G6 | **AP Aging Buckets** | 0-30, 31-60, 61-90, 91-120, 120+ per vendor | ✅ **منجز** — `ap-aging/route.ts` (vendor + bucket) |
| G7 | **Commitments Register** | PO + عقود + CAPEX + IFRS 7 maturity | ✅ **منجز** — `commitments-register-engine.ts` + API |
| G8 | **OpenAPI Auto-Generation** | OpenAPI 3.1 + YAML + Route Registry | ✅ **منجز** — `api/openapi/route.ts` (self-updating) |
| G9 | **Storybook / UI Catalog** | 15 مكوّن shadcn/ui | 🟡 **مؤجل** — أولوية منخفضة |
| G10 | **CI/CD Workflows** | GitHub Actions: CI + E2E + Deploy | ✅ **موجود** — `.github/workflows/ci.yml` |
| G11 | **Vector DB / Embeddings Store** | pgvector + IVFFlat index + chunk ingestion | ✅ **منجز** — `vector-store.ts` + migration SQL |
| G12 | **PDPL DPIA Template** | تقييم أثر حماية البيانات الشخصية | ✅ **منجز** — `docs/compliance/DPIA_TEMPLATE.md` |
| G13 | **User Manual** | دليل المستخدم النهائي | 🟡 **مؤجل** — يحتاج محتوى بشري |
| G14 | **Design System Source** | Stitch / Figma exports | 🟡 **مؤجل** — قابل للتنفيذ بـ `/stitch-design` |
| G15 | **Inter-Company Eliminations** | Mismatch detection + Unrealized profit | ✅ **منجز** — `ic-elimination-engine.ts` |

### 3.2 الفجوات الجزئية (Partial — موجود لكن ناقص)

| الفجوة | الموجود | الناقص |
|---|---|---|
| **Three-Way Match** | service موجود | logic للـ tolerance بالنسبة المئوية + قواعد إلكترونية ZATCA |
| **GR/IR Clearing** | حساب موجود | reconciliation report للأرصدة العالقة |
| **Multi-Currency** | exchange rates موجودة | FX revaluation شهري مؤتمت + Realized/Unrealized P&L breakdown |
| **Recurring Billing** | template موجود | scheduler يتعامل مع pro-rating + tax changes mid-cycle |
| **Credit Limit** | check موجود | hard-block على POS + workflow استثناء بالاعتماد |
| **Approval Workflow** | engine موجود | UI builder للقواعد (drag-drop) + branching |
| **Audit Trail** | logger موجود | field-level audit (قبل/بعد) — حالياً action-level فقط |
| **Numbering Sequences** | بسيط | sequences متعدّدة + reset سنوي + alpha prefixes |

---

## 🎯 القسم 4 — أهمّ 10 فجوات: برومنت جاهز + سيناريو عمل + فلو بيانات

> انسخ البرومنت ولصقه مع Claude (هذا المشروع) لتنفيذ الميزة من الصفر.

---

### G1 — Cash Flow Indirect Method

#### 📋 البرومنت الجاهز
```
السياق: نحتاج إضافة قائمة التدفقات النقدية بالطريقة غير المباشرة (Indirect Method) إلى financial-statements-engine.
الموجود: financial-statements-engine.ts فيه balance sheet + income statement + direct cash flow.
المطلوب: extend الـ engine بدالة generateIndirectCashFlow(period).

المنطق المحاسبي:
1. ابدأ من Net Income (من income statement للفترة)
2. أضِف Non-cash items:
   + Depreciation (من asset-lifecycle-engine)
   + Amortization (intangibles)
   + Provisions changes
   + Unrealized FX losses (gains مطروحة)
3. عدّل تغيّرات Working Capital:
   - Δ Receivables (زيادة AR = خصم)
   - Δ Inventory (زيادة = خصم)
   - Δ Payables (زيادة = إضافة)
4. اطرح/أضف Investing activities (asset acquisitions, disposals)
5. اطرح/أضف Financing (loans, equity, dividends)
6. الناتج = Net Change in Cash → يجب أن يساوي (Ending Cash - Beginning Cash) من Balance Sheet

القيد:
- Tolerance 0.01 SAR
- اربط بكل line بالحساب المصدر (account_id) للـ drill-down
- صدّر كـ JSON + render في components/financial-statements/cash-flow-indirect.tsx

الاختبار:
- اكتب test لمؤسسة بـ Net Income = 1M, Depreciation = 200K, Δ AR = +100K, Δ AP = +50K
- يجب أن يساوي CFO = 1,150,000
```

#### 🎬 سيناريو العمل
1. المحاسب يضغط "تقارير → التدفقات النقدية → غير المباشرة"
2. النظام يجلب الفترة الافتراضية (الشهر الحالي)
3. يقرأ Income Statement + Balance Sheet (افتتاحي + ختامي)
4. يحسب الـ adjustments تلقائياً
5. يعرض الجدول مع drill-down على كلّ سطر
6. زر "تصدير PDF" + "تصدير Excel"
7. مقارنة Side-by-side مع Direct Method

#### 📊 فلو البيانات
```
[Period Selection]
   ↓
[Income Statement] ──→ [Net Income]
   ↓
[asset-lifecycle-engine] ──→ [Depreciation/Amortization]
   ↓
[Balance Sheet t0 + t1] ──→ [Δ Working Capital]
   ↓
[journal_entries WHERE account_type = 'INVESTING'] ──→ [Investing CF]
   ↓
[journal_entries WHERE account_type = 'FINANCING'] ──→ [Financing CF]
   ↓
[Reconciliation Check]
   ↓
[financial_statements table] ← INSERT
   ↓
[UI Render + PDF Export]
```

---

### G2 — IFRS 16 Lease Accounting (Right-of-Use Asset)

#### 📋 البرومنت الجاهز
```
السياق: عندنا عقود إيجار في app/api/assets/leases، لكن المعالجة المحاسبية ناقصة. نحتاج تطبيق IFRS 16 كاملاً.

المطلوب:
1. أنشئ engine جديد: src/lib/ifrs16-lease-engine.ts
2. عند إنشاء lease contract:
   a. احسب Present Value للـ minimum lease payments باستخدام incremental borrowing rate
   b. أنشئ Right-of-Use Asset (ROU) في Fixed Assets
   c. أنشئ Lease Liability في Long-Term Liabilities (split: Current + Non-Current)
   d. القيد الافتتاحي:
      Dr ROU Asset             X
        Cr Lease Liability     X
3. شهرياً (cron job):
   a. Depreciation للـ ROU (straight-line على lease term)
   b. Interest unwinding على الـ liability
   c. Lease payment تقسّم: principal (يقلّل liability) + interest (P&L)
4. عند تعديل العقد (Modification):
   a. أعد حساب PV
   b. Adjust ROU + Liability
5. التقارير:
   - Lease maturity analysis (IFRS 16.58)
   - Reconciliation of lease liabilities (opening to closing)
   - Notes disclosure (IAS 17 vs IFRS 16)

Prisma changes:
model Lease {
  rouAsset       Decimal @db.Decimal(18, 4)
  leaseLiability Decimal @db.Decimal(18, 4)
  discountRate   Decimal @db.Decimal(8, 6)
  paymentSchedule LeasePayment[]
  modifications  LeaseModification[]
}

Tests:
- 5-year lease, 100K/year, 5% IBR → PV ≈ 432,948 SAR
- Year 1: Depreciation 86,590, Interest 21,647
- Year 5: Liability balance = 0
```

#### 🎬 سيناريو العمل
1. مدير العقارات ينشئ عقد إيجار: المبلغ، المدة، IBR
2. النظام يولّد جدول دفعات (lease schedule)
3. القيد الافتتاحي تلقائياً (Dr ROU / Cr Lease Liability)
4. كل شهر:
   - Cron job يولّد قيد depreciation
   - Cron job يولّد قيد interest unwinding
   - Cron job يولّد invoice الدفعة (Dr Liability + Dr Interest / Cr Bank)
5. تقرير Lease Aging شهرياً
6. عند تعديل العقد → re-measurement

#### 📊 فلو البيانات
```
[Lease Contract Created]
   ↓
[PV Calculator (IBR × payments)] ──→ [ROU + Liability values]
   ↓
[auto-journal: Opening Entry] ──→ [GL]
   ↓
[Cron: Monthly]
   ├──→ [Depreciation Calc] ──→ [auto-journal: Dr Dep Expense / Cr Accumulated Dep]
   ├──→ [Interest Calc]     ──→ [auto-journal: Dr Interest Expense / Cr Liability]
   └──→ [Payment Due]       ──→ [bank-payment-engine → outflow]
   ↓
[Lease Maturity Report (IFRS 16.58)]
```

---

### G3 — Rolling Budget Engine

#### 📋 البرومنت الجاهز
```
السياق: نحتاج Budget Engine يدعم Rolling Forecast بدل Static Annual Budget.

المتطلبات:
1. كل شهر ينتهي → drop الشهر + add شهر جديد في نهاية الـ horizon (12-month rolling)
2. Driver-based: budgets = function(units_sold, headcount, FX_rate)
3. Variance analysis: Actual vs Budget vs Forecast
4. Reforecast الربعي + Re-baseline السنوي

Schema:
model RollingForecast {
  scenarioId    String   // "base" | "best" | "worst"
  driver        String   // "units_sold" | "headcount" | "raw_material_price"
  monthlyValues Json     // { "2026-01": 1000, "2026-02": 1050, ... }
  formula       String?  // "revenue = units_sold * avg_price * (1 - discount_rate)"
}

API:
POST /api/finance/rolling-forecast/recalc
GET  /api/finance/rolling-forecast/variance?period=2026-Q1

UI:
- جدول 12 شهر متحرّك
- driver assumptions في sidebar
- variance heatmap (Green/Yellow/Red)
```

#### 🎬 سيناريو العمل
1. CFO يفتح Rolling Forecast
2. يحدّد scenario (Base / Best / Worst)
3. يعدّل drivers (مثلاً: زيادة units_sold بـ 10%)
4. النظام يعيد حساب كلّ السطور المرتبطة (Revenue, COGS, Margin)
5. يقارن بـ Actuals → variance report
6. عند نهاية الشهر، النظام تلقائياً drops الشهر + adds شهراً جديداً

#### 📊 فلو البيانات
```
[Drivers Update] ──→ [Formula Evaluator] ──→ [12-Month Forecast]
                                                ↓
[Actuals from GL] ──→ [Variance Engine] ──→ [Variance Report]
                                                ↓
[Cron: Month-End] ──→ [Roll Forward] ──→ [Drop Oldest + Add Next]
```

---

### G5 — Reverse Charge VAT (إجباري ZATCA)

#### 📋 البرومنت الجاهز
```
السياق: عند استيراد خدمات من الخارج (مثلاً: AWS, Google Ads)، الـ VAT لا يدفعه المورد بل المستلم (reverse charge).

المطلوب:
1. في فاتورة الشراء: لو الـ supplier_country != "SA" والـ service:
   a. لا تضف VAT للمورد
   b. سجّل قيدين:
      Dr VAT Input (deductible)   X*15%
        Cr VAT Output (payable)   X*15%
   (Both reported in VAT return — net effect = 0 cash, but reported to ZATCA)
2. في VAT Return:
   - Box 8: Imports subject to reverse charge
   - Box 9: VAT due on imports
   - Box 10: Deductible VAT

Code locations:
- lib/zatca.ts: add isReverseCharge() helper
- lib/auto-journal.ts: extend purchase invoice handler
- app/api/zatca/vat-return/route.ts: include boxes 8-10

Tests:
- Invoice $1000 from AWS (US) → reverse charge:
  Dr VAT Input 150 SAR
    Cr VAT Output 150 SAR
- VAT Return must show in both boxes
```

#### 🎬 سيناريو العمل
1. محاسب يدخل فاتورة شراء من AWS
2. يختار "Service Import" + "Country = US"
3. النظام يحجب حقل VAT تلقائياً
4. يسجّل reverse-charge entry
5. في نهاية الشهر، VAT return يظهر القيدين

#### 📊 فلو البيانات
```
[Purchase Invoice: Foreign Service]
   ↓
[supplier.country != "SA" && type == "SERVICE"] → [isReverseCharge = true]
   ↓
[auto-journal]
   ├──→ Dr Expense (full amount)
   ├──→ Cr Accounts Payable
   ├──→ Dr VAT Input (notional 15%)
   └──→ Cr VAT Output (notional 15%)
   ↓
[VAT Return: Boxes 8-10]
   ↓
[ZATCA Submission]
```

---

### G6 — AP Aging Buckets (Explicit)

#### 📋 البرومنت الجاهز
```
السياق: open-items-engine موجود ويعطي AR aging، لكن AP aging buckets غير ظاهرة باسمها.

المطلوب:
1. Extend lib/open-items-engine.ts بدالة generateAPAging(asOfDate)
2. Buckets: Current (0-30), 31-60, 61-90, 91-120, 120+
3. لكل bucket:
   - Vendor name + outstanding amount
   - Days overdue (max)
   - Last contact date
4. خيارات:
   - by vendor / by branch / by aging bucket
5. UI: heatmap في app/(dashboard)/treasury/ap-aging/page.tsx
6. تكامل مع payment-run-engine: priority by aging

Schema (موجود مسبقاً، لا تغيير):
- vendor_invoices.due_date
- payments.payment_date
- open_items.balance

API:
GET /api/finance/ap-aging?asOf=2026-05-11&groupBy=vendor
```

#### 🎬 سيناريو العمل
1. CFO يفتح "خزينة → AP Aging"
2. النظام يحسب الـ buckets فوراً
3. ينقر على bucket "91-120" → قائمة الموردين المتأخرين
4. ينقر على مورد → قائمة الفواتير المعنية
5. ينقر "أضف للـ payment run" → ينضم لدفعة الدفع التالية

#### 📊 فلو البيانات
```
[asOfDate]
   ↓
[vendor_invoices WHERE status != 'PAID' AND tenant_id = X]
   ↓
[Calculate days_overdue = asOfDate - due_date]
   ↓
[Bucket Classifier]
   ├──→ Current (0-30)
   ├──→ 31-60
   ├──→ 61-90
   ├──→ 91-120
   └──→ 120+
   ↓
[Group by vendor + sum]
   ↓
[Render heatmap + actionable buttons]
```

---

### G10 — CI/CD Pipelines (Hard Gap)

#### 📋 البرومنت الجاهز
```
السياق: لا توجد GitHub Actions workflows مرئية في الكود. أنشئ pipeline كامل.

المطلوب: 3 workflows في .github/workflows/

1. ci.yml (PR + push):
   - Install (pnpm)
   - Lint (eslint --max-warnings 0)
   - Type check (tsc --noEmit)
   - Unit tests (vitest)
   - Integration tests (with test DB via docker-compose)
   - Build (next build)
   - Upload coverage to Codecov

2. e2e.yml (nightly):
   - Spin up test DB + redis
   - Run Playwright tests
   - Upload screenshots/videos on failure

3. deploy.yml (on tag v*):
   - Build Docker image
   - Push to GHCR
   - Deploy to staging (k8s rolling update)
   - Run smoke tests
   - Promote to production (manual approval)

Required secrets:
- DATABASE_URL_TEST
- DOCKER_REGISTRY_TOKEN
- KUBECONFIG_STAGING
- KUBECONFIG_PROD

Add to package.json:
"test:integration": "vitest --config vitest.integration.config.ts"
"test:e2e": "playwright test"
```

#### 🎬 سيناريو العمل
1. مطوّر يفتح PR
2. CI تلقائياً:
   - يفحص الـ types
   - يشغّل الاختبارات
   - يعرض النتائج في الـ PR
3. عند الـ merge إلى `main`:
   - يبني docker image
   - يدفع لـ staging
4. عند tag `v1.2.3`:
   - يبني image production
   - ينشر مع approval

#### 📊 فلو البيانات
```
[Developer Push PR]
   ↓
[ci.yml triggers]
   ├──→ Lint
   ├──→ TypeCheck
   ├──→ Unit Tests
   ├──→ Integration Tests
   └──→ Build
   ↓
[All Pass?] ──No──→ [Block Merge]
   ↓ Yes
[Merge to main]
   ↓
[Build Docker Image]
   ↓
[Push to GHCR]
   ↓
[Deploy to Staging]
   ↓
[Smoke Tests]
   ↓
[Manual Promotion to Production]
```

---

### G11 — Vector Database / Embeddings Store

#### 📋 البرومنت الجاهز
```
السياق: rag-pipeline موجود لكنّه يحسب embeddings كل مرة (مكلف، بطيء). نحتاج persistent vector store.

الخيار 1 (موصى به): pgvector على نفس PostgreSQL
1. Migration: CREATE EXTENSION IF NOT EXISTS vector;
2. Prisma model:
   model EmbeddingChunk {
     id        String   @id @default(cuid())
     tenantId  String
     documentId String
     chunkText String   @db.Text
     embedding Unsupported("vector(1536)")
     metadata  Json
     createdAt DateTime @default(now())
     @@index([tenantId, documentId])
   }
3. lib/rag-pipeline.ts:
   - On ingest: chunk → embed → INSERT
   - On query: embed question → ORDER BY embedding <-> $query LIMIT 10
4. lib/embeddings.ts: wrap OpenAI/Google embedding API

الخيار 2: Chroma/Qdrant (containerized)
- لو بتعمل scale كبير

Tests:
- Insert 1000 chunks
- Query "ما هي سياسة الإجازات؟" → return top 5 most relevant
- Latency < 100ms
```

#### 🎬 سيناريو العمل
1. مستخدم يرفع وثيقة (PDF policies)
2. RAG pipeline:
   - يقسّم لـ chunks (500 token كلّ chunk)
   - يولّد embedding لكلّ chunk
   - يخزّن في pgvector
3. مستخدم يسأل Copilot: "كم مدة الإجازة السنوية؟"
4. Copilot:
   - يولّد embedding للسؤال
   - يستعلم pgvector → top 5 chunks
   - يضمّن chunks في الـ prompt
   - يولّد إجابة + citations

#### 📊 فلو البيانات
```
[Document Upload]
   ↓
[Chunker (500 tokens, overlap=50)]
   ↓
[Embedding Model (text-embedding-3-small)]
   ↓
[pgvector INSERT]
   ↓
[Indexed]

---
[User Query] ──→ [Embedding]
                    ↓
                 [pgvector SELECT ORDER BY embedding <-> $q]
                    ↓
                 [Top-K Chunks]
                    ↓
                 [LLM Prompt Augmentation]
                    ↓
                 [Answer + Citations]
```

---

### G15 — Inter-Company Eliminations

#### 📋 البرومنت الجاهز
```
السياق: consolidation-engine موجود، لكن inter-company eliminations غير واضحة.

المطلوب: extend lib/consolidation-engine.ts بـ:
1. Identify inter-company transactions:
   - Sales/Purchases between subsidiaries (sister companies)
   - Inter-company loans
   - Inter-company dividends
2. Elimination Rules:
   a. IC Revenue (Co A sells to Co B) ↔ IC Cost (Co B buys from Co A) → eliminate both
   b. IC AR ↔ IC AP → net to zero
   c. Inter-company profit in stock (unrealized profit) → defer until external sale
   d. IC dividends → eliminate from group P&L
3. Schema:
   model IntercompanyTransaction {
     fromTenantId String
     toTenantId   String
     amount       Decimal
     type         "SALE" | "LOAN" | "DIVIDEND" | "SERVICE"
     status       "PENDING" | "ELIMINATED" | "PARTIAL"
   }
4. Consolidation Run:
   a. Aggregate all subsidiaries TBs
   b. Identify ICs by counter-party
   c. Apply eliminations
   d. Produce consolidated FS
5. Reconciliation Report:
   - "Co A says 100K owed by Co B"
   - "Co B says 95K owed to Co A"
   - "Mismatch: 5K — investigate"
```

#### 🎬 سيناريو العمل
1. CFO يطلب القوائم الموحّدة
2. النظام يجمع TBs لكل tenant
3. يحدّد المعاملات بين الشركات
4. يطبّق eliminations
5. ينتج consolidated FS + reconciliation report
6. لو هناك mismatches → ينبّه ويعرضها

#### 📊 فلو البيانات
```
[Consolidation Run Triggered]
   ↓
[Aggregate TBs (parent + subsidiaries)]
   ↓
[IC Transactions Identifier]
   ↓
[Match Pairs (FromCo, ToCo, Amount)]
   ↓
[Mismatch Detector] ──→ [Reconciliation Report]
   ↓
[Apply Eliminations]
   ↓
[Consolidated Financial Statements]
```

---

## 📦 القسم 5 — قائمة الأرتفاكتس المطلوبة (User's Checklist)

### 5.1 AI & Prompt Engineering

| الأرتفاكت | الحالة | المسار/الملف |
|---|---|---|
| System Prompt | 🟢 موجود | `src/lib/prompts/system/personas/*` (cfo, auditor, copilot, base) |
| Persona Templates | 🟢 موجود | `src/lib/prompts/system/compose.ts` |
| Context Injection | 🟢 موجود | `src/lib/rag-pipeline.ts` |
| RAG Pipeline | 🟢 موجود | `src/lib/rag/pipeline.ts` + `citations/tracker.ts` |
| LangChain Chaining | 🟢 موجود | `src/lib/langchain-chains.ts` |
| Vector DB | 🔴 **مفقود** | اطلب pgvector — G11 أعلاه |
| MCP Bridge | 🟢 موجود | `src/lib/mcp-bridge.ts` + `erp-tools.ts` |
| AI Evaluation | 🟢 موجود | `src/lib/ai-eval.ts` |
| Guardrails | 🟢 موجود | `src/app/api/ai/guardrails/*` |
| NLQ Engine | 🟢 موجود | `src/lib/nlq-engine.ts` |
| Stock Images (Shutterstock?) | 🔴 غير موجود | لا تكامل خارجي |

### 5.2 Backend / API

| الأرتفاكت | الحالة | الملاحظة |
|---|---|---|
| REST APIs (767 endpoints) | 🟢 | غنية جداً |
| Webhooks (5 endpoints) | 🟢 | `app/api/webhooks/*` |
| OpenAPI Spec | 🟠 جزئي | endpoint موجود، لكن auto-gen مفقود — G8 |
| Request Validation (Zod) | 🟢 | `lib/api/validate-request.ts` (24 schemas) |
| Rate Limiting | 🟢 | `lib/rate-limit.ts` |
| Error Handling | 🟢 | `lib/api-handler.ts` + `apiError()` |
| Pagination | 🟠 موجود في بعض APIs | غير موحّد |
| Prometheus Metrics | 🟢 | `lib/instrumentation/metrics.ts` |

### 5.3 Data & Storage

| الأرتفاكت | الحالة | الملاحظة |
|---|---|---|
| Prisma Schema | 🟢 | 157 نموذج |
| Migrations | 🟢 موجودة | في `prisma/migrations/` |
| Seeders | 🟡 جزئي | يحتاج expansion (seed-company endpoint موجود) |
| Backup System | 🟢 | `src/app/api/system/backup/*` |
| Multi-Tenant | 🟢 | DB-per-tenant via Master DB |
| Audit Log | 🟢 | action-level (مفقود field-level) |
| Vector Storage | 🔴 | G11 |
| File Storage | 🟢 | uploads endpoint |

### 5.4 Frontend / UI

| الأرتفاكت | الحالة | الملاحظة |
|---|---|---|
| Next.js Pages (378) | 🟢 | غنية |
| shadcn/ui Components (15) | 🟢 | dialog, dropdown, select, table, button, card, ... |
| Tailwind | 🟢 | Tailwind 4 |
| i18n (AR/EN, RTL) | 🟢 | `lib/i18n.tsx` + `lib/translations.ts` |
| Storybook | 🔴 | G9 |
| Design Tokens | 🟠 جزئي | في tailwind.config |
| Theme Switcher | 🟢 | `SettingsContext.tsx` |
| Toast System | 🟢 | `Toast.tsx` + `useToast()` |
| Form Builder | 🟡 جزئي | react-hook-form موجود، لكن لا generator |

### 5.5 Infrastructure & DevOps

| الأرتفاكت | الحالة | الملاحظة |
|---|---|---|
| Docker | ❓ غير ظاهر في src/ | يحتاج تحقّق |
| CI/CD | 🔴 | G10 |
| Kubernetes | 🔴 | لا manifests |
| Monitoring | 🟢 | Prometheus + metrics endpoint |
| Logging | 🟢 | logger في 1115 مكان |
| APM | 🔴 | لا OpenTelemetry/Sentry ظاهر |

### 5.6 Testing

| الأرتفاكت | الحالة | عدد الملفات |
|---|---|---|
| Unit Tests | 🟠 ضعيف | 29 ملف اختبار (مقابل 1856 ملف كود = 1.6% فقط) |
| Integration Tests | 🟡 جزئي | tests/auto-journal.test.ts + financial-schemas.test.ts |
| E2E Tests | 🔴 | لا Playwright/Cypress ظاهر |
| Test Factories | 🟢 | `tests/factories.ts` |

### 5.7 Documentation Artifacts

| الأرتفاكت | الحالة | التوصية |
|---|---|---|
| Business Flows | 🟢 موجود | `BUSINESS_FLOWS_GUIDE.md` (18 فلو) |
| Wireframes / Mockups | 🔴 | استخدم Figma + Stitch — G14 |
| Database ERD | 🟠 جزئي | احتاج `prisma generate erd` + diagram |
| OpenAPI Spec | 🟠 جزئي | G8 |
| User Stories | 🔴 | غير موجود — يحتاج إنشاء |
| Acceptance Criteria | 🔴 | يحتاج Cucumber/Gherkin |
| Test Cases & Plan | 🔴 | غير موثّق |
| Architecture Document | 🟠 | `SYSTEM_MASTER_GUIDE.md` موجود، لكن C4 diagrams ناقصة |
| Security Plan | 🔴 | لا OWASP-style document |
| Deployment Plan | 🔴 | غير موجود |
| Style Guide / Design System | 🟠 | shadcn/ui patterns، لا official doc |
| i18n Translation Files | 🟢 | `lib/translations.ts` |
| Sample Data / Seeders | 🟡 | بسيط |
| Migration Scripts | 🟢 | Prisma migrations |
| User Manual | 🔴 | G13 |
| Training Videos | 🔴 | G13 |
| Legal & Compliance Docs | 🟠 | pdpl-engine موجود، لكن DPIA template مفقود |

---

## 🚀 القسم 6 — خارطة طريق مقترحة (3 أشهر القادمة)

### الشهر 1: السدّ المحاسبي
- G1: Cash Flow Indirect Method (1 أسبوع)
- G5: Reverse Charge VAT (1 أسبوع)
- G6: AP Aging Buckets (3 أيام)
- G15: Inter-Company Eliminations (2 أسبوع)

### الشهر 2: البنية التحتية
- G10: CI/CD Pipelines (1 أسبوع)
- G11: pgvector (3 أيام)
- G9: Storybook (3 أيام)
- G8: OpenAPI auto-generation (4 أيام)

### الشهر 3: IFRS + Compliance
- G2: IFRS 16 Lease Accounting (3 أسابيع)
- G3: Rolling Budget Engine (1 أسبوع)
- G12: PDPL DPIA template (3 أيام)
- G7: Commitments Register (4 أيام)

---

## 📌 ملاحظات نهائية

1. **الأخبار السارّة:** مشروعك أنضج بكثير ممّا توحي به القوائم الادّعائية. عندك **189 engine** حقيقي، ليس فقط CRUD.
2. **الأخبار المهمّة:** الفجوات الحقيقية ليست في الوظائف الأساسية، بل في:
   - معايير IFRS المتقدّمة (16, 9 hedge done, indirect CF)
   - البنية التحتية (CI/CD, vector DB)
   - التوثيق (wireframes, user manual)
3. **توصية اختبارية حرجة:** نسبة الاختبارات 1.6% فقط (29 ملف اختبار مقابل 1856 كود). **هذا أهم رقم في كلّ هذا التقرير.** إذا قمنا بأي refactor، سنُكسر شيئاً ولن نعلم.

---

**ملفّات مرجعية مولّدة:**
- `graphify-out/structure.json` — قائمة كلّ API/Page/Service/Engine
- `graphify-out/graph.json` — الرسم البياني الكامل
- `graphify-out/GRAPH_REPORT.md` — تقرير التدقيق
- `graphify-out/graph.html` — تصوّر بصري (أهمّ 60 مجتمع)

**للاستفسارات:**
```bash
/graphify query "ما هي تبعيات auto-journal-engine؟"
/graphify path "PaymentRunEngine" "auto-journal"
/graphify explain "EventBus"
```
