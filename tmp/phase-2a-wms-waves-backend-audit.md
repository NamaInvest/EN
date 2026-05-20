# PHASE 2A: WMS Waves Backend Audit Report

## 1. Existing Architecture (الموجود حالياً)
- **Prisma Models:** يوجد نموذج واحد فقط للموجات وهو `WmsWave`، بينما توجد نماذج بنية المستودعات `WarehouseZone`, `WarehouseRack`, `WarehouseBin` و `InventoryBin`. لا توجد جداول لمهام الالتقاط (`WmsTask`).
- **API Routes:** المسار `/api/wms/waves` موجود، لكنه يعمل كواجهة استدعاء بسيطة لمحرك (Engine) وليس كخدمة (Service) متكاملة.
- **Service Layer:** المنطق الحالي مبني داخل `src/lib/wave-picking.ts` (WavePickingEngine)، وهو محرك يقوم بـ (In-memory computation) لتوليد مهام الالتقاط وتقديم تحليل `Slotting` بناءً على الحركات، ولا يقوم بحفظ موجة فعلية في قاعدة البيانات.

## 2. Missing Elements (النواقص المعمارية)
- **Database:** نقص جداول `WmsTask` و `WmsWaveLine` لربط المنتجات بالموجات بشكل دائم وليس فقط في الذاكرة.
- **Service Pattern:** لا يوجد Service Layer يحترم هيكلة النظام (لا توجد فئة `WmsWavesService` تستخدم `runFinancialTx` أو `runInventoryTx`).
- **Audit Logs:** غائبة تماماً.
- **Idempotency:** غير مطبقة، يمكن توليد نفس الموجة لنفس الطلبات أكثر من مرة.

## 3. Security & Governance Risks (المخاطر الأمنية - هام جداً)
- **🔴 Tenant Isolation Leakage (مخاطر تسريب المستأجرين):**
  - ملف `wave-picking.ts` يقوم بالاستعلام عن `SalesOrder` و `StockMovement` عبر `warehouseId` فقط دون تضمين `tenantId` في شرط الـ `where`. هذا تسريب خطير قد يعرض أوامر وحركات مستأجر لمستأجر آخر!
  - المسار `route.ts` لا يستخدم دالة الأمان `requireTenantId(req)` التي اعتمدناها في المرحلة الأولى.
- **🔴 RBAC:** المسار يكتفي بـ `getUserFromRequest` بدون التحقق من صلاحيات مدير المستودع (مثلاً التحقق من الأدوار).
- **🔴 Direct Prisma Usage:** المحرك يستخدم Prisma مباشرة بطريقة ضعيفة (`db(prisma)`) وبدون Type Safety كامل، ويتجاوز طبقة الحماية.

## 4. Inventory Integrity (تأثير المخزون)
- حالياً، لا تقوم هذه الـ API بتغيير أرصدة المخزون أو إجراء حركات فعلية (فقط Planning و Analysis)، لذا فهي آمنة نسبياً من ناحية الـ (Data Corruption) الخاصة بالمخزون.
- عند بناء إجراءات (Pick/Pack/Ship)، سيصبح من الإلزامي استخدام `runInventoryTx` لضمان عدم حدوث رصيد سالب.

## 5. UI Requirements (متطلبات الواجهة اللاحقة)
لتشغيل شاشة `wms/waves`، ستحتاج الشاشة إلى:
- **Read-only Dashboard:** لعرض `Slotting Analysis` وحالة المستودعات (Velocity).
- **Wave Planning:** شاشة لاختيار طلبات البيع (`Sales Orders`) وتوليد موجة `Create Wave`.
- **Task Assignment:** شاشة لتعيين المهام لعمال المستودع.

## 6. Safe Implementation Plan (خطة التنفيذ الآمنة لإصلاح البنية لاحقاً)
لتفعيل هذه الشاشات في المستقبل القريب بأمان، يجب تنفيذ الخطة التالية (Backend First):
1. **Migration (Additive):** إضافة جدول `WmsTask` مرتبط بـ `WmsWave`، وتوسيع `WmsWave` ليحتوي على علاقة بـ `tenantId`.
2. **Service Refactoring:** التخلص من `WavePickingEngine` واستبداله بـ `wms-waves.service.ts` الذي يستخدم `requireTenantId` وتمرير الـ `tenantId` لكل الاستعلامات إجبارياً.
3. **Route Hardening:** تحديث `route.ts` لاستخدام `requireTenantId` وإضافة Idempotency-Key في حال إنشاء موجات فعلية (POST/Write).
4. **UI Assembly:** بعد تأمين الـ Backend، يتم استبدال `FeatureDisabledPanel` وبناء الـ Client Component الخاص بالموجات.

لا أنصح أبداً بفتح الشاشة في وضعها الحالي نظراً لثغرة الـ Tenant Leakage الخطيرة.
