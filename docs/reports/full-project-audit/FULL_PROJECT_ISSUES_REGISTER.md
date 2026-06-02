# FULL PROJECT ISSUES REGISTER
# سجل المشاكل والفجوات التشغيلية لكامل المشروع

---

> **TRACK ID**: `ENTERPRISE_GAP_ANALYSIS_TRACK`
> **STATUS**: `AUDITED_AND_REGISTERED`
> **COMPLIANCE LEVEL**: Redacted sensitive values, structural logging only.

---

يقدم هذا السجل تفصيلاً دقيقاً لكافة المشاكل والفجوات الفنية المكتشفة أثناء الفحص المعمق لكود وهيكلية مشروع **Nama Invest ERP**:

## 1. Summary of Issues / ملخص سجل المشاكل

| ID | Severity | File/Module Path | Primary Module | Title / عنوان المشكلة | Suggested Gate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ISS-01** | `P1 High` | `src/app/api/admin/cron` | Security / Admin | ثغرة الاستعلامات العامة الخالية من فلتر المستأجر في مهام الكرون | `GO_FOR_P1_TENANT_ISOLATION_REVIEW_ONLY` |
| **ISS-02** | `P1 High` | `src/app/api/admin/mfa` | Security / Auth | غياب المصادقة الثنائية المتعددة في طلبات استرداد الـ MFA | `GO_FOR_P0_SECURITY_FIX_PLAN_ONLY` |
| **ISS-03** | `P1 High` | `src/app/api/inventory` | Financial / Inventory| تجاوز فترات الإغلاق المالي في حركات تسوية المخزون والتسجيل المخزني | `GO_FOR_P1_FINANCIAL_GOVERNANCE_GAP_PLAN_ONLY` |
| **ISS-04** | `P2 Medium` | `src/app/api/manufacturing` | Manufacturing / BOM | استعلامات N+1 المتكررة في شجرة شاشات خطوط الإنتاج والـ BOM | `GO_FOR_P2_PERFORMANCE_INDEX_REVIEW_ONLY` |
| **ISS-05** | `P2 Medium` | `src/app/api/pos/terminal` | POS / Cashier | غياب فحص حالة الصندوق المالي المسبق قبل حفظ المعاملة نقدياً | `GO_FOR_P1_FINANCIAL_GOVERNANCE_GAP_PLAN_ONLY` |
| **ISS-06** | `P2 Medium` | `src/components/pos/` | UI / POS Desktop | قص وتداخل نصوص الجوال في فواتير ونقاط البيع عند استعراض الشاشة | `GO_FOR_P2_MOBILE_UX_FIX_PLAN_ONLY` |
| **ISS-07** | `P2 Medium` | `src/app/api/reports/` | Reports / BI | تحميل كامل لتقرير دفتر الأستاذ العام دفعة واحدة وتسييل payloads ضخمة | `GO_FOR_P2_PERFORMANCE_INDEX_REVIEW_ONLY` |
| **ISS-08** | `P2 Medium` | `src/app/api/upload` | Security / DMS | غياب فحص وفلترة ترويسة نوع الملف الحقيقية عند رفع المستندات | `GO_FOR_P0_SECURITY_FIX_PLAN_ONLY` |
| **ISS-09** | `P3 Low` | `scripts/workers/` | SRE / BullMQ | نقص التوثيق الفني لكيفية معالجة فشل جسور المراقبة لعمال طوابير BullMQ | `GO_FOR_P3_FUNCTIONAL_MANUALS_IMPLEMENTATION_ONLY` |
| **ISS-10** | `P3 Low` | `tests/load/` | QA / Stress | غياب اختبارات ضغط وحمل متقدمة (Stress Tests) لعمليات الفوترة الضخمة | `GO_FOR_P2_E2E_COVERAGE_EXPANSION_PLAN_ONLY` |
| **ISS-11** | `P3 Low` | `e2e/wave2/` | QA / Playwright | اختبارات الموجة الثانية التجارية مجمدة لعدم اكتمال تأسيس خادم الـ Staging | `GO_FOR_P2_E2E_COVERAGE_EXPANSION_PLAN_ONLY` |
| **ISS-12** | `P3 Low` | `docs/functional/` | Docs / Support | نقص الأدلة الوظيفية الشاملة لعمليات التسويات الضريبية وحركات الـ WHT | `GO_FOR_P3_FUNCTIONAL_MANUALS_IMPLEMENTATION_ONLY` |
| **ISS-13** | `P4 Cosmetic`| `src/components/ui/` | UI / Core | تحسين سلاسة الحركات الانتقالية متناهية الصغر للهيدرات وشريط المهام | `GO_FOR_P2_MOBILE_UX_FIX_PLAN_ONLY` |
| **ISS-14** | `P4 Cosmetic`| `src/app/pos/` | UI / UX | إضافة مؤشر بصرى تفاعلي يؤكد نجاح الاتصال المحلى بطابعة الفواتير | `GO_FOR_P2_MOBILE_UX_FIX_PLAN_ONLY` |

---

