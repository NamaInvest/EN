# 02 - AI Master Prompt

## الهدف
هذا الملف هو التعليمات الإلزامية لأي ذكاء صناعي أو مطور يعمل على مشروع Nama Invest ERP.

النظام ليس مشروع CRUD عادي.
النظام هو:

- Multi-Tenant SaaS ERP
- Web + Desktop EXE + PWA
- POS Offline/Online
- محاسبة وقيود مالية
- ZATCA Phase 2
- اشتراكات وتراخيص
- لوحة ICE Super Admin
- AI ERP Assistant
- Saudi Compliance Platform

أي تعديل خاطئ قد يؤثر على:
- أموال العملاء
- الضرائب
- الفواتير الإلكترونية
- المخزون
- الرواتب
- بيانات الشركات

---

# 1. قبل أي تعديل

يجب قراءة الملفات التالية:

```text
00-index.md
01-architecture.md
02-database.md
03-auth-permissions.md
04-api-routes.md
05-business-logic.md
06-project-rules.md
14-modules-map.md
15-saudi-compliance.md
17-gap-analysis.md
19-claude-rules.md
30-master-ice.md
49-scenarios-real-world.md
52-decision-tables.md
54-common-mistakes.md

/project-governance/01-SYSTEM_SCENARIOS.md
/project-governance/02-AI_MASTER_PROMPT.md
/project-governance/03-FINANCIAL_INVARIANTS.md
/project-governance/04-DOMAIN_BOUNDARIES.md
/project-governance/05-TENANT_ISOLATION_RULES.md
/project-governance/06-ACCOUNTING_LOCK_RULES.md
/project-governance/07-STATE_MACHINE_RULES.md
/project-governance/08-OFFLINE_DESKTOP_SYNC_RULES.md
/project-governance/09-MIGRATION_RULES.md
/project-governance/10-EVENT_CATALOG.md
/project-governance/11-PERFORMANCE_GUARDRAILS.md
/project-governance/12-SECURITY_RULES.md
/project-governance/13-TESTING_RULES.md
/project-governance/14-MODULE_OWNERSHIP.md
/project-governance/15-PRODUCTION_CHECKLIST.md
```

إذا كان الطلب متعلقًا بقسم معين، اقرأ ملف القسم أيضًا:

```text
20-accounting-domain.md
21-sales-pos.md
22-purchases.md
23-inventory.md
24-manufacturing.md
25-hr-payroll.md
26-assets.md
27-treasury-banks.md
28-ai-features.md
29-electron-desktop.md
36-ai-architecture.md
38-electron-internals.md
40-tests-quality.md
45-error-monitoring.md
46-state-machines.md
49-scenarios-real-world.md
53-period-end-procedures.md
55-disaster-recovery.md
56-security-incidents.md
58-performance-tuning.md
59-api-sdk-integration.md
61-support-runbooks.md
```

# 2. طريقة العمل الإلزامية

قبل كتابة أي كود، يجب أن ترد بهذه الصيغة:

سأعمل على الطلب التالي:
[شرح الطلب]

القسم المتأثر:
[Accounting / Sales / POS / Inventory / HR / ZATCA / ICE / Desktop / AI / ...]

الملفات التي سأقرأها:
[...]

الملفات التي سأعدلها:
[...]

هل يوجد تأثير على:
- Tenant Isolation: نعم/لا
- Accounting: نعم/لا
- ZATCA: نعم/لا
- Subscription/Licensing: نعم/لا
- Permissions: نعم/لا
- Desktop/Offline: نعم/لا
- Security: نعم/لا
- Performance: نعم/لا

المخاطر:
[...]

طريقة الاختبار:
[...]

لا تبدأ بالتعديل قبل هذه المراجعة.

# 3. القواعد الممنوعة نهائيًا
ممنوع
لا تحذف tenantId.
لا تعمل query بدون tenant filter.
لا تعدل قيود POSTED.
لا تعدل فاتورة بعد ZATCA clearance.
لا تحذف invoice رسمية.
لا تعدل المحاسبة مباشرة من sales أو inventory أو POS.
لا تتجاوز permission check.
لا تعتمد على إخفاء زر في الواجهة فقط.
لا تضيف API بدون withRoute.
لا تضيف مدخلات بدون Zod validation.
لا تستخدم new PrismaClient() يدويًا.
لا تستخدم any إلا عند الضرورة مع شرح.
لا تستخدم Float للأموال.
لا تغير schema بدون migration.
لا تعمل destructive migration بدون backup.
لا تضيف مكتبة جديدة بدون سبب.
لا تعيد هيكلة المشروع بدون إذن.
لا تعدل أكثر من نطاق الطلب.
لا تضيف feature جديدة إذا لم تكن مطلوبة.
لا تكتب placeholder code.
لا تترك TODO في كود إنتاجي.
لا تكسر backward compatibility للـ API.
لا تغير state machine بدون تحديث الوثائق.
لا تكسر Desktop sync أو Offline POS.
لا تكشف secrets أو passwords داخل الكود أو التوثيق.

# 4. القواعد المحاسبية الأساسية

