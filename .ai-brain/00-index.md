# 00 - فهرس ذاكرة المشروع (AI Brain Index)

> **آخر تحديث:** 2026-05-14 | **مبني من الكود الفعلي** | **يُقرأ تلقائياً قبل أي قرار**

---

## 📌 هوية المشروع

| البند | القيمة |
|---|---|
| **الاسم التجاري** | Nama Invest (نما إنفست) |
| **الاسم الفني** | `namaweb` |
| **الإصدار** | 2.4.8 |
| **النوع** | Multi-Tenant SaaS ERP + POS + Desktop (Electron) + PWA |
| **الجمهور** | الشركات السعودية ودول الخليج (SMEs → Enterprise) |
| **القطاع** | صيدلة، تجزئة، مطاعم، تصنيع، خدمات، تعليم، عقارات |
| **الموقع الحي** | `namainvist.com` |
| **الإطار الفني** | Next.js 16.2.6 + React 19.2.6 + Prisma 5.22 + PostgreSQL + TypeScript |
| **النشر** | Hetzner VPS `46.4.188.170` عبر PM2 + Cloudflare |

---

## 📊 إحصائيات حقيقية (محسوبة من الكود)

| المقياس | العدد | المصدر |
|---|---|---|
| **جداول قاعدة البيانات (Models)** | **607** | `grep '^model ' prisma/schema.prisma` |
| **التعدادات (Enums)** | **1** (AuditAction) | `grep '^enum '` |
| **أسطر Schema** | **11,922** | `wc -l prisma/schema.prisma` |
| **مسارات API (route.ts)** | **848** | `find src/app/api -name route.ts` |
| **أقسام API** | **167** | `ls -d src/app/api/*/` |
| **موديولات Dashboard** | **109** | `ls -d src/app/(dashboard)/*/` |
| **ملفات المكتبات (src/lib)** | **536** | `find src/lib` |
| **صفحات (page.tsx)** | **491** | `find src/app -name page.tsx` |
| **مكونات UI** | **63** | `find src/components` |
| **حزم Dependencies** | **76** | `package.json` |
| **حزم DevDependencies** | **46** | `package.json` |
| **CRON Endpoints** | **29** | `find src/app/api/cron` |

---

## 📁 خريطة الـ Brain (هيكل المعرفة)

### 🧠 الأساسية (تحليل يدوي):

| # | الملف | الموضوع |
|---|---|---|
| 01 | [01-architecture.md](./01-architecture.md) | الهيكلية + دورة الطلب + النشر + **Phase 2 Active** |
| 02 | [02-database.md](./02-database.md) | قواعد البيانات + Pool + Soft-Delete + Audit |
| 03 | [03-auth-permissions.md](./03-auth-permissions.md) | المصادقة + JWT + Roles + **Master Owner ENV** |
| 04 | [04-api-routes.md](./04-api-routes.md) | كل الأقسام الـ 167 + Rate Limiting + withRoute |
| 05 | [05-business-logic.md](./05-business-logic.md) | 18 فلو أعمال + Q2C + P2P + H2R + R2R |
| 06 | [06-project-rules.md](./06-project-rules.md) | قواعد الكود + الـ Workflow + Git |

### 🤖 الآلية (مولّدة بفحص الكود):

| # | الملف | المحتوى | الحجم |
|---|---|---|---|
| 07 | [07-all-api-endpoints.md](./07-all-api-endpoints.md) | كل API endpoint بتفصيله | ~180KB |
| 08 | [08-database-models-full.md](./08-database-models-full.md) | كل 607 جدول بحقوله | ~600KB |
| 09 | [09-core-libraries.md](./09-core-libraries.md) | كل دالة في src/lib | ~94KB |
| 10 | [10-frontend-pages.md](./10-frontend-pages.md) | كل صفحة Client/Server | ~41KB |
| 11 | [11-components.md](./11-components.md) | كل مكون UI | ~3.5KB |
| 12 | [12-dependencies.md](./12-dependencies.md) | الحزم + Scripts | ~6KB |
| 13 | [13-config.md](./13-config.md) | next.config + tsconfig + .env | ~14KB |

### 🌟 المتقدمة (السياق الكامل):

