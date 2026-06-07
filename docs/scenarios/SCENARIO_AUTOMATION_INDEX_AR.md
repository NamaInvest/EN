# فهرس أتمتة السيناريوهات - Nama Invest ERP (SCENARIO_AUTOMATION_INDEX_AR)
**المشروع:** Nama Invest ERP
**التاريخ:** 2026-06-07

يرسم هذا المستند خطة تصنيف الأتمتة والطبقات البرمجية المعتمدة لكل سيناريو فحص في النظام، مع تحديد مدى أمان الأتمتة ومتطلبات الأمان والتكامل لكل منها.

---

## 📊 جدول فهرس الأتمتة العام

| المعرف | القسم الفرعي | نوع الأتمتة | طبقة الاختبار | آمن للأتمتة؟ | الأولوية | الحالة |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCN-GL-001** | Journal Entries | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | NEEDS_ISOLATED_TEST_DB |
| **SCN-GL-002** | Chart of Accounts | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | NOT_STARTED |
| **SCN-BANK-001** | Bank Reconciliation | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM | NOT_STARTED |
| **SCN-GL-003** | Dunning Engine V2 | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM | NEEDS_ISOLATED_TEST_DB |
| **SCN-POS-001** | Cashier Checkout | UI_E2E | Playwright (Mocked API) | **PARTIAL** | HIGH | NEEDS_ISOLATED_TEST_DB |
| **SCN-SAL-002** | Sales Returns | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | NEEDS_ISOLATED_TEST_DB |
| **SCN-POS-002** | Restaurant POS | UI_E2E | Playwright (Mocked API) | **PARTIAL** | HIGH | NEEDS_ISOLATED_TEST_DB |
| **SCN-PUR-001** | Purchase Orders | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM | **AUTOMATED** |
| **SCN-PUR-002** | Purchase Returns | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | NEEDS_ISOLATED_TEST_DB |
| **SCN-INV-001** | Stock Transfers | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | NEEDS_ISOLATED_TEST_DB |
| **SCN-INV-002** | Stocktake | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | NEEDS_ISOLATED_TEST_DB |
| **SCN-HR-001** | Employee Contracts | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | MEDIUM | NOT_STARTED |
| **SCN-COMP-001** | Mudad File Generation | API_CONTRACT | Vitest (Read-only) | **YES** | MEDIUM | **AUTOMATED** |
| **SCN-APP-001** | Workflow Approvals | INTEGRATION_SAFE | Vitest (Mocked DB) | **YES** | HIGH | **AUTOMATED** |
| **SCN-AI-001** | AI CFO Auditor | API_CONTRACT | Vitest (Mocked LLM) | **YES** | MEDIUM | **AUTOMATED** |
| **SCN-CMMS-001** | Preventive Maintenance| INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | LOW | NOT_STARTED |
| **SCN-SEC-001** | Cross-Tenant Leakage | API_CONTRACT | Playwright / Vitest | **YES** | HIGH | **AUTOMATED** |
| **SCN-SEC-002** | Server Access Control | API_CONTRACT | Playwright / Vitest | **YES** | HIGH | **AUTOMATED** |
| **SCN-PERF-001**| Sync Blockers Check | UNIT | Jest / AST parser check | **YES** | HIGH | **AUTOMATED** |
| **SCN-PERF-002**| POS Memory Leak Check | UI_E2E | Playwright Performance | **PARTIAL** | HIGH | NOT_STARTED |
| **SCN-FIN-001** | Unbalanced Entries | UNIT | Vitest / Jest (Calculation) | **YES** | HIGH | **AUTOMATED** |
| **SCN-FIN-002** | Posted Record Lock | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | **AUTOMATED** |
| **SCN-FIN-003** | Closed Period Lock | INTEGRATION_SAFE | Vitest / Jest (Mocked DB) | **YES** | HIGH | **AUTOMATED** |

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
* **AUTOMATION_STATUS:** NOT_STARTED

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
* **AUTOMATION_STATUS:** NOT_STARTED

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
* **AUTOMATION_STATUS:** NOT_STARTED

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
* **AUTOMATION_STATUS:** NOT_STARTED

---

## 🛡️ 2. تفاصيل خطة أتمتة موديول الأمن والأداء (Security & Performance)

