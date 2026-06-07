# دليل إعداد بيئة قاعدة بيانات الاختبار المعزولة - Nama Invest ERP

## الهدف
تجهيز قاعدة بيانات اختبار معزولة لتشغيل اختبارات التكامل بدون لمس الإنتاج.

## مبادئ السلامة
- لا تستخدم DATABASE_URL الإنتاجي.
- لا تطبع قيمة TEST_DATABASE_URL في الطرفية أو التقارير.
- لا تحفظ TEST_DATABASE_URL داخل Git.
- لا تعدل .env من خلال الأوتوبايلوت.
- استخدم ملف env محلي غير متتبع أو متغيرات session مؤقتة.
- لا تشغل migrate أو db push إلا بعد بوابة منفصلة صريحة.
- لا تستخدم أي قاعدة تحمل اسم الإنتاج أو tenant حقيقي.
- كل اختبار يجب أن يكون rollback أو disposable.

## الخيار A: Docker PostgreSQL disposable
- مناسب للاختبارات التكاملية.
- يتم تشغيله محليًا فقط.
- اسم القاعدة يجب أن يحتوي test أو disposable.
- ممنوع استخدامه للإنتاج.
- الأوامر تكتب كإرشاد فقط، لا تنفذ في هذه المرحلة.

## الخيار B: Local PostgreSQL test-only
- مناسب إذا Docker غير متاح.
- يجب إنشاء database منفصلة باسم يحتوي test.
- يجب إنشاء user محدود الصلاحيات.
- ممنوع استخدام مستخدم production.

## الخيار C: SQLite
- يستخدم فقط إذا كان متوافقًا مع Prisma schema والمزايا المطلوبة.
- إذا المشروع يعتمد PostgreSQL features، لا تستخدم SQLite إلا كـ unit/pure tests.

## متغيرات البيئة المطلوبة
- TEST_MODE=true
- TEST_DATABASE_URL=<لا تكتب القيمة هنا>
- NODE_ENV=test عند الحاجة

## بوابة التحقق قبل التشغيل
- TEST_MODE موجود.
- TEST_DATABASE_URL موجود.
- TEST_DATABASE_URL لا يحتوي production domain.
- database name يحتوي test أو disposable.
- لا توجد migration مطلوبة.
- لا توجد schema drift تتطلب db push.
- لا توجد live posting.

## Stop Conditions
- TEST_DATABASE_URL مفقود.
- TEST_MODE مفقود.
- URL يشبه production.
- أي أمر يطلب prisma migrate.
- أي أمر يطلب prisma db push.
- أي اختبار يريد live posting.
- أي اختبار يتصل بخدمة خارجية.
