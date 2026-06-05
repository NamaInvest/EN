# دليل وجدول اختبارات الأتمتة الشاملة (E2E Test Automation Backlog)

يحتوي هذا الجدول على خطة العمل التفصيلية لتحويل السيناريوهات التشغيلية اليومية لنظام نما إنفست ERP إلى اختبارات آلية E2E باستخدام أدوات الاختبار (مثل Playwright أو Cypress)، مع تحديد أولوية ومخاطر كل اختبار ومستويات الأمان المطلوبة.

| معرف السيناريو | الموديول | اسم السيناريو | المسار المستهدف | قابل للأتمتة | كتابة للـ DB | ترحيل مالي | آمن محلياً | آمن بالإنتاج | الأدوات المقترحة | الأولوية | حالة الأتمتة الحالية |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCN-PUBLIC-001** | Public Website | تصفح الموقع وإنشاء حساب تجريبي | `/sign-up` | نعم | نعم | لا | نعم | نعم | Playwright | عالية | **AUTOMATED_PHASE_7A** |
| **SCN-ONBOARDING-001** | Onboarding & Tenant | تأسيس مستأجر منفرد معزول وحارس subdomain | `/company-setup` | نعم | نعم | لا | نعم | لا | Playwright / API | عالية جداً | **AUTOMATED_PHASE_7A (Rejection test)** |
| **SCN-AUTH-001** | Authentication | المصادقة الثنائية وعزل جلسة المستخدم | `/login` | نعم | لا | لا | نعم | نعم | Playwright | حرجة | **AUTOMATED_PHASE_7A** |
| **SCN-SUPERADMIN-001** | Platform Admin | مراقبة البنية التحتية وسجلات الأمان SIEM | `/admin/siem` | نعم | لا | لا | نعم | نعم | Playwright | متوسطة | مؤجل (يتطلب SuperAdmin auth) |
| **SCN-TENANTADMIN-001**| Company Admin | تخصيص الصلاحيات وتفعيل الفروع للشركات | `/settings/roles` | نعم | نعم | لا | نعم | نعم | Playwright | عالية | **AUTOMATED_PHASE_7A** |
| **SCN-ACCOUNTING-001** | Accounting & GL | ترحيل القيود اليومية وحارس الفترات المالية | `/accounting/journal/new`| نعم | نعم | نعم | نعم | لا | Playwright / API | حرجة | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-SALES-001** | Sales | إصدار فاتورة مبيعات معتمدة من هيئة الزكاة | `/sales/orders` | نعم | نعم | نعم | نعم | لا | Playwright / API | حرجة | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-PURCHASES-001** | Purchases | دورة المشتريات ومطابقة GR/IR الثلاثية | `/purchases/orders` | نعم | نعم | نعم | نعم | لا | Playwright / API | حرجة | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-INVENTORY-001** | Inventory | تسوية جرد المخازن وتحديث تكلفة الصرف | `/inventory` | نعم | نعم | نعم | نعم | لا | Playwright / API | عالية جداً | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-TREASURY-001** | Treasury & Cash | قبض النقدية وإجراء المطابقة البنكية الذكية | `/treasury/petty-cash`| نعم | نعم | نعم | نعم | لا | Playwright / API | عالية جداً | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-POS-001** | POS & Restaurant | طلبات سلة المشتريات ونقاط البيع السريعة | `/pos` | نعم | نعم | نعم | نعم | لا | Playwright / Cypress | عالية | مؤجل (خطير بالإنتاج) |
| **SCN-HR-001** | Human Resources | تهيئة ملف موظف وإدارة طلبات الإجازات | `/hr/leaves` | نعم | نعم | لا | نعم | نعم | Playwright | متوسطة | مؤجل (يحتاج مستخدم تجريبي) |
| **SCN-PAYROLL-001** | Payroll | معالجة الرواتب وتوليد مسير حماية الأجور | `/payroll` | نعم | نعم | نعم | نعم | لا | Playwright / API | عالية جداً | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-CRM-001** | CRM & Deals | تحويل العميل المحتمل إلى صفقة رابحة | `/crm/leads` | نعم | نعم | لا | نعم | نعم | Playwright | متوسطة | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-PROJECTS-001** | Project Management | متابعة المشاريع وقياس كفاءة القيمة المكتسبة| `/enterprise/projects` | نعم | نعم | لا | نعم | نعم | Playwright | متوسطة | مؤجل (يحتاج مستخدم تجريبي) |
| **SCN-MANUFACTURING-001**| Manufacturing | جدولة أوامر الإنتاج وهيكل شجرة BOM | `/manufacturing/boms` | نعم | نعم | نعم | نعم | لا | Playwright / API | عالية | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-PHARMACY-001** | Pharmacy | تتبع صلاحية الأدوية والتداخلات العلاجية | `/pharmacy` | نعم | لا | لا | نعم | نعم | Playwright | منخفضة | مؤجل (يحتاج مستخدم تجريبي) |
| **SCN-WMS-001** | Warehouse (WMS) | استلام البضائع وجدولة مهام التخزين | `/enterprise/wms` | نعم | نعم | لا | نعم | لا | Playwright | متوسطة | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-REPORTS-001** | Reports & BI | استعلام ميزان المراجعة والتقارير المالية | `/reports/cashflow` | نعم | لا | لا | نعم | نعم | Playwright | عالية | **AUTOMATED_PHASE_7A (Read-only redirect check)** |
| **SCN-AI-001** | AI & RAG | استخلاص الأنماط الاحتيالية بالذكاء الاصطناعي | `/ai/bank-fraud` | نعم | لا | لا | نعم | نعم | API Testing | متوسطة | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-SETTINGS-001** | System Settings | بناء حقول ديناميكية مخصصة لكل مستأجر | `/settings/custom-fields`| نعم | نعم | لا | نعم | نعم | Playwright | متوسطة | **AUTOMATED_PHASE_7A (Rejection check)** |
| **SCN-SUPPORT-001** | Help Desk | تذكرة دعم فني وقياس الامتثال لاتفاقية SLA| `/support/help-desk` | نعم | نعم | لا | نعم | نعم | Playwright | منخفضة | مؤجل (يحتاج مستخدم تجريبي) |
| **SCN-DESKTOP-001** | Desktop Launcher | مزامنة الترخيص والتشغيل دون اتصال بالشبكة | `/desktop/verify-license` | نعم | نعم | لا | نعم | نعم | Playwright Electron| متوسطة | مؤجل (تكامل سطح مكتب) |

