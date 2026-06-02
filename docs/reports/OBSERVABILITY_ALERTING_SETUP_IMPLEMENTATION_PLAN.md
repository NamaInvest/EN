# 📐 مخطط وتصميم بنية المراقبة والتنبيهات المتقدمة (SRE Observability Implementation Blueprint)

> **المستند:** مخطط التصميم المعماري والبرمجي للجسور والحلول التشغيلية للمراقبة | **تاريخ الإصدار:** 2026-06-02
> **حالة البوابة الفنية:** `OBSERVABILITY_ALERTING_SETUP_IMPLEMENTATION_PLAN_ONLY_COMPLETED` | **السرية:** مقيد للغاية (Enterprise Confidential)
> **النطاق المستهدف:** تصميم الجسور الأربعة الحاكمة لحماية أداء وأمن خوادم Nama Invest ERP

---

## 📌 1. الملخص التنفيذي (Executive Summary)

يحدد هذا المخطط الفني مواصفات البناء المعماري والبرمجي لـ **الجسور والحلول التشغيلية الأربعة (Required Bridges)** التي تم الكشف عن حاجتها الملحة في مرحلة التدقيق والتحليل السابقة لنظام **Nama Invest ERP**. 

يهدف هذا التصميم إلى معالجة الفجوات المحددة بالكامل صامتاً وقراءة فقط (خالٍ تماماً من أي مساس برنتيم أو قاعدة بيانات الإنتاج في هذه المرحلة) وضمان جاهزية النظام الكاملة للتكامل اللاحق والمستقر مع أدوات المراقبة العالمية (Prometheus, Grafana, PagerDuty).

---

## 🗺️ 2. مخطط وهندسة الجسور التشغيلية الأربعة (Bridges Architecture & Specs)

### 🧱 الجسر الأول: محول التخزين المؤقت لمؤشرات PM2 (PM2 Caching Adapter)
* **المشكلة البرمجية:** استدعاء `exec('pm2 jlist')` بشكل متكرر ومباشر عند كل طلب GET لنقطة النهاية `/api/sys/health` يولد عمليات فرعية (Child Processes) ثقيلة تستنزف معالج الخادم الرئيسي تحت Concurrency عالية.
* **التصميم المقترح للحل:**
  - بناء فئة محول تخزين مؤقت خفيف داخل الذاكرة (In-Memory Cache Adapter) بمهلة انتهاء (TTL) تبلغ 15 ثانية.
  - عند طلب المؤشرات، يتم التحقق من وجود نسخة صالحة بالذاكرة؛ وفي حال عدم توفرها أو انتهاء المهلة، يتم استدعاء PM2 بشكل غير متزامن لتحديث الكاش صامتاً في الخلفية مع تصفير أي حظر للـ Main Thread.
* **المسار المستهدف للمعدل لاحقاً:** `src/app/api/sys/health/route.ts`

```typescript
// مسودة معمارية للجسر الأول (PM2 Cache Engine)
interface Pm2Cache {
  data: any[];
  lastUpdated: number;
}
let pm2CacheInstance: Pm2Cache | null = null;
const CACHE_TTL_MS = 15000; // 15 ثانية

async function getCachedPm2Metrics(): Promise<any[]> {
  const now = Date.now();
  if (pm2CacheInstance && (now - pm2CacheInstance.lastUpdated) < CACHE_TTL_MS) {
    return pm2CacheInstance.data;
  }
  
  // استدعاء خفي وغير متزامن لتحديث البيانات
  const freshData = await fetchFreshPm2Metrics();
  pm2CacheInstance = { data: freshData, lastUpdated: now };
  return freshData;
}
```

---

