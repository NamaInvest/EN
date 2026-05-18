# Financial Traceability Architecture
**Phase 10 — Financial Engines Integration (Active)**
**Last Updated:** 2026-05-18

---

## 1. الهدف

ضمان أن كل عملية مالية حرجة في النظام:
1. **مُتتبَّعة** من API request حتى AuditLog
2. **مُرتبطة** بـ correlationId موحد
3. **مُوثَّقة** بـ traceId خاص بالعملية المالية
4. **مُراقَبة** من حيث المدة والحالة والنتيجة

---

## 2. خريطة التتبع المالي

```
HTTP Request (x-request-id: req-abc123)
    │
    ▼
withApiHandler ← يحقن requestContextStore
    │
    ▼
traceFinancialOperation({
    operationType: 'POST_JOURNAL',
    module: 'accounting',
    aggregateId: journalId,
})
    │
    ├─→ LOG: "Financial operation started"
    │       requestId: req-abc123
    │       traceId: trace_9f3a2b1c...
    │       status: STARTED
    │
    ├─→ assertPeriodWritable() ← يتحقق من حالة الفترة
    │       إذا SOFT_LOCK + override:
    │       └─→ traceOverrideUsed() → LOG: override event
    │           └─→ AuditLog.create({metadata: {requestId, traceId}})
    │
    ├─→ Domain Business Logic
    │       └─→ OutboxService.emit({
    │               payload: { ...data, _meta: buildCorrelationMeta() }
    │           })
    │
    ├─→ logAuditEvent({
    │       metadata: { requestId, traceId }
    │   })
    │
    └─→ LOG: "Financial operation completed"
            requestId: req-abc123
            traceId: trace_9f3a2b1c...
            durationMs: 234
            status: SUCCESS
```

---

## 3. Financial Trace IDs

| المعرّف | الطول | الغرض | المصدر |
|---------|-------|-------|--------|
| `requestId` | 8 chars | تتبع HTTP request | `withApiHandler` |
| `traceId` | 37 chars (`trace_` + 32 hex) | تتبع عملية مالية بعينها | `generateTraceId()` |
| `spanId` | 13 chars (`span_` + 16 hex) | تتبع sub-operation | `generateSpanId()` |

### مثال: تتبع journal entry من البداية للنهاية

```
grep '"requestId":"a3f9c2e1"' /var/log/erp/app.log

→ 2026-05-18T14:30:00.000Z INFO  "Financial operation started"   traceId=trace_9f3a...
→ 2026-05-18T14:30:00.123Z INFO  "Period check passed"           traceId=trace_9f3a...
→ 2026-05-18T14:30:00.234Z INFO  "Journal lines balanced"        traceId=trace_9f3a...
→ 2026-05-18T14:30:00.345Z INFO  "Outbox event emitted"          traceId=trace_9f3a...
→ 2026-05-18T14:30:00.456Z INFO  "Financial operation completed"  traceId=trace_9f3a... durationMs=456
```

---

## 4. العمليات المالية الحرجة المغطاة

| العملية | الموديول | محرك التنفيذ | حالة Phase 10 |
|---------|---------|-------------|---------------|
| CREATE_JOURNAL_ENTRY | accounting | `createJournalEntry()` في auto-journal.ts | ✅ مُدمج |
| TREASURY_RECEIPT | treasury | `TreasuryPostingService.createTreasuryEntry()` | ✅ مُدمج |
| TREASURY_PAYMENT | treasury | `TreasuryPostingService.createTreasuryEntry()` | ✅ مُدمج |
| PERIOD_LOCK_REJECTION | governance | `assertPeriodWritable()` | ✅ مُدمج |
| SOFT_LOCK_OVERRIDE | governance | `assertPeriodWritable()` | ✅ مُدمج |
| PAYROLL_POST | hr/payroll | postWagePayrollAccrual() | 🔲 Phase 11 |
| INVOICE_CREATE | sales | postSalesInvoice() | 🔲 Phase 11 |
| PURCHASE_RECEIVE | inventory | postGRN() | 🔲 Phase 11 |
| FX_REVALUATION | treasury | - | 🔲 Phase 11 |
| ASSET_DEPRECIATION | assets | - | 🔲 Phase 11 |

