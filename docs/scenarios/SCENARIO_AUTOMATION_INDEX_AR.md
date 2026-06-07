# فهرس أتمتة السيناريوهات - Nama Invest ERP (SCENARIO_AUTOMATION_INDEX_AR)
**المشروع:** Nama Invest ERP
**التاريخ:** 2026-06-07

يرسم هذا المستند خطة تصنيف الأتمتة والطبقات البرمجية المعتمدة لكل سيناريو فحص في النظام، مع تحديد مدى أمان الأتمتة ومتطلبات الأمان والتكامل لكل منها.

---

## 📊 جدول فهرس الأتمتة العام

| المعرف | القسم الفرعي | نوع الأتمتة | طبقة الاختبار | آمن للأتمتة؟ | الأولوية |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SCN-GL-001** | Journal Entries | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-GL-002** | Chart of Accounts | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-BANK-001** | Bank Reconciliation | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM |
| **SCN-GL-003** | Dunning Engine V2 | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM |
| **SCN-POS-001** | Cashier Checkout | UI_E2E | Playwright (Mocked API) | **PARTIAL** | HIGH |
| **SCN-SAL-002** | Sales Returns | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-POS-002** | Restaurant POS | UI_E2E | Playwright (Mocked API) | **PARTIAL** | HIGH |
| **SCN-PUR-001** | Purchase Orders | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM |
| **SCN-PUR-002** | Purchase Returns | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-INV-001** | Stock Transfers | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-INV-002** | Stocktake | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-HR-001** | Employee Contracts | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM |
| **SCN-COMP-001** | Mudad File Generation | API_CONTRACT | Vitest (Read-only) | **YES** | MEDIUM |
| **SCN-APP-001** | Workflow Approvals | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-AI-001** | AI CFO Auditor | API_CONTRACT | Vitest (Mocked LLM) | **YES** | MEDIUM |
| **SCN-CMMS-001** | Preventive Maintenance| INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | LOW |
| **SCN-SEC-001** | Cross-Tenant Leakage | API_CONTRACT | Playwright / Vitest | **YES** | HIGH |
| **SCN-SEC-002** | Server Access Control | API_CONTRACT | Playwright / Vitest | **YES** | HIGH |
| **SCN-PERF-001**| Sync Blockers Check | UNIT | Jest / AST parser check | **YES** | HIGH |
| **SCN-PERF-002**| POS Memory Leak Check | UI_E2E | Playwright Performance | **PARTIAL** | HIGH |
| **SCN-FIN-001** | Unbalanced Entries | UNIT | Vitest / Jest (Calculation) | **YES** | HIGH |
| **SCN-FIN-002** | Posted Record Lock | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |
| **SCN-FIN-003** | Closed Period Lock | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH |

---

## 🏛️ 1. تفاصيل خطة أتمتة موديول المحاسبة (General Ledger)

### SCN-GL-001: Journal Entries & Period Close
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Journal Entries & Period Close
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest / Jest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** يمكن اختبار ترحيل قيد اليومية بالكامل وقياس الأثر المحاسبي باستخدام قاعدة بيانات معزولة ومحاكاة للـ Prisma Client بالكامل دون كتابة حقيقية.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** YES (محاكاة فقط)
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/integration/accounting/journal-post.test.ts`
* **PRIORITY:** HIGH

### SCN-GL-002: Chart of Accounts (COA)
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Chart of Accounts (COA)
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest / Jest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** اختبار التحقق من شجرة الحسابات SoCPA وعزلها بالـ tenantId محاكياً بالكامل.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** YES (محاكاة)
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/integration/accounting/coa.test.ts`
* **PRIORITY:** HIGH

### SCN-BANK-001: Bank Reconciliation
* **MODULE:** Accounting
* **MAIN_SECTION:** Cash & Banks
* **SUBSECTION:** Bank Reconciliation
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest / Jest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** مطابقة حركات البنك وكشوفات الاستيراد بشكل حسابي معزول.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** YES (محاكاة)
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/integration/accounting/bank-recon.test.ts`
* **PRIORITY:** MEDIUM

### SCN-GL-003: Dunning Engine V2
* **MODULE:** Accounting
* **MAIN_SECTION:** Accounts Receivable
* **SUBSECTION:** Dunning Engine V2
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest / Jest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** اختبار محاكاة جدولة الإجراءات وإرسال الإنذارات بدون خوادم SMS/Email حقيقية.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** YES (محاكاة)
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/integration/accounting/dunning.test.ts`
* **PRIORITY:** MEDIUM

---

## 🛡️ 2. تفاصيل خطة أتمتة موديول الأمن والأداء (Security & Performance)

### SCN-SEC-001: Cross-Tenant Leakage Verification
* **MODULE:** Security
* **MAIN_SECTION:** Security & Tenant Isolation
* **SUBSECTION:** Cross-Tenant Isolation
* **AUTOMATION_TYPE:** API_CONTRACT
* **TEST_LAYER:** Playwright / Vitest
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** يمكن إرسال طلبات HTTP لراوترات معزولة والتحقق من كود الاستجابة 403/401؛ آمن جداً ولا يكتب في قاعدة البيانات.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `e2e/security/tenant-isolation.spec.ts`
* **PRIORITY:** HIGH

### SCN-PERF-001: Sync Blockers Check
* **MODULE:** Performance
* **MAIN_SECTION:** Code Quality & Performance
* **SUBSECTION:** Sync Blockers Check
* **AUTOMATION_TYPE:** UNIT
* **TEST_LAYER:** Jest / AST parser check
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** فحص الكود المصدري باستخدام المحللات النحوية (AST) للتأكد من خلوه من `readFileSync` وغيرها؛ آمن 100% ولا يلمس السيرفر.
* **REQUIRES_AUTH:** NO
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/unit/performance/sync-blockers.test.ts`
* **PRIORITY:** HIGH
