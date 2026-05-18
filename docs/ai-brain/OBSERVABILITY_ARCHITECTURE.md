# Observability Architecture
**Phase 9.2-9.4 — Enterprise Operations Layer**
**Last Updated:** 2026-05-18

---

## 1. نظرة عامة

طبقة المراقبة (Observability Layer) في Nama Invest ERP توفر:
- **Correlation IDs**: ربط كل العمليات بـ requestId موحد
- **Structured Logging**: سجلات JSON منظمة بحقول ثابتة
- **Financial Tracing**: تتبع كامل للعمليات المالية الحرجة
- **Tenant-Aware Metrics**: مقاييس مفصولة حسب التينانت
- **Operational Diagnostics**: تشخيص فوري لصحة النظام

---

## 2. بنية المكونات

```
src/lib/observability/
├── request-context.ts    — AsyncLocalStorage context propagation
├── correlation.ts        — Correlation ID generation & headers
├── logger.ts             — Enterprise structured logger
├── financial-trace.ts    — Financial operation tracing
├── tenant-telemetry.ts   — Per-tenant metrics & violations
└── diagnostics.ts        — Operational health diagnostics
```

---

## 3. Request Context Flow

### كيف يتدفق الـ requestId عبر النظام

```
HTTP Request
    │
    ▼
withApiHandler (api-handler.ts)
    │  → يولّد requestId = crypto.randomUUID().slice(0,8)
    │  → يستخرج tenantId من x-tenant-id header
    │  → يستخرج actorId من x-actor-id header
    │  → يستخرج actorRole من x-actor-role header
    │
    ▼
requestContextStore.run(context, handler)
    │
    ├─→ Service Layer (accounting.service, treasury-posting.service…)
    │       └─→ logger.info('…')  ← auto-injects requestId, tenantId
    │
    ├─→ OutboxService.emit()
    │       └─→ buildCorrelationMeta() ← embeds requestId in payload
    │
    ├─→ assertPeriodWritable()
    │       └─→ logger.override('…') ← logs with requestId + override context
    │
    └─→ logAuditEvent()
            └─→ metadata.requestId  ← AuditLog carries correlation ID
```

### مثال: السجل المنتج تلقائياً

```json
{
  "level": "info",
  "time": "2026-05-18T14:30:00.000Z",
  "msg": "Payment applied successfully",
  "requestId": "a3f9c2e1",
  "tenantId": "tenant-riyadh-001",
  "actorId": "42",
  "actorRole": "MASTER_ADMIN",
  "module": "treasury",
  "operationType": "APPLY_PAYMENT",
  "financialImpact": true,
  "durationMs": 234,
  "traceId": "trace_9f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c"
}
```

---

## 4. Logging API

### `logger.info(message, data?)` — عام
```typescript
import { logger } from '@/lib/observability/logger';

logger.info('Operation complete', { customField: 'value' });
// Auto-injects: requestId, tenantId, actorId, actorRole, module
```

### `logger.financial(level, message, data)` — للعمليات المالية
```typescript
logger.financial('info', 'Journal posted', {
  operationType: 'POST_JOURNAL',
  module: 'accounting',
  traceId: 'trace_abc123',
  durationMs: 145,
  currency: 'SAR',
});
// Adds: financialImpact: true, severity: INFO
```

### `logger.override(message, data)` — للـ overrides
```typescript
logger.override('SOFT_LOCK bypass authorized', {
  module: 'accounting',
  operationType: 'POST_JOURNAL',
  actorId: 'u-5',
  reason: 'Emergency Q4 correction authorized by CFO',
});
// Adds: overrideUsed: true, severity: CRITICAL
```

### `logger.child(boundData)` — child logger
```typescript
const log = logger.child({ module: 'treasury', operationType: 'PAYMENT_RUN' });
log.info('Starting payment run'); // inherits module + operationType
```

---

## 5. Financial Tracing

```typescript
import { traceFinancialOperation } from '@/lib/observability/financial-trace';

const result = await traceFinancialOperation(
  {
    operationType: 'POST_JOURNAL',
    module: 'accounting',
    aggregateId: journalId,
    currency: 'SAR',
    overrideUsed: false,
    periodState: 'OPEN',
  },
  async (traceId) => {
    // Store traceId in AuditLog metadata for end-to-end correlation
    await doFinancialMutation();
    return result;
  }
);
```

**Emits two log lines per operation:**
1. `Financial operation started` → level: info
2. `Financial operation completed` OR `Financial operation failed` → info / error

---

## 6. Tenant Telemetry

```typescript
import {
  recordTenantViolation,
  recordTenantOverride,
  getTenantRuntimeMetrics,
} from '@/lib/observability/tenant-telemetry';

// Cross-tenant access attempt
recordTenantViolation('other-tenant', 'InvoiceRecord', 'READ');
// → logs CRITICAL with severity: 'CRITICAL'

// Override tracking
recordTenantOverride(
  tenantId, 'accounting', 'POST_JOURNAL', actorId, reason
);

// Runtime metrics (for admin dashboard)
const metrics = getTenantRuntimeMetrics(tenantId);
// { operationCount, overrideCount, violationCount, lastActivity }
```

---

## 7. Operational Diagnostics

```typescript
import { OperationalDiagnostics } from '@/lib/observability/diagnostics';
import { prisma } from '@/lib/prisma';

const report = await OperationalDiagnostics.run(prisma, tenantId);

// report.outbox.status          → 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
// report.overrides.totalOverridesLast30Days
// report.periodLocks.rejectedAttemptsLast7Days
// report.healthScore            → 0-100
// report.criticalIssues         → string[]
```

**Data Sources:**
- `OutboxEvent` table — failed/stuck events
- `AuditLog` table — override history
- `PeriodLockLog` table — rejected write attempts

---

## 8. قيود وضمانات

### لا يُسجَّل أبداً:
- ❌ أسماء العملاء أو الموظفين (PII)
- ❌ الأرقام الوطنية أو معلومات التعريف
- ❌ كلمات المرور أو التوكنات أو المفاتيح التشفيرية
- ❌ المبالغ المالية الفردية (يمكن تسجيل العملة فقط)

### يُسجَّل دائماً:
- ✅ requestId لكل عملية
- ✅ tenantId لكل mutation
- ✅ actorId و actorRole لكل override
- ✅ durationMs للعمليات المالية الحرجة
- ✅ traceId لكل financial trace

---

## 9. Health Score Interpretation

| النطاق | التفسير | الإجراء المطلوب |
|--------|---------|----------------|
| 90-100 | ✅ Healthy | None |
| 75-89  | ⚠️ Minor issues | Monitor |
| 50-74  | 🔶 Degraded | Investigate outbox failures |
| 0-49   | 🔴 Critical | Immediate intervention required |
