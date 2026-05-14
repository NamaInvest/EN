# 34 - فهرس المحركات الكامل (Lib Engines Catalog)

> 350+ ملف في `src/lib/` مصنّف حسب المجال — مرجع شامل لكل engine في النظام

---

## 📊 الإحصائيات

- **إجمالي ملفات `src/lib/*.ts`:** ~359
- **عدد المجلدات الفرعية:** 41
- **الـ engines القابلة للإعادة الاستخدام:** ~250
- **الـ utilities + helpers:** ~100

---

## 💼 محاسبة عامة (General Accounting Engines)

### Core Posting & Journal:
| الملف | الغرض |
|---|---|
| `auto-journal.ts` (53KB) | **محرك القيود التلقائية الموحد** |
| `accounting-engine.ts` | محرك المحاسبة الأساسية |
| `recurring-journal-runner.ts` | القيود المتكررة |
| `manufacturing-accounting.ts` | قيود التصنيع |

### Account Structure:
| الملف | الغرض |
|---|---|
| `account-hierarchy-engine.ts` | شجرة الحسابات الهرمية |
| `seed-socpa-coa.ts` | بذر COA SOCPA (88 حساب) |
| `multi-book-engine.ts` + `multi-book-engine-v2.ts` | محاسبة متعددة الكتب |
| `multi-gaap-engine.ts` | IFRS + US GAAP + Local |

### Period & Close:
| الملف | الغرض |
|---|---|
| `period-close.ts` / `period-close-engine.ts` | إقفال الفترات (16 خطوة) |
| `period-lock-engine.ts` | قفل الفترات |
| `month-end-close-engine.ts` | إقفال شهري |
| `year-end-close.ts` / `year-end-engine.ts` / `year-end-processing-engine.ts` | إقفال سنوي |
| `financial-close-engine.ts` | الإقفال المالي العام |

### Financial Statements:
| الملف | الغرض |
|---|---|
| `financial-statements-engine.ts` (27KB) | **الـ engine الرئيسي للقوائم** |
| `equity-statement-engine.ts` | قائمة التغيرات في حقوق الملكية |
| `cash-flow-forecasting.ts` (17KB) | التدفقات النقدية |
| `cash-flow-indirect-engine.ts` | الـ Indirect method |
| `cashflow-direct-engine.ts` | الـ Direct method |
| `cashflow-engine.ts` | عام |
| `cash-flow-forecast.ts` | التنبؤ |
| `cash-forecast-engine.ts` | تنبؤ الـ cash |
| `notes-to-fs-engine.ts` / `fs-notes-engine.ts` / `financial-notes-engine.ts` | إيضاحات القوائم |
| `comparative-financial-report-engine.ts` | تقارير مقارنة |
| `statutory-reports-engine.ts` | تقارير قانونية |
| `segment-reporting-engine.ts` | IFRS 8 |

### IFRS Compliance:
| الملف | الغرض |
|---|---|
| `ifrs-engines.ts` | عام |
| `ifrs9-ecl.ts` + `ecl-engine.ts` | IFRS 9 — Expected Credit Loss |
| `ifrs16-lease-engine.ts` + `lease-accounting-engine.ts` | IFRS 16 — Leases |
| `revenue-recognition-ifrs15.ts` + `revenue-recognition.ts` | IFRS 15 — Revenue |
| `contract-asset-engine.ts` | IFRS 15 contract assets |
| `impairment-engine.ts` | Asset impairment |
| `hedge-accounting-engine.ts` | Hedge accounting |
| `transfer-pricing-engine.ts` | Transfer pricing |
| `deferred-tax-engine.ts` | الضرائب المؤجلة |

### Multi-Entity:
| الملف | الغرض |
|---|---|
| `consolidation-engine.ts` | توحيد القوائم |
| `intercompany-engine.ts` | المعاملات البينية |
| `ic-elimination-engine.ts` | حذف المعاملات البينية |
| `ic-netting-engine.ts` | مقاصة المعاملات |