| # | الملف | الغرض |
|---|---|---|
| 14 | [14-modules-map.md](./14-modules-map.md) | خريطة 167 API + 109 Dashboard مصنفة |
| 15 | [15-saudi-compliance.md](./15-saudi-compliance.md) | ZATCA + VAT + Zakat + WHT + WPS + GOSI + EOS + PDPL |
| 16 | [16-troubleshooting.md](./16-troubleshooting.md) | 20 مشكلة شائعة + حلولها |
| 17 | [17-gap-analysis.md](./17-gap-analysis.md) | نسب اكتمال + Roadmap + Budget |
| 18 | [18-environment.md](./18-environment.md) | ENV vars كاملة + PM2 + Deployment |
| 19 | [19-claude-rules.md](./19-claude-rules.md) | تلخيص CLAUDE.md الإلزامي |

### 🎯 الموديولات التفصيلية:

| # | الملف | المجال |
|---|---|---|
| 20 | [20-accounting-domain.md](./20-accounting-domain.md) | المحاسبة الكاملة (Auto-Journal + Periods + FX + COPA + Allocations) |
| 21 | [21-sales-pos.md](./21-sales-pos.md) | المبيعات + POS + ZATCA + Returns + Loyalty |
| 22 | [22-purchases.md](./22-purchases.md) | المشتريات + P2P + GRN + 3-Way Match + Vendors |
| 23 | [23-inventory.md](./23-inventory.md) | المخزون + Warehouses + Costing + Batches + AI Vision |
| 24 | [24-manufacturing.md](./24-manufacturing.md) | التصنيع + BOM + MRP + MO + QC + CMMS |
| 25 | [25-hr-payroll.md](./25-hr-payroll.md) | HR + Payroll + GOSI + WPS + EOS + Saudization |
| 26 | [26-assets.md](./26-assets.md) | الأصول + Depreciation + IFRS 16 + CWIP |
| 27 | [27-treasury-banks.md](./27-treasury-banks.md) | الخزينة + Reconciliation + Checks + Petty Cash |
| 28 | [28-ai-features.md](./28-ai-features.md) | AI Copilot + CFO + Auditor + OCR + Vision + Bots |
| 29 | [29-electron-desktop.md](./29-electron-desktop.md) | Electron + Embedded PG + Licensing + Code Protection |
| 30 | [30-master-ice.md](./30-master-ice.md) | Master Panel + ICE + Tenant Management + Licenses |
| 31 | [31-cron-jobs.md](./31-cron-jobs.md) | 29 CRON + BullMQ Workers + WhatsApp |
| 32 | [32-webhooks-events.md](./32-webhooks-events.md) | Event Bus + Outbound + Inbound Webhooks |
| 33 | [33-relations-diagram.md](./33-relations-diagram.md) | علاقات الجداول الكاملة |

### 🔬 الفهارس التفصيلية (Deep Catalogs):

| # | الملف | الغرض |
|---|---|---|
| 34 | [34-lib-engines-catalog.md](./34-lib-engines-catalog.md) | **فهرس 359 engine في src/lib** مصنفة |
| 35 | [35-saudi-integrations.md](./35-saudi-integrations.md) | Najiz + SAMA + Mudad + Qiwa + Bayan |
| 36 | [36-ai-architecture.md](./36-ai-architecture.md) | Chains + RAG + Vector + Prompts + Multi-Agent + MCP |
| 37 | [37-scripts-inventory.md](./37-scripts-inventory.md) | 122 script (deploy, fix, audit, migration) |
| 38 | [38-electron-internals.md](./38-electron-internals.md) | main.js + preload + offline-db + ZATCA SDK |

### 🌟 ملفات تكميلية (Coverage 100%):

| # | الملف | الغرض |
|---|---|---|
| 39 | [39-vertical-solutions.md](./39-vertical-solutions.md) | الصيدلية + العيادة + المدرسة + المطعم + الأسطول + العقار + الإنشاءات + التوزيع + الخدمات |
| 40 | [40-tests-quality.md](./40-tests-quality.md) | Jest + Playwright + Testcontainers + A11y + Coverage |
| 41 | [41-public-marketing.md](./41-public-marketing.md) | Marketing + Sign-up + Onboarding + Error pages + Public APIs |
| 42 | [42-ui-components.md](./42-ui-components.md) | 63 component + Forms + Tables + Themes + RTL + Patterns |
| 43 | [43-prisma-seeds-migrations.md](./43-prisma-seeds-migrations.md) | Seed data + Migrations + Multi-tenant push |
| 44 | [44-pwa-realtime.md](./44-pwa-realtime.md) | PWA + Service Workers + Offline POS + Push notifications |
| 45 | [45-error-monitoring.md](./45-error-monitoring.md) | Sentry + Logger + Prometheus + OpenTelemetry + Error pages |
| 46 | [46-state-machines.md](./46-state-machines.md) | Document State Machines + Approval Workflows + BPM + Saga |
| 47 | [47-glossary.md](./47-glossary.md) | المعجم: 200+ اختصار + مصطلح فني/محاسبي/قانوني |
| 48 | [48-app-routes-map.md](./48-app-routes-map.md) | كل الـ routes في src/app (491 page) |

