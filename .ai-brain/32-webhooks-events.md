# 32 - Webhooks & Events

> Event Bus + Outbound Webhooks + Inbound Webhooks (Salla, Zid, Clerk, ZATCA)

---

## 🔔 Event Bus (المنطق الداخلي)

### النموذج (`src/lib/event-bus.ts`):
```typescript
class EventBus {
    static handlers = new Map<string, Handler[]>();
    
    static subscribe(eventType: string, handler: Handler) {
        // عند startup
    }
    
    static async publish(eventType: string, sourceModule: string, payload: any) {
        // 1. حفظ في EventLog
        const event = await prisma.eventLog.create({
            data: {
                eventType, sourceModule,
                payload, status: 'PENDING'
            }
        });
        
        // 2. إضافة لـ syncQueue (BullMQ)
        await syncQueue.add('process_event', {
            eventId: event.id,
            eventType, payload
        });
        
        // 3. إذا queue غير متاح → setImmediate fallback
        // 4. تحديث status → PROCESSED أو FAILED
    }
    
    static async replayPending(limit: number = 100) {
        // إعادة المعالجة للأحداث الفاشلة
    }
}
```

### النموذج في Schema:
```prisma
EventLog {
    eventType
    sourceModule
    payload: Json
    status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'RETRY'
    errorReason?
    processedAt
    retryCount
    createdAt
}
```

---

## Outbox Pattern Observability

- `OutboxEvent` stores external side-effect jobs atomically with business transactions.
- `outboxRelayWorker` polls pending rows through `outboxRelayQueue` and dispatches to `syncQueue`.
- Admin diagnostics endpoint: `GET /api/admin/outbox/diagnostics`.
- Admin diagnostics page: `/(dashboard)/admin/outbox`.
- Diagnostics are read-only, tenant-scoped, and never select or return `payload`.

---

## 📡 أنواع الـ Events

### Sales Events:
- `INVOICE_CREATED` — فاتورة جديدة
- `INVOICE_POSTED` — قيد الفاتورة
- `INVOICE_CANCELLED`
- `INVOICE_PAID`
- `INVOICE_OVERDUE`
- `SALES_ORDER_CREATED`
- `QUOTE_ACCEPTED`
- `RETURN_PROCESSED`

### Purchases:
- `PR_SUBMITTED`
- `PR_APPROVED`
- `PO_CREATED`
- `GRN_RECEIVED`
- `PURCHASE_INVOICE_POSTED`
- `PAYMENT_MADE`

### Inventory:
- `STOCK_LOW`
- `STOCK_OUT`
- `STOCK_EXPIRY_SOON`
- `STOCK_TRANSFER_INITIATED`

### HR:
- `EMPLOYEE_HIRED`
- `EMPLOYEE_TERMINATED`
- `LEAVE_REQUESTED`
- `LEAVE_APPROVED`
- `PAYROLL_RUN_POSTED`
- `WPS_SUBMITTED`

### Approvals:
- `APPROVAL_REQUESTED`
- `APPROVAL_APPROVED`
- `APPROVAL_REJECTED`
- `APPROVAL_ESCALATED`

### Customers:
- `CUSTOMER_CREATED`
- `CUSTOMER_CREDIT_HOLD`
- `CUSTOMER_DUNNING_LEVEL_INCREASED`

### Financial:
- `JE_POSTED`
- `JE_REVERSED`
- `PERIOD_CLOSED`
- `BANK_RECONCILIATION_COMPLETED`

### Manufacturing:
- `MO_RELEASED`
- `MO_COMPLETED`
- `QC_FAILED`
- `MACHINE_DOWN`

### Assets:
- `ASSET_ACQUIRED`
- `ASSET_DISPOSED`
- `DEPRECIATION_POSTED`
- `MAINTENANCE_DUE`

### ZATCA:
- `ZATCA_CLEARED`
- `ZATCA_REJECTED`
- `ZATCA_REPORTED`

---

## 📤 Outbound Webhooks