### Currency & FX:
| الملف | الغرض |
|---|---|
| `fx-revaluation.ts` / `fx-revaluation-engine.ts` | إعادة تقييم العملات |
| `realized-fx-engine.ts` | فروقات FX محققة |
| `cumulative-translation.ts` | ترجمة العملات للتوحيد |

### Budget & Variance:
| الملف | الغرض |
|---|---|
| `budget-engine.ts` | إدارة الميزانيات |
| `budget-control.ts` | الرقابة على الميزانية |
| `budget-variance-engine.ts` | تحليل الفروقات |
| `rolling-budget-engine.ts` | Rolling forecast |
| `variance-engine.ts` | تحليل الانحرافات |

### Allocations:
| الملف | الغرض |
|---|---|
| `allocation-engine.ts` | توزيعات المصروفات |
| `copa-engine.ts` | CO-PA (Profitability Analysis) |

### Aging & Dunning:
| الملف | الغرض |
|---|---|
| `aging-engine.ts` | تقرير الأعمار (AR/AP) |
| `dunning-engine.ts` + `dunning-engine-v2.ts` | إنذار التحصيل |
| `collection-workflow-engine.ts` | workflow التحصيل |
| `bad-debt-engine.ts` | الديون المشكوك فيها |

### AR/AP:
| الملف | الغرض |
|---|---|
| `cash-application.ts` + `cash-application-engine.ts` + `cash-app-engine.ts` | تطبيق الدفعات |
| `open-items.ts` + `open-items-engine.ts` | إدارة البنود المفتوحة |
| `customer-statement.ts` + `customer-statement-pdf.ts` + `customer-statement-email.ts` + `customer-statement-scheduler.ts` | كشوف حساب العملاء |
| `vendor-statement.ts` | كشوف حساب الموردين |
| `payment-run-engine.ts` | تشغيل المدفوعات |
| `payment-terms.ts` | شروط الدفع |
| `gr-ir-clearing-engine.ts` | تسوية GR/IR |
| `credit-check.ts` + `credit-check-engine.ts` + `credit-limit-engine.ts` | فحص الائتمان |
| `commitments-register-engine.ts` | سجل الالتزامات |

---

## 🛒 المبيعات والـ POS (Sales & POS Engines)

| الملف | الغرض |
|---|---|
| `quote-engine.ts` | عروض الأسعار |
| `cpq-engine.ts` | Configure-Price-Quote |
| `delivery-note-engine.ts` | إذن التسليم |
| `rma-engine.ts` | Return Merchandise Authorization |
| `pos-session-engine.ts` | جلسات الـ POS |
| `pos-sync-engine.ts` | مزامنة POS (online/offline) |
| `commission-engine.ts` | عمولات المندوبين |
| `pricing-rule-engine.ts` | قواعد التسعير |
| `promotions-engine.ts` | الترويج والعروض |
| `loyalty-points-engine.ts` | برامج الولاء |
| `rebate-engine.ts` | الـ Rebates |
| `sales-forecast.ts` + `sales-forecast-engine.ts` | توقعات المبيعات |
| `subscription-engine.ts` | الاشتراكات المتكررة |
| `recurring-billing-engine.ts` | الفوترة المتكررة |
| `bnpl.ts` | BNPL (Tabby/Tamara) |
| `territory-engine.ts` | المناطق الجغرافية |
| `salla.ts` | تكامل سلة |
| `omnichannel-engine.ts` | متعدد القنوات |

---

## 🛍 المشتريات (Procurement Engines)

