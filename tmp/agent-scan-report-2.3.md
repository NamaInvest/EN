# SCAN + PLAN Report: Phase 2.3 - Audit Trail Engine

## 1. Schema Analysis (فحص قاعدة البيانات)
بعد فحص `prisma/schema.prisma`، تبين **عدم وجود** جداول مخصصة للـ Audit بشكل عام مثل `AuditLog` أو `SystemLog`.
الجداول الموجودة الأقرب هي:
- `DocumentStateLog`: مخصص لتتبع دورة حياة وحالات المستندات (Workflow/State Machine) وليس لتعديلات البيانات.
- `EventLog`: مخصص لنظام الـ Saga / Event Bus.
- `ComplianceAuditLog`: مخصص للمخالفات الإدارية والقانونية.

**النتيجة:** **نحتاج إلى Schema Migration** لإضافة جدول `AuditLog` عام وشامل.

## 2. النطاق والمسارات الحرجة (Critical Scope)
سيتم تطبيق الـ Audit Trail على المسارات المالية والمخزنية التي تعدل حالة النظام:
- **POS:** `POST /api/pos` (إنشاء فواتير ونقص مخزون)
- **Purchases:** 
  - `POST /api/purchases` (إنشاء فاتورة مشتريات)
  - `PUT /api/purchases/[id]/receive` (استلام مخزني)
  - `DELETE /api/purchases` (حذف وعكس قيود)
- **Manufacturing:** 
  - `PUT /api/manufacturing/work-orders/[id]` (استهلاك المواد وإكمال الإنتاج)
- **Treasury:** 
  - `POST /api/finance/treasury` (سندات قبض/صرف، تحويلات عملة)
- **Delivery Notes:** 
  - `POST /api/sales/delivery-notes` (توصيل ونقص مخزون)
- **Stocktake:** 
  - `POST /api/stocktake` (تسويات جردية)

## 3. نمط استخراج البيانات (Data Extraction Pattern)
- **`tenantId`:** يُستخرج باستخدام `resolveTenant(req)` والذي يقرأ الهيدر `x-tenant`.
- **`userId`:** يُستخرج من جسم الطلب `body.userId` أو من الهيدر `req.headers.get('x-user-id')` (حسب الـ Auth Middleware المطبق).
- **`route path`:** من كائن الطلب `req.nextUrl.pathname`.
- **`entityType` / `entityId`:** تُحدد برمجياً داخل الـ Transaction بناءً على نوع العملية (مثلاً `SalesInvoice` و `invoice.id`).

## 4. تصميم أداة الـ Audit Helper
سيتم إنشاء ملف `src/lib/audit-trail.ts` يحتوي على دالة للحقن المباشر داخل الـ `$transaction`.

```typescript
import { Prisma } from '@prisma/client';

export interface AuditEventPayload {
  tenantId: string;
  userId: number | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'REVERSE';
  entityType: string;
  entityId: number | string;
  route: string;
  oldData?: any;
  newData?: any;
  metadata?: any;
  ipAddress?: string;
}

export async function logAuditEvent(
  txOrPrisma: Prisma.TransactionClient | any, 
  payload: AuditEventPayload
) {
  // سيتم استدعاؤها هكذا داخل الـ prisma.$transaction:
  await txOrPrisma.auditLog.create({
    data: {
      tenantId: payload.tenantId,
      userId: payload.userId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: String(payload.entityId),
      route: payload.route,
      oldData: payload.oldData || null,
      newData: payload.newData || null,
      metadata: payload.metadata || null,
      ipAddress: payload.ipAddress || null,
    }
  });
}
```

## 5. المخاطر والتحديات (Risks)
1. **Performance Overhead:** إضافة عملية إدخال (`INSERT`) في جدول الـ Audit لكل عملية حفظ قد يؤثر قليلاً على أداء الـ `$transaction` الكبيرة (كفاتورة بآلاف الأسطر).
   - *الحل:* دمج הـ Audit object مع عمليات الحفظ، أو الاحتفاظ بالـ Payload خفيفاً قدر الإمكان.
2. **Database Bloat (تضخم قاعدة البيانات):** جدول `AuditLog` سينمو بسرعة هائلة جداً في بيئة Multi-tenant.
   - *الحل:* يمكن لاحقاً إضافة آلية أرشيف، لكن مبدئياً يجب إضافة `@@index` مناسب للـ `tenantId` و `entityType` لتسريع البحث.
3. **Data Privacy (الخصوصية):** تسجيل بيانات تفصيلية في `oldData` و `newData` قد يخزن بيانات حساسة (Passwords, Tokens).
   - *الحل:* عدم تمرير كائنات كاملة في الـ Payload، بل فقط الحقول المتأثرة التي تهم التدقيق المالي.

## 6. Definition of Done (معيار الاكتمال)
1. إضافة موديل `AuditLog` إلى `schema.prisma` وعمل `prisma db push` (أو `migrate`).
2. إنشاء `src/lib/audit-trail.ts`.
3. دمج `logAuditEvent` في 3 مسارات حرجة (كمرحلة أولى للتقييم): `POS`, `Purchases`, و `Treasury`.
4. التحقق من أن سجلات الـ Audit لا تكسر الـ `$transaction` وتكون محصورة بنطاق الـ Tenant.
5. التحقق عبر `tsc --noEmit`.
