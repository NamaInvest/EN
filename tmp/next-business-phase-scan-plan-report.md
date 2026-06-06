# تقرير الفحص والتخطيط للمرحلة القادمة (Next Business Phase Scan & Plan Report) - Phase 3 (Wave P4-A)

يوثق هذا التقرير تفاصيل الفحص الدقيق والخطط المقترحة لتطبيق المرحلة التجارية والتشغيلية القادمة **Wave P4-A: UI/UX Micro-interactions & Printer Connection Status Indicator (ISS-13 & ISS-14)**.

---

## 1. تفاصيل التحديد (Selection Details)

- **المرحلة المحددة**: **Wave P4-A: UI/UX Micro-interactions & Printer Connection Status Indicator** (المرتبطة بالمشكلتين `ISS-13` و `ISS-14` في سجل المشاكل).
- **سبب الاختيار**: تماشيًا مع إتمام كافة المراحل الوظيفية المعقدة السابقة (الدانينج ومسارات الفترات المالية وتوطيد Staging)، تهدف هذه المرحلة إلى سد الفجوات الجمالية والتشغيلية المتبقية في واجهات نقاط البيع POS وشريط التنقل الأساسي للوصول بـ Nama Invest ERP إلى تجربة مستخدم عالمية (Rich Aesthetics) والتأكد من وضوح حالة الطابعة محلياً.

---

## 2. نطاق الفحص الميداني (Scope & Files Reviewed)

لقد تم فحص المكونات والملفات التالية:

- **الملفات البرمجية (Files Reviewed)**:
  - [src/lib/qz.ts](file:///d:/namasoft9-3-main/src/lib/qz.ts): فحص جسر الاتصال ببرنامج الطباعة QZ Tray والتأكد من استخدام `connectQZ()` و `getLocalPrinters()`.
  - [src/app/(dashboard)/pos/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/pos/page.tsx) & [src/app/(dashboard)/restaurant-pos/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/restaurant-pos/page.tsx): شاشات نقاط البيع الكبرى.
  - [src/app/(dashboard)/sales/terminal/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/sales/terminal/page.tsx): شاشة الكاشير والمبيعات السريعة المتقدمة.
  - [src/components/Sidebar.tsx](file:///d:/namasoft9-3-main/src/components/Sidebar.tsx): شريط التنقل الجانبي.
  - [src/app/globals.css](file:///d:/namasoft9-3-main/src/app/globals.css): ملف الأنماط العام للنظام.

- **الصفحات المتأثرة (Pages Reviewed)**:
  - صفحة نقطة البيع للمطاعم والتجزئة: `/pos` و `/restaurant-pos`
  - صفحة كاشير المبيعات السريعة: `/sales/terminal`
  - شريط التنقل الجانبي في جميع لوحات التحكم.

- **الأزرار والوظائف المعنية**:
  - مؤشر الاتصال بالشبكة (الرأس) ومؤشر الطابعة الجديد.
  - أزرار التحكم بالكمية، وأزرار الدفع النقدي والشبكي في نقاط البيع.
  - روابط القائمة المنسدلة للوحدات الممتدة في شريط التنقل.

- **نماذج البيانات والمنافذ (Models & APIs)**:
  - لا يتطلب تعديل أي جداول Prisma (DB_CHANGED: NO).
  - لا يتطلب تعديل أي مسارات API خلفية، فالتغييرات تجميلية وعلى العميل فقط.

---

## 3. السلوك الحالي مقابل السلوك المفقود (Current vs. Missing Behavior)

### أ. اتصال الطابعة المحلية (ISS-14):
- **السلوك الحالي**: يتم استدعاء الاتصال بالطابعة QZ Tray بشكل كسول (lazily) عند الضغط على زر الطباعة فقط. لا توجد طريقة تمكن الكاشير من معرفة ما إذا كانت طابعة الفواتير المحلية متصلة بالبرنامج ومتاحة للطباعة قبل المباشرة بالدفع وحفظ الفاتورة، مما قد يسبب تأخيراً وتشويشاً للكاشير في أوقات الذروة.
- **السلوك المفقود**: مؤشر بصري (Badge) يعرض حالة الاتصال مع QZ Tray على العميل (مثال: "متصل بالطابعة 🟢" أو "الطابعة غير متصلة 🔴") يتم تحديثه تلقائياً عند تحميل الصفحة، مع زر تحديث سريع لإعادة التحقق من الاتصال بالبرنامج دون إعادة تحميل المتصفح.

### ب. الحركات الانتقالية متناهية الصغر (ISS-13):
- **السلوك الحالي**: تستخدم روابط وتفرعات القوائم في Sidebar تبديلات مفاجئة وخشنة للتنقل وتوسيع القوائم دون سلاسة (opacity و max-height تتغير بسرعة شديدة دون تأثير انتقالي مميز).
- **السلوك المفقود**: تفعيل حركات انتقالية ناعمة و hardware-accelerated باستخدام Tailwind transitions وتنسيق cubic-bezier متطور وتوسيع آمن للارتفاع مع هوفر أنيق ومتحرك للأزرار.

---

## 4. خطة التنفيذ المقترحة (Proposed Implementation Plan)

### الخطوة 1: دمج مؤشر الطابعة المحلية في نقاط البيع (POS Pages)
- إضافة حالة React بداخل `pos/page.tsx` و `restaurant-pos/page.tsx` و `sales/terminal/page.tsx`:
  `const [printerStatus, setPrinterStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');`
- استدعاء `connectQZ()` على العميل عندMount الصفحة:
  ```typescript
  const checkPrinter = async () => {
      setPrinterStatus('checking');
      const isConnected = await connectQZ();
      setPrinterStatus(isConnected ? 'connected' : 'disconnected');
  };
  useEffect(() => { checkPrinter(); }, []);
  ```
- عرض المؤشر في الهيدر بجوار `OfflineBadge` في شاشات الـ POS:
  - في حال الاتصال: شارة خضراء بأسلوب Glassmorphism ناعم "طابعة الفواتير متصلة 🖨️ 🟢".
  - في حال عدم الاتصال: شارة حمراء/رمادية تفاعلية "الطابعة غير متصلة 🖨️ 🔴" مع زر إعادة محاولة دائري صغير.

### الخطوة 2: تحسين حركات وانتقالات الواجهة (ISS-13)
- تحسين توسيع القوائم في `src/components/Sidebar.tsx` بإضافة فئات ناعمة ومؤثرات تحريك للروابط والأيقونات الفرعية.
- إضافة فئات ومؤثرات هوفر ناعمة وسلسة للأزرار في شاشات الـ POS بداخل `src/app/globals.css` باستخدام حركات Micro-interactions مطورة.

---

## 5. خطة الاختبار والتحقق (Test Plan)

- **الاختبارات الآلية (Automated Tests)**:
  - التحقق من خلو الواجهات من أي مشاكل في الصلاحيات أو عزل المستأجرين.
  - تشغيل `npm run typecheck` و `npm run build` لضمان سلامة التوطين.
- **الاختبارات اليدوية (Manual Verification)**:
  - تشغيل السيرفر محلياً والتحقق من عمل شاشة الـ POS وعرض شارات الطابعة الخضراء والحمراء ديناميكياً عند تشغيل أو إيقاف برنامج QZ Tray محلياً.

---

## 6. خطة التراجع والضمانات (Rollback & Safe Guards)

- **خطة التراجع (Rollback Plan)**: تراجع بسيط عبر Git (`git checkout`) نظرًا لأن التغييرات لا تؤثر على قاعدة البيانات أو الكود الخلفي للـ APIs.
- **شروط حظر التقدم (No-go Conditions)**:
  - أي فشل في تجميع TypeScript أو خطأ في بناء Next.js.
  - أي بطء ملحوظ أو تسريب ذاكرة عند إعادات التحقق المتكررة من الطابعة.

---

## 7. عبارة الموافقة المطلوبة للمرحلة التالية (Approval Expectation)

**عبارة الموافقة المطلوبة للانتقال للتنفيذ**:  
`GO_FOR_NEXT_BUSINESS_PHASE_IMPLEMENTATION_ONLY`
