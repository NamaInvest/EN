# خريطة ربط السيناريوهات بحامل الاختبار (SCENARIO_TO_TEST_HARNESS_MAPPING_AR)

توضح هذه الخريطة تصنيف كل سيناريو برمجي معلق ومستوى الـ Test Harness المطلوب لأتمتته بأمان وموثوقية، مع فرز السيناريوهات التي تحتاج قاعدة بيانات اختبار معزولة أو محاكاة كاملة.

---

## 📊 جدول ربط السيناريوهات بحامل الاختبار (Harness Mapping Table)

| Scenario ID | Module | Current Status | Harness Layer | Automatable Now | Needs Mock | Needs Test DB | Manual Only | Reason | Recommended Wave |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCN-GL-001** | Accounting | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | يحتاج ترحيل مالي حقيقي وحساب أثر القيود | Wave H3 (Test DB) |
| **SCN-GL-002** | Accounting | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | يمكن محاكاة دليل الحسابات وعزل المستأجر | Wave H2 (API Mock) |
| **SCN-BANK-001**| Accounting | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | مطابقة حسابات بنوك عبر بيانات وهمية | Wave H2 (API Mock) |
| **SCN-GL-003** | Accounting | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | تطلب فواتير حقيقية وتحديث تاريخ المتابعة | Wave H3 (Test DB) |
| **SCN-ASST-001**| Fixed Assets | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | تطلب إهلاك أصول حقيقية وقيود إهلاك دوري | Wave H3 (Test DB) |
| **SCN-POS-001** | Sales | NOT_STARTED | Playwright Smoke | **NO** | YES | YES | NO | تتطلب محاكاة websocket وطباعة QZ Tray | Wave H4 (UI Smoke) |
| **SCN-SAL-002** | Sales | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | إرجاع كميات وفواتير مباعة معقدة | Wave H3 (Test DB) |
| **SCN-POS-002** | Sales | NOT_STARTED | Playwright Smoke | **NO** | YES | YES | NO | خريطة طاولات وتفاعلات نادل وطباعة مطبخ | Wave H4 (UI Smoke) |
| **SCN-PUR-001** | Purchases | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | طلبات شراء مسودة لا تولد قيوداً مالية | Wave H2 (API Mock) |
| **SCN-PUR-002** | Purchases | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | إرجاع أصناف مخزنية وتعديل كميات جرد | Wave H3 (Test DB) |
| **SCN-INV-001** | Inventory | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | نقل بضائع فوري بين مستودعين معزولين | Wave H3 (Test DB) |
| **SCN-INV-002** | Inventory | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | تسوية عجز جرد وتأثير متوسط التكلفة | Wave H3 (Test DB) |
| **SCN-HR-001** | HR | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | تسجيل موظف وعقده بشكل معزول | Wave H2 (API Mock) |
| **SCN-APP-001** | Approvals | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | اختبار ترحيل موافقة مستندات مسودة | Wave H2 (API Mock) |
| **SCN-AI-001** | AI | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | محاكاة استدعاء OpenAI وعزل سياق RAG | Wave H2 (API Mock) |
| **SCN-CMMS-001**| Maintenance | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | تقديم بلاغات صيانة للمعدات المسجلة | Wave H2 (API Mock) |
| **SCN-SEC-001** | Security | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | فحص رفض الاستعلامات عبر مستأجرين مختلفين | Wave H2 (API Mock) |
| **SCN-SEC-002** | Security | NOT_STARTED | API Contract Mock | **YES** | YES | NO | NO | اختبار صلاحيات الخادم وحظر مسارات الأدمن | Wave H2 (API Mock) |
| **SCN-PERF-002**| Performance | NOT_STARTED | Playwright Smoke | **NO** | YES | NO | NO | قياس تسريب الذاكرة لشاشة الكاشير | Wave H4 (UI Smoke) |
| **SCN-FIN-002** | Financial | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | التحقق من تجميد الحقول بعد ترحيل القيد | Wave H3 (Test DB) |
| **SCN-FIN-003** | Financial | NOT_STARTED | Integration Test DB | **NO** | YES | YES | NO | التحقق من حظر الترحيل في فترة مغلقة | Wave H3 (Test DB) |

---

## 📊 ملخص الفرز البرمجي للتحقق

- **قابل للأتمتة بالـ Mock الآن (Automatable with Mock):** 9 سيناريوهات.
- **تتطلب قاعدة بيانات اختبار (Needs Test DB):** 9 سيناريوهات.
- **تتطلب فحص Playwright Smoke:** 3 سيناريوهات.
- **السيناريوهات اليدوية فقط (Manual Only):** 0 (جميعها قابلة للأتمتة تحت مستويات الحامل المختلفة).
