# روابط تقارير السيناريوهات والعمليات (Scenario Report Links)

يربط هذا الجدول كل معرف سيناريو تشغيلي بملف الاختبار الآمن المقابل ومسار التقرير الذي يثبت سلامة التشغيل.

| Scenario ID | Page | Button/API | Test File | Report Path | Status | Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| SCN-PUBLIC-001 | /sign-up | نموذج التسجيل | e2e/public-home.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-ONBOARDING-001 | /company-setup | تأكيد وبدء التأسيس | e2e/provisioning-dryrun-mocked.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-AUTH-001 | /login | نموذج الدخول | e2e/auth-negative-and-protection.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-SUPERADMIN-001 | /admin/siem | تصدير سجلات SIEM | None | None | DEFERRED | توفير حساب SuperAdmin للاختبار |
| SCN-TENANTADMIN-001 | /settings/roles | حفظ الدور والصلاحية | e2e/mocked-settings-rbac.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-ACCOUNTING-001 | /accounting/journal/new | ترحيل القيد المحاسبي | e2e/financial-dryrun-protection.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-SALES-001 | /sales/orders | إصدار واعتماد الفاتورة | e2e/mocked-sales-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-PURCHASES-001 | /purchases/orders | مطابقة وأرشفة GR/IR | e2e/mocked-purchases-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-INVENTORY-001 | /inventory | تسوية جرد المستودع | e2e/mocked-inventory-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-TREASURY-001 | /treasury/petty-cash | تأكيد المطابقة البنكية | e2e/mocked-treasury-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-POS-001 | /pos | دفع وإصدار الفاتورة | None | None | DEFERRED | الموافقة على تهيئة سلة تجريبية |
| SCN-HR-001 | /hr/leaves | إرسال طلب إجازة | None | None | DEFERRED | تهيئة حسابات الموظفين |
| SCN-PAYROLL-001 | /payroll | اعتماد مسير الرواتب | e2e/financial-dryrun-protection.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-CRM-001 | /crm/leads | تحويل العميل المحتمل | e2e/mocked-sales-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-PROJECTS-001 | /enterprise/projects | حفظ لقطة المشروع | None | None | DEFERRED | ربط مشاريع تجريبية |
| SCN-MANUFACTURING-001 | /manufacturing/boms | اعتماد شجرة التصنيع | e2e/mocked-purchases-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-PHARMACY-001 | /pharmacy | استعلام تداخل أدوية | None | None | DEFERRED | إدخال أدوية تجريبية |
| SCN-WMS-001 | /enterprise/wms | تحويل البضائع للرفوف | e2e/mocked-inventory-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-REPORTS-001 | /reports/cashflow | استعلام الأرصدة المالية | e2e/reports-readonly-protection.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-AI-001 | /ai/bank-fraud | فحص الأنماط الاحتيالية | e2e/mocked-ai-rag-mutations.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-AI-002 | /ai/nlq | الاستعلام باللغة الطبيعية | e2e/mocked-ai-rag-mutations.spec.ts | tmp/analytical-ai-spend-analytics-verification-report.md | AUTOMATED | لا يوجد |
| SCN-AI-003 | /procurement/spend-analytics | تحليلات الإنفاق الشرائي | e2e/mocked-ai-rag-mutations.spec.ts | tmp/analytical-ai-spend-analytics-verification-report.md | AUTOMATED | لا يوجد |

| SCN-SETTINGS-001 | /settings/custom-fields | حفظ الحقل المخصص | e2e/settings-rbac.spec.ts | tmp/full-system-safe-testing-report.md | AUTOMATED | لا يوجد |
| SCN-SUPPORT-001 | /support/help-desk | إرسال تذكرة فنية | None | None | DEFERRED | تفعيل حسابات بورتال الدعم |
| SCN-DESKTOP-001 | /desktop/verify-license | تفعيل الرخصة محلياً | None | None | DEFERRED | تهيئة تشغيل Electron |
