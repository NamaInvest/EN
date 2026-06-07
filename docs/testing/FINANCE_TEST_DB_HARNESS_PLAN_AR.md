# خطة تصميم وتطوير حامل الاختبارات المالية (FINANCE_TEST_DB_HARNESS_PLAN_AR)

يهدف هذا المستند إلى رسم وتصميم معايير وحواجز الأمان لعمليات فحص القيود والتعديلات والفترات والتحويلات المالية داخل نظام Nama Invest ERP في بيئة اختبار معزولة بالكامل.

---

## 🔒 بوابات السلامة المالية (Financial Safety Rules)
1. **منع الإنتاج (No Production):** يمنع تماماً الاتصال بالخادم الرئيسي أو استخدام DATABASE_URL الخاص بالإنتاج.
2. **عزل الاختبارات (TEST_MODE):** تفعيل اختبارات الوحدة فقط ما لم يتم تحديد `TEST_MODE=true` و `NODE_ENV=test` صراحةً.
3. **التراجع التلقائي (Transactional Rollback):** يجب إتمام كل فحص مالي حقيقي داخل معاملة (Transaction) ويتم التراجع عنها (Rollback) تلقائياً لمنع أي كتابة أو تلوث للبيانات.
4. **تجميد السجلات المرحلة (Posted Immutability):** منع كامل لتعديل القيود المالية التي تحمل حالة `posted`.
5. **التحقق من الفترات المغلقة (Period Lock):** حظر فوري لأي قيد في فترة محاسبية تحمل حالة `LOCKED` أو `SOFT_LOCKED` (ما لم يكن هناك تصريح وتجاوز معتمد).
6. **عزل المستأجر المالي (Tenant Isolation):** التحقق التلقائي من تطابق الـ `tenantId` لجميع الأسطر المدخلة.

---

## 🏗️ مصانع البيانات المالية (Finance Seed Factories)
- `createTestTenant`: توليد مستأجر وهمي نظيف.
- `createTestUser`: توليد مستخدم محاسبي بصلاحيات وأدوار RBAC.
- `createTestFiscalPeriod`: إعداد فترات مالية مفتوحة ومغلقة.
- `createTestChartOfAccounts`: إعداد شجرة الحسابات SoCPA القياسية للمستأجر.
- `createBalancedJournalDraft`: توليد مسودة قيد متوازن.
- `createUnbalancedJournalDraft`: توليد مسودة قيد غير متوازن (فروقات debit/credit).
- `createPostedJournal`: إنشاء قيد مالي مرحل ومثبت.
- `createLockedPeriod`: إغلاق فترة مالية محددة.
- `createOpenItem`: إدراج فواتير آجلة مفتوحة للمطابقة.
- `createFxRate`: إعداد أسعار صرف العملات الأجنبية.
- `createAuditExpectation`: صياغة كائن مراجعة سجلات التدقيق.
- `createPreviewOnlyScenario`: إعداد سيناريو معاينة القيد دون إجراء كتابة فعلية.

---

## 📊 دوال التحقق المعتمدة (Assertions)
- `assertDebitCreditBalanced`: التحقق من توازن إجماليات المدين والدائن في خطوط القيد.
- `assertDebitCreditUnbalanced`: التحقق من رفض القيود غير المتوازنة بـ 400 Bad Request.
- `assertPostedJournalImmutable`: التحقق من رفض أي تعديلات على القيود المرحلة وإرجاع خطأ 500.
- `assertClosedPeriodRejected`: التحقق من رفض ترحيل القيود في التواريخ المغلقة مالياً وإرجاع 409 LOCKED.
- `assertTenantScopedFinancialData`: التأكد من خلو القيود والبيانات المالية من أي خلط أو تسريب مستأجرين.
- `assertAuditLogWritten`: التحقق من تسجيل العمليات المالية الحساسة في سجلات التدقيق.
- `assertPreviewDoesNotMutate`: التأكد من أن تشغيل المعاينة (Preview) يرجع تفاصيل العمليات والضرائب دون القيام بأي تعديل حقيقي على قاعدة البيانات.
- `assertFinancialTransactionRollbackReady`: التحقق من استعداد البيئة للتراجع عن حركات الاختبار المالي بعد نجاح التحقق.

---

## 🌊 موجات تطوير وتكامل الحامل المالي (Parallel Waves)

* **F-H1: Pure finance assertions**
  - بناء وتطوير مكتبة التحققات المالية البحتة واختبارها محلياً دون أي حاجة للاتصال الفعلي بقاعدة البيانات.
* **F-H2: Mocked transaction boundaries**
  - بناء محاكاة سياق المعاملات المالية وحدود التراجع في Prisma Client.
* **F-H3: Disposable DB finance seed**
  - ربط بيئة الـ Seed والـ Factories بقاعدة بيانات اختبار مؤقتة معزولة.
* **F-H4: Journal + period lock integration**
  - اختبار تكامل ترحيل القيود وحوكمة إغلاق الفترات في قاعدة البيانات المعزولة.
* **F-H5: Open items + FX integration**
  - فحص تكاملي لتسوية الفواتير المفتوحة وفروق أسعار الصرف.
* **F-H6: Financial reports read-only integration**
  - فحص تكاملي لاسترجاع التقارير المالية والقوائم الختامية للقراءة فقط.
