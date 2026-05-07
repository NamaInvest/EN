# 🎯 Namasoft ERP — Ultimate Audit Master Index

> **هذا الملف يربط 3 ملفات تفصيلية بناها 3 وكلاء متخصصون متوازياً.**
> Generated: 2026-05-06
> Total content across all 3 files: ~12,000 lines.

---

## 📚 الملفات الثلاثة

### 1️⃣ [MODULE_INVENTORY_V2.md](./MODULE_INVENTORY_V2.md) — جرد التطبيق الكامل
**الحجم:** ~3,800 سطر
**المحتوى:** كل موديول من الـ **79 موديول**، مع:
- Pages (316 صفحة)
- Forms (~250)
- Tables (~300)
- Buttons/Actions (~1,500)
- API endpoints (150+)
- Saudi compliance touchpoints
- Dependencies بين الموديولات
- مقياس النضج لكل موديول (1-10)

**التوزيع:**
- 14 نطاق (Finance, Sales, Procurement, Inventory, Manufacturing, HR, Service, Industry Verticals, Admin, Reports, AI, Emerging, Horizontal Support, V3)
- 11 موديول جاهز إنتاج (7-8/10)
- 50 موديول متوسط (4-6/10)
- 18 موديول مبكر (<4/10)

---

### 2️⃣ [GAPS_BY_DOMAIN.md](./GAPS_BY_DOMAIN.md) — تحليل الفجوات الشامل
**الحجم:** ~3,000 سطر
**المحتوى:** **403 فجوة محددة** عبر **28 نطاق** مقارنة بالأنظمة العالمية الرائدة:
- SAP S/4HANA
- Oracle Fusion / NetSuite
- Microsoft Dynamics 365
- Workday
- Salesforce CPQ
- Manhattan WMS
- Yardi (Real Estate)
- Primavera (Projects)
- Siemens Opcenter (MES)
- Coupa / Ariba (Procurement)
- HighRadius (AR Automation)
- Kyriba (Treasury)

**النطاقات الـ 28:**
| Block | Domains | Gaps |
|-------|---------|------|
| Finance Core | 1-4 | 62 |
| Asset & Tax | 5-6 | 33 |
| Cost & Plan | 7-8 | 24 |
| Supply Chain | 9-10 | 36 |
| Customer-Facing | 11-12 | 29 |
| Mfg & Project | 13-14 | 31 |
| HR | 15-17 | 39 |
| Verticals (RE/Service/WMS) | 18-20 | 39 |
| Quality & GRC | 21-22 | 23 |
| Reporting | 23 | 12 |
| Industry | 24 | 21 |
| Platform (API/UX/Perf/Sec) | 25-28 | 54 |
| **Total** | **28** | **403** |

---

### 3️⃣ [BUILD_PROMPTS_LIBRARY_V2.md](./BUILD_PROMPTS_LIBRARY_V2.md) — مكتبة البرومتات
**الحجم:** ~5,000 سطر
**المحتوى:** **46 build package** كاملة، لكل واحدة:
- 🎯 الهدف (1 سطر بالعربية)
- 📦 المتطلبات (5-7 نقاط)
- 🗄️ Schema Snippet (Prisma كامل)
- 🌐 API Routes (3-6 لكل package)
- ⚙️ Engine File (path + 4-5 method signatures)
- 🖥️ UI Pages (paths)
- 📖 سيناريو العمل (10 خطوات user flow بالعربية)
- 📊 Data Flow (ASCII diagram)
- 🇸🇦 Saudi Compliance Note (إن وجدت)
- ⏱️ Effort: S/M/L
- 🚀 Ready Prompt (multi-line — قابل للنسخ-لصق مع `/erp-build-feature`)

**التوزيع حسب المراحل:**
- **Phase 0 (Foundation):** 6 builds — Universal Journal, Numbering, Document State, Audit Trail, Period Close, Approval Workflow
- **Phase 1 (Saudi Critical):** 6 builds — Qiwa, PDPL, VAT, WHT, Zakat, Mudad
- **Phase 2 (Finance):** 8 builds — CO-PA, Driver Budget, Asset Components, AP OCR, Credit Check, Cash Pool, FX Hedging, IC Netting
- **Phase 3 (Sales/Procurement):** 8 builds — CPQ, Rebate, Forecast, Customer Portal, Vendor Scorecard, Spend, Contract Compliance, e-Auction
- **Phase 4 (Operations):** 7 builds — Wave Picking, Multi-Valuation, Consignment, Yard Mgmt, APS, MES, Genealogy
- **Phase 5 (Projects/Service/BI):** 5 builds — WBS+EVM, Service SLA, PM Scheduler, BI Cubes, NLQ
- **Phase 6 (Verticals + Cross-cutting):** 6 builds — Clinic Insurance, School Gradebook, Restaurant Recipe, SSO/SCIM, Webhook, Mobile PWA

