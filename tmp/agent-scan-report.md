# Scan Report (P2-B POS Session Governance) - Nama Invest ERP

هذا تعديل مالي عالي الخطورة.
لن أعدل الكود قبل تحديد:
- الأثر المحاسبي: متوسط (ربط المبيعات نقدياً بورديات وصناديق مخصصة لتسوية العجز والزيادة المحاسبية بدقة ومنع عشوائية الصرف والتحصيل).
- الجداول المتأثرة: `pos_sessions`, `pos_session_movements`, `sales_invoices`, `payment_transactions`, `journal_entries`, `journal_lines`.
- القيود المتأثرة: قيود تسوية الفروقات وعجز/زيادة الصندوق (POS Cashier Over/Short Variance).
- الاختبارات المطلوبة: اختبارات تكاملية لمنع الـ Checkout بدون وردية نشطة، واختبار نجاح الدفع مع وجود وردية وتثبيت معرف الوردية.
- طريقة rollback: استرجاع النسخ الاحتياطية الموثقة بالامتداد `.bak_P2B_REMEDIATION_*` وإعادة التشغيل.

---

## 1. الملفات التي قرأتها (Files Read)
- `src/lib/pos-session-engine.ts`
- `src/app/api/pos/checkout/route.ts`
- `src/app/api/pos/route.ts`
- `src/app/api/pos/sessions/open/route.ts`
- `src/app/api/pos/sessions/close/route.ts`
- `src/app/api/pos/sessions/movement/route.ts`
- `prisma/schema.prisma`

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)
- [MODIFY] [pos-session-engine.ts](file:///d:/namasoft9-3-main/src/lib/pos-session-engine.ts)
- [MODIFY] [route.ts](file:///d:/namasoft9-3-main/src/app/api/pos/checkout/route.ts)
- [MODIFY] [route.ts](file:///d:/namasoft9-3-main/src/app/api/pos/route.ts)
- [MODIFY] [route.ts](file:///d:/namasoft9-3-main/src/app/api/pos/sessions/open/route.ts)
- [MODIFY] [route.ts](file:///d:/namasoft9-3-main/src/app/api/pos/sessions/close/route.ts)
- [MODIFY] [route.ts](file:///d:/namasoft9-3-main/src/app/api/pos/sessions/movement/route.ts)

## 3. الدومينات المتأثرة (Affected Domains)
- **POS Cashier Operations**: إدارة ورديات الكاشير، فحص حالة الصندوق قبل الدفع، تحصيلات الخزينة، وقيود فروقات التسوية المحاسبية.
- **Financial Registry**: ترحيل اليومية وربط القيود بالخزينة ووردية الكاشير المقابلة.
- **Tenant Isolation Security**: تأمين عزل مسارات إدارة جلسات POS عبر المستأجرين لمنع الاختراقات وتسريب البيانات.

## 4. المخاطر (Risks)
- **فقد الربط في نمط الأوفلاين**: قد تتأثر واجهة الكاشير إذا لم يُتح فحص محلي، وسنصيغ فحوصاً مرنة تدعم التحقق من الجلسات النشطة.
- **عشوائية الـ userId**: إرسال معرف مستخدم مغاير من جهة العميل يسبب كسر عزل المستأجرين. سنلزم استخراج معرف المستخدم `auth.userId` والـ `tenantId` من سياق المصادقة الآمن `getUserFromRequest`.

## 5. خطة التنفيذ (Implementation Plan)
1. تعديل `PosSessionEngine` ليقبل معاملات الـ `prisma` (أو الـ transaction client) والـ `tenantId` بشكل صريح في كافة الدوال لضمان الامتثال التام لقوانين الحماية.
2. تعديل نهايتي الـ Checkout في POS (`/api/pos/checkout` و `/api/pos`) للتحقق الإجباري من وجود وردية صندوق كاشير نشطة ومفتوحة (`PosSession.status === 'OPEN'`) للمستخدم الحالي والفرع المحدد، ورفض الدفع فوراً برمز 400 في حالة عدم توفر الجلسة.
3. تعديل وتأمين نهايات الوردية الطرفية (`sessions/open`, `sessions/close`, `sessions/movement`) لتطبيق سياق المصادقة `getUserFromRequest` والـ `requireTenantId` وتمرير المعطيات المعزولة للـ Engine.

## 6. خطة الاختبار (Test Plan)
- كتابة اختبارات تكامل شاملة في `tests/integration/security/p2b-remediations.test.ts` تغطي:
  - رفض عملية الـ Checkout في حالة عدم وجود وردية مفتوحة.
  - قبول عملية الـ Checkout وربطها بنجاح فور فتح الوردية.
  - رفض فتح/إغلاق وردية كاشير تخص مستأجر آخر (عزل كامل).
