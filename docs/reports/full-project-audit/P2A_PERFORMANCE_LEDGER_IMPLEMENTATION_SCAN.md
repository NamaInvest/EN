# P2-A Performance and Ledger Implementation Scan

## 1. الملفات المفحوصة (Scanned Files)
- `src/lib/bom-engine.ts` (BOM explosion recursive logic)
- `src/app/api/manufacturing/bom/route.ts` (BOM API endpoint)
- `src/app/api/reports/[type]/route.ts` (Dynamic reports API including sales, purchases, stock, expenses, etc.)
- `src/app/api/reports/dimensional-gl/route.ts` (Dimensional GL report API)

## 2. نقاط N+1 المحتملة (Potential N+1 Query Points)
- **ISS-04 (BOM Explosion)**: في دالة `BOMEngine.explode` بداخل [bom-engine.ts](file:///d:/namasoft9-3-main/src/lib/bom-engine.ts)، يتم استدعاء `prisma.recipe.findFirst` داخل حلقة تكرارية (`for const i of ingredients`) لكل مكون مخزني لمعرفة ما إذا كان يمثل وصفة تصنيع فرعية، ومن ثم استدعاء التفجير تعاودياً. يتسبب هذا السلوك في إطلاق استعلام DB منفصل لكل مكون في الشجرة (N+1 Queries).

## 3. نقاط payload الضخمة (Potential Massive Payload Points)
- **ISS-07 (GL / Ledger reports)**: في نهايات التقارير [route.ts](file:///d:/namasoft9-3-main/src/app/api/reports/[type]/route.ts) و [route.ts](file:///d:/namasoft9-3-main/src/app/api/reports/dimensional-gl/route.ts)، يتم الاستعلام باستخدام سقف ثابت `take: 100` أو `take: 500` أو جلب كلي لدفاتر الأستاذ العام دون معالجة معاملات التقسيم الديناميكية (`skip`/`take`/`limit`/`page`) الممررة بالطلب، مما يعرّض الخادم لبطء شديد أو سقوط في حالة وجود كشوفات ضخمة.

## 4. خطة الإصلاح المقترحة (Fix Design Plan)

### أ. تحسين استعلامات الـ BOM (ISS-04)
- **الاستراتيجية**: التخلص من استعلامات الـ DB الدورية عن طريق التجميع المسبق بالدفعة (Batch pre-loading) عند كل مستوى عمق في شجرة المكونات:
  1. استخلاص جميع معرفات المكونات `rawProductId` في المستوى الحالي.
  2. جلب جميع الوصفات المطابقة لتلك المكونات دفعة واحدة باستخدام استعلام واحد بـ `findMany` مع معامل الـ `in`: `finishedProductId: { in: rawProductIds }`.
  3. عمل خريطة مطابقة `Map<finishedProductId, Recipe>` في الذاكرة.
  4. استخراج الوصفة المطابقة للمكون من الخريطة بالذاكرة فوراً دون إطلاق أي استعلام إضافي، ثم مواصلة التفجير تعاودياً.
  5. الحفاظ على نفس البنية ونوع المخرجات وشروط عزل المستأجر بشكل كامل.

### ب. إدخال ترقيم الصفحات الديناميكي لتقارير الأستاذ العام والتقارير المالية (ISS-07)
- **الاستراتيجية**:
  1. استخلاص قيم `page` و `limit` بشكل ديناميكي من معطيات URL الطلب مع وضع قيم افتراضية آمنة (`defaultLimit = 100`) وحد أقصى حامٍ لخوادم التشغيل (`maxLimit = 1000`).
  2. تطبيق معاملات الإزاحة `take` و `skip` للـ Prisma بمرونة مطلقة.
  3. تضمين تفاصيل الـ `pagination` (الصفحة الحالية، الحد التشغيلي، ومؤشر توافر المزيد من البيانات `hasMore`) في ترويسة مخرجات الـ JSON لضمان الشفافية.
  4. الحفاظ التام على التوافق الرجعي (Backward Compatibility)؛ بحيث لا يتأثر سلوك الواجهات في حال عدم تمرير معلمات التقسيم من العميل وتستمر بنفس الأرقام والنتائج المحاسبية.

## 5. خطة الاختبارات (Test Plan)
- **اختبار كفاءة الـ BOM**: كتابة اختبار في Vitest يمرر عينة شجرة BOM معقدة والتحقق من تطابق بنية البيانات المرجعة بنسبة 100% مع البنية القديمة والتأكد من انخفاض عدد الاستعلامات.
- **اختبار الـ Pagination للتقارير**: صياغة سيناريوهات فحص للـ Ledger و Dimensional GL تقارن:
  - تطبيق الـ Limit الافتراضي (100) عند خلو معلمات الطلب.
  - تطبيق الـ Skip والـ Take مع تغير الصفحات والتحقق من صحة مؤشر `hasMore`.
  - تطبيق الـ Max Limit Clamp لحظر طلبات السحب الكلي غير المقيد.
  - الحفاظ الصارم على عزل البيانات للمستأجرين.

## 6. المخاطر وتقييم العواقب (Risks)
- **عزل المستأجرين**: الحفاظ الكامل على استخدام `tenantId` داخل استعلامات Prisma لضمان عزل البيانات المالي.
- **التوافق الرجعي**: تصميم مخرجات مطابقة في شاشات التقارير لتفادي كسر واجهات الاستخدام القائمة.
- **تأكيد السلامة والأمان**: لا يوجد أي تعديل في الـ Database Schema أو Prisma Schema، ولا توجد أي هجرات أو عمليات نشر إنتاجي.

---

## 7. تأكيد ضوابط التشغيل (Safety Confirmation)
- **No DB structural changes**: مؤكد ✅
- **No Prisma push / migrations**: مؤكد ✅
- **No Env modifications**: مؤكد ✅
- **No production deploy**: مؤكد ✅
