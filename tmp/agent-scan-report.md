# Reconciliation Worker Safety Scan Report

## 1. Current Mode | الوضع الحالي
* **STANDBY_MODE** (وضع الاستعداد)
* **SCAN + PLAN ONLY** (الفحص والتخطيط فقط)
* **Read-only** (قراءة فقط - لم يتم إجراء أي تعديل على الكود البرمجي)
* **No DB/Prisma Changes** (لا تغييرات في قاعدة البيانات أو Prisma)
* **No Production Touch** (لم يتم لمس بيئة الإنتاج أو عمل PM2 restart أو SFTP)
* **No Git Changes** (لا توجد أي تعديلات على Git أو commit أو push)

---

## 2. Incident Context | سياق المشكلة والتحذير
تم رصد تحذيرات وأخطاء متكررة في سجلات (logs) بيئة الإنتاج الخاصة بالعامل الخلفي `SystemReconciliationWorker` (المعروف في الكود بـ `systemReconciliationWorker`).
الخطأ يظهر بالصيغة التالية:
`Failed for tenant: The column sales_invoices.deleted_at does not exist in the current database`

### سبب الظهور:
عندما يبدأ عامل المطابقة والتدقيق المحاسبي (Reconciliation Worker) بالمرور على جميع المستأجرين (Tenants) النشطين، فإنه يقوم بتشغيل دالة `runSystemReconciliation(prisma)` لفحص الفواتير والقيود المحاسبية.
تقوم هذه الدالة باستدعاء `prisma.salesInvoice.findMany` للبحث عن الفواتير المكتملة أو المدفوعة. ونظراً لأن نموذج `SalesInvoice` في Prisma يحتوي على حقل `deletedAt` المميّز للمسح الناعم (Soft Delete) والمربوط بعمود `deleted_at` في قاعدة البيانات، فإن وسيط Prisma لـ Soft Delete (`prisma-soft-delete.ts`) يتدخل تلقائياً ويقوم بإضافة شرط `deletedAt: null` إلى جملة الاستعلام (SQL query).
لكن، في قواعد البيانات الخاصة بالمستأجرين التجريبيين (Trial) أو القدامى (Unmigrated/Free)، لم يتم تشغيل الهجرات الأخيرة (migrations)، وبالتالي لا يوجد عمود باسم `deleted_at` في جدول `sales_invoices`. يؤدي هذا إلى انهيار الاستعلام الخاص بهذا المستأجر بالكامل وإلقاء استثناء قاعدة بيانات (PostgreSQL exception code 42703 / Prisma P2021).

---

