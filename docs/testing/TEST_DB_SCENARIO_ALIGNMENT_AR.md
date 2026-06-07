# مواءمة سيناريوهات النظام مع قاعدة بيانات الاختبار المعزولة - Nama Invest ERP

يوضح هذا المستند كيفية مطابقة وتوزيع سيناريوهات العمل للأقسام الرئيسية والفرعية مع بيئة قاعدة الاختبار المعزولة وتحديد شروط التوقف والموجات القادمة.

---

## 📊 جدول مواءمة السيناريوهات (Scenario Alignment Table)

| Scenario ID | Module | Needs Test DB | Setup Requirement | First Safe Test | Stop Condition | Next Wave |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCN-GL-001** | Accounting | YES (NEEDS_ISOLATED_TEST_DB) | SoCPA COA & Open Fiscal Period | balanced journal posting | Missing TEST_DATABASE_URL / Missing TEST_MODE | Wave H3 (Finance Integration) |
| **SCN-GL-002** | Accounting | YES (NEEDS_ISOLATED_TEST_DB) | Seed root accounts SoCPA | create child account | Schema mismatch requiring db push | Wave H3 (Finance Integration) |
| **SCN-BANK-001**| Accounting | YES (NEEDS_ISOLATED_TEST_DB) | Imported Statement & Account Ledger| bank reconciliation mapping | Live Bank API connection attempt | Wave H3 (Finance Integration) |
| **SCN-GL-003** | Accounting | YES (NEEDS_ISOLATED_TEST_DB) | Overdue invoice & dunning rules | trigger dunning step | External email/SMS sender not mocked | Wave H3 (Finance Integration) |
| **SCN-ASST-001**| Fixed Assets | YES (NEEDS_ISOLATED_TEST_DB) | Capitalized asset with salvage value| run asset depreciation | Mutation of live assets database | Wave H3 (Finance Integration) |
| **SCN-POS-001** | Sales | YES (NEEDS_ISOLATED_TEST_DB) | POS items, active cash register shift| POS fast checkout | Real stripe/paytabs integration call | Wave H4 (Sales/POS) |
| **SCN-SAL-002** | Sales | YES (NEEDS_ISOLATED_TEST_DB) | Original posted sales invoice | sales return posting | Return amount exceeds sold quantity | Wave H4 (Sales/POS) |
| **SCN-POS-002** | Sales | YES (NEEDS_ISOLATED_TEST_DB) | Restaurant hall tables & active shift| table assignment | Table WebSocket sync fails | Wave H4 (Sales/POS) |
| **SCN-INV-001** | Inventory | YES (NEEDS_ISOLATED_TEST_DB) | Source & Destination Warehouses | stock transfer validation | Negative stock transfer allowed | Wave H5 (Inventory) |
| **SCN-INV-002** | Inventory | YES (NEEDS_ISOLATED_TEST_DB) | Draft stocktake sheet, physical count| stocktake approval | Avg cost valuation corruption | Wave H5 (Inventory) |
| **SCN-PUR-002** | Purchases | YES (NEEDS_ISOLATED_TEST_DB) | Original posted GRN (Goods Rec. Note)| purchase return validation | Return quantity exceeds GRN | Wave H6 (Purchases) |
| **SCN-COMP-001**| HR / Payroll | NO (AUTOMATED via Mock) | Mudad schema structure | wages file compliance check| External Mudad API write attempt | Wave H7 (Compliance) |
| **SCN-COMP-WPS**| HR / Payroll | NO (Manual / Mock only) | Bank WPS excel structure | WPS file format verification| Real bank upload / Live execution | Wave H7 (Compliance) |
| **SCN-ZATCA-REAL**| Compliance | NO (Manual / Mock only) | CSR, Onboarding XML payload | ZATCA Phase 2 compliance scan| Real ZATCA production API upload | Wave H7 (Compliance) |
