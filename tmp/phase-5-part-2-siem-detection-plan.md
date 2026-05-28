# خطة هندسة محرك كشف التهديدات ولوحة أمان SIEM (Phase 5 Part 2 — SIEM Detection Engine & Audit Dashboard)

---

## 1. ملخص المعاينة وفحص الهيكل البرمجي الحالي (Architectural Findings)

بعد إجراء الفحص العميق للمسارات البرمجية، تم العثور على البنية الأساسية للـ SIEM وهي متكاملة ومعدة بشكل متميز:
1. **خلفية الأمان الموحدة ([withRoute](file:///d:/namasoft9-3-main/src/lib/api/with-route.ts)):** تقوم الآن بتسجيل الأحداث الثلاثة (`AUTH_FAIL`, `RBAC_DENIED`, `ADMIN_BYPASS`) بنجاح داخل قاعدة البيانات في جدول `AuditLog` وتضمين بيانات الـ IP والـ UserAgent بشكل كامل وسليم.
2. **معالج الـ SIEM المركزي المكتوب ([siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)):** يمتلك بالفعل محركاً برمجياً ديناميكياً يحلل السجلات في الذاكرة (In-Memory Detection) للكشف عن Brute Force، Privilege Escalation، Mass Export، و Off-Hours Access للمسؤولين.
3. **لوحة تحكم الأمان للـ SIEM في الواجهة ([siem/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/siem/page.tsx)):** واجهة متطورة جداً تفاعلية (Enterprise UX) تعرض الإحصائيات، الأنماط المكتشفة، المخططات الزمنية للأحداث، وتفاصيل الـ metadata بدقة متناهية.

---

## 2. تحليل الفجوات والترابط البرمجي (Telemetry & SIEM Gaps)

بالرغم من قوة البنية الحالية، تم اكتشاف فجوات ربط وتكامل هندسية دقيقة (Gaps) تجعل أحداث الـ RBAC الجديدة غير مستغلة في محرك الـ SIEM:

> [!WARNING]
> **الفجوة الأولى: حجب الـ IP والـ UserAgent لسجلات الـ AuditLog**
> في ملف الـ API `siem/route.ts` عند قراءة سجلات `AuditLog` وتحويلها لكيانات `SiemEvent` (السطر 345)، يتم ضبط قيمة حقل `ipAddress` كـ `null` دائماً، بالرغم من أن الجدول يحتوي على قيمة `ipAddress` حقيقية ومسجلة حديثاً من معالج الـ `withRoute`!
> * **الأثر:** محرك كشف التهديدات لا يستطيع كشف Brute Force أو الهجمات المرتبطة بعناوين الـ IP القادمة من سجلات التدقيق العام.

> [!IMPORTANT]
> **الفجوة الثانية: عدم تصنيف الأحداث الجديدة كأنواع أمنية مستقلة (Type Mismatch)**
> الأحداث الجديدة (`AUTH_FAIL`, `RBAC_DENIED`, `ADMIN_BYPASS`) يتم إدراجها حالياً في الـ SIEM تحت التصنيف العام الافتراضي `AUDIT_EXECUTE` عوضاً عن امتلاكها لنوع مستقل في الـ `SiemEventType`.
> * **الأثر:** لا يمكن تصفية هذه السجلات الحساسة بشكل مستقل في لوحة التحكم، كما لا يمكن تشغيل قواعد كشف مخصصة لها في الـ Detection Engine.

> [!NOTE]
> **الفجوة الثالثة: غياب تصنيفات الشدة لـ RBACTelemetry في deriveSeverity**
> معالج `deriveSeverity` لا يحتوي على قواعد لتحديد شدة (Severity) الأحداث الثلاثة الجديدة، مما يسقطها كلها في مستوى الشدة الافتراضي `INFO` وهو ما يقلل من حساسية اللوحة الأمنية.

---

## 3. الهيكلية البرمجية المقترحة وتصنيف البيانات (Proposed Telemetry Model)

نقترح إدخال التحديثات الهيكلية التالية لحل الفجوات البرمجية دون تغيير الـ Prisma schema:

### أ. تحديث الأنواع في الـ API والـ Frontend (`SiemEventType`)
إدراج الأحداث الثلاثة بشكل رسمي وموحد:
```typescript
type SiemEventType =
  | 'AUDIT_CREATE' | 'AUDIT_UPDATE' | 'AUDIT_DELETE' | 'AUDIT_EXECUTE'
  | 'AUTH_FAIL' | 'RBAC_DENIED' | 'ADMIN_BYPASS' // الأحداث الثلاثة الجديدة
  | 'MFA_SUCCESS' | 'MFA_FAIL'
  | 'LOGIN_SUCCESS' | 'LOGIN_FAIL'
  | 'FIELD_CHANGE' | 'COMPLIANCE_VIOLATION' | 'SAFETY_INCIDENT';
```

### ب. تصنيفات الشدة المستنبطة (`deriveSeverity`)
* **`AUTH_FAIL`** $\rightarrow$ **`MEDIUM`** (محاولة ولوج غير ناجحة مثل فشل تسجيل الدخول).
* **`RBAC_DENIED`** $\rightarrow$ **`HIGH`** (محاولة اختراق أو زحف من مستخدم مسجل للوصول إلى قسم حساس ليس له صلاحية عليه).
* **`ADMIN_BYPASS`** $\rightarrow$ **`LOW`** (حدث تشغيلي طبيعي للمسؤولين لكن تجب مراقبته وتدقيقه).

---

## 4. قواعد الكشف المقترحة لمحرك الـ SIEM (Threat Detection Rules)

سنقوم بتعزيز وتوسيع محرك الكشف `detectPatterns` بإدراج 3 قواعد كشف أمنية ثورية:

### 1. قاعدة كشف الزحف الاستكشافي (RBAC_CRAWL)
* **الوصف:** رصد قيام مستخدم معين (من نفس الـ `userId`) بالتعرض لـ 3 محاولات منع `RBAC_DENIED` خلال نافذة زمنية مدتها 5 دقائق.
* **الشدة:** **`HIGH`** (تنبيه ذو أولوية عالية لأنه مؤشر على محاولة استكشاف الثغرات البرمجية).

### 2. قاعدة Brute Force الاستهدافية للـ API (API_BRUTE_FORCE)
* **الوصف:** رصد حدوث 5 محاولات منع غير مصادقة `AUTH_FAIL` لنفس عنوان الـ `ipAddress` خلال نافذة 10 دقائق.
* **الشدة:** **`HIGH`** (مؤشر على محاولة تخمين الـ tokens أو فك التشفير للاتصال بـ APIs حركية).

### 3. قاعدة تخطي المسؤولين خارج الدوام (OFF_HOURS_BYPASS)
* **الوصف:** رصد حدوث أي حدث `ADMIN_BYPASS` بواسطة الـ `admin` أو الـ `owner` خارج ساعات العمل الرسمية (بين الساعة 10 مساءً و 6 صباحاً بتوقيت الرياض).
* **الشدة:** **`MEDIUM`** (مهمة للـ Enterprise Compliance ورصد اختراق الحسابات الإدارية).

---

## 5. مقترح تحسين واجهة المستخدم لوحة تحكم SIEM (Dashboard Enhancements)

واجهة لوحة التحكم الحالية `admin/siem/page.tsx` تمتلك بالفعل تصميماً راقياً وواجهات glassmorphic. نقترح ترقيتها بالتالي:
1. **تحديث الـ Types في الـ UI:** إضافة `AUTH_FAIL`, `RBAC_DENIED`, `ADMIN_BYPASS` إلى تصنيفات العرض في ملف الـ `page.tsx` ليعكس الألوان المناسبة لكل منها تلقائياً.
2. **رسم بياني حركي للأنماط المكتشفة:** إظهار الأنماط الجديدة بشكل نيون أحمر عائم في قسم التنبيهات المرتفعة لتعطي المسؤول الأمني نظرة سريعة على زحف الصلاحيات المكتشف.

---

## 6. خطة التنفيذ المقسمة (Staged Implementation Plan)

نقترح تقسيم العمل إلى 3 مراحل آمنة ومحدودة النطاق تضمن تصفير المخاطر التشغيلية بالكامل:

### المرحلة الأولى: ربط قنوات الاتصال والـ IP في الـ API (API Telemetry & Mapping)
* **الملف المتأثر:** `src/app/api/admin/siem/route.ts`
* **العمل المطلوب:**
  * تعديل دالة الربط لتقوم بقراءة واستخلاص `ipAddress` الفعلي من سجلات الـ `AuditLog`.
  * إدراج الأحداث الثلاثة الجديدة في تصنيف `SiemEventType` ومعالجة تحويل الحركات الحقيقية لها بدلاً من سقوطها في `AUDIT_EXECUTE`.
  * تحديث دالة `deriveSeverity` لدعم تصنيف شدة الأحداث الجديدة.
* **الـ Commit المقترح:** `feat(siem): align rbac security telemetry and map audit log ip addresses`

### المرحلة الثانية: دمج قواعد الكشف الأمنية في الـ SIEM (Detection Rules Integration)
* **الملف المتأثر:** `src/app/api/admin/siem/route.ts`
* **العمل المطلوب:**
  * كتابة وتنفيذ قواعد الكشف المخصصة لـ `RBAC_CRAWL` و `API_BRUTE_FORCE` و `OFF_HOURS_BYPASS` داخل الدالة الموحدة `detectPatterns`.
  * إضافة وتحديث اختبارات Jest المؤتمتة للتأكيد على دقة وسرعة كشف المحرك لهذه الأنماط في الذاكرة.
* **الـ Commit المقترح:** `feat(siem): add advanced detection rules for rbac crawling and off-hours bypass`

### المرحلة الثالثة: تحديث الواجهة الرسومية وتوحيد الأنواع (UI Integration)
* **الملف المتأثر:** `src/app/(dashboard)/admin/siem/page.tsx`
* **العمل المطلوب:**
  * محاذاة الأنواع في الواجهة الرسومية بإدراج `AUTH_FAIL`, `RBAC_DENIED`, `ADMIN_BYPASS` في الـ UI.
  * تحديث الأنماط الرسومية للوحة التحكم لعرض التنبيهات المكتشفة الجديدة بخصائص Premium Glassmorphism.
* **الـ Commit المقترح:** `fix(siem-ui): align frontend typescript types and style new event alerts`

---

## 7. فحص السلامة وتأكيد مستودع Git (Git & Safety Plan)

### أ. إقرار قواعد السلامة البرمجية:
* **تعديل مخطط قاعدة البيانات (Schema changes):** **لا يوجد نهائياً**. سنعتمد بالكامل على الحقول الحالية وجدول `AuditLog` المستقر.
* **تعديل منطق العمل المالي أو المحاسبي:** **لا يوجد نهائياً**. لن نقوم بلمس أو التأثير على أي معادلة محاسبية أو محركات الفوترة أو المخزون.
* **حالة الـ Commits والنشر:** لن يتم إجراء أي تعديل برمجى أو commit أو push حتى إكمال مراجعة هذه الخطة بالكامل واعتمادها صراحة من قبل المالك.

### ب. حالة الملفات غير المتتبعة في الـ Git:
```bash
?? tmp/phase-3-scan-plan.md
?? tmp/phase-5-rbac-operational-monitoring-plan.md
?? tmp/phase-5-part-2-siem-detection-plan.md
```
*(جميع ملفات التخطيط معزولة كلياً في مجلد الـ `tmp` للحفاظ على نظافة سجل الالتزام).*