### 🎬 السيناريوهات وطرق العمل (Practical Knowledge):

| # | الملف | الغرض |
|---|---|---|
| 49 | [49-scenarios-real-world.md](./49-scenarios-real-world.md) | **35+ سيناريو حقيقي** يحدث يومياً في الشركات السعودية مع الخطوات الكاملة والـ JE |
| 50 | [50-how-to-guides.md](./50-how-to-guides.md) | **20+ دليل "كيف أعمل"** خطوة-بخطوة (فاتورة B2B، توظيف، EOS، ZATCA، إلخ) |
| 51 | [51-role-day-in-life.md](./51-role-day-in-life.md) | يوم في حياة Cashier + Accountant + CFO + HR + Owner + Driver + Waiter |
| 52 | [52-decision-tables.md](./52-decision-tables.md) | جداول القرارات (متى VAT، Approval، Credit، FIFO، إلخ) |
| 53 | [53-period-end-procedures.md](./53-period-end-procedures.md) | إقفال Daily/Weekly/Monthly (16 خطوة)/Quarterly/Year-End الكامل |
| 54 | [54-common-mistakes.md](./54-common-mistakes.md) | **50+ خطأ شائع** + كيفية تجنبها (محاسبية، أمنية، تقنية، UX) |

### 🚨 العمليات والصيانة (Operations & Maintenance):

| # | الملف | الغرض |
|---|---|---|
| 55 | [55-disaster-recovery.md](./55-disaster-recovery.md) | DR + Backup/Restore + Failover + Ransomware + HA |
| 56 | [56-security-incidents.md](./56-security-incidents.md) | Incident Response: Phishing, Compromise, Breach, DDoS, Ransomware |
| 57 | [57-data-migration.md](./57-data-migration.md) | Migration من Excel/SAP B1/Oracle/Onyx Pro/QuickBooks |
| 58 | [58-performance-tuning.md](./58-performance-tuning.md) | DB Tuning + Indexing + Caching + Load Testing + Scaling |
| 59 | [59-api-sdk-integration.md](./59-api-sdk-integration.md) | API Keys + Webhooks + SDKs + Integration Patterns |
| 60 | [60-templates-formats.md](./60-templates-formats.md) | Email + PDF + Excel + ZATCA XML + SIF Templates |
| 61 | [61-support-runbooks.md](./61-support-runbooks.md) | 15+ Support Runbook لحل المشاكل الشائعة |
| 62 | [62-future-roadmap.md](./62-future-roadmap.md) | الخارطة المستقبلية + التقنيات القادمة + الـ Investment |
| 63 | [63-brain-maintenance.md](./63-brain-maintenance.md) | كيف نحافظ على هذا الـ Brain حياً وحديثاً |
| 64 | [64-tenant-isolation-hardening.md](./64-tenant-isolation-hardening.md) | دليل تقوية عزل المستأجرين في الكود والـ Database |

### 🌍 ذاكرة الجاهزية العالمية وهندسة المؤسسات (Global Readiness & Enterprise Memory):

