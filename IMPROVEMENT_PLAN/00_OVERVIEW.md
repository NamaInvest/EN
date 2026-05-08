# 📋 خطة التحسين الشاملة — Namasoft ERP

> **الهدف:** الوصول لمستوى SAP/Oracle/NetSuite في 9-12 شهر.
> **94 ملف** يغطي كل طبقات النظام.

---

## 🚨 اقرأ هذا أولاً

📌 **[STATUS_LEGEND.md](STATUS_LEGEND.md)** — يوضح:
- 🟢 ما هو **موجود فعلاً** في النظام
- 🔴 ما هو **مفقود** يجب إضافته
- 🟡 ما هو **موجود لكن معطّل/جزئي** يجب إصلاحه

كل ملف يحتوي 3 أقسام: **الموجود** → **الفجوات** → **الخطة**.

---

## 📚 الفهرس الكامل

### 🛠️ الطبقة الأفقية (Horizontal Layers) — الجذور
| # | الملف | الوصف |
|---|-------|-------|
| 01 | [PROMPT_ENGINEERING](01_PROMPT_ENGINEERING.md) | Registry, A/B Testing |
| 02 | [SYSTEM_PROMPT](02_SYSTEM_PROMPT.md) | Personas, Few-shot |
| 03 | [CONTEXT](03_CONTEXT.md) | Tenant + Business Context |
| 04 | [WORKFLOW_ORCHESTRATION](04_WORKFLOW_ORCHESTRATION.md) | State Machines, Sagas |
| 05 | [LANGCHAIN](05_LANGCHAIN.md) | 25 ERP Tools |
| 06 | [CHAINING](06_CHAINING.md) | Sequential, ReAct |
| 07 | [VECTORMINE](07_VECTORMINE.md) | Knowledge Pipeline |
| 08 | [BACKEND_LOGIC](08_BACKEND_LOGIC.md) | Service Layer |
| 09 | [API](09_API.md) | OpenAPI + Versioning |
| 10 | [DATA_STORAGE](10_DATA_STORAGE.md) | Decimal Migration |
| 11 | [VECTOR_DATABASES](11_VECTOR_DATABASES.md) | pgvector HNSW |
| 12 | [RAG](12_RAG.md) | Citations + RAGAS |
| 13 | [FRONTEND_UIUX](13_FRONTEND_UIUX.md) | RHF + Tanstack |
| 14 | [SHUTTERSTOCK_MEDIA](14_SHUTTERSTOCK_MEDIA.md) | CDN |
| 15 | [INFRASTRUCTURE_DEVOPS](15_INFRASTRUCTURE_DEVOPS.md) | K8s + Vault |
| 16 | [CICD](16_CICD.md) | CodeQL + Snyk |
| 17 | [TESTING_QA](17_TESTING_QA.md) | Strategy |
| 18 | [UNIT_TESTING](18_UNIT_TESTING.md) | Vitest |
| 19 | [INTEGRATION_TESTING](19_INTEGRATION_TESTING.md) | Playwright |

### 📦 الموديولات الـ ERP — القلب
| # | الملف | الاكتمال |
|---|------|---------|
| 20 | [Accounting Engine](20_modules/20_ACCOUNTING_ENGINE.md) | 65% |
| 21 | [AR](20_modules/21_AR_RECEIVABLES.md) | 35% |
| 22 | [AP](20_modules/22_AP_PAYABLES.md) | 35% |
| 23 | [Treasury](20_modules/23_TREASURY.md) | 25% |
| 24 | [Inventory](20_modules/24_INVENTORY.md) | 34% |
| 25 | [Manufacturing](20_modules/25_MANUFACTURING.md) | 40% |
| 26 | [HR](20_modules/26_HR.md) | 45% |
| 27 | [Payroll](20_modules/27_PAYROLL.md) | 50% |
| 28 | [Sales & POS](20_modules/28_SALES_POS.md) | 60% |
| 29 | [Purchases](20_modules/29_PURCHASES.md) | 50% |
| 2A | [Fixed Assets](20_modules/2A_FIXED_ASSETS.md) | 18% |
| 2B | [Projects](20_modules/2B_PROJECTS.md) | 30% |
| 2C | [Financial Reporting](20_modules/2C_FINANCIAL_REPORTING.md) | 50% |

### 🇸🇦 الامتثال السعودي
| # | الملف |
|---|------|
| 30 | [ZATCA Phase 2](30_compliance/30_ZATCA_PHASE2.md) |
| 31 | [GOSI](30_compliance/31_GOSI.md) |
| 32 | [WPS / Mudad](30_compliance/32_WPS_MUDAD.md) |
| 33 | [Qiwa](30_compliance/33_QIWA.md) |
| 34 | [Najiz](30_compliance/34_NAJIZ.md) |
| 35 | [PDPL](30_compliance/35_PDPL.md) |
| 36 | [SAMA Open Banking](30_compliance/36_SAMA_OPEN_BANKING.md) |
| 37 | [Saudi Labor Law](30_compliance/37_SAUDI_LABOR_LAW.md) |
| 38 | [Zakat & Tax](30_compliance/38_ZAKAT_TAX.md) |
| 39 | [Customs / Bayan](30_compliance/39_CUSTOMS_BAYAN.md) |