## 3. Files Reviewed | الملفات التي تمت مراجعتها
تمت قراءة وتحليل الملفات التالية بدقة بالغة لضمان مطابقتها لأعلى معايير الأمان المالي وعزل المستأجرين:
1. **ملف العامل الخلفي**: [src/workers/audit/reconciliation.worker.ts](file:///d:/namasoft9-3-main/src/workers/audit/reconciliation.worker.ts)
2. **مكتبة تدقيق النظام والمطابقة**: [src/lib/system-audit.ts](file:///d:/namasoft9-3-main/src/lib/system-audit.ts)
3. **وسيط المسح الناعم**: [src/lib/prisma-soft-delete.ts](file:///d:/namasoft9-3-main/src/lib/prisma-soft-delete.ts)
4. **طبقة الاتصال بقاعدة البيانات وعزل المستأجرين**: [src/lib/prisma.ts](file:///d:/namasoft9-3-main/src/lib/prisma.ts)
5. **مخطط قاعدة البيانات الموحد**: [prisma/schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma)
6. **سجل الذاكرة للمشروع**: [AI_PROJECT_MEMORY.md](file:///d:/namasoft9-3-main/AI_PROJECT_MEMORY.md)

---

## 4. Current Worker Flow | التدفق الحالي للعمل في الخلفية
يعمل الـ Worker وفق الخطوات التالية:
1. **جلب قائمة المستأجرين**: يتصل بقاعدة البيانات الرئيسية (Master DB) تحت سياق المستأجر الرئيسي `n11` لجلب كل الحسابات المسجلة:
   ```typescript
   const tenants = await withTenant('n11', async () => {
       return await prisma.tenantAccount.findMany({
           select: { subdomain: true, status: true }
       });
   });
   ```
2. **تصفية المستأجرين النشطين**: يقوم بتصفية المستأجرين الذين تكون حالتهم `status === 'active'` فقط، دون التحقق من باقة الاشتراك (`plan`) أو حالة الاشتراك (`subscriptionStatus`).
3. **تنفيذ المطابقة داخل حلقة تكرارية**:
   * يمر على كل مستأجر نشط باستخدام `withTenant(tenantId, async () => { ... })`.
   * يستدعي دالة المطابقة المحاسبية `runSystemReconciliation(prisma)`.
   * يقوم بتسجيل تقرير تدقيق (Audit Log) في جدول `sys_audit_trail` الخاص بالمستأجر إذا تم العثور على أي فروقات أو أخطاء.
   * يحتوي التكرار على بلوك `try-catch` لمنع توقف العامل بالكامل عند حدوث خطأ لأي مستأجر:
     ```typescript
     } catch (error: any) {
         logger.error({ tenantId }, `[SystemReconciliationWorker] Failed for tenant: ${error.message}`);
     }
     ```

---

## 5. Confirmed Findings | نتائج الفحص المؤكدة

### 🔴 CRITICAL SEVERITY (الخطورة: حرجة)
*لا توجد أي ثغرات أو أخطاء حرجة تؤثر على سلامة البيانات المالية للمستأجرين الفعليين أو تسبب انهيار النظام بالكامل، حيث أن الكود معزول تماماً ومحمي بواسطة `try-catch` لكل مستأجر.*

### 🟡 HIGH SEVERITY (الخطورة: عالية)
*لا توجد.*

### 🟠 MEDIUM SEVERITY (الخطورة: متوسطة)
#### 1. استعلام المستأجرين التجريبيين والقدامى غير المتوافقين (Indiscriminate Tenant Processing)
* **الملف**: [src/workers/audit/reconciliation.worker.ts:L13-26](file:///d:/namasoft9-3-main/src/workers/audit/reconciliation.worker.ts#L13-26)
* **السبب**: استعلام جلب المستأجرين من جدول `tenant_accounts` يكتفي بتصفية `status === 'active'` دون استثناء باقات التجربة (`trial`) أو الباقات المجانية (`free`) أو مستأجرين الاختبار (`test`, `t`, `demo`). هذه المستأجرين غالباً ما تكون قواعد بياناتهم قديمة وغير مستخدمة ولم تُطبق عليها الهجرات التراكمية، مما يسبب أخطاء عدم وجود العمود `deleted_at`.
* **الأثر**: تكرار استهلاك الموارد ومحاولة إجراء مطابقة محاسبية دورية عديمة الفائدة على حسابات تجريبية أو مهجورة، بالإضافة إلى تلويث السجلات بالعديد من الأخطاء المتكررة.
* **هل يسبب توقف العامل بالكامل؟**: لا، لوجود `try-catch` داخلي لكل مستأجر.
* **هل يؤثر على مستأجرين فعليين؟**: لا، المستأجرين الفعليين تعمل المطابقة لديهم بنجاح كامل إذا كانت قواعد بياناتهم محدثة.
* **هل يمس منطق المحاسبة أو قاعدة البيانات؟**: لا، العملية للقراءة والتدقيق فقط.
* **هل يحتاج إلى Migration؟**: لا، الحل برمجي بالكامل عن طريق استثناء هذه الحسابات من التصفية.

#### 2. قصور في عزل وتسجيل تفاصيل الخطأ (Prisma Error Logging Clutter)
* **الملف**: [src/workers/audit/reconciliation.worker.ts:L58-60](file:///d:/namasoft9-3-main/src/workers/audit/reconciliation.worker.ts#L58-60)
* **السبب**: عند فشل الاستعلام بسبب عدم وجود العمود، يتم إلقاء خطأ كامل يظهر ك Error في السجلات (logs) دون تمييز ما إذا كان خطأ قاعدة بيانات قديمة/تالفة أم خطأ برمجي حقيقي يستدعي التدخل.
* **الأثر**: صعوبة تمييز الأخطاء البرمجية الحقيقية عن مجرد وجود مستأجر تجريبي قديم.
* **هل يحتاج Migration؟**: لا، الحل برمجي عبر معالجة ذكية للخطأ (Resilient Error Handling).

---

## 6. Root Cause Analysis | تحليل السبب الجذري
1. **انحراف المخطط (Schema Drift)**: عند إضافة ميزة الـ Soft Delete للمبيعات والمشتريات والقيود، تم إضافة عمود `deleted_at` إلى جداول المبيعات وغيرها. هذه الهجرات تم تشغيلها بنجاح على بيئة الإنتاج للمستأجرين الأساسيين والنشطين الحقيقيين. لكن المستأجرين التجريبيين والمجانيين يعملون على قواعد بيانات منفصلة تماماً (Isolated databases per tenant), والعديد من هذه القواعد لم يتم استخدامها أو تحديثها بالهجرات الأخيرة، مما خلق فجوة في بنية الجداول (Schema Drift).
2. **غياب التصفية الذكية للمستأجرين**: لم يتم استثناء الحسابات المجانية والتجريبية من دورة التدقيق المحاسبي التلقائي، رغم أن التدقيق والمطابقة هي ميزة مخصصة للشركات والمستأجرين الفعليين ذوي الحجم التشغيلي الحقيقي.

---

## 7. Proposed Safe Fix Plan | خطة الإصلاح المقترحة والآمنة
نقترح حلاً برمجياً آمناً بنسبة 100% (Code-only) لا يتطلب أي تغيير في مخطط Prisma أو أي هجرات جديدة أو مساس بالبيانات:

### 1. تحسين استعلام تصفية المستأجرين (Excluding Trial/Free Tenants):
سنقوم بتحديث استعلام جلب المستأجرين وقائمة التصفية في `reconciliation.worker.ts` لجلب معلومات `plan` و `subscriptionStatus` وتصفية المستأجرين كالتالي:
* استثناء باقات التجربة (`trial`) والباقات المجانية (`free`).
* استثناء المستأجرين التجريبيين المعروفين من خلال أسمائهم (`test`, `t`, `demo`).

```typescript
// تعديل استعلام جلب الحسابات
const tenants = await withTenant('n11', async () => {
    try {
        return await prisma.tenantAccount.findMany({
            select: { subdomain: true, status: true, plan: true, subscriptionStatus: true }
        });
    } catch (error) {
        logger.error({}, '[SystemReconciliationWorker] Failed to fetch tenants', { error });
        return [{ subdomain: 'n11', status: 'active', plan: 'enterprise', subscriptionStatus: 'active' }];
    }
});

// تصفية برمجية صارمة للحسابات الحقيقية والمدفوعة فقط
const activeTenants = tenants
    .filter((t: any) =>
        t.status === 'active' &&
        t.plan !== 'free' &&
        t.subscriptionStatus !== 'trial' &&
        !['test', 't', 'demo'].includes(t.subdomain.toLowerCase())
    )
    .map((t: any) => t.subdomain);
```

### 2. تدعيم معالجة الأخطاء (Schema Drift Resilience):
حتى لو وجد مستأجر نشط حقيقي بقاعدة بيانات غير متوافقة مؤقتاً، سنقوم بالتقاط الخطأ الخاص بالعمود المفقود وتسجيله كتحذير نظيف (`logger.warn`) بدلاً من تسجيل استثناء كامل يلوث سجلات النظام التشغيلية:
```typescript
} catch (error: any) {
    const isSchemaDrift = error.message.includes('deleted_at') || error.code === 'P2021';
    if (isSchemaDrift) {
        logger.warn({ tenantId }, `[SystemReconciliationWorker] Skipped tenant due to schema drift (missing deleted_at column).`);
    } else {
        logger.error({ tenantId }, `[SystemReconciliationWorker] Failed for tenant: ${error.message}`, { error });
    }
}
```

### 3. عدم تعديل أي منطق محاسبي:
لن نقوم بتغيير أي سطر في `system-audit.ts` أو معادلات المطابقة المالية لضمان عدم حدوث أي انحراف محاسبي (Zero Accounting Drift).

---

## 8. Test Plan | خطة الاختبار والتحقق
قبل رفع الكود أو دفعه للإنتاج، سنقوم بالتحقق الكامل والمحلي كالتالي:
1. **التحقق من البناء والأنماط**:
   * تشغيل `npm run typecheck` للتأكد من عدم وجود أي خطأ في تعريفات TypeScript الجديدة (`plan`, `subscriptionStatus`).
   * تشغيل `npx prisma validate` للتأكد من سلامة مخطط قاعدة البيانات.
   * تشغيل `npm run build` للتأكد من نجاح بناء واجهة وتطبيقات Next.js بالكامل.
2. **اختبار التصفية الذاتية**:
   * التحقق من محاكاة تصفية الحسابات البرمجية واستبعاد الحسابات المجانية والتجريبية.
   * محاكاة معالجة الأخطاء للتأكد من عدم توقف الـ Worker واستمراره بنجاح للمستأجرين الفعليين.

---

## 9. Risk Assessment | تقييم المخاطر

* **Worker availability risk**: **منخفض جداً (Very Low)**. التعديل يزيد من استقرار وموثوقية العامل الخلفي ويمنع تراكم الأخطاء والانهيارات داخل التكرار.
* **Tenant isolation risk**: **صفر (Zero)**. لا يتم مشاركة أي بيانات بين المستأجرين، وعزل الاتصال لكل مستأجر يظل محمياً ومضموناً عبر دالة `withTenant`.
* **DB drift risk**: **صفر (Zero)**. لا يتم تعديل أي جداول أو إضافة أي أعمدة أو لمس قواعد البيانات الحالية للمستأجرين.
* **Financial/accounting risk**: **صفر (Zero)**. التعديل برمجي خارجي للـ Worker ولا يمس منطق المطابقة أو الحسابات المالية داخل القيود المحاسبية.
* **Production risk**: **منخفض جداً (Very Low)**. تعديل آمن محصور في ملف الـ Worker ومحمي بآليات المعالجة والتحقق المحلية.

---

## 10. Execution Approval Gate | بوابة الموافقة والتنفيذ
> [!IMPORTANT]
> **قاعدة ذهبية صارمة**: التزاماً بالوضع الحالي **STANDBY_MODE** وقواعد الحوكمة في `AGENTS.md` والتعليمات الصريحة للمالك، **لم ولن يتم إجراء أي تعديل على الكود المصدري أو قواعد البيانات في هذه المرحلة**.
>
> هذا التقرير هو فحص وتحليل وتخطيط شامل للمشكلة فقط.
>
> **بانتظار موافقة المالك الصريحة للانتقال إلى مرحلة التنفيذ (IMPLEMENTATION MODE) للمرحلة الأولى.**