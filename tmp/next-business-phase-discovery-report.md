# تقرير اكتشاف المرحلة التجارية التالية (Next Business Phase Discovery Report) - Phase 2

## 1. تقييم الحالة والبحث الفني (Current State Assessment)
بعد فحص الذاكرة الأساسية `AI_PROJECT_MEMORY.md` وملفات الديون والمخاطر التقنية `KNOWN_RISKS_AND_TECH_DEBT.md` وسجلات المستودع:

* **آخر مرحلة مكتملة (Last Completed Phase)**: تحسين حد الطلبات للـ APIs في الـ Middleware ونشرها بنجاح (Commit: `01e6f9bad`).
* **الثغرات والعيوب المكتشفة في الكود التشغيلي**:
  * يحتوي محرك التصنيع والمخازن `MaterialIssuanceEngine` في الملف `src/lib/material-issuance.ts` على عيبين فادحين:
    1. **خرق عزل المستأجرين (Tenant Isolation Vulnerability)**: الدالة `executeBackflushing` والدالة `generatePicklist` تستعلمان وتحدثان المخزون وأوامر التصنيع دون تصفية أو فحص `tenantId` المالك، مما يسمح لأي مستخدم بتعديل أو سحب مخازن مستأجرين آخرين بمجرد توفر معرف MO.
    2. **إنشاء PrismaClient مباشر**: السطر 6 ينشئ `new PrismaClient()` وهو ما يخالف صراحة القواعد المعيارية المعززة في `AGENTS.md`.
    3. **غياب متانة التزامن (Missing Concurrency/Idempotency Guard)**: لا يوجد حارس يمنع تكرار سحب المواد الخام وخصم المخازن في حال تكرر طلب الاستدعاء لنفس المعاملة بسبب انقطاع الشبكة (Double Deducting Risk).

## 2. تحديد المرحلة التالية المقترحة (Selected Phase)
المرحلة المختارة هي: **تأمين وحماية عزل المستأجرين ومنع التكرار لمحرك التصنيع (Concurrent Manufacturing Backflushing & Tenant Isolation Hardening)**.

* **الدومين المتأثر (Domain)**: التصنيع والمخازن (Manufacturing & Inventory).
* **درجة الأهمية والخطورة (Severity)**: **حرجة جداً وأمنية (CRITICAL SECURITY)** لخرق عزل المستأجرين.
* **الأهداف التشغيلية للمرحلة**:
  1. إزالة إنشاء `new PrismaClient()` من الملف بالكامل وتمرير سياق `prisma` المشترك كمعامل للدوال.
  2. فرض فحص وتصفية `tenantId` بشكل إلزامي على جميع الاستعلامات وعمليات التحديث وحركات المخازن.
  3. إضافة نظام فحص يمنع تكرار خصم المخزون لنفس كميات أمر التصنيع المحددة (Idempotency Guard).

## 3. قرار الانتقال للمرحلة التالية (Phase Transition Decision)
* **النتيجة**: المرحلة التالية واضحة ومحددة أمنياً وتشغيلياً.
* **القرار**: الانتقال تلقائياً إلى الفحص التفصيلي والتخطيط (Phase 3 - Scan & Plan).