## 2. Detailed Issue Records / سجل تفاصيل المشاكل والفجوات

### 🔴 ISS-01: ثغرة الاستعلامات العامة الخالية من فلتر المستأجر في مهام الكرون
* **الخطورة (Severity)**: `P1 High`
* **الملف المتأثر (File)**: `src/app/api/admin/cron/route.ts` & `src/scripts/cron-cleanup.ts`
* **القسم (Module)**: Security / Admin
* **الوصف (Description)**: تقوم بعض دوال التنظيف وإعداد التقارير الدورية التي تعمل كـ Cron jobs بالاستعلام المباشر عبر Prisma دون تمرير معامل الـ `tenantId` أو فلترة النطاق، مما قد يتسبب في تداخل بيانات المستأجرين (Tenant Leakage) أو تصفية بيانات تخص شركات أخرى عن طريق الخطأ.
* **الدليل المادي (Evidence)**:
  ```typescript
  // src/scripts/cron-cleanup.ts
  const expiredTokens = await prisma.mfaUsedToken.deleteMany({
    where: { expiresAt: { lt: new Date() } } // Missing tenantId filter!
  });
  ```
* **الأثر والمخاطر (Risk)**: تداخل منطقي وتصفية جلسات مستخدمين عبر شركات متعددة، وخرق حوكمة عزل البيانات الصارمة.
* **الإصلاح المقترح (Recommended Fix)**: تفعيل بادئة الاستعلام الإلزامية وتعديل الـ Middleware ليرفض الاستعلامات الكلية للـ `deleteMany` إلا بتحديد صريح للـ `tenantId` أو بادئة إدارية معتمدة.
* **البوابة المقترحة (Suggested Gate)**: `GO_FOR_P1_TENANT_ISOLATION_REVIEW_ONLY`

---

### 🔴 ISS-02: غياب المصادقة الثنائية المتعددة في طلبات استرداد الـ MFA
* **الخطورة (Severity)**: `P1 High`
* **الملف المتأثر (File)**: `src/app/api/admin/mfa/recovery/route.ts`
* **القسم (Module)**: Security / Auth
* **الوصف (Description)**: تتم معالجة طلبات استرداد وإعادة تعيين رموز المصادقة الثنائية للـ MFA (`MfaRecoveryRequest`) من قبل حساب إداري منفرد (Single Admin Approved) دون وجود صمام موافقة ثنائية أو توقيع مشترك من مسؤول ثانٍ (Dual-Officer Authorization)، مما يسهل اختراق النظام بالكامل عند اختراق حساب إداري واحد.
* **الدليل المادي (Evidence)**:
  ```typescript
  // src/app/api/admin/mfa/recovery/route.ts
  const request = await prisma.mfaRecoveryRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED', reviewedByUserId: session.userId } // Single administrator approval
  });
  ```
* **الأثر والمخاطر (Risk)**: رفع الصلاحيات وهجوم التجاوز الإداري للـ MFA لحسابات كبار المدراء والمحاسبين.
* **الإصلاح المقترح (Recommended Fix)**: فرض بروتوكول الموافقة الثنائية (Dual-Officer Consensus Approval) حيث يتطلب تفعيل طلب الاسترداد موافقة مسؤولين اثنين مختلفين قبل تعيين المفاتيح الجديدة.
* **البوابة المقترحة (Suggested Gate)**: `GO_FOR_P0_SECURITY_FIX_PLAN_ONLY`

---

### 🔴 ISS-03: تجاوز فترات الإغلاق المالي في حركات تسوية المخزون والتسجيل المخزني
* **الخطورة (Severity)**: `P1 High`
* **الملف المتأثر (File)**: `src/app/api/inventory/stocktake/route.ts` & `src/lib/inventory-reconciliation.ts`
* **القسم (Module)**: Financial / Inventory
* **الوصف (Description)**: تسمح واجهة تسوية فروقات الجرد المخزني وبعض واجهات الاستلام وتعديل المخازن بتسجيل حركات ذات أثر مالي وتقييم مخزني بأثر رجعي دون التحقق من حالة إغلاق الفترة المالية للوحدة التشغيلية أو الفرع، مما يؤدي لتشوهات في تقييم المخزون المالي وحساب تكلفة البضاعة المباعة (COGS).
* **الدليل المادي (Evidence)**:
  ```typescript
  // src/app/api/inventory/stocktake/route.ts
  const adjustment = await prisma.stockMovement.create({
    data: { productId, stockId, quantity, type: 'ADJUSTMENT' } // Missing check against closed fiscal periods!
  });
  ```
* **الأثر والمخاطر (Risk)**: تدمير توازن القوائم المالية، وخرق إغلاق الحسابات الختامية المعمدة، وعدم الامتثال لمعايير التدقيق المحاسبي.
* **الإصلاح المقترح (Recommended Fix)**: إخضاع كافة عمليات الإدخال المخزني ذات الأثر المالي لفحص إجباري يستعلم عن تاريخ الحركة ويطابقه بجدول الفترات المغلقة `FiscalPeriod` قبل السماح بالترحيل.
* **البوابة المقترحة (Suggested Gate)**: `GO_FOR_P1_FINANCIAL_GOVERNANCE_GAP_PLAN_ONLY`