**زمن التنفيذ المُقدَّر:** 72 أسبوعاً (~17 شهر) لكل الـ 46 package.

---

## 🔗 الروابط الذكية بين الملفات

عند الحاجة لبناء أي ميزة:

1. **اقرأ [MODULE_INVENTORY_V2.md](./MODULE_INVENTORY_V2.md)** للتأكد ما الموجود فعلاً (تجنب التكرار).
2. **اقرأ [GAPS_BY_DOMAIN.md](./GAPS_BY_DOMAIN.md)** لترى الفجوات في النطاق المعني وتحديد الأولوية.
3. **انسخ Build Package من [BUILD_PROMPTS_LIBRARY_V2.md](./BUILD_PROMPTS_LIBRARY_V2.md)** والصقه في `/erp-build-feature` للتنفيذ.

---

## 🎯 Top 10 Critical Path (6-month plan)

من الفجوات الـ 403، هذه الـ 10 الأكثر تأثيراً:

| # | Gap (Reference) | Build Package | Phase |
|---|-----------------|---------------|-------|
| 1 | Domain 1.1 + 1.2 — Universal Journal + Parallel Ledgers | Build #1 | 0 |
| 2 | Domain 4.4 + 4.10 — Payment Factory + SWIFT GPI | Build #18 | 2 |
| 3 | Domain 6.1 + 6.4 — Tax Engine + VAT Return | Build #9 | 1 |
| 4 | Domain 9.7 + 9.11 — ATP/CTP + Demand Forecasting | (في Phase 4) | 4 |
| 5 | Domain 16.1 + 16.2 — Qiwa + Mudad Full | Build #7 + #12 | 1 |
| 6 | Domain 22.1 + 22.4 — Continuous SoD + Internal Audit | (في GRC suite) | 5 |
| 7 | Domain 23.1 + 23.5 — Semantic Layer + FS Designer | Build #39 | 5 |
| 8 | Domain 25.1 + 25.2 — API Gateway + Webhooks | Build #45 | 6 |
| 9 | Domain 27.2 + 27.4 — Cache + Queue with DLQ | (Infra) | — |
| 10 | Domain 28.2 + 28.7 — SCIM/SSO + UEBA | Build #44 | 6 |

---

## 📊 Top 5 Saudi Compliance Mandatory (الأعجل)

| # | Gap | Penalty if Missing | Build |
|---|-----|---------------------|-------|
| 1 | **Qiwa + Saudization/Nitaqat** | تجميد visas، تعطيل VAT/WPS | Build #7 |
| 2 | **PDPL DSR + Breach Notification** | حتى **5 ملايين ر.س** | Build #8 |
| 3 | **Zakat Engine + Auto Filing** | تقدير + غرامة | Build #11 |
| 4 | **VAT per-line classification + reverse-charge** | حتى **50 ألف ر.س** + 5%/شهر | Build #9 |
| 5 | **WHT foreign-vendor + Form 14** | حتى **10 ألف ر.س** + 1%/شهر | Build #10 |

---

## 📈 خارطة الطريق المُقتَرحة (72 أسبوع)

```
أسبوع 1-8     ▶ Phase 0: Foundation (6 builds)
أسبوع 9-16    ▶ Phase 1: Saudi Critical (6 builds)        ← مهم للإنتاج
أسبوع 17-28   ▶ Phase 2: Finance Excellence (8 builds)
أسبوع 29-38   ▶ Phase 3: Sales/Procurement (8 builds)
أسبوع 39-50   ▶ Phase 4: Operations (7 builds)            ← Mfg/WMS/Inventory
أسبوع 51-60   ▶ Phase 5: Projects/Service/BI (5 builds)
أسبوع 61-72   ▶ Phase 6: Verticals + Cross-cutting (6 builds)
```

**Total: 46 builds → ERP بمستوى SAP/Oracle parity في ~17 شهر.**

---

## 🛠️ Engines الموجودة فعلاً (لا تُكرَّر)