---

## 5. Override Tracing

عند استخدام SOFT_LOCK override:

```typescript
// في period-lock.ts — يُنفَّذ تلقائياً (Phase 10)
traceOverrideUsed({
  operationType,
  module,
  periodState: 'SOFT_LOCKED',
  actorId,
  actorRole,
  reason: reason.slice(0, 200), // truncated — no full user input
  traceId: overrideContext.requestId,
});

// + يكتب في AuditLog.metadata:
{
  requestId: overrideContext.requestId,  // ← correlation key
  module,
  operationType,
  reason,
  decision: 'ALLOWED_WITH_OVERRIDE'
}
```

---

## 6. Outbox Correlation

كل `OutboxService.emit()` يحمل correlation metadata:

```typescript
await OutboxService.emit(tx, {
  tenantId,
  aggregateId: String(journalId),
  aggregateType: 'JournalEntry',
  eventType: 'JOURNAL_POSTED',
  payload: {
    ...data,
    // Injected automatically via buildCorrelationMeta()
    _correlationMeta: {
      requestId: 'a3f9c2e1',
      tenantId: 'tenant-xyz',
      actorId: '42',
      module: 'accounting',
    },
  },
});
```

هذا يسمح بـ:
- ربط outbox event بـ HTTP request الأصلي
- تحديد السبب الجذري عند فشل event معالجة

---

## 7. AuditLog Correlation

```typescript
await logAuditEvent(tx, {
  tenantId,
  userId: actorId,
  action: 'EXECUTE',
  entityType: 'JournalEntry',
  entityId: journalId,
  metadata: {
    requestId,    // ← correlation key
    traceId,      // ← financial trace key
    module,
    operationType,
  },
});
```

---

## 8. قواعد عدم التسجيل (PII/PHI)

| لا تسجّل | سجّل بدلاً |
|---------|-----------| 
| customer.name | customerId |
| employee.nationalId | employeeId |
| patient.diagnosis | patientId |
| payment.amount | currency, aggregateId |
| password, token | - (لا تسجّل أبداً) |

---

## 9. Phase 10 — Engine Integration Map

```
HTTP POST /api/treasury/entries
    │
    ▼
withApiHandler() ← AsyncLocalStorage: {requestId, tenantId, actorId}
    │
    ▼
TreasuryPostingService.createTreasuryEntry()
    │
    ├─→ traceFinancialOperation('TREASURY_RECEIPT', 'treasury') [Phase 10 ✅]
    │       ├─→ LOG STARTED {traceId, correlationId, status:'STARTED'}
    │       │
    │       ├─→ tx.treasury.create()
    │       │       └─→ LOG 'Treasury record created' {aggregateId: 'TREAS-501'}
    │       │
    │       └─→ createJournalEntry({operationType: 'TREASURY_RECEIPT'})
    │               │
    │               └─→ traceFinancialOperation('TREASURY_RECEIPT', 'treasury') [Phase 10 ✅]
    │                       ├─→ assertPeriodWritable()
    │                       │       ├─→ OPEN: continue
    │                       │       ├─→ SOFT_LOCKED + override:
    │                       │       │       └─→ traceOverrideUsed() [Phase 10 ✅]
    │                       │       └─→ SOFT_LOCKED no override:
    │                       │               └─→ tracePeriodLockRejection() [Phase 10 ✅]
    │                       │
    │                       └─→ AccountingJournalService.createEntry()
    │
    └─→ LOG COMPLETED {status:'SUCCESS', durationMs: 234}

```

### Searchability عبر Logs

```bash
# تتبع treasury operation بـ requestId
grep '"requestId":"a3f9c2e1"' app.log | grep '"module":"treasury"'

# عرض كل SOFT_LOCK overrides
grep '"overrideUsed":true' app.log | grep '"severity":"CRITICAL"'

# عرض كل period lock rejections
grep '"periodState":"SOFT_LOCKED"' app.log | grep '"status":"REJECTED"'

# تتبع journal من request إلى completion
grep '"traceId":"trace_9f3a..."' app.log
```