| الملف | الغرض |
|---|---|
| `three-way-match.ts` + `three-way-match-engine.ts` | المطابقة الثلاثية |
| `three-way-match-tolerance-engine.ts` | tolerance settings |
| `blanket-po-engine.ts` | Blanket POs |
| `landed-cost-engine.ts` | التكاليف الإضافية |
| `rfx-auction-engine.ts` | RFx Auctions |
| `reverse-auction-engine.ts` | المزادات العكسية |
| `rfq-vendor-comparison-engine.ts` | مقارنة عروض الموردين |
| `vendor-contract-engine.ts` | عقود الموردين |
| `vendor-onboarding-engine.ts` | تأهيل الموردين |
| `vendor-portal-engine.ts` + `supplier-portal-engine.ts` | بوابة المورد |
| `vendor-scorecard.ts` + `vendor-scoring.ts` | تقييم الموردين |
| `spend-analysis-engine.ts` + `spend-analytics-engine.ts` + `spend-analytics.ts` | تحليل الإنفاق |
| `ap-ocr-engine.ts` | OCR لفواتير الشراء |
| `contract-engine.ts` | إدارة العقود |

---

## 📦 المخزون والمستودعات (Inventory & Warehouse Engines)

### Core Inventory:
| الملف | الغرض |
|---|---|
| `inventory-engine.ts` | core inventory |
| `inventory-analytics-engine.ts` | تحليلات المخزون |
| `inventory-bin-engine.ts` | إدارة الـ bins |
| `costing.ts` | FIFO/LIFO/Average |
| `material-issuance.ts` | إصدار المواد للإنتاج |

### Lot/Batch/Serial:
| الملف | الغرض |
|---|---|
| `lot-engine.ts` | Lot tracking |
| `serial-batch-tracking-engine.ts` | Serial + Batch |
| `picking-fefo.ts` | FEFO picking |

### WMS:
| الملف | الغرض |
|---|---|
| `wms-engine.ts` | WMS عام |
| `wms-wave-engine.ts` | Wave management |
| `wave-picking.ts` | Wave picking logic |
| `slotting-engine.ts` | تحسين توزيع المنتجات |
| `cross-dock-engine.ts` | Cross-docking |
| `dropship-engine.ts` | Drop shipping |
| `shipping-engine.ts` | الشحن |

### Planning:
| الملف | الغرض |
|---|---|
| `demand-sensing-engine.ts` | استشعار الطلب (AI) |
| `reorder-engine.ts` | منطق إعادة الطلب |
| `mps-engine.ts` | Master Production Schedule |
| `mrp-engine.ts` | Material Requirements Planning |

---

## 🏭 التصنيع (Manufacturing Engines)

| الملف | الغرض |
|---|---|
| `bom-engine.ts` | Bill of Materials |
| `mes-engine.ts` | Manufacturing Execution System |
| `mes-oee-engine.ts` | OEE الـ MES |
| `oee-engine.ts` | Overall Equipment Effectiveness |
| `aps-engine.ts` + `aps-scheduler.ts` | Advanced Planning Scheduling |
| `standard-cost-engine.ts` | التكلفة المعيارية |
| `capacity-planning-engine.ts` | تخطيط القدرات |
| `wip-production-tracking-engine.ts` | تتبع WIP |
| `subcontracting-engine.ts` | المقاولات الفرعية |
| `quality-management.ts` + `quality-inspection-engine.ts` | إدارة الجودة |
| `spc-engine.ts` | Statistical Process Control |
| `calibration-engine.ts` | معايرة الأجهزة |
| `preventive-maintenance.ts` | الصيانة الوقائية |
| `eco-engine.ts` | Engineering Change Order |

---

## 👥 الموارد البشرية (HR & Payroll Engines)

### Employee Lifecycle:
| الملف | الغرض |
|---|---|
| `employee-onboarding-engine.ts` | تأهيل الموظف |
| `employee-performance-engine.ts` | تقييم الأداء |
| `recruitment-engine.ts` | التوظيف |
| `ats-engine.ts` | Applicant Tracking System |
| `succession-engine.ts` | التعاقب الوظيفي |
| `competency-engine.ts` | الكفاءات |
| `okr-engine.ts` | Objectives & Key Results |
| `tna-engine.ts` | Training Needs Analysis |
| `comp-review-engine.ts` | Compensation Review |
| `nps-engine.ts` | Net Promoter Score (للموظفين) |

