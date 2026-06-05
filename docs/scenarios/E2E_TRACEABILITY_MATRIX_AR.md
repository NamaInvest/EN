# مصفوفة تتبع اختبارات الأتمتة (E2E Traceability Matrix)

تربط هذه المصفوفة بين السيناريوهات التشغيلية المحددة وملفات الاختبارات الآلية (Playwright) مع تحديد حالة الأتمتة الحالية وسبب التأجيل للسيناريوهات غير المؤتمتة.

| Scenario ID | Module | Page | Test File | Test Name | Safety Class | Status | Deferred Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| SCN-PUBLIC-001 | Public Website | /sign-up | e2e/public-home.spec.ts | verify public signup landing page | آمن | AUTOMATED | لا يوجد |
| SCN-ONBOARDING-001 | Onboarding & Tenant | /company-setup | e2e/provisioning-dryrun-mocked.spec.ts | verify company onboarding & subdomain reservation | خطر حرج (بناء DB) | AUTOMATED | لا يوجد |
| SCN-AUTH-001 | Authentication | /login | e2e/auth-negative-and-protection.spec.ts | verify MFA login session isolation | آمن | AUTOMATED | لا يوجد |
| SCN-SUPERADMIN-001 | Platform Admin | /admin/siem | None | None | آمن | DEFERRED | يتطلب SuperAdmin auth وبيئة تشغيل خاصة |
| SCN-TENANTADMIN-001 | Company Admin | /settings/roles | e2e/mocked-settings-rbac.spec.ts | verify role and permissions save | آمن | AUTOMATED | لا يوجد |
| SCN-ACCOUNTING-001 | Accounting & GL | /accounting/journal/new | e2e/financial-dryrun-protection.spec.ts | verify journal posting and period lock restriction | خطر (كتابة مالية) | AUTOMATED | لا يوجد |
| SCN-SALES-001 | Sales | /sales/orders | e2e/mocked-sales-mutations.spec.ts | verify invoice approval and ZATCA compliance checks | خطر (فاتورة زكاة) | AUTOMATED | لا يوجد |
| SCN-PURCHASES-001 | Purchases | /purchases/orders | e2e/mocked-purchases-mutations.spec.ts | verify GR/IR three-way matching | خطر متوسط | AUTOMATED | لا يوجد |
| SCN-INVENTORY-001 | Inventory | /inventory | e2e/mocked-inventory-mutations.spec.ts | verify stock adjustment approval and valuation recalculation | خطر (كتابة مخزنية) | AUTOMATED | لا يوجد |
| SCN-TREASURY-001 | Treasury & Cash | /treasury/petty-cash | e2e/mocked-treasury-mutations.spec.ts | verify bank reconciliation matching | خطر (تسوية بنكية) | AUTOMATED | لا يوجد |
| SCN-POS-001 | POS & Restaurant | /pos | None | None | خطر (بيع نقدي) | DEFERRED | خطورة الاختبار بالإنتاج وتوافر سلة شراء مخصصة للمطاعم |
| SCN-HR-001 | Human Resources | /hr/leaves | None | None | آمن | DEFERRED | يتطلب تهيئة حسابات موظفين إضافية ومزامنة الحضور |
| SCN-PAYROLL-001 | Payroll | /payroll | e2e/financial-dryrun-protection.spec.ts | verify payroll run and WPS file generation | خطر حرج (رواتب) | AUTOMATED | لا يوجد |
| SCN-CRM-001 | CRM & Deals | /crm/leads | e2e/mocked-sales-mutations.spec.ts | verify lead conversion to customer | آمن | AUTOMATED | لا يوجد |
| SCN-PROJECTS-001 | Project Management | /enterprise/projects | None | None | آمن | DEFERRED | يتطلب تهيئة مشاريع وربط مع الجداول الزمنية للـ Gantt |
| SCN-MANUFACTURING-001 | Manufacturing | /manufacturing/boms | e2e/mocked-purchases-mutations.spec.ts | verify BOM validation and materials issuance | خطر متوسط | AUTOMATED | لا يوجد |
| SCN-PHARMACY-001 | Pharmacy | /pharmacy | None | None | آمن | DEFERRED | يتطلب إدخال وصفات طبية تجريبية والتحقق من التفاعل الدوائي |
| SCN-WMS-001 | Warehouse (WMS) | /enterprise/wms | e2e/mocked-inventory-mutations.spec.ts | verify WMS putaway and item shelving | خطر متوسط | AUTOMATED | لا يوجد |
| SCN-REPORTS-001 | Reports & BI | /reports/cashflow | e2e/reports-readonly-protection.spec.ts | verify cashflow report trial balance readonly redirect | آمن | AUTOMATED | لا يوجد |
| SCN-AI-001 | AI & RAG | /ai/bank-fraud | e2e/mocked-ai-rag-mutations.spec.ts | verify LLM prompt injection guards & fraud scan | آمن | AUTOMATED | لا يوجد |
| SCN-SETTINGS-001 | System Settings | /settings/custom-fields | e2e/settings-rbac.spec.ts | verify custom fields creation and save | آمن | AUTOMATED | لا يوجد |
| SCN-SUPPORT-001 | Help Desk | /support/help-desk | None | None | آمن | DEFERRED | يتطلب دمج مع بوابة العملاء وخدمة البريد |
| SCN-DESKTOP-001 | Desktop Launcher | /desktop/verify-license | None | None | آمن | DEFERRED | يتطلب تشغيل البيئة المكتبية Electron وبيئة ترخيص منفصلة |