---

### 🟡 ISS-04: استعلامات N+1 المتكررة في شجرة شاشات خطوط الإنتاج والـ BOM
* **الخطورة (Severity)**: `P2 Medium`
* **الملف المتأثر (File)**: `src/app/api/manufacturing/bom/route.ts` & `src/lib/bom-helper.ts`
* **القسم (Module)**: Manufacturing / BOM
* **الوصف (Description)**: تستعلم شاشة فحص شجرة خطوط الإنتاج وجداول مكونات الإنتاج (BOM) عن المكونات والمكونات الفرعية التابعة للمنتج بشكل متسلسل فردي، مما يولد عشرات استعلامات N+1 المتكررة لقاعدة البيانات عند فحص الهياكل العميقة.
* **الدليل المادي (Evidence)**:
  ```typescript
  // src/lib/bom-helper.ts
  for (const item of ingredients) {
    const detail = await prisma.product.findUnique({ where: { id: item.productId } }); // Runs in a loop for each nested ingredient!
  }
  ```
* **الأثر والمخاطر (Risk)**: بطء استجابة واجهة المستخدم، وتأخير تحميل خطط التصنيع الضخمة، وإرهاق الذاكرة لقاعدة بيانات PostgreSQL.
* **الإصلاح المقترح (Recommended Fix)**: استخدام الاستعلام الموحد المسبق بالـ `findMany` مع عامل الاستيعاب `in` لجلب تفاصيل كافة المنتجات دفعة واحدة، أو تفعيل كاش Redis معزول لتخزين شجرة BOM المعتمدة.
* **البوابة المقترحة (Suggested Gate)**: `GO_FOR_P2_PERFORMANCE_INDEX_REVIEW_ONLY`

---

### 🟡 ISS-05: غياب فحص حالة الصندوق المالي المسبق قبل حفظ المعاملة نقدياً
* **الخطورة (Severity)**: `P2 Medium`
* **الملف المتأثر (File)**: `src/app/api/pos/checkout/route.ts`
* **القسم (Module)**: POS / Cashier
* **الوصف (Description)**: تسمح واجهة الدفع وحفظ فواتير نقاط البيع (POS Checkout) بإنشاء فواتير مبيعات نقدية دون التحقق من حالة صندوق الكاشير وما إذا كانت جلسة الصندوق مفتوحة ومغذاة بالرصيد الافتتاحي، مما يسبب فروقات ترحيل مالي وتراكم عشوائي في حسابات الصناديق.
* **الدليل المادي (Evidence)**:
  لم يتم جلب أو اشتراط التحقق من جدول `PosSession` وحالته النشطة في ترويسة الطلب قبل حفظ الفاتورة مباشرة.
* **الأثر والمخاطر (Risk)**: فروقات الصناديق عند الجرد، وتشويه تقارير إغلاق الوردية، وغياب الانضباط الرقابي على الكاشير.
* **الإصلاح المقترح (Recommended Fix)**: فرض وجود جلسة صندوق نشطة ومطابقة `PosSession.status == 'OPEN'` لربط الفاتورة النقدية بمعرف الوردية.
* **البوابة المقترحة (Suggested Gate)**: `GO_FOR_P1_FINANCIAL_GOVERNANCE_GAP_PLAN_ONLY`

---

### 🟡 ISS-06: قص وتداخل نصوص الجوال في فواتير ونقاط البيع عند استعراض الشاشة
* **الخطورة (Severity)**: `P2 Medium`
* **الملف المتأثر (File)**: `src/components/pos/terminal.tsx` & `src/app/pos/invoice/page.tsx`
* **القسم (Module)**: UI / POS Desktop
* **الوصف (Description)**: عند استعراض شاشة الكاشير أو تفاصيل الفواتير المحسوبة من الجوال أو الأجهزة الكفية الصغيرة، تتداخل الحقول وتتقاطع الأزرار نتيجة لغياب هوامش كافية للتصميم اللغوي العربي (RTL layout) لبعض التسميات العربية الطويلة.
* **الدليل المادي (Evidence)**:
  مراجعة سلوك شاشة الكاشير في مشروع الجوال لمحرك Playwright أظهرت قصاً للنص في زر الدفع التلقائي وعناصر التسمية المخزنية.
* **الأثر والمخاطر (Risk)**: صعوبة الاستخدام من قبل أمناء الصناديق، وزيادة احتمالية ارتكاب أخطاء إدخال مالي.
* **الإصلاح المقترح (Recommended Fix)**: استخدام الفئات التجاوبية للـ CSS بشكل مرن وتطبيق التفاف النصوص التلقائي `text-wrap` مع تقليص حجم الخطوط بداخل حاويات الهيدر على الشاشات الكفية.
* **البوابة المقترحة (Suggested Gate)**: `GO_FOR_P2_MOBILE_UX_FIX_PLAN_ONLY`