### Time & Attendance:
| الملف | الغرض |
|---|---|
| `timesheet-engine.ts` | كشوف الوقت |
| `shift-schedule-engine.ts` | جدولة الورديات |
| `leave-engine.ts` | الإجازات |
| `overtime-approval-engine.ts` | اعتماد الإضافي |

### Payroll:
| الملف | الغرض |
|---|---|
| `payroll-reconciliation-engine.ts` | تسوية الرواتب |
| `multi-country-payroll-engine.ts` | رواتب متعددة الدول |
| `salary-structure-engine.ts` | هيكل الرواتب |
| `salary-advances-engine.ts` + `employee-loan-engine.ts` | السلف والقروض |
| `expense-report-engine.ts` | تقارير المصروفات |

### Saudi Compliance:
| الملف | الغرض |
|---|---|
| `eos-engine.ts` + `saudi-eos-engine.ts` | EOS Article 84-85 |
| `gosi-engine.ts` + `gosi-service.ts` | GOSI |
| `wps-generator.ts` | WPS SIF generator |
| `saudization-nitaqat-engine.ts` | السعودة والنطاقات |
| `mudad-api.ts` + `mudad-compliance.ts` + `mudad-sync-engine.ts` | Mudad |
| `qiwa-engine.ts` | Qiwa |

### Self-Service:
| الملف | الغرض |
|---|---|
| `ess-engine.ts` | Employee Self Service |

---

## 🏗 الأصول الثابتة (Fixed Assets Engines)

| الملف | الغرض |
|---|---|
| `fixed-assets-engine.ts` | أساسي |
| `asset-lifecycle-engine.ts` | دورة الحياة |
| `asset-physical-verification-engine.ts` | جرد الأصول |
| `asset-revaluation-engine.ts` | إعادة التقييم |
| `depreciation-engine.ts` (490 سطر) | الإهلاك |
| `aro-engine.ts` | Asset Retirement Obligations |

---

## 🏦 الخزينة والبنوك (Treasury & Banking)

### Banking:
| الملف | الغرض |
|---|---|
| `bank-feed-engine.ts` | Bank feed (Open Banking) |
| `bank-statement-engine.ts` | معالجة الكشوف |
| `bank-statement-importer.ts` | استيراد كشوف |
| `bank-statement-parser.ts` (18KB) | parser للصيغ المختلفة |
| `bank-recon-engine.ts` + `bank-reconciliation.ts` + `bank-reconciliation-ui-engine.ts` | الموازنة |
| `bank-recon-exceptions.ts` | استثناءات الموازنة |

### Cash Management:
| الملف | الغرض |
|---|---|
| `treasury-cash-position-engine.ts` | الموقف النقدي |
| `cheque-management-engine.ts` | إدارة الشيكات |

---

## 🏢 إدارة المشاريع (Project Management)

| الملف | الغرض |
|---|---|
| `project-costing-engine.ts` | تكلفة المشاريع |
| `project-profitability-engine.ts` | ربحية المشاريع |
| `project-revenue-recognition-engine.ts` | اعتراف بإيرادات المشاريع |
| `wbs-engine.ts` | Work Breakdown Structure |

---

## 🎯 CRM & Customer Engagement

| الملف | الغرض |
|---|---|
| `crm-engine.ts` | CRM core |
| `customer360-engine.ts` | عرض شامل للعميل |
| `customer-health-engine.ts` | صحة العلاقة مع العميل |
| `customer-portal-engine.ts` | بوابة العميل |

---

## 🤖 الذكاء الاصطناعي (AI Engines)

### AI Core:
| الملف | الغرض |
|---|---|
| `ai-copilot-engine.ts` | Copilot |
| `ai-personas.ts` | شخصيات AI الـ 4 |
| `ai-cost.ts` | تتبع التكلفة |
| `ai-eval.ts` | تقييم الجودة |
| `ai-job-queue.ts` | قائمة المهام |
| `llm-client.ts` | عميل LLM موحد |