### 🔌 التكاملات
| # | الملف |
|---|------|
| 40 | [Banks](40_integrations/40_BANKS.md) |
| 41 | [Payment Gateways](40_integrations/41_PAYMENT_GATEWAYS.md) |
| 42 | [Shipping](40_integrations/42_SHIPPING.md) |
| 43 | [E-commerce](40_integrations/43_ECOMMERCE.md) |
| 44 | [Government](40_integrations/44_GOVERNMENT.md) |
| 45 | [Accounting Migration](40_integrations/45_ACCOUNTING_MIGRATION.md) |
| 46 | [Productivity](40_integrations/46_PRODUCTIVITY.md) |
| 47 | [AI/OCR Services](40_integrations/47_AI_OCR_SERVICES.md) |

### 💼 المنتج والأعمال
| # | الملف |
|---|------|
| 50 | [Pricing & Billing](50_product/50_PRICING_BILLING.md) |
| 51 | [Onboarding](50_product/51_ONBOARDING.md) |
| 52 | [Documentation](50_product/52_DOCUMENTATION.md) |
| 53 | [Support](50_product/53_SUPPORT.md) |
| 54 | [Marketing](50_product/54_MARKETING.md) |
| 55 | [Knowledge Base](50_product/55_KNOWLEDGE_BASE.md) |
| 56 | [Partner Program](50_product/56_PARTNER_PROGRAM.md) |
| 57 | [Training](50_product/57_TRAINING.md) |

### 📊 البيانات والتحليلات
| # | الملف |
|---|------|
| 60 | [Data Warehouse](60_data/60_DATA_WAREHOUSE.md) |
| 61 | [BI & Reporting](60_data/61_BI_REPORTING.md) |
| 62 | [Forecasting](60_data/62_FORECASTING.md) |
| 63 | [Anomaly Detection](60_data/63_ANOMALY_DETECTION.md) |
| 64 | [Data Migration](60_data/64_DATA_MIGRATION.md) |
| 65 | [Analytics](60_data/65_ANALYTICS.md) |

### 🔧 SRE والاعتمادية
| # | الملف |
|---|------|
| 70 | [SLA / SLO](70_sre/70_SLA_SLO.md) |
| 71 | [Performance](70_sre/71_PERFORMANCE.md) |
| 72 | [Incident Response](70_sre/72_INCIDENT_RESPONSE.md) |
| 73 | [Chaos Engineering](70_sre/73_CHAOS.md) |
| 74 | [FinOps](70_sre/74_FINOPS.md) |

### 🛠️ قدرات المنصة
| # | الملف |
|---|------|
| 80 | [Auth & SSO](80_platform/80_AUTH_SSO.md) |
| 81 | [Notifications](80_platform/81_NOTIFICATIONS.md) |
| 82 | [Search](80_platform/82_SEARCH.md) |
| 83 | [Real-time](80_platform/83_REALTIME.md) |
| 84 | [Reporting Engine](80_platform/84_REPORTING_ENGINE.md) |
| 85 | [Print & Barcode](80_platform/85_PRINT_BARCODE.md) |
| 86 | [Mobile & PWA](80_platform/86_MOBILE_PWA.md) |
| 87 | [Desktop / Electron](80_platform/87_DESKTOP_ELECTRON.md) |

### 🧠 الذكاء الاصطناعي المتقدم
| # | الملف |
|---|------|
| 90 | [Fine-tuning](90_ai_advanced/90_AI_FINETUNING.md) |
| 91 | [Governance](90_ai_advanced/91_AI_GOVERNANCE.md) |
| 92 | [Multi-Agent](90_ai_advanced/92_AI_AGENTS.md) |
| 93 | [Voice](90_ai_advanced/93_AI_VOICE.md) |
| 94 | [Vision](90_ai_advanced/94_AI_VISION.md) |

### 🗺️ خرائط التتبع
| الملف | الوصف |
|-------|-------|
| [STATUS_LEGEND](STATUS_LEGEND.md) | شرح ما هو موجود/مفقود/معطّل |
| [ROADMAP](ROADMAP.md) | الجدول الزمني الإجمالي |
| [METRICS](METRICS.md) | KPIs قبل/بعد |
| [KICKOFF](KICKOFF.md) | الأسبوع الأول |

---

## 🚨 الفترة 0 — الحرائق الأمنية (هذا الأسبوع!)

| # | المهمة | الحرج | الوقت |
|---|--------|-------|------|
| 1 | إزالة `.env` من Git history | 🔴🔴🔴 | 4 ساعات |
| 2 | Rotate كل المفاتيح | 🔴🔴🔴 | 2 ساعة |
| 3 | تعطيل `system/reset` و `check-env` | 🔴🔴🔴 | 1 ساعة |
| 4 | Auth middleware موحّد على 297 route | 🔴🔴 | 8 ساعات |
| 5 | Sentry sampling = 0.1 في prod | 🔴 | 30 دقيقة |
| 6 | إيقاف Ghost PostgreSQL | 🔴🔴 | 2 ساعة |
| 7 | Backup cron يومي | 🔴🔴 | 4 ساعات |

---

## 📊 المؤشرات الإجمالية

| المؤشر | الحالي | الهدف |
|--------|--------|-------|
| Routes بدون auth | 297 (45%) | 0 |
| Routes بدون Zod | 650 (98%) | 0 |
| Float financial fields | 0 | 0 |
| auto-journal coverage | 3.8% | 100% |
| Test coverage | غير معلوم | 80% |
| E2E tests | 0 | 25+ |
| Hardcoded prompts | 6+ | 0 |
| Broken buttons | 109 | 0 |
| Migrations | 2 | 30+ |
| API docs | 0 | 100% |
| نسبة الاكتمال الإجمالية | ~30-35% | 100% |

---

**تاريخ الإنشاء:** 2026-05-08
**عدد الملفات:** 94
**التحديث:** أسبوعياً