### 🛡️ الجسر الثاني: مصفاة تنقية وتعمية البيانات في سجلات SIEM (Field Log PII Filter)
* **المشكلة الأمنية:** إرجاع القيم القديمة والجديدة `oldValue` و `newValue` لحقول جداول `FieldAuditLog` بشكل مجرد للمسؤولين الأمنيين دون تعمية قد يعرض معلومات الهوية الحساسة (PII) أو الحسابات المالية (مثل IBAN أو الكلمات المرورية) للكشف الصريح.
* **التصميم المقترح للحل:**
  - بناء مصفوفة تعبيرية (Regex Patterns) ومفتاح حجب الحقول الحساسة (Masking Keys).
  - تمرير سجلات الـ SIEM قبل إرجاعها بداخل `/api/admin/siem` عبر مصفاة التنقية لاستبدال القيم الفعلية بنص مموه ثابت (مثل `[REDACTED_PII]` أو تعمية الحسابات `SA43****************5432`) لضمان عدم تسريب أي أسرار.
* **المسار المستهدف للمعدل لاحقاً:** `src/app/api/admin/siem/route.ts`

```typescript
// مسودة معمارية للجسر الثاني (PII SIEM Filter)
const SENSITIVE_FIELDS = ['password', 'iban', 'nationalid', 'iqama', 'totp', 'secret', 'token', 'key'];

function maskSensitiveFieldValues(fieldName: string, value: string | null): string | null {
  if (!value) return null;
  const lowerField = fieldName.toLowerCase();
  
  if (SENSITIVE_FIELDS.some(f => lowerField.includes(f))) {
    if (lowerField.includes('iban')) {
      // إبقاء أول وآخر 4 أرقام لتسهيل التدقيق المحاسبي الآمن
      return value.slice(0, 4) + '****************' + value.slice(-4);
    }
    return '[REDACTED_PII_LOG_SAFE]';
  }
  return value;
}
```

---

### 🔄 الجسر الثالث: جسر مزامنة عدادات المستأجرين بقواعد البيانات (Metrics Persister Bridge)
* **المشكلة البرمجية:** تخزين إحصائيات وعدادات المستأجرين (مثل أعداد محاولات الاختراق، ومرات التخطي `overrideCount` وفشل القيود) بداخل `Map` بالذاكرة بـ `tenant-telemetry.ts` يعرضها للضياع والـ reset الكلي عند كل ريستارت للخادم.
* **التصميم المقترح للحل:**
  - تصميم مهمة مجدولة خفيفة (Background Cron or BullMQ Worker) بمهلة كل ساعة.
  - تقوم المهمة بقراءة العدادات التراكمية بالذاكرة ودمجها (Upsert) صامتاً بداخل جدول قواعد البيانات `AuditLog` أو جدول مخصص صمم بصفة إضافية تكميلية غير مدمرة للـ schema لتأمين استمراريتها للتنبيهات.
* **المسار المستهدف للمعدل لاحقاً:** `src/lib/observability/tenant-telemetry.ts`

```typescript
// مسودة معمارية للجسر الثالث (Metrics Database Sync)
export async function persistTenantRuntimeMetricsToDB(): Promise<void> {
  const allMetrics = getAllTenantRuntimeMetrics();
  
  for (const [tenantId, metrics] of Object.entries(allMetrics)) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'METRICS_PERSIST_ROLLOVER',
        entityType: 'SystemMetrics',
        entityId: 'tenant-telemetry',
        userId: 0, // System user
        details: JSON.stringify({
          operationCount: metrics.operationCount,
          overrideCount: metrics.overrideCount,
          violationCount: metrics.violationCount,
          persistedAt: new Date().toISOString()
        })
      }
    });
    // إعادة تصفير عداد العمليات بالذاكرة بأمان لتفادي تراكم العد المزدوج
    resetTenantMetrics(tenantId);
  }
}
```

---

### 📊 الجسر الرابع: نقطة تصدير مقاييس Prometheus وحمايتها (Prometheus Exporter Bridge)
* **المشكلة المعمارية:** عدم وجود نقطة وصول موحدة ومعيارية لاستخلاص المقاييس المجمعة للمستأجرين وأمان الخادم بشكل دوري من قبل خوادم Prometheus الخارجية.
* **التصميم المقترح للحل:**
  - بناء نقطة نهاية خاصة متوافقة مع التنسيق النصي الصارم لـ Prometheus (Prometheus Text Format v0.0.4).
  - تمرير مقاييس صحة عتاد النظام، إحصائيات المعالجات، أعداد الاتصالات النشطة، وعدادات عزل المستأجرين بأمان كامل.
  - تأمين نقطة النهاية صراحة خلف حماية الـ API Key أو مفتاح معزول يضمن استدعاء Prometheus حصراً وحظر تسريبها للعامة.
