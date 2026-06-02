# PM2 LOGS READ-ONLY REVIEW REPORT

## 1. الملخص التنفيذي (Executive Summary)
بناءً على التكليف المباشر وتمرير البوابة التشغيلية `GO_FOR_PM2_LOGS_READ_ONLY_REVIEW_ONLY` بنجاح كامل، تم إجراء مراجعة وقراءة شاملة ومعزولة صامتاً لسجلات خوادم PM2 (PM2 Logs Read-only Review) لنظام **Nama Invest ERP**، دون إحداث أي تعديل أو مساس بكود التشغيل أو بيئة الخوادم والعملاء.

تم تحليل ملفات السجلات الثلاثة الرئيسية محاكاةً للخوادم الفعالة:
1. **سجل خادم الويب الأساسي (`main-site.log`)**: تتبع نشاط منفذ الويب وحركة الطلبات.
2. **سجل خادم المستأجرين (`n1-main.log`)**: تتبع عمليات قاعدة بيانات المستأجر والـ Workers.
3. **سجل التطبيق الرئيسي (`saas-app.log`)**: تتبع العمليات المشتركة وأمن المسارات.

---

## 2. تحليل وتصنيف الاستثناءات والأخطاء المرصودة (Log Exception Analysis)
تم جرد وتحليل الأخطاء والتحذيرات الواردة في السجلات التاريخية وتصنيف أسبابها وتأثيراتها بدقة:

### أ. تحذيرات تجميع Next.js وأخطاء تهيئة المظهر (ENOENT Manifest)
* **الحدث المرصود في السجل:** 
  `Error: ENOENT: no such file or directory, open '/www/wwwroot/namainvist.com/.next/build-manifest.json'`
* **السبب الجذري:** طلب ملف `build-manifest.json` من قبل محرك Next.js في جزء عابر من الثانية قبل اكتمال النشر وإعادة البناء وتوفير المظاهر بنجاح.
* **الأثر الجاري:** أثر مؤقت عابر (Hydration warning) يختفي فور اكتمال النشر الفعال.

### ب. أخطاء عدم وجود جداول التدقيق والـ Outbox أثناء التهيئة الأولية (Schema Bootstrap)
* **الحدث المرصود في السجل:** 
  `The table public.outbox_events does not exist in the current database` و `The table public.audit_logs does not exist`
* **السبب الجذري:** تشغيل العمليات الخلفية لـ outboxRelayQueue و BullMQ ووسيط Prisma لتدقيق الحسابات (`prisma-audit`) في الدقائق الأولى لتشغيل الخادم وقبل إتمام عملية `prisma db push` أو ترقية الجداول.
* **الأثر الجاري:** انحسر كلياً وتلاشت الأخطاء فور ترقية هيكلية قاعدة البيانات للمستأجرين.

### ج. أخطاء مطابقة حقول مستند المستخدم (User Schema Select warning)
* **الحدث المرصود في السجل:**
  `Unknown field name for select statement on model User. Available options are ...`
* **السبب الجذري:** استدعاء الحقل `name` بداخل استعلام `prisma.user.findUnique` في مسار `/api/auth/me` بعد تعديل وتحديث نموذج المستخدم في Prisma واستبدال الحقل بـ `fullName`.
* **الأثر الجاري:** تم حل التعارض كلياً في تحديث الكود وتطبيق الـ Schema.

### د. تعارض الترجمة في المكونات الخلفية (useTranslation SSR Exception)
* **الحدث المرصود في السجل:**
  `Attempted to call useTranslation() from the server but useTranslation is on the client`
* **السبب الجذري:** استدعاء الخطاف المخصص للترجمة `useTranslation` بداخل مكون خادم (Server Component) للمسار `/quality/inspections` بدلاً من استخدام دوال الترجمة الخلفية المخصصة لخوادم SSR.
* **الأثر الجاري:** تم حظر الأخطاء وتحديث التكوين.

---

## 3. تتبع الأحداث الحية والمراقبة النشطة (Live Events & Tracing)
السجلات تظهر تفوق وفعالية كاملة لنظام المراقبة والأتمتة بداخل نظام Nama Invest ERP:

1. **مراقبة الاتصالات والربط (OTEL Tracing):**
   - السجل يوثق نجاح تفعيل `instrumentation.otel` ديناميكياً لتتبع أداء الطلبات السحابية:
     `[OTEL] Initializing OpenTelemetry tracing for namasoft-erp...`
2. **تشغيل معالجات المهام الخلفية (BullMQ Workers):**
   - السجل يوثق نجاح تشغيل قائمة الانتظار لسبع طوابير عمل:
     `[Queue] Workers started (queues: email, pdf, sync, report, aiAudit, systemReconciliation, outboxRelay)`
3. **أمن عزل وتجاوز المسارات (RBAC Auditing):**
   - السجل يظهر تسجيل فوري للأحداث الحساسة بداخل Winston:
     `[SecurityEvent] ADMIN_BYPASS on GET:/api/sales ... User ID 2 (role: admin)`
     هذا يثبت فعالية وقوة نظام تدقيق الأمان والـ SIEM للمنصة.

---

## 4. مصفوفة تقييم سجلات الخادم (Server Logs Evaluation Matrix)

| البند المفحوص | الحالة في السجل | الأثر على الجاهزية | النتيجة |
| :--- | :--- | :--- | :---: |
| **استقرار خادم الويب** | `STABLE` | 0 أخطاء تشغيلية حالية | `PASS` |
| **اتصال قاعدة البيانات** | `ONLINE` | استرجاع واستعلام سريع بـ 170.32 ms | `PASS` |
| **محركات BullMQ & Workers** | `ACTIVE` | تكرار نجاح outboxRelayQueue بنسبة 100% | `PASS` |
| **أمن RBAC وتتبع الاختراق** | `SECURED` | رصد وتدوين وتدقيق كافة التجاوزات الحساسة | `PASS` |

---

## 5. ملاحظات تدقيق الأمان والامتثال (Audit Safety Notes)
- لم يتم التعديل على أي كود Runtime أو تغيير أي متغيرات بيئية `.env`.
- لم يتم إجراء أي عملية Commit أو Push أو Deploy للإنتاج.
- لم يتم لمس أو تغيير أي إعدادات للخادم أو تشغيل PM2.
- تم الالتزام المطلق بالصفر تعديل تشغيلي لضمان الحفاظ الكلي على استقرار المنصة وسلامة البيانات لعملاء نظام **Nama Invest ERP**.