---

## تفاصيل وملاحظات التنفيذ الفني للاختبارات الآلية

### 1. بيانات البذر والتأهيل المطلوبة (Required Seed Data)
- لتفعيل اختبارات المحاسبة والمبيعات والمشتريات آلياً دون أخطاء بالتبعية، يجب تجهيز بيئة الاختبار المحلية ببذر بيانات كامل مسبقاً (Seed Database) يشمل:
  - مستخدمين تجريبيين بهويات وأدوار كاملة الصلاحيات وأخرى مقيدة.
  - دليل حسابات متكامل متزن يحمل الهيكل القياسي المعتمد للزكاة والدخل (CoA).
  - منتجات معرفة الباركود والأسعار والوحدات، ومخازن تحتوي على أرصدة إيجابية أولية.
  - حساب بنكي وخزينة معرفين ولهما أرقام تسلسلية نشطة.

### 2. محاكاة الخدمات والربط الخارجي (Mocking Requirements)
- **خدمات الزكاة والدخل (ZATCA Api Mocks):** نظراً لأن استدعاء واجهات الزكاة الحية يؤدي لاعتماد مستندات مالية حقيقية، يجب أتمتة اختبارات الـ ZATCA بمحاكاة كاملة (Mocks) للردود المتوقعة من سيرفرات الهيئة أو استخدام الـ Sandbox الرسمي المتاح للتطوير.
- **خدمات الذكاء الاصطناعي (LLM Providers Mocks):** لتوفير تكلفة استدعاء خوادم الـ OpenAi أو Anthropic وتفادي تذبذب الردود (Flakiness)، يجب محاكاة ردود الـ APIs الخاصة بمراقبة الاحتيال والاستعلام الطبيعي (NLQ).

### 3. الاختبار الآمن للعمليات المالية والإنتاج
- **قاعدة ذهبية:** يمنع كلياً تشغيل أي سيناريو أتمتة يشتمل على كتابة مادية لقاعدة بيانات الإنتاج أو تشغيل عمليات ترحيل محاسبي حقيقية (مثل الترحيل الضريبي أو إقفال الرواتب).
- يقتصر تشغيل اختبارات E2E على البيئات المحلية (Local Machine) أو بيئات التطوير والاستقرار (Staging/CI environments) التي تتم إعادة بنائها دورياً.
