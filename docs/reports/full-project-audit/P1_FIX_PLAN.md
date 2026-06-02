# P1 REMEDIATION AND FIX PLAN
# خطة الإصلاح والمعالجة للمشاكل عالية الخطورة (P1 Fix Plan)

---

> **TRACK ID**: `ENTERPRISE_GAP_ANALYSIS_TRACK`
> **GATE STATE**: `GO_FOR_P1_FIX_APPROVAL_ONLY` (Remediation Plan Gate)
> **COMPLIANCE LEVEL**: Planning & architecture design only. Strictly zero runtime code execution.

---

يقدم هذا التقرير خطة فنية وهندسية تفصيلية لمعالجة المشاكل الثلاث المصنفة كـ **P1 High** في نظام **Nama Invest ERP**، تمهيداً لعرضها على مسؤولي التقنية للاعتماد والموافقة البرمجية قبل أي تنفيذ:

## 1. Remediation Scope / نطاق المعالجة الفنية

تشمل الخطة تصميم الحلول الهندسية للمشاكل المحورية الثلاث:
1. **ISS-01**: تأمين وعزل المستأجرين في الكرونات الخلفية وسكربتات التنظيف الدورية.
2. **ISS-02**: فرض بروتوكول التوقيع الثنائي (Dual-Officer Approval) لاسترداد الـ MFA.
3. **ISS-03**: منع وتجنب حركات الجرد وتسويات المخازن بأثر رجعي في الفترات المالية المقفلة.

---

## 2. Technical Design of Remediations / التصميم الفني للحلول

### 🛠️ حل ISS-01: عزل الكرونات والمهام الخلفية (Sub-system Isolation)
* **المستهدف**: تعديل `src/scripts/cron-cleanup.ts` و نهايات الكرون `/api/admin/cron` لضمان عدم إجراء أي استعلام كلي أو حذف دون بادئة المستأجر.
* **التصميم الهندسي**:
  - جلب قائمة المستأجرين النشطين أولاً عبر جدول المستأجرين `Tenant`.
  - معالجة طوابير التنظيف والـ items بشكل دوري مقسم بداخل حلقة دائرية تمرر الـ `tenantId` لكل مستأجر على حدة.
  - نموذج الكود المقترح:
    ```typescript
    const activeTenants = await prisma.tenant.findMany({ where: { active: true } });
    for (const tenant of activeTenants) {
      await prisma.mfaUsedToken.deleteMany({
        where: {
          tenantId: tenant.id,
          expiresAt: { lt: new Date() }
        }
      });
    }
    ```

---

### 🛠️ حل ISS-02: التوقيع الثنائي لاعتماد استرداد الـ MFA (Dual-Officer Approval)
* **المستهدف**: ترقية شاشة واعتماد استرداد الـ MFA بداخل نهايات `/api/admin/mfa/recovery` ليتطلب توقيع مسؤولين اثنين مختلفين قبل السماح بإعادة تعيين مفاتيح المستخدم.
* **التصميم الهندسي**:
  - تعديل مخطط `MfaRecoveryRequest` ليتضمن حقول تسجيل المشرف الأول `officer1Id` وتوقيعه، والمشرف الثاني `officer2Id` وتوقيعه.
  - عند محاولة التفعيل، يوقع المشرف الأول وتبقى حالة الطلب `PENDING_SECOND_OFFICER` ولا يتم تحويلها إلى `APPROVED` وإعادة توليد المفاتيح إلا بعد توقيع المشرف الثاني (والذي يجب ألا يتطابق مع معرف المشرف الأول).
  - نموذج الكود المقترح:
    ```typescript
    if (request.status === 'PENDING') {
      await prisma.mfaRecoveryRequest.update({
        where: { id: requestId },
        data: { status: 'PENDING_SECOND_OFFICER', officer1Id: session.userId }
      });
    } else if (request.status === 'PENDING_SECOND_OFFICER' && request.officer1Id !== session.userId) {
      await prisma.mfaRecoveryRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', officer2Id: session.userId, newSecretGenerated: true }
      });
      // Trigger actual MFA reset logic here safely
    }
    ```

---

### 🛠️ حل ISS-03: حظر التسويات المخزنية بأثر رجعي في الفترات المقفلة (Fiscal Lock Guard)
* **المستهدف**: إخضاع نهايات ترحيل فروقات الجرد والتسوية المخزنية `/api/inventory/stocktake` لفحص إلزامي يطابق تاريخ ترحيل الحركة مع حالة الفترة المالية.
* **التصميم الهندسي**:
  - دمج دالة الحماية `checkFiscalPeriodOpen(date, tenantId)` بداخل الطبقة الخدمية للمستودعات.
  - استعلام فوري من جدول الفترات `FiscalPeriod` للتحقق من أن الفترة التي ينتمي إليها تاريخ الحركة مفتوحة (`status == 'OPEN'`).
  - نموذج الكود المقترح:
    ```typescript
    const isPeriodOpen = await checkFiscalPeriodOpen(adjustmentDate, tenantId);
    if (!isPeriodOpen) {
      throw new Error("❌ TRANSACTION_BLOCKED: The fiscal period for this date is CLOSED or locked.");
    }
    ```

---

## 3. Next Step / التوقف والاستيقاف الاستراتيجي الحاكم

بموجب الحوكمة الصارمة وقواعد الـ Autopilot الآمن:
* **حالة الالتزام الحالية**: يتم تسجيل الخطة الحالية توثيقياً في المستودع تمهيداً لعرضها على CTO وبورد الحوكمة للمشروع.
* **الموقف الحالي**:
  ```text
  STATUS: GO_FOR_P1_FIX_APPROVAL_ONLY
  REMEDIATION: P1_REMEDIATION_PLAN_ESTABLISHED
  RUNTIME: UNTOUCHED (Zero actual code modifications applied)
  ```
* **البوابة التالية**: الاستيقاف وحظر أي تعديل تشغيلي للإنتاج لحين صدور الموافقة الخطية الصريحة على خطة الإصلاح P1:
  `GO_FOR_P1_FIX_APPROVAL_ONLY`