### النموذج:
```prisma
WebhookSubscription {
    tenantId
    name, description
    url               // الـ endpoint للعميل
    secret            // HMAC secret
    events: Json      // ['INVOICE_CREATED', ...]
    active
    
    failCount
    lastFailedAt
    lastSuccessAt
}

WebhookDeliveryLog {
    subscriptionId
    event, payload
    statusCode
    response
    deliveredAt
    duration
    attemptNumber
}
```

### الـ Engine (`src/lib/webhook-engine.ts`):
```typescript
class WebhookEngine {
    static async dispatch(subscriptionId: number, event: string, payload: any) {
        const sub = await prisma.webhookSubscription.findUnique({...});
        if (!sub.active || !sub.events.includes(event)) return;
        
        const body = JSON.stringify({ event, payload, timestamp: Date.now() });
        const signature = crypto.createHmac('sha256', sub.secret).update(body).digest('hex');
        
        let attempt = 0;
        let success = false;
        
        while (attempt < 3 && !success) {
            attempt++;
            try {
                const response = await fetch(sub.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-NamaSoft-Signature': signature,
                        'X-NamaSoft-Event': event,
                        'X-NamaSoft-Delivery': uuidv4()
                    },
                    body
                });
                
                await prisma.webhookDeliveryLog.create({
                    data: {
                        subscriptionId,
                        event,
                        payload,
                        statusCode: response.status,
                        deliveredAt: new Date(),
                        attemptNumber: attempt
                    }
                });
                
                if (response.ok) {
                    success = true;
                    sub.lastSuccessAt = new Date();
                    sub.failCount = 0;
                }
            } catch (e) {
                // exponential backoff: 2^n * 1000ms
                await sleep(Math.pow(2, attempt) * 1000);
            }
        }
        
        if (!success) {
            sub.failCount++;
            sub.lastFailedAt = new Date();
            
            if (sub.failCount >= 10) {
                // disable subscription
                sub.active = false;
                notifyOwner();
            }
        }
        
        await sub.save();
    }
}
```

### الـ Subscription:
```typescript
// العميل يضيف webhook:
POST /api/webhooks/events
{
    name: 'My Integration',
    url: 'https://my-app.com/webhook',
    events: ['INVOICE_CREATED', 'PAYMENT_MADE']
}

// النظام يولد secret يُرسل للعميل
```

### الـ Verification (العميل):
```javascript
// في الـ endpoint الخارجي:
const signature = req.headers['x-namasoft-signature'];
const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

if (signature !== expected) {
    return res.status(401).end();
}

// الـ payload صحيح، عالج
```

---

## 📥 Inbound Webhooks

### 1. Salla Webhook:
**المسار:** `/api/webhooks/salla`

```typescript
// السيناريو:
1. Salla يرسل event:
   - order.created
   - order.updated
   - product.created
   - customer.created
   - app.store.authorize
2. النظام يفحص HMAC:
   const signature = req.headers['x-salla-signature'];
   const expected = hmac256(secret, req.body);
3. إذا valid:
   - معالجة الـ event
   - مثال: order.created → ينشئ SalesOrder في النظام
   - postSalesInvoice() → JE تلقائي
4. إذا event غير معروف → ignore
```

### 2. Zid Webhook:
**المسار:** `/api/webhooks/zid`

نفس الفكرة لـ Zid platform.

### 3. Clerk Webhook:
**المسار:** `/api/webhook` (Clerk events)

```typescript
// Events:
- user.created
- user.updated
- user.deleted
- session.created
- session.removed

// السيناريو:
1. مستخدم يسجل في Clerk
2. Clerk يرسل user.created
3. النظام:
   - يربط بـ TenantAccount (إن وجد)
   - أو ينتظر provisioning
```

### 4. ZATCA Callback:
**المسار:** `/api/zatca/callback`

- ZATCA يستلم async invoices ويرسل النتيجة
- النظام يحدّث `SalesInvoice.zatcaStatus`

### 5. Tabby/Tamara:
**المسار:** `/api/bnpl/tabby/webhook`, `/api/bnpl/tamara/webhook`

```typescript
// Events:
- payment.authorized
- payment.captured
- payment.refunded
- payment.failed

// السيناريو:
1. عميل يكمل التقسيط على Tabby
2. Tabby يرسل authorized
3. النظام:
   - يصدر فاتورة المبيعات
   - JE: Dr Tabby Receivable / Cr Revenue + VAT
4. عند الـ capture (بعد 1-3 أيام):
   - استلام المال
   - JE: Dr Bank / Cr Tabby Receivable
```

### 6. Telegram Webhook:
**المسار:** `/api/telegram/webhook`

```typescript
// Events:
- Text message
- Photo
- Voice message
- Document
- Callback query

// السيناريو:
1. مستخدم يرسل أمر للبوت
2. Telegram يرسل update لـ webhook
3. النظام يعالج (commands list في AI features)
```

### 7. WhatsApp Business Webhook:
**المسار:** `/api/whatsapp/interactive`

- للموافقات السريعة
- المستخدم يستلم: "موافقة على PO-456؟"
- يرد: "1" / "2" / "3"
- النظام يطبق في `ApprovalStep`

---

## 🔄 Retry & Dead Letter

### Retry Policy:
- **Max attempts:** 3
- **Backoff:** Exponential (2^n × 1000ms)
- **Backoff caps:** 30 ثانية max

### Dead Letter:
- بعد 3 fails → يبقى في `WebhookDeliveryLog` بـ status FAILED
- لا dead letter queue منفصل
- يمكن إعادة المحاولة يدوياً عبر:
  ```typescript
  POST /api/webhooks/deliveries/{id}/retry
  ```

### Notifications:
- بعد 10 fails متتالية → الـ subscription تُعطل تلقائياً
- يُرسل email للـ admin

---

## 📊 Monitoring

### Metrics:
- `webhook_deliveries_total` (counter, by status)
- `webhook_delivery_duration_seconds` (histogram)
- `active_webhook_subscriptions` (gauge)

### Dashboard في الـ UI:
- `/settings/webhooks` — قائمة الـ subscriptions
- `/settings/webhooks/{id}/logs` — سجل التسليم
- Filters: status, event type, date range

---

## 🛡 الأمان

### Outbound:
- ✅ HMAC-SHA256 signature
- ✅ Timestamp validation (window 5 دقائق)
- ✅ HTTPS only
- ✅ User-Agent: `NamaSoft-Webhook/2.4.8`

### Inbound:
- ✅ التحقق من signature (Salla, Zid, Clerk, etc.)
- ✅ التحقق من timestamp
- ✅ Rate limiting (PUBLIC tier)
- ✅ Idempotency keys (لمنع double-processing)

---

## 📋 Event Catalog (للـ Developers)

### Sample Payload (INVOICE_CREATED):
```json
{
    "event": "INVOICE_CREATED",
    "timestamp": 1715680800,
    "tenantId": "aljassim",
    "data": {
        "id": 1234,
        "invoiceNo": "INV-2026-0345",
        "customerId": 56,
        "subtotal": 1000.00,
        "vatAmount": 150.00,
        "total": 1150.00,
        "zatcaStatus": "pending"
    }
}
```

### Sample Payload (PAYMENT_MADE):
```json
{
    "event": "PAYMENT_MADE",
    "timestamp": 1715680900,
    "tenantId": "aljassim",
    "data": {
        "paymentId": 789,
        "type": "INCOMING",
        "customerId": 56,
        "amount": 1150.00,
        "method": "BANK_TRANSFER",
        "appliedTo": [
            { "invoiceId": 1234, "amount": 1150.00 }
        ]
    }
}
```

---

## 🎯 Best Practices

1. ✅ **Sign every webhook** بـ HMAC
2. ✅ **Validate timestamp** (anti-replay)
3. ✅ **Idempotency keys** للـ inbound
4. ✅ **Retry with exponential backoff**
5. ✅ **Log every delivery**
6. ✅ **Disable on repeated failure**
7. ✅ **Document event payloads**
8. ❌ **لا تبعث بيانات حساسة** (Use IDs، لا secrets)
9. ❌ **لا تثق في الـ inbound** بدون validation
10. ✅ **Versioning للـ payload schema**
