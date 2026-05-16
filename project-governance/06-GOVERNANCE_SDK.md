# Nama Invest ERP - Governance SDK Architecture

## 1. Vision: Policy-Driven ERP
تم تصميم **Governance SDK** ليكون الدرع الدفاعي الأول والأخير للنظام المالي والتشغيلي المتعدد الشركات (Multi-Tenant). الهدف الأساسي هو تحويل النظام من الاعتماد على "انضباط المطور" (Developer-discipline) إلى "نظام تقوده السياسات" (Policy-driven ERP).

لن يُسمح بمرور أي عملية مالية، أو تعديل في المخزون، أو اتصال بخدمات خارجية، أو وصول للبيانات دون المرور عبر بوابات `assert` صارمة. 

## 2. Core Pillars (الأعمدة الرئيسية)

### A. Tenant Isolation Engine
كل طلب يجب أن يخضع لفحص الـ Tenant قبل وصوله لقاعدة البيانات.
- `assertTenant(tenantId)`: التأكد من وجود السياق.
- `requireTenantFilter(whereClause)`: إضافة حقن تلقائي لـ `tenantId` في استعلامات Prisma لمنع أي Leakage عرضي للبيانات.
- `assertCrossTenantSafety(entities)`: منع دمج بيانات من Tenant A في معاملة تخص Tenant B.

### B. Financial Atomicity (الذرية المالية)
أي عملية تمس الحسابات المالية، القيود، أو الأرصدة، يجب أن تكون مغلفة:
- `assertFinancialTx(tx)`: التأكد من أن العملية تجري داخل `Prisma Transaction` من نوع Serialized/Read-Committed.
- `assertGLBalance(debit, credit)`: التحقق من توازن القيد المحاسبي قبل تسجيله في قاعدة البيانات.

### C. Inventory Governance (حوكمة المخزون)
- `assertInventoryTx(tx)`: لا يمكن تعديل المخزون مباشرة، يجب استخدام `InventoryService.adjustStock` ليتم تسجيل أثر الحركة وتكلفتها آلياً.
- `assertCostMethod(productId)`: التأكد من احتساب التكلفة الصحيحة بناءً على الـ Moving Average.

### D. Request Idempotency
- `assertIdempotency(tenantId, actionKey, headerKey)`: منع تنفيذ أي طلب مرتين مهما حدث من انقطاع شبكة أو إعادة محاولة (Retries) غير مقصودة.

### E. Webhook Governance
- `assertWebhookSignature(provider, payload, signature)`: توثيق أمان الـ Webhooks الواردة من (Salla, Zid, Telegram) ومنع عمليات الـ Spoofing.
- `enqueueWebhookEvent(payload)`: تحويل الـ Webhooks لـ Async Queue لمنع توقف النظام عند ضغط الـ API.

## 3. The Implementation Strategy
سيتم تحويل هذه السياسات إلى مكتبة مستقلة (Library) داخل `src/lib/governance/` بحيث تكون الاستدعاءات إلزامية عبر نظام `ESLint Rule` مخصص إن أمكن، لضمان عدم تجاوز أي مطور لهذه القواعد مستقبلاً.

## 4. Phase 1 Execution Plan (Next Sprint)
1. مراجعة وتعديل 387 ملف محتمل لتسريب البيانات (Tenant Leakage).
2. تطبيق `requireTenantFilter` على 100% من استعلامات الـ GET.
3. هندسة طبقة الـ `Webhook Governance`.