| الملف المرجعي للجاهزية العالمية | موضوع الملف الفني والتشغيلي الموثق |
| ---------------------------------- | ------------------------------------- |
| [01-current-state.md](./01-current-state.md) | **حالة المشروع الحالية**: الالتزام النشط والأرقام المثبتة برمجياً وحظر النشر. |
| [02-global-readiness-roadmap.md](./02-global-readiness-roadmap.md) | **خارطة الطريق العالمية**: المراحل الـ 13 المتعاقبة لتأهيل الكود والمحركات. |
| [03-quality-and-testing.md](./03-quality-and-testing.md) | **جودة البيئة والاختبارات**: تكوين المترجم وحل خطأ `TS5011` وتوطيد Jest و Vitest. |
| [04-api-and-tenant-isolation.md](./04-api-and-tenant-isolation.md) | **أمن الـ APIs وعزل المستأجرين**: غلاف `withRoute` ومساعد Prisma وتصنيفات الأمان. |
| [05-financial-governance.md](./05-financial-governance.md) | **الحوكمة والنزاهة المالية**: مصفوفات الترحيل والعكس وحظر التكرار ولقطات الأرصدة. |
| [06-security-and-compliance.md](./06-security-and-compliance.md) | **الأمن والخصوصية المؤسسية**: مصفوفة الـ RBAC والكوكيز ومخططات الاستجابة للحوادث. |
| [07-saudi-compliance.md](./07-saudi-compliance.md) | **الامتثال والربط السعودي**: ZATCA Phase 2 والضرائب وحسابات GOSI و WPS و SIF وملفات الرواتب. |
| [08-performance-and-scalability.md](./08-performance-and-scalability.md) | **الأداء العالي وقابلية التوسع**: قياس العمليات الـ 20 الكبرى وتحسين الاستعلامات والـ caching. |
| [09-devops-backup-rollback-dr.md](./09-devops-backup-rollback-dr.md) | **العمليات والنسخ واستعادة البيانات**: بيئات التشغيل وخطة الكوارث واستعادة الخادم. |
| [10-product-ux-documentation.md](./10-product-ux-documentation.md) | **تجربة المستخدم والتوثيق**: جودة RTL والكتيبات المخصصة والبيانات التجريبية المعيارية. |
| [11-global-erp-comparison.md](./11-global-erp-comparison.md) | **المقارنة والتميز التنافسي**: تحليل مقارن مع SAP و NetSuite و Dynamics وخطة الفجوات. |
| [12-customer-pilot-uat.md](./12-customer-pilot-uat.md) | **البرنامج التجريبي واختبارات UAT**: سيناريوهات فحص المستخدمين الميدانية وتواقيع القبول. |
| [13-legal-trust-sales-readiness.md](./13-legal-trust-sales-readiness.md) | **الجاهزية القانونية والثقة**: اتفاقيات شروط الاستخدام والـ DPA ومستويات الـ SLA وعقود المجموعات. |
| [14-world-class-release-gate.md](./14-world-class-release-gate.md) | **بوابة النجاح وحكم الإطلاق الكلي**: ميزان Go/No-Go وتصنيف الجاهزية الحالي. |
| [15-approval-gates.md](./15-approval-gates.md) | **سجل بوابات الموافقات المخصصة**: تنظيم العبارات وتواقيع المدراء المسؤولين للمراحل. |
| [16-risk-register.md](./16-risk-register.md) | **سجل وتخفيف المخاطر**: تفصيل المخاطر الـ 20 وقوة أدلتها وإجراءات وقايتها. |
| [17-gap-register.md](./17-gap-register.md) | **سجل وحصر الفجوات الهيكلية**: تتبع الفجوات الـ 4 الأساسية للبنية البرمجية والتشغيلية. |
| [18-decision-log.md](./18-decision-log.md) | **سجل القرارات المعمارية (ADR)**: تدوين القرارات وتوصية فصل Jest و Vitest. |
| [19-evidence-index.md](./19-evidence-index.md) | **فهرس وسجل الأدلة البرمجية**: ربط وتوثيق كافة تقارير الجلسات وفحوصات الجودة. |
| [20-next-actions.md](./20-next-actions.md) | **الخطوات والمهام الفورية القادمة**: معالجات المرحلة الأولى المحددة بوضوح وجداول العمل. |

---

## AI Skills

- [nama-brain-governance](../.skills/nama-brain-governance/SKILL.md) — Brain governance and evidence registry updates.
- [nama-qa-stabilization](../.skills/nama-qa-stabilization/SKILL.md) — Testing, coverage, Jest/Vitest, ESLint stabilization.
- [nama-api-tenant-isolation](../.skills/nama-api-tenant-isolation/SKILL.md) — API protection and tenant isolation audit.
- [nama-prisma-governance](../.skills/nama-prisma-governance/SKILL.md) — Prisma schema and DB governance audit.
- [nama-security-compliance](../.skills/nama-security-compliance/SKILL.md) — Security, secret hygiene, and compliance evidence.

---

## Brain Governance Scripts