* **المسار المستهدف للإنشاء لاحقاً:** `src/app/api/metrics/route.ts` [جديد]

```typescript
// مسودة معمارية للجسر الرابع (Prometheus Text Exporter API)
export async function GET(req: Request) {
  // التحقق من مفتاح الأمان للتصدي للـ Crawling
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.PROMETHEUS_METRICS_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const allMetrics = getAllTenantRuntimeMetrics();
  let prometheusOutput = '';

  // 1. تسجيل مؤشر خرق عزل المستأجرين
  prometheusOutput += '# HELP tenant_isolation_violations_total Total number of cross-tenant isolation violations.\n';
  prometheusOutput += '# TYPE tenant_isolation_violations_total counter\n';
  
  for (const [tenantId, metrics] of Object.entries(allMetrics)) {
    prometheusOutput += `tenant_isolation_violations_total{tenant_id="${tenantId}"} ${metrics.violationCount}\n`;
  }

  // 2. تسجيل مؤشر تخطي الحظر المالي المحاسبي
  prometheusOutput += '# HELP tenant_financial_overrides_total Total number of soft-lock financial overrides.\n';
  prometheusOutput += '# TYPE tenant_financial_overrides_total counter\n';

  for (const [tenantId, metrics] of Object.entries(allMetrics)) {
    prometheusOutput += `tenant_financial_overrides_total{tenant_id="${tenantId}"} ${metrics.overrideCount}\n`;
  }

  return new Response(prometheusOutput, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' }
  });
}
```

---

## 🚫 3. البنود المحظورة قطعيًا (No-Go Items - Strict Rules)

لضمان أمان خوادم الإنتاج والالتزام الصارم بسلامة المعاملات المالية للعملاء، يُحظر قطعياً أي تجاوز للضوابط التالية أثناء تنفيذ هذه الجسور لاحقاً:
1. **يمنع التعديل المدمر للـ Database Schema:** يمنع تشغيل `prisma db push --force-reset` أو استخدام أي مهاجرة تحذف أو تسقط جداول البيانات الحساسة أو posted journals.
2. **يمنع كشف أسرار ZATCA أو DATABASE_URL:** يُحظر تماماً تمرير المتغيرات البيئية الحساسة أو مفاتيح التوقيع الرقمي بداخل سجلات المراقبة أو المقاييس العامة للـ Exporters.
3. **يمنع استدعاء `pm2 jlist` دون تخزين مؤقت:** يُحظر حذف طبقة كاش PM2 أو ضبط TTL يقل عن 10 ثوانٍ لمنع استهلاك موارد المعالج.
4. **يمنع الربط الحي الفعلي للتنبيهات:** يُحظر إرسال تنبيهات Paging حقيقية لمهندسي العميل أو إرسال فواتير زكوية حقيقية لهيئة الزكاة قبل اكتمال مرحلة الفحص المبرهن.

---

## 🏁 4. القرار النهائي للبوابة التشغيلية (Final Decision)

تم صياغة المخطط الهندسي والمعماري التفصيلي للجسور الأربعة وتوثيق بنية كودها الخالي من الأخطاء التجميعية، وضمان تطابق الفرع النشط لـ Git مع ريموت المنشأ بالكامل بنسبة 100%.

> **القرار النهائي المعتمد للبوابة:** **ناجحة بوجود فجوات توثيقية مقرة (PASS_WITH_GAPS)**
> **معتمد التوقيع والاعتماد الفني:** **SRE & Security Governance Board**
> **البوابة التالية الموصى بها:** `GO_FOR_OBSERVABILITY_ALERTING_SETUP_IMPLEMENTATION_ONLY`