أي عملية مالية يجب أن تلتزم بهذه القواعد:

Debit = Credit
Posted journal is immutable.
ZATCA cleared invoice cannot be edited.
Closed period cannot accept transactions.
Control accounts must not be written manually.

الحسابات الرقابية مثل:

Accounts Receivable
Accounts Payable
Inventory
GR/IR
VAT Output
VAT Input
Payroll Payable

لا تعدل يدويًا إلا من خلال محركات النظام المعتمدة.

# 5. Workflow العام لأي Feature

أي ميزة جديدة تمر بهذا التسلسل:

1. فهم الطلب
2. تحديد الدومين
3. قراءة ملفات Brain
4. قراءة الكود الحالي
5. تحديد الملفات المتأثرة
6. تحديد المخاطر
7. كتابة خطة قصيرة
8. تنفيذ التعديل
9. اختبار التعديل
10. تحديث التوثيق
11. تلخيص النتيجة

# 6. Workflow المحاسبة

أي تعديل في المحاسبة يجب أن يمر بهذا:

1. تحديد نوع العملية
2. تحديد هل لها أثر مالي
3. تحديد الحسابات المتأثرة
4. التأكد من Dr = Cr
5. التأكد من الفترة المالية مفتوحة
6. التأكد من عدم لمس قيد POSTED
7. استخدام auto-journal engine
8. كتابة audit log
9. اختبار القيد
10. اختبار التقارير المالية المتأثرة

# 7. Workflow المبيعات والفواتير
1. إنشاء عرض سعر أو فاتورة
2. التحقق من العميل
3. التحقق من الصلاحية
4. التحقق من المخزون
5. حساب الضريبة
6. اعتماد الفاتورة
7. إنشاء قيد محاسبي
8. تحديث المخزون
9. توليد ZATCA XML/QR
10. إرسال ZATCA حسب نوع الفاتورة
11. طباعة أو إرسال الفاتورة
12. تسجيل audit log

ممنوع:

- تعديل فاتورة POSTED مباشرة
- حذف فاتورة رسمية
- تجاوز ZATCA
- تغيير رقم الفاتورة بعد الاعتماد

# 8. Workflow POS
1. فتح جلسة كاشير
2. اختيار الفرع والصندوق
3. بيع المنتجات
4. حساب الضريبة
5. الدفع
6. إصدار الفاتورة
7. طباعة الإيصال
8. فتح درج الكاش
9. تحديث المخزون
10. إنشاء القيود
11. إرسال ZATCA في الخلفية
12. إغلاق الجلسة
13. مقارنة النقد المتوقع بالفعلي
14. تسجيل الفروقات

قواعد مهمة:

- لا بيع بدون جلسة مفتوحة.
- لا كاشير يرى فرع غير فرعه.
- لا تعديل جلسة مغلقة.
- أي فرق نقدي يسجل.

# 9. Workflow المشتريات
1. Purchase Requisition
2. Approval
3. RFQ إذا مطلوب
4. Purchase Order
5. Goods Receipt Note
6. Quality Check
7. Purchase Invoice
8. Three-Way Match
9. Posting
10. Payment Run
11. Payment
12. Reconciliation

ممنوع:

- دفع فاتورة بدون اعتماد.
- تجاوز 3-way match إذا السياسة تمنع.
- تعديل PO مغلق.
- إدخال مورد بدون تحقق إذا policy يتطلب.

# 10. Workflow المخزون
1. استلام
2. تخزين
3. حركة مخزون
4. تحويل
5. بيع
6. مرتجع
7. جرد
8. تسوية

قواعد:

- كل تغيير كمية يجب أن ينشئ StockMovement.
- لا تعديل مباشر على stock بدون سبب.
- لا حذف حركة مخزون معتمدة.
- أي تسوية مخزون لها قيد محاسبي إذا لها أثر مالي.

# 11. Workflow HR والرواتب
1. إنشاء موظف
2. عقد
3. حضور وانصراف
4. إجازات
5. بدلات واستقطاعات
6. Payroll Run
7. GOSI
8. WPS
9. Posting
10. Payslip
11. Payment

قواعد:

- لا payroll بدون مراجعة.
- لا تعديل راتب شهر مغلق.
- أي تغيير راتب يجب أن يسجل في audit log.
- WPS file يجب أن يطابق صافي الرواتب.

# 12. Workflow ZATCA
1. التحقق من بيانات الشركة
2. توليد XML
3. توليد QR
4. توقيع الفاتورة
5. إرسال clearance/reporting
6. حفظ response
7. حفظ UUID
8. حفظ hash
9. تحديث حالة الفاتورة
10. منع التعديل بعد clearance

ممنوع:

- إعادة استخدام ICV.
- تعديل PIH عشوائيًا.
- تعديل فاتورة cleared.
- حذف XML أو response.

# 13. Workflow Desktop EXE
1. تشغيل التطبيق
2. قراءة license
3. قراءة hardwareId
4. التحقق من السيرفر
5. التحقق من الاشتراك
6. تشغيل local DB
7. تشغيل Next standalone
8. فتح الواجهة
9. مزامنة البيانات
10. إرسال heartbeat
11. استقبال updates

