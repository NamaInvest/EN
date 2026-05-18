# Phase 9.1 — Observability Architecture Audit Report
**Date:** 2026-05-18
**Scope:** Full observability stack scan — logging, tracing, metrics, diagnostics
**System:** Nama Invest ERP (Next.js + Prisma + PostgreSQL + Redis + BullMQ)

---

## 1. الملفات التي تم فحصها

| الملف | الوضع |
|-------|-------|
| src/lib/logger.ts | موجود — Pino-compatible JSON logger أساسي |
| src/lib/observability.ts | موجود — in-memory metrics |
| src/lib/telemetry.ts | موجود — span tracing بدون correlation IDs |
| src/lib/sentry.ts | موجود — Sentry integration اختيارية |
| src/lib/observability/correlation.ts | موجود جزئياً — 12 سطر فقط |
| src/lib/observability/request-context.ts | موجود جزئياً — AsyncLocalStorage بدون ربط |
| src/lib/observability/financial-trace.ts | موجود جزئياً — stub غير مستخدم |
| src/lib/observability/tenant-telemetry.ts | موجود جزئياً — recordTenantViolation فقط |
| src/lib/observability/logger.ts | موجود — محسّن مع context extraction |
| src/lib/governance/period-lock.ts | موجود — SOFT_LOCK/HARD_LOCK |
| src/lib/services/outbox.service.ts | موجود — مع getDiagnostics |
| src/lib/api-handler.ts | موجود — لا يحقن requestContext في AsyncLocalStorage |
| src/lib/audit-trail.ts | موجود — logAuditEvent |
| src/lib/instrumentation/metrics.ts | موجود — Prometheus metrics |
| src/lib/instrumentation/otel.ts | stub فقط |

---

## 2. Blind Spots الحرجة

### أ. Correlation ID Gaps (CRITICAL)
- withApiHandler يولّد requestId لكن لا يحقنه في requestContextStore
- telemetry.ts spans بدون tenantId أو requestId
- لا يوجد correlation يتتبع من API → Service → Outbox → Audit

### ب. Tenant-Aware Logging Gaps (HIGH)
- logger.ts الأصلي (src/lib/) لا يجلب tenantId تلقائياً
- Prometheus metrics — tenant label محدود
- لا يوجد per-tenant operation logging

### ج. Financial Operation Tracing Gaps (HIGH)
- traceFinancialOperation موجود لكن غير مستدعى في أي engine
- SOFT_LOCK override يُسجَّل بدون requestId correlation
- auto-journal.ts (55KB) بدون أي observability

### د. Diagnostics Gaps (MEDIUM)
- لا يوجد diagnostics.ts
- لا يوجد API endpoint للـ operational health
- لا يوجد orphan workflow detection

---

## 3. خطة التنفيذ

1. Phase 9.2: ربط requestContext بـ withApiHandler (SAFE — إضافة فقط)
2. Phase 9.3: تحسين observability/logger.ts (SAFE — حقول إضافية)
3. Phase 9.4: إنشاء diagnostics.ts (SAFE — read-only)
4. Phase 9.5: اختبارات
5. Phase 9.6: توثيق

---

## 4. المخاطر

| المخاطرة | الدرجة |
|---------|--------|
| نسختان من logger | متوسطة |
| PII في financial logs | عالية — لن نسجل amounts |
| diagnostics queries بدون LIMIT | متوسطة — سنضيف LIMIT دائماً |

---

## 5. Observability Score الحالي

```
Total Score: 4.5 / 10

Correlation IDs:    20%
Tenant-aware logs:  30%
Financial tracing:  20%
Diagnostics:        10%
Override monitoring: 30%
```

**الهدف بعد Phase 9:** 8.5 / 10