### SCN-SEC-001: Cross-Tenant Leakage Verification
* **MODULE:** Security
* **MAIN_SECTION:** Security & Tenant Isolation
* **SUBSECTION:** Cross-Tenant Isolation
* **AUTOMATION_TYPE:** API_CONTRACT
* **TEST_LAYER:** Vitest
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** اختبار عزل المستأجرين والتأكد من رفض الطلب أو تصفية الاستعلام ببيانات مستأجر آخر.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-security.test.ts`
* **PRIORITY:** HIGH
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

### SCN-SEC-002: Server Access Control & RBAC Verification
* **MODULE:** Security
* **MAIN_SECTION:** Security & Tenant Isolation
* **SUBSECTION:** Server Access Control
* **AUTOMATION_TYPE:** API_CONTRACT
* **TEST_LAYER:** Vitest
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** التحقق من الصلاحيات ورفض الأدوار غير المصرح بها بـ 403 Forbidden.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-security.test.ts`
* **PRIORITY:** HIGH
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

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
* **RECOMMENDED_TEST_FILE:** `tests/sync-blockers.test.ts`
* **PRIORITY:** HIGH
* **AUTOMATION_STATUS:** AUTOMATED

---

## 📦 3. تفاصيل خطة أتمتة موديول المشتريات والموافقات (Procurement & Approvals)

### SCN-PUR-001: Purchase Order Draft Creation & Tax Calculation
* **MODULE:** Purchases
* **MAIN_SECTION:** Procurement
* **SUBSECTION:** Purchase Orders
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** التحقق من صحة معدلات الضريبة وتوليد مسودة أمر الشراء Saga وإعادة الكود 201 Created.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** YES (محاكاة)
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-procurement.test.ts`
* **PRIORITY:** MEDIUM
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

### SCN-APP-001: Document Workflow Approvals Pending Listing
* **MODULE:** Workflow
* **MAIN_SECTION:** Approvals
* **SUBSECTION:** Document Workflow Approvals
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** جلب الموافقات المعلقة الخاصة بالـ User/Tenant المعني بـ 200 OK.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-procurement.test.ts`
* **PRIORITY:** HIGH
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

---

## ⚖️ 4. تفاصيل خطة أتمتة موديولات الامتثال والذكاء الاصطناعي وحوكمة الحسابات

### SCN-COMP-001: Mudad File Generation / Wages Protection
* **MODULE:** HR / Payroll
* **MAIN_SECTION:** Wages Protection System
* **SUBSECTION:** Mudad Compliance
* **AUTOMATION_TYPE:** API_CONTRACT
* **TEST_LAYER:** Vitest (Read-only)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** اختبار التحقق من الامتثال وحسابات نسب حماية الأجور وإنشاء تقارير Mudad.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-compliance.test.ts`
* **PRIORITY:** MEDIUM
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** REMAINING_API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

### SCN-AI-001: AI CFO Auditor
* **MODULE:** AI Features
* **MAIN_SECTION:** CFO Auditor
* **SUBSECTION:** AI Financial Insights
* **AUTOMATION_TYPE:** API_CONTRACT
* **TEST_LAYER:** Vitest (Mocked LLM)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** فحص عقد استرجاع تحليلات الأرباح والمخازن ومقترحات CFO من Gemini API باستخدام محاكاة للنموذج والطلب المباشر.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-ai-cfo.test.ts`
* **PRIORITY:** MEDIUM
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** REMAINING_API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

### SCN-FIN-001: Unbalanced Journal Entry Prevention
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Journal Entry Calculation
* **AUTOMATION_TYPE:** UNIT
* **TEST_LAYER:** Vitest / Jest (Calculation)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** التحقق حسابياً من توازن قيود اليومية ورفض القيود غير المتوازنة بـ 400 Bad Request.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-accounting-governance.test.ts`
* **PRIORITY:** HIGH
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** REMAINING_API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

### SCN-FIN-002: Posted Record Lock / Immutability
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Posted Journal Entry
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest / Jest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** التحقق من استحالة تعديل القيود بعد ترحيلها (posted) وإرجاع كود الخطأ المناسب 500.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-accounting-governance.test.ts`
* **PRIORITY:** HIGH
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** REMAINING_API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS

### SCN-FIN-003: Closed Period Lock
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Closed Period Verification
* **AUTOMATION_TYPE:** INTEGRATION_SAFE
* **TEST_LAYER:** Vitest / Jest (Mocked DB)
* **SAFE_TO_AUTOMATE:** YES
* **REASON:** التحقق من رفض عمليات الحفظ أو التعديل في الفترات المالية المغلقة وإرجاع 409 LOCKED.
* **REQUIRES_AUTH:** YES
* **REQUIRES_DB_WRITE:** NO
* **DB_WRITE_ALLOWED_IN_THIS_PHASE:** NO
* **PRODUCTION_SAFE:** NO_PRODUCTION_TOUCH
* **RECOMMENDED_TEST_FILE:** `tests/api-contract-accounting-governance.test.ts`
* **PRIORITY:** HIGH
* **AUTOMATION_STATUS:** AUTOMATED
* **AUTOMATED_IN_WAVE:** REMAINING_API_CONTRACT_WAVE
* **LAST_VALIDATION:** PASS
