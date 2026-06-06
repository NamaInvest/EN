# Agent Scan Report - Wave P4-A: UI/UX Micro-interactions & Printer Connection Status Indicator

> **TRACK ID**: `WAVE_P4A_UI_UX_PRINTER_TRACK` / `GLOBAL_EVALUATION_GAPS_CLOSURE`
> **STATUS**: `PLAN_ONLY_PHASE` (No runtime modifications - awaiting implementation approval)
> **DATE**: 2026-06-06

---

## 1. الملفات التي قرأتها (Files Scanned)
1. `docs/reports/full-project-audit/FULL_PROJECT_ISSUES_REGISTER.md` (سجل المشاكل العام)
2. `src/lib/qz.ts` (جسر الاتصال بالطابعة المحلية QZ Tray)
3. `src/app/(dashboard)/pos/page.tsx` (شاشة نقاط البيع للمطاعم والتجزئة)
4. `src/app/(dashboard)/restaurant-pos/page.tsx` (شاشة نقاط بيع المطاعم المستقلة)
5. `src/app/(dashboard)/sales/terminal/page.tsx` (شاشة الكاشير السريعة)
6. `src/components/Sidebar.tsx` (شريط التنقل الجانبي والنطاق الفرعي)
7. `src/app/globals.css` (ملف تنسيق Ocean Glass العام)
8. `AI_PROJECT_MEMORY.md` (حالة الذاكرة الحالية)
9. `AGENTS.md` (قواعد الوكلاء ومصفوفات الحظر والتحصين)

---

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)
بموجب خطة "PLAN ONLY" المعتمدة حالياً، لن يتم تعديل أي ملف تشغيلي حتى صدور عبارة الموافقة البرمجية التالية. الملفات المخطط تعديلها في المرحلة القادمة هي:
1. `src/app/(dashboard)/pos/page.tsx` (إضافة شارة الاتصال بالطابعة وزر التحديث)
2. `src/app/(dashboard)/restaurant-pos/page.tsx` (إضافة شارة الاتصال بالطابعة وزر التحديث)
3. `src/app/(dashboard)/sales/terminal/page.tsx` (إضافة شارة الاتصال بالطابعة)
4. `src/components/Sidebar.tsx` (إضافة حركات انتقالية ناعمة cubic-bezier للتوسيع والتقليص)
5. `src/app/globals.css` (إضافة فئات التحريك متناهية الصغر `hover-micro` للأزرار)
6. `AI_PROJECT_MEMORY.md` (لتوثيق الحالة وإدراج commit hash الفعلي لـ Wave P3-C)

---

## 3. الدومينات المتأثرة (Affected Domains)
- **POS / Local Printing Domain** (إدماج حالة QZ Tray)
- **UI / UX & Rich Aesthetics Domain** (الانتقالات الناعمة وحركات شريط التنقل والأزرار)

---

## 4. المخاطر والحلول (Risks & Mitigations)
- **الخطر**: عدم اتصال برنامج QZ Tray محلياً عند العميل، مما قد يسبب استدعاءات فاشلة متكررة تبطئ المتصفح.
  - **الحل**: تفعيل الاتصال والتثبيت لمرة واحدة عند تحميل الصفحة (Mount) مع تخزين الحالة، ولا يتم التكرار إلا بطلب يدوي من المستخدم عبر الضغط على زر التحديث.
- **الخطر**: تكسير تصاميم الواجهات أو تداخل النصوص بسبب إضافة الشارات الجديدة.
  - **الحل**: تنسيق الشارة بأسلوب Glassmorphism متوافق بالكامل مع الألوان وتجاوب الشاشات، ووضعها بجوار `OfflineBadge` في المساحات المخصصة بالهيدر.

---

## 5. خطة التنفيذ (Implementation Plan)
1. إدراج حالة الاتصال بالطابعة `printerStatus` في شاشات الـ POS الثلاث.
2. تفعيل التحقق التلقائي عند التحميل وإضافة الشارات الخضراء والحمراء ديناميكياً.
3. دمج فئات الأنماط والحركات الانتقالية متناهية الصغر في `Sidebar` و `globals.css` للأزرار والقوائم.

---

## 6. خطة الاختبار (Testing Plan)
- فحص بناء المشروع محلياً بالكامل للتأكد من عدم وجود أخطاء تجميع: `npm run build`
- فحص سلامة اتساق الأنواع للواجهات: `npm run typecheck`
- تشغيل السيرفر محلياً واختبار مؤشر الطابعة يدوياً بتشغيل وإيقاف برنامج QZ Tray للتأكد من تفاعلية المؤشر.