### LangChain:
| الملف | الغرض |
|---|---|
| `langchain-orchestrator.ts` | تنسيق Chains |
| `langchain-chains.ts` | Chains الـ pre-defined |

### Prompt Engineering:
| الملف | الغرض |
|---|---|
| `prompt-registry.ts` | سجل البرومبتس |
| `prompt-cache.ts` | كاش البرومبتس |
| `few-shot-examples.ts` | أمثلة few-shot |
| `token-budget.ts` | إدارة الـ tokens |

### Specific AI Features:
| الملف | الغرض |
|---|---|
| `nlq-engine.ts` | Natural Language Query |
| `kb-rag-engine.ts` | Knowledge Base RAG |
| `rag-pipeline.ts` | RAG pipeline |
| `vector-store.ts` | Vector storage |
| `document-embeddings.ts` | تضمينات الوثائق |
| `mcp-bridge.ts` | Model Context Protocol |

### AI subdirectory (`src/lib/ai/`):
| الملف | الغرض |
|---|---|
| `ai-finetuning-engine.ts` | Fine-tuning |
| `ai-governance-engine.ts` | الحوكمة |
| `ai-vision-engine.ts` | Vision |
| `ai-voice-engine.ts` | Voice |
| `multi-agent-engine.ts` | Multi-agent |

---

## ⚙️ Workflow & State Machine

| الملف | الغرض |
|---|---|
| `state-machine.ts` + `state-machine-engine.ts` | State machine generic |
| `document-state-machine.ts` | State machine للوثائق |
| `workflow-builder-engine.ts` | Drag-and-drop workflow |
| `approval-engine.ts` (13KB) | الموافقات |
| `approval-sla-engine.ts` | SLA الموافقات |
| `approval-workflow-engine.ts` | workflow الموافقات |
| `bpm-engine.ts` + `bpmn-engine.ts` | BPMN |
| `saga-orchestrator.ts` | Saga pattern |
| `scheduled-action-engine.ts` | إجراءات مجدولة |

---

## 🔢 Numbering & Audit

| الملف | الغرض |
|---|---|
| `numbering.ts` + `numbering-engine.ts` | تسلسلات الترقيم |
| `field-audit-engine.ts` | **Field-Level Audit Trail** |
| `field-audit.ts` | core |
| `prisma-audit.ts` | Prisma middleware |
| `prisma-soft-delete.ts` | Soft delete middleware |

---

## 🛡 Security & Compliance

### Field-Level:
| الملف | الغرض |
|---|---|
| `field-encryption-engine.ts` | تشفير الحقول |
| `field-permission.ts` | صلاحيات الحقول |

### Data Protection:
| الملف | الغرض |
|---|---|
| `data-masking-engine.ts` | إخفاء البيانات |
| `pii-mask.ts` | إخفاء PII |
| `privacy-filter.ts` | فلتر للـ AI |

### Crypto:
| الملف | الغرض |
|---|---|
| `encryption.ts` | AES-256-GCM |
| `mfa-engine.ts` + `totp.ts` | MFA |

### Governance:
| الملف | الغرض |
|---|---|
| `governance-engine.ts` | الحوكمة |
| `pdpl-engine.ts` (في `src/lib/pdpl/`) | PDPL Saudi |

---

## 📊 Reports & BI

| الملف | الغرض |
|---|---|
| `report-builder-engine.ts` | بناء التقارير |
| `custom-report-engine.ts` | تقارير مخصصة |
| `bi-cube-engine.ts` | BI Cube (OLAP) |
| `pivot-engine.ts` | Pivot tables |
| `dashboard-builder-engine.ts` | Drag-drop dashboards |

---

## 💬 Communication

| الملف | الغرض |
|---|---|
| `email.ts` + `email-template-engine.ts` | البريد |
| `sms.ts` | SMS |
| `notification-engine.ts` + `notifications.ts` | الإشعارات |
| `telegram-bot.ts` | بوت التليجرام |
| `chatter-engine.ts` | Chat features |
| `help-desk-engine.ts` | Help desk |

