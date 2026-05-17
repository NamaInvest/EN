# AI Project Memory

## Stabilization Completion Snapshot
**Date:** 2026-05-17
**Last Commit Hash:** `ded1350cbf9972ceedc71db2e76d419ec8938e29`

### قائمة Commits المنجزة (Stabilization Phase)
1. `docs: update enterprise governance roadmap`
2. `governance: enhance tenant isolation and middlewares`
3. `phase reliability add outbox relay infrastructure`
4. `manufacturing harden inventory transaction boundaries`
5. `hr assets enforce financial atomicity and idempotency`
6. `financial core enforce atomic posting boundaries`
7. `integrations enforce transactional consistency`
8. `schema package add outbox infrastructure setup`

### الحالة الحالية للنظام
- TypeScript Zero-Error ✅
- Working Tree Clean ✅
- لا توجد `prisma.$transaction` مكشوفة ✅
- `OutboxEvent` موجود في Schema ✅
- `db:setup` يشغل سكربت `setup-db-triggers` تلقائياً ✅

### القاعدة الجديدة والمستمرة للنظام
أي مرحلة قادمة (مثل Phase 3.1.4 وما بعدها) يجب أن تحافظ بصرامة على:
- No exposed `prisma.$transaction`.
- All mutations through domain tx wrappers (`runFinancialTx`, `runInventoryTx`, etc.).
- No financial posting outside tx.
- Tenant isolation enforced strictly.
- Idempotency implemented for all external integrations.

## HR Tenant Isolation Completion Snapshot
**Date:** 2026-05-17
**Last Commit Hash:** `cdb1d5bc`

### حالة قطاع الموارد البشرية (HR Status)
- قطاع HR بالكامل مغلق ومؤمن (Strict Tenant Isolation) ✅
- TypeScript Zero-Error ✅
- Working Tree Clean ✅
- لا يوجد `body/query tenantId` (استبعاد الطرق غير الآمنة) ✅
- لا يوجد `tenantId default/1` (تطبيق صارم لهوية المستأجر) ✅
- لا يوجد `prisma.$transaction` مكشوف ومباشر ✅
- جميع HR routes تستخدم `requireTenantId` بنجاح ✅

### أهم المخاطر التي أُغلقت:
- Payroll race condition
- Double payroll run
- GOSI runtime error
- Expense reports atomicity
- Mudad tenant isolation
- HR engines tenant leakage

## Phase 3.1.4: Outbox Integration Snapshot
**Date:** 2026-05-17
**Last Commit Hash:** `4dd8b39d`

### قائمة Commits المنجزة
- Schema: `1c89d825`
- Worker: `3cdb89b0`
- Helper: `92716c4a`
- Payroll Integration: `4dd8b39d`

### تفاصيل البنية الآمنة المكتملة
- حقل `tenantId` إلزامي تماماً في `OutboxEvent` (تم إزالة `default`).
- خاصية `idempotencyKey` مدعومة لتأمين Event-Idempotency.
- الـ Relay Worker أصبح `tenant-aware` (ينقل هوية المستأجر داخل الـ Queue Payload).
- تم تفعيل نظام الإعادة (Retry Logic) بحد أقصى `MAX_ATTEMPTS = 5`.
- نظام الرواتب (`Payroll`) يولد بنجاح حدث `HR_PAYROLL_RUN_COMPLETED` **داخل نفس `runFinancialTx`**.

### القاعدة الجديدة الخاصة بالـ Outbox:
أي حدث (OutboxEvent) مستقبلي **يجب أن يُنشأ فقط** داخل نفس معاملة قاعدة البيانات (Domain Transaction) عبر تمرير `tx` لـ `OutboxService.emit`.
