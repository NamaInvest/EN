# Operational Monitoring Guide
**Phase 9.4 — Enterprise Operations Layer**
**Last Updated:** 2026-05-18

---

## 1. نظرة عامة

دليل المراقبة التشغيلية لـ Nama Invest ERP. يغطي:
- كيفية قراءة health reports
- ماذا تعني المؤشرات
- كيف تستجيب لكل سيناريو
- الأدوات المتاحة

---

## 2. مؤشرات الصحة التشغيلية

### 2.1 Outbox Health

| الحالة | المعنى | الإجراء |
|--------|---------|---------|
| `HEALTHY` | لا يوجد failed/stuck events | لا شيء |
| `DEGRADED` | يوجد failed events (attempts < 5) | راجع logs، تحقق من أسباب الفشل |
| `CRITICAL` | exceeded retry limit أو stuck events > 5 | تدخل فوري — راجع outbox processor |

**طريقة الاستعلام:**
```typescript
const report = await OperationalDiagnostics.run(prisma, tenantId);
console.log(report.outbox.status);
console.log(report.outbox.recentFailedEventTypes);
console.log(report.outbox.stuckEventCount);
```

**Stuck Event Definition:**
حدث في حالة `PROCESSING` لأكثر من 30 دقيقة → غالباً worker crash أو database timeout.

### 2.2 Override Frequency

| الحد | التفسير |
|------|---------|
| 0-2 per 30 days | طبيعي |
| 3-10 per 30 days | مرتفع — يحتاج مراجعة CFO |
| > 10 per 30 days | إشارة خطر — audit جرائي مطلوب |

**استعلام overrides:**
```typescript
const report = await OperationalDiagnostics.run(prisma, tenantId);
report.overrides.overridesByModule;   // { accounting: 3, treasury: 1 }
report.overrides.overridesByActor;    // { 'user:5': 4 }
report.overrides.recentOverrides;     // آخر 10 override events
```

### 2.3 Period Lock Violations

| الحد | التفسير |
|------|---------|
| 0-3 per 7 days | طبيعي (user errors) |
| > 3 per 7 days | مشكلة في workflow — تدريب مطلوب |
| > 10 per 7 days | كسر محتمل في business logic |

### 2.4 Health Score

```
100    ─── Fully Healthy
 90    ─── Minor issues (monitor)
 75    ─── Degraded (investigate)
 50    ─── Serious (intervention needed)
  0    ─── Critical (stop & fix)
```

---

## 3. Diagnostic API Usage

### جلب التقرير الكامل

```typescript
import { OperationalDiagnostics } from '@/lib/observability/diagnostics';
import { prisma } from '@/lib/prisma';

// يجب أن يكون tenantId صريحاً — ممنوع 'default'
const report = await OperationalDiagnostics.run(prisma, tenantId);

console.log({
  healthScore: report.healthScore,
  criticalIssues: report.criticalIssues,
  outboxStatus: report.outbox.status,
  overridesLast30Days: report.overrides.totalOverridesLast30Days,
  rejectedAttempts7Days: report.periodLocks.rejectedAttemptsLast7Days,
});
```

### جلب Runtime Metrics للتينانت

```typescript
import { getTenantRuntimeMetrics } from '@/lib/observability/tenant-telemetry';

const metrics = getTenantRuntimeMetrics(tenantId);
// { operationCount, overrideCount, violationCount, lastActivity }
```

---

## 4. سيناريوهات الاستجابة

### سيناريو 1: Outbox CRITICAL

**الأعراض:**
- `report.outbox.status === 'CRITICAL'`
- `report.outbox.diagnostics.exceededRetryLimitCount > 0`

**الإجراءات:**
1. راجع logs للـ failed event types
2. تحقق من Redis connection (BullMQ)
3. تحقق من ZATCA API availability إذا `ZATCA_REPORT_JOB` في الفشل
4. Manual retry إذا الخطأ transient:
   ```sql
   UPDATE "OutboxEvent" SET status = 'PENDING', attempts = 0
   WHERE "tenantId" = 'xxx' AND status = 'FAILED' AND "eventType" = 'ZATCA_REPORT_JOB';
   ```
   ⚠️ **يتطلب موافقة قبل التنفيذ**

### سيناريو 2: Override Rate Spike

**الأعراض:**
- `report.overrides.totalOverridesLast30Days > 10`
- `report.criticalIssues` يحتوي على "High override frequency"

**الإجراءات:**
1. راجع `report.overrides.overridesByActor` — من يستخدم override؟
2. راجع `report.overrides.recentOverrides` — ما الأسباب؟
3. هل هناك فترة يجب فتحها؟
4. هل هناك موظف يسيء استخدام الصلاحية؟

### سيناريو 3: Tenant Isolation Violation

**الأعراض:**
- سجل يحتوي على `"violationType": "CROSS_TENANT_ACCESS"`
- `metrics.violationCount > 0`

**الإجراءات:**
1. 🚨 **هذا CRITICAL SECURITY INCIDENT**
2. احتجز الـ requestId من السجل
3. تتبع كل العمليات بنفس الـ requestId
4. تحديد إذا تم وصول فعلي لبيانات tenant آخر
5. إبلاغ فوري للـ security team

---

## 5. Log Monitoring Queries

### فلترة السجلات المالية

```bash
# جميع العمليات المالية لـ tenant معين
grep '"financialImpact":true' app.log | grep '"tenantId":"tenant-xyz"'

# جميع الـ overrides
grep '"overrideUsed":true' app.log

# العمليات الفاشلة
grep '"status":"FAILED"' app.log | grep '"financialImpact":true'

# العمليات البطيئة (> 5 ثواني)
grep '"durationMs"' app.log | jq 'select(.durationMs > 5000)'

# تتبع request معين
grep '"requestId":"a3f9c2e1"' app.log | jq '{time, msg, module, operationType}'
```

---

## 6. Metrics Endpoints

| Endpoint | الغرض |
|---------|-------|
| `GET /api/metrics` | Prometheus-compatible metrics |
| `GET /api/admin/audit-logs` | Audit log browser (MASTER_ADMIN only) |

### مثال Prometheus alert rules

```yaml
# تنبيه إذا outbox failed count ارتفع
- alert: OutboxFailedEvents
  expr: outbox_failed_events_total > 0
  for: 5m
  labels:
    severity: warning

# تنبيه إذا override rate ارتفع
- alert: HighOverrideRate
  expr: rate(soft_lock_overrides_total[30m]) > 0.5
  labels:
    severity: critical
```

---

## 7. Blind Spots المتبقية (Post-Phase 9)

| المشكلة | الأولوية | الحل المقترح |
|---------|---------|-------------|
| لا يوجد distributed tracing (OTEL) | متوسطة | Phase 10: OpenTelemetry integration |
| اختبارات E2E للـ observability | منخفضة | Playwright tests |
| Prometheus scraping endpoint | متوسطة | إضافة `/api/metrics` route |
| Alert manager integration | منخفضة | PagerDuty / OpsGenie |
| Log aggregation (Loki/ELK) | متوسطة | DevOps configuration |