---

## 🔌 Integration

### subdirectory `src/lib/integrations/`:
| الملف | الغرض |
|---|---|
| `accounting-migration-engine.ts` | استيراد من أنظمة أخرى |
| `ai-ocr-engine.ts` | OCR |
| `bank-integration-engine.ts` | تكامل البنوك |
| `ecommerce-sync-engine.ts` | مزامنة E-commerce |
| `government-portals-engine.ts` | البوابات الحكومية |
| `payment-gateway-engine.ts` | بوابات الدفع |
| `productivity-engine.ts` | أدوات الإنتاجية |
| `shipping-engine.ts` | الشحن |

### Webhooks:
| الملف | الغرض |
|---|---|
| `webhook-engine.ts` | core |
| `webhook-guard.ts` | حماية inbound |
| `webhooks.ts` | helpers |

---

## 💾 Storage & Files

| الملف | الغرض |
|---|---|
| `cloud-storage.ts` | S3/Azure |
| `cdn-manager.ts` | CDN |
| `pdf-service.ts` | توليد PDF |
| `excel-service.ts` | Excel I/O |
| `import-export-engine.ts` | Import/Export |
| `dms-engine.ts` | Document Management |
| `print-template-engine.ts` | قوالب الطباعة |
| `barcode-engine.ts` | الباركود |
| `qz.ts` | QZ Tray |
| `esignature-engine.ts` | التوقيع الإلكتروني |

---

## 🧰 Utilities

### Math & Money:
| الملف | الغرض |
|---|---|
| `money.ts` | Decimal handling |
| `decimal-utils.ts` | Helpers |
| `formatters.ts` | Format helpers |

### Date/Locale:
| الملف | الغرض |
|---|---|
| `hijri.ts` | التقويم الهجري |
| `translations.ts` | الترجمات |
| `localization-engine.ts` | i18n |

### Common:
| الملف | الغرض |
|---|---|
| `cache.ts` | Caching |
| `pagination.ts` | Pagination helpers |
| `idempotency.ts` | Idempotency keys |
| `validations.ts` + `validations.test.ts` | Zod validators |
| `decimal-utils.ts` | Math |
| `env.ts` + `env-validator.ts` | Environment vars |

### Search:
| الملف | الغرض |
|---|---|
| `global-search-engine.ts` | بحث شامل |
| `search-engine.ts` (في platform) | core |

### UI helpers:
| الملف | الغرض |
|---|---|
| `design-tokens.ts` | Design tokens |
| `usePagePermission.ts` | Page-level permissions hook |
| `useToast` / `Toast.tsx` | Notifications |

---

## 🛠 Infrastructure

| الملف | الغرض |
|---|---|
| `prisma.ts` | Prisma client + RLS + Pool |
| `auth.ts` | JWT + bcrypt |
| `b2b-auth.ts` | B2B auth |
| `logger.ts` | Structured logging |
| `observability.ts` | Observability core |
| `telemetry.ts` | Telemetry |
| `sentry.ts` | Sentry integration |
| `security-headers.ts` | Security headers |
| `cron-guard.ts` | Cron auth |
| `webhook-guard.ts` | Webhook auth |
| `quotaGuard.ts` | API quotas |
| `api-error.ts` | Error handling |
| `api-handler.ts` | Generic handler |
| `api-keys.ts` | API key management |
| `rate-limit.ts` + `rate-limiter.ts` | Rate limiting |
| `mcp-bridge.ts` | MCP |

### Instrumentation (`src/lib/instrumentation/`):
| الملف | الغرض |
|---|---|
| `metrics.ts` | Prometheus metrics |
| `otel.ts` | OpenTelemetry |

---

## 📦 Specialized Subdirectories