- `scripts/brain/check-brain-consistency.ts` — Checks `.ai-brain` structure and risky claims.
- `scripts/brain/validate-evidence-tags.ts` — Validates evidence tags.
- `scripts/brain/update-current-state.ts` — Updates current state safely.
- `scripts/brain/update-quality-status.ts` — Records quality/testing status.
- `scripts/brain/update-gap-register.ts` — Updates gap register.
- `scripts/brain/update-risk-register.ts` — Updates risk register.
- `scripts/brain/update-decision-log.ts` — Updates ADR/decision log.
- `scripts/brain/update-evidence-index.ts` — Updates evidence index.
- `scripts/brain/update-approval-gates.ts` — Updates approval gates.
- `scripts/brain/archive-old-reports.ts` — Indexes old reports without deleting them.

---

## 🎯 كيف يستخدم الـ AI هذا الـ Brain؟

### قبل أي تعديل برمجي:
1. **اقرأ `19-claude-rules.md`** للقواعد الحرجة (إلزامي)
2. **افحص `14-modules-map.md`** لتحديد الموديول المتأثر
3. **راجع `01-architecture.md`** لفهم تدفق الطلب
4. **افحص `17-gap-analysis.md`** لمعرفة حالة الموديول

### قبل ميزة محاسبية:
- `20-accounting-domain.md` → Auto-Journal Engine
- `15-saudi-compliance.md` → الامتثال السعودي
- `05-business-logic.md` → الفلوهات
- `33-relations-diagram.md` → علاقات الجداول

### قبل ميزة في موديول محدد:
- **المبيعات/POS:** `21-sales-pos.md` + `22-purchases.md`
- **المخزون:** `23-inventory.md`
- **التصنيع:** `24-manufacturing.md`
- **HR:** `25-hr-payroll.md`
- **الأصول:** `26-assets.md`
- **الخزينة:** `27-treasury-banks.md`

### قبل تعديل API:
- `04-api-routes.md` → withRoute + Rate Limit
- `07-all-api-endpoints.md` → المسار المعني
- `03-auth-permissions.md` → الصلاحيات

### قبل تعديل DB:
- `02-database.md` → القواعد الصارمة
- `08-database-models-full.md` → الجداول
- `33-relations-diagram.md` → العلاقات

### قبل تكامل خارجي:
- `32-webhooks-events.md` → Webhooks
- `28-ai-features.md` → AI integrations
- `31-cron-jobs.md` → Background tasks

### عند مشكلة:
- `16-troubleshooting.md` → 20 مشكلة شائعة
- `18-environment.md` → ENV + Deployment

### للمسؤول الفني:
- `30-master-ice.md` → Master Panel + ICE
- `29-electron-desktop.md` → Desktop edition

---

## ⚠️ تحذيرات للـ AI

### قواعد ذهبية:
- ❌ **لا تعتمد على معلومات قديمة** — الـ Brain يُحدّث دورياً
- ❌ **لا تخمن أرقام** — استخدم الأدوات للعد الفعلي
- ❌ **النظام في Phase 2** — قاعدة فيزيائية لكل tenant
- ✅ **اقرأ `CLAUDE.md` أولاً دائماً**
- ✅ **`getPrisma(req)` فقط** — لا `new PrismaClient()` يدوياً
- ✅ **`withRoute` لكل route جديد** — لا `withGuard`
- ✅ **Auto-Journal لكل قيد محاسبي**
- ✅ **Decimal(18,4)** للمال، لا Float

### تذكيرات مهمة:
- 🇸🇦 **Saudi-first:** ZATCA, VAT, GOSI, WPS, EOS, PDPL — كلها إلزامية
- 🔒 **Multi-Tenant:** كل query يحترم tenantId
- 📊 **Soft Delete:** لكل البيانات المالية والتشغيلية
- 📝 **Audit Trail:** تلقائي عبر middleware
- 🛡 **MFA:** للأدوار الحرجة (admin, accountant)
- 🤖 **AI cost tracking:** لكل ميزة

---

## 📞 معلومات التواصل

- **مالك المشروع:** ialqrashi62@gmail.com
- **التاريخ:** 2026-05-14
- **Sentry:** sentry.io/nama-invest
- **Hetzner Support:** للسيرفر `46.4.188.170`
- **Cloudflare Support:** للـ DNS/SSL
- **ZATCA:** dev-portal.zatca.gov.sa

---

> **القاعدة الذهبية:** "الكود الفعلي هو المرجع. الـ Brain تلخيص — والتلخيص قد يتقادم. تحقق دائماً قبل الادعاء."

> **الفلسفة:** "البرمجة 25% من العمل. الباقي: تصميم + توثيق + اختبار + امتثال."

> **الهدف:** "الوصول لمستوى SAP/Oracle/NetSuite في 12-18 شهراً."