| Engine | Status | المسار |
|--------|--------|--------|
| `auto-journal` | ✅ مكتمل | `src/lib/auto-journal.ts` |
| `costing` | ✅ FIFO/LIFO/Avg | `src/lib/costing.ts` |
| `mrp-engine` | ✅ MRP infinite | `src/lib/mrp-engine.ts` |
| `mps-engine` | ✅ | `src/lib/mps-engine.ts` |
| `bom-engine` | ✅ | `src/lib/bom-engine.ts` |
| `subcontracting-engine` | ✅ | `src/lib/subcontracting-engine.ts` |
| `wht-engine` | ✅ + extended this session | `src/lib/wht-engine.ts` |
| `gosi-engine` | ✅ | `src/lib/gosi-engine.ts` |
| `wps-generator` | ✅ | `src/lib/wps-generator.ts` |
| `saudi-eos-engine` | ✅ | `src/lib/saudi-eos-engine.ts` |
| `zatca-signer` | ✅ Phase 2 | `src/lib/zatca-signer.ts` |
| `lease-accounting-engine` | ✅ IFRS-16 | `src/lib/lease-accounting-engine.ts` |
| `multi-book-engine` | ✅ | `src/lib/multi-book-engine.ts` |
| `three-way-match` | ✅ | `src/lib/three-way-match.ts` |
| `dunning-engine` | ✅ | `src/lib/dunning-engine.ts` |
| `payment-run-engine` | ✅ + extended this session | `src/lib/payment-run-engine.ts` |
| `fixed-assets-engine` | ✅ | `src/lib/fixed-assets-engine.ts` |
| `mfa-engine` | ✅ + extended this session | `src/lib/mfa-engine.ts` |
| `bank-recon-engine` | ✅ | `src/lib/bank-recon-engine.ts` |
| `open-items` | ✅ | `src/lib/open-items.ts` |
| `cash-application` | ✅ | `src/lib/cash-application.ts` |
| `governance-engine` | ✅ | `src/lib/governance-engine.ts` |
| `field-audit` | ✅ | `src/lib/field-audit.ts` |
| `consolidation-engine` | ✅ | `src/lib/consolidation-engine.ts` |
| `fx-revaluation` | ✅ | `src/lib/fx-revaluation.ts` |
| `mudad` | 🟡 stub فقط | `src/lib/saudi-gov/mudad.ts` (Build #12) |
| `wms-engine` | 🟡 thin (Build #29 يوسع) | `src/lib/wms-engine.ts` |
| `qiwa` | ❌ غير موجود (Build #7) | TBD |
| `pdpl-engine` | ❌ غير موجود (Build #8) | TBD |
| **`zakat-engine`** | ✅ **بُني هذه الجلسة** | `src/lib/zakat-engine.ts` |

---

## ✅ ما تم إنجازه في هذه الجلسة (نسبة كبيرة)

### Production
- ✅ Redis مُصلَح (apt purge + reinstall)
- ✅ 8 PostgreSQL roles + GRANTs
- ✅ n1.namainvist.com/.env رمَّم
- ✅ n1-main أُضيف لـ PM2
- ✅ 12 ملف hardcoded creds → env vars
- ✅ MfaEngine + 2FA routes (4 دوال جديدة)
- ✅ WHTEngine + DunningEngine + PaymentRunEngine (دوال مفقودة)
- ✅ depreciation routes (currentValue → currentBookValue)
- ✅ Zakat Engine كامل + 5 APIs + UI + Migration على 11 DB
- ✅ /api/accounting/fiscal-years (كان 404)
- ✅ 12 ملف i18n (admin/grc, bi-builder, v3 modules — ~96 نص)

### Documentation
- ✅ MASTER_AUDIT_REPORT.md
- ✅ BUILD_PLAYBOOK.md (15 builds مختصرة)
- ✅ I18N_PLAN.md
- ✅ DEAD_BUTTONS_REPORT.md
- ✅ MODULE_INVENTORY_V2.md (3,800 سطر — 79 موديول)
- ✅ GAPS_BY_DOMAIN.md (3,000 سطر — 403 فجوة)
- ✅ BUILD_PROMPTS_LIBRARY_V2.md (5,000 سطر — 46 build packages)
- ✅ ULTIMATE_AUDIT_INDEX.md (هذا الملف)

---

## 🎯 الخطوة التالية الموصى بها

ابدأ بـ **Phase 0 — Build #1 (Universal Journal)** لأنها **أساس** كل ما بعدها (CO-PA, EVM, BI Cubes تعتمد عليها). الأمر:

```
/erp-build-feature
{اللصق من BUILD_PROMPTS_LIBRARY_V2.md → Build #1 → Ready Prompt}
```

أو ابدأ بـ **Phase 1 (Saudi Compliance)** إذا الإنتاج يحتاج Qiwa/PDPL فوراً.

---

**نهاية الفهرس الموحد.** كل التوثيق جاهز. التنفيذ ابتداءً من هنا.