### Saudi-Specific:
| المجلد | الملفات | الغرض |
|---|---|---|
| `src/lib/gosi/` | gosi-engine.ts | GOSI |
| `src/lib/wps/` | mudad-integration-engine.ts, wps-sif-generator.ts | WPS + Mudad |
| `src/lib/zatca/` | zatca-counter-service.ts, zatca-onboarding-engine.ts, zatca-qr-engine.ts | ZATCA |
| `src/lib/zakat/` | zakat-tax-engine.ts | Zakat |
| `src/lib/qiwa/` | qiwa-engine.ts | Qiwa |
| `src/lib/najiz/` | najiz-engine.ts | **Najiz (محاكم سعودية)** |
| `src/lib/sama/` | sama-open-banking-engine.ts | **SAMA Open Banking** |
| `src/lib/customs/` | customs-bayan-engine.ts | **Bayan (الجمارك)** |
| `src/lib/saudi-compliance/` | index.ts | شامل |
| `src/lib/saudi-gov/` | mudad.ts | عام |
| `src/lib/pdpl/` | pdpl-engine.ts | PDPL |
| `src/lib/hr/` | (HR helpers) | HR |

### AI Subdirectories:
| المجلد | المحتوى |
|---|---|
| `src/lib/ai/` | 5 engines (finetuning, governance, vision, voice, multi-agent) |
| `src/lib/chains/` | base, parallel, react, reflexion, router, sequential (LangChain) |
| `src/lib/rag/` | augmentation, citations, evaluation, query-transformers, retrievers + pipeline |
| `src/lib/vector/` | chunking, embedding, ingestion, retrieval, store |
| `src/lib/prompts/` | ab-testing, eval, library, registry, system |
| `src/lib/orchestrator/` | streaming, tool-registry, tools |

### Platform:
| المجلد | المحتوى |
|---|---|
| `src/lib/platform/` | auth-sso, desktop-electron, mobile-pwa, notifications, print-barcode, realtime, reporting, search |

### Other:
| المجلد | المحتوى |
|---|---|
| `src/lib/bank-files/` | sepa-pain-001.ts (SEPA payment format) |
| `src/lib/bank-parsers/` | mt940.ts (SWIFT MT940) |
| `src/lib/payment-gateway/` | moyasar.ts (Saudi payment gateway) |
| `src/lib/state-machine/` | state machine implementation |
| `src/lib/workflow/` | approval, engine, saga (workflow engine) |
| `src/lib/services/` | service layer |
| `src/lib/queue/` | BullMQ queues |
| `src/lib/storage/` | file storage |
| `src/lib/validations/` | Zod schemas |
| `src/lib/openapi/` | OpenAPI generation |
| `src/lib/context/` | React contexts |
| `src/lib/data/` | data helpers |
| `src/lib/db/` | database helpers |
| `src/lib/sre/` | Site Reliability Engineering |
| `src/lib/stock-images/` | صور المنتجات |
| `src/lib/gaps/` | gap-feature implementations |
| `src/lib/product/` | product helpers |

---

## 🔍 ملاحظات مهمة

### الـ Engines المُكرّرة:
بعض الـ engines له أكثر من نسخة (مثل `dunning-engine.ts` + `dunning-engine-v2.ts`):
- النسخة الأقدم: legacy
- النسخة v2: المُعتمدة الجديدة
- **عند العمل، استخدم v2 إن وجدت**

### الفرق بين `.ts` و `.test.ts`:
- ملفات `.test.ts` هي اختبارات Jest
- لا تستخدمها كـ engines (هي tests فقط)

### Engines قيد التطوير:
- بعض engines صغيرة (< 1KB) قد تكون stubs
- مثلاً: `bpmn-engine.ts` (697 bytes) — placeholder
- `approval-workflow-engine.ts` (846 bytes) — قد يكون wrapper

### Best Practice:
عند إضافة engine جديد:
1. ضعه في الموقع المنطقي (subdirectory أو root)
2. اتبع تسمية `{domain}-engine.ts` أو `{domain}-{purpose}.ts`
3. أضف للملف الـ Brain المناسب
4. اكتب اختبار `{file}.test.ts`