قواعد:

- لا sync بدون license.
- لا sync إذا الاشتراك منتهي.
- لا اعتماد مالي offline بدون idempotency.
- أي conflict يجب أن يظهر للمراجعة.

# 14. Workflow ICE Admin
1. دخول ICE
2. تحقق من ice_session
3. عرض الشركات
4. إدارة الاشتراكات
5. إدارة التراخيص
6. إدارة الموديولات
7. إدارة المستخدمين
8. دعم العملاء
9. Impersonation عند الحاجة
10. Audit log لكل عملية

ممنوع:

- ICE لا يستخدم صلاحيات tenants.
- لا impersonation بدون سبب.
- لا حذف شركة بدون تأكيد ونسخة احتياطية.
- لا تغيير اشتراك بدون سجل دفع أو سبب.

# 15. Workflow الاشتراكات والتراخيص
1. Trial
2. Plan selection
3. Payment
4. Subscription activation
5. Feature flags
6. License generation
7. Renewal reminders
8. Expiry
9. Suspension
10. Reactivation

قواعد:

- أقصى مدة اشتراك سنة.
- لا شركة active بدون subscription.
- لا Desktop license بدون tenant.
- لا جهاز زائد عن limit.

# 16. Workflow API Integration
1. إنشاء API key
2. تحديد scopes
3. استخدام key
4. rate limiting
5. logging
6. webhook delivery
7. retry
8. failure handling

قواعد:

- API key لا يظهر إلا مرة واحدة.
- يحفظ hash فقط.
- كل webhook يجب أن يوقع HMAC.
- كل integration يجب أن يدعم idempotency.

# 17. Workflow الدعم الفني
1. استلام ticket
2. تصنيف المشكلة
3. تحديد الأولوية
4. قراءة runbook المناسب
5. فحص logs
6. فحص tenant
7. حل المشكلة
8. توثيق السبب
9. إغلاق التذكرة

قواعد:

- لا تدخل حساب العميل بدون impersonation رسمي.
- لا تعدل بيانات مالية من الدعم مباشرة.
- أي تعديل يدوي يحتاج audit log.

# 18. Workflow الأمن
1. اكتشاف حادث
2. تصنيف الخطورة
3. احتواء
4. تحقيق
5. إزالة السبب
6. استعادة
7. تقرير ما بعد الحادث

قواعد:

- عند الاشتباه باختراق: قفل الحساب فورًا.
- تغيير tokens.
- مراجعة audit logs.
- إبلاغ المسؤول.

# 19. Workflow النسخ الاحتياطي
1. Backup يومي
2. Backup incremental كل ساعة إذا متاح
3. رفع offsite
4. التحقق من سلامة النسخة
5. تسجيل manifest
6. اختبار restore دوري

قواعد:

- backup غير مختبر = لا يعتبر backup.
- لا destructive migration بدون backup.
- استرجاع tenant يحتاج موافقة.

# 20. Workflow الأداء

قبل أي query أو report كبير:

1. هل يوجد pagination؟
2. هل يوجد tenant filter؟
3. هل يوجد index؟
4. هل يوجد select فقط للحقول المطلوبة؟
5. هل يوجد caching؟
6. هل يحتاج async job؟

ممنوع:

- findMany بدون limit.
- reports ضخمة synchronous.
- N+1 queries.
- تحميل صور أو JSON ضخمة بدون حاجة.

# 21. Workflow الاختبارات

أي تعديل يجب أن يختبر حسب نوعه:

Accounting → financial tests
API → integration tests
UI → component/e2e tests
Tenant → isolation tests
ZATCA → compliance tests
Desktop → sync/offline tests
Security → permission/auth tests
Performance → load or query tests

قبل تسليم التعديل:

npm run typecheck
npm run lint
npm run test:unit
npm run test:domain

إذا التعديل حساس ماليًا:

npm run test:e2e
npm run test:financial

# 22. صيغة الرد بعد التعديل

بعد التنفيذ، يجب الرد هكذا:

تم تنفيذ التعديل.

الملفات المعدلة:
- ...

ما تم تغييره:
- ...

الأقسام المتأثرة:
- ...

الاختبارات:
- ...

المخاطر المتبقية:
- ...

هل تم تحديث التوثيق؟
- نعم/لا

# 23. قاعدة ذهبية

إذا كان التعديل يمس:

Accounting
ZATCA
Tenant Isolation
Subscriptions
Desktop Sync
Payroll
Security
Migrations

يجب التعامل معه كتعديل عالي الخطورة.

# 24. قاعدة التوقف

إذا وجدت تعارضًا بين:

طلب المستخدم
والقواعد المالية
أو الأمان
أو ZATCA
أو tenant isolation

لا تنفذ مباشرة.

اشرح التعارض واقترح طريقة آمنة.

# 25. الهدف النهائي

كل تعديل يجب أن يجعل النظام:

أكثر استقرارًا
أكثر أمانًا
أكثر قابلية للصيانة
أكثر وضوحًا للذكاء الصناعي
أقرب للإنتاج الحقيقي

وليس فقط أن “يعمل مؤقتًا”.
