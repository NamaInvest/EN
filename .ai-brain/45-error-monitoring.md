# 45 - الأخطاء والمراقبة (Error Handling & Monitoring)

> Sentry + Custom Logger + Prometheus + OpenTelemetry + Error Pages

---

## 🔥 طبقات الأخطاء

```
┌─────────────────────────────┐
│  Client (Browser)            │
│  - try/catch                 │
│  - Error Boundary            │
│  - Sentry Browser            │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│  Edge Middleware             │
│  - Catch + 500 response      │
│  - Sentry Edge               │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│  API Route (withRoute)       │
│  - Try/Catch automatic       │
│  - Structured error response │
│  - Sentry Server             │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│  Service / Engine            │
│  - Throw custom errors       │
│  - Log to logger             │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│  Database                    │
│  - Prisma errors             │
│  - Constraint violations     │
└─────────────────────────────┘
```

---

## 🛡 Sentry Integration

### الـ Config:
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0, // 100% on error
    
    integrations: [
        Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
        }),
    ],
    
    beforeSend(event) {
        // Filter PII
        if (event.user) {
            event.user.email = undefined;
            event.user.username = undefined;
        }
        return event;
    }
});
```

### الـ Tunnel (لتجاوز ad-blockers):
```typescript
// next.config.ts
const sentryConfig = {
    org: "nama-invest",
    project: "namaweb",
    tunnelRoute: "/monitoring",
    // ...
};

export default withSentryConfig(nextConfig, sentryConfig);
```

### الـ Source Maps Upload:
- يتم تلقائياً عبر `@sentry/nextjs`
- `SENTRY_AUTH_TOKEN` في الـ env
- يساعد في debug الـ minified errors

---

## 📝 Custom Logger

### الـ File: `src/lib/logger.ts`

### الـ Structure:
```typescript
interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    time: string;
    msg: string;
    context?: Record<string, any>;
    data?: any;
}

class Logger {
    constructor(private context: Record<string, any> = {}) {}
    
    debug(msg: string, data?: any) {
        this.log('debug', msg, data);
    }
    
    info(msg: string, data?: any) {
        this.log('info', msg, data);
    }
    
    warn(msg: string, data?: any) {
        this.log('warn', msg, data);
    }
    
    error(msg: string, data?: any) {
        this.log('error', msg, data);
        // أيضاً يرسل لـ Sentry
        Sentry.captureMessage(msg, 'error');
    }
    
    child(context: Record<string, any>): Logger {
        return new Logger({ ...this.context, ...context });
    }
    
    private log(level: string, msg: string, data?: any) {
        if (shouldLog(level)) {
            console.log(JSON.stringify({
                level, msg,
                time: new Date().toISOString(),
                context: this.context,
                data
            }));
        }
    }
}
```

### الاستخدام:
```typescript
import logger from '@/lib/logger';

const log = logger.child({ service: 'auto-journal' });

log.info('Posting journal entry', { invoiceId, amount });

try {
    await postEntry();
} catch (e) {
    log.error('Failed to post', { error: e.message, stack: e.stack });
    throw e;
}
```

### الـ Levels:
- **debug** (10): تفاصيل dev
- **info** (20): الأحداث العادية
- **warn** (30): تحذيرات
- **error** (40): أخطاء قابلة للاسترداد
- **fatal** (50): أخطاء حرجة

### Environment:
- `LOG_LEVEL=info` (افتراضي للـ production)
- `LOG_LEVEL=debug` (للـ development)

---

## 🚨 Custom Error Classes

### النموذج:
```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class ValidationError extends ApiError {
    constructor(message: string, public fields: Record<string, string>) {
        super(400, message, 'VALIDATION_ERROR', { fields });
    }
}

export class NotFoundError extends ApiError {
    constructor(resource: string) {
        super(404, `${resource} not found`, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
    }
}

export class ConflictError extends ApiError {
    constructor(message: string) {
        super(409, message, 'CONFLICT');
    }
}

export class BusinessRuleError extends ApiError {
    constructor(message: string, code: string) {
        super(422, message, code);
    }
}
```

### الاستخدام:
```typescript
async function createInvoice(data) {
    if (data.total < 0) {
        throw new ValidationError('Invalid total', { total: 'Must be positive' });
    }
    
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId }});
    if (!customer) throw new NotFoundError('Customer');
    
    if (customer.creditHold) {
        throw new BusinessRuleError('Customer on credit hold', 'CREDIT_HOLD');
    }
    
    // ...
}
```

---

## 🔄 Error Response Format

### الـ Standard Response:
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input",
        "details": {
            "fields": {
                "total": "Must be positive",
                "customerId": "Required"
            }
        },
        "requestId": "uuid-v4",
        "timestamp": "2026-05-14T10:30:00Z"
    }
}
```

### في الـ withRoute:
```typescript
} catch (error) {
    if (error instanceof ApiError) {
        return NextResponse.json({
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
                requestId
            }
        }, { status: error.statusCode });
    }
    
    // Unknown error
    log.error('Unhandled error', { error: error.message, stack: error.stack, requestId });
    Sentry.captureException(error);
    
    return NextResponse.json({
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            requestId,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    }, { status: 500 });
}
```

---

## 📊 Prometheus Metrics

### الـ Endpoint: `GET /api/metrics`

### الـ Setup (`src/lib/instrumentation/metrics.ts`):
```typescript
// Custom Prometheus implementation (بدون مكتبات خارجية)

export const httpRequestsTotal = new Counter('http_requests_total', ['method', 'status', 'route']);
export const httpRequestDuration = new Histogram('http_request_duration_seconds', ['method', 'route'], {
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const journalEntriesPosted = new Counter('journal_entries_posted_total', ['tenant', 'type']);
export const webhookDeliveries = new Counter('webhook_deliveries_total', ['event', 'status']);
export const llmTokens = new Counter('llm_tokens_consumed_total', ['model', 'operation']);
export const apiKeyRequests = new Counter('api_key_requests_total', ['key_id', 'tenant']);
export const approvalRequests = new Counter('approval_requests_total', ['status', 'document_type']);

export const activeWebhookSubscriptions = new Gauge('active_webhook_subscriptions', ['tenant']);
export const nodejsHeapUsed = new Gauge('nodejs_heap_used_bytes');
export const processUptime = new Gauge('process_uptime_seconds');
```

### الـ Export:
```typescript
// /api/metrics route
export async function GET() {
    const metrics = await register.metrics();
    return new Response(metrics, {
        headers: { 'Content-Type': 'text/plain; version=0.0.4' }
    });
}
```

### الـ Scraping:
- Prometheus server يـ scrape كل 30 ثانية
- Grafana للـ dashboards
- Alertmanager للـ alerts

---

## 🔭 OpenTelemetry

### الـ Setup: `src/lib/instrumentation/otel.ts`

### الـ Spans:
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('namainvist');

async function processInvoice(invoice) {
    return tracer.startActiveSpan('process-invoice', async (span) => {
        try {
            span.setAttribute('invoice.id', invoice.id);
            span.setAttribute('invoice.amount', invoice.total);
            
            // ...
            
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (e) {
            span.recordException(e);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw e;
        } finally {
            span.end();
        }
    });
}
```

### Trace Context:
- يُمرّر تلقائياً بين الـ services
- يساعد في تتبع الأحداث المعقدة
- `X-Request-Id` للـ HTTP

---

## 🎯 Error Boundaries (React)

### `GlobalErrorBoundary.tsx`:
```typescript
'use client';
import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };
    
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    
    componentDidCatch(error: Error, errorInfo: any) {
        Sentry.captureException(error, {
            contexts: { react: { componentStack: errorInfo.componentStack } }
        });
        logger.error('React error boundary caught', { error: error.message });
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="error-fallback">
                    <h1>عذراً، حدث خطأ غير متوقع</h1>
                    <button onClick={() => location.reload()}>إعادة التحميل</button>
                </div>
            );
        }
        return this.props.children;
    }
}
```

### الاستخدام:
```typescript
// في الـ root layout
<GlobalErrorBoundary>
    <Providers>{children}</Providers>
</GlobalErrorBoundary>
```

---

## 📈 Health Checks

### `/api/health`:
- Basic health (200 OK if alive)
- يستخدمه LB/uptime monitors

### `/api/sys/health`:
- Detailed health checks:
  - DB connection
  - Redis connection
  - ZATCA reachability
  - Disk space
  - Memory usage
  - Queue health

### Response example:
```json
{
    "status": "ok",
    "timestamp": "2026-05-14T10:30:00Z",
    "checks": [
        { "name": "database", "status": "ok", "latency": "12ms" },
        { "name": "redis", "status": "ok", "latency": "2ms" },
        { "name": "zatca", "status": "ok" },
        { "name": "memory", "status": "ok", "value": "60%" }
    ]
}
```

---

## 🚨 Alerts

### الـ Sentry Alerts:
- Error rate > 1% → Slack/Email
- Crash-free sessions < 99% → Notify team
- New error type → Notify dev
- Performance degradation → Investigate

### Custom Alerts (cron):
- Database connections > 80% → Telegram admin
- Queue depth > 1000 → Telegram
- Disk usage > 90% → Telegram + Email
- Failed payments > 10/hour → Telegram

---

## 🐛 Debugging Workflow

### Production Issue Steps:
```
1. تنبيه Sentry يصل
2. افتح الـ event:
   - Stack trace
   - Browser info
   - User info (مع PII redacted)
   - Breadcrumbs (آخر 50 إجراء)
3. ابحث في الـ logs:
   pm2 logs main-site | grep <requestId>
4. تحقق من Database state:
   psql > SELECT * FROM audit_log WHERE ...
5. أعد إنتاج محلياً
6. أصلح
7. اختبار + Deploy
8. تأكد ما يحدث مرة أخرى
```

---

## 📋 Sentry Pages

### الـ `/sentry-example-page`:
- صفحة اختبار Sentry
- يولّد errors عمداً
- للتأكد من configuration

```typescript
// app/sentry-example-page/page.tsx
'use client';

export default function SentryExamplePage() {
    return (
        <div>
            <button onClick={() => {
                throw new Error('Test Sentry Error');
            }}>
                Throw error
            </button>
        </div>
    );
}
```

---

## 🎯 Best Practices

1. ✅ **استخدم Custom Error Classes**
2. ✅ **Structured logging** (JSON)
3. ✅ **requestId في كل log**
4. ✅ **PII redaction** قبل الإرسال
5. ✅ **Sentry للـ exceptions** فقط
6. ✅ **Metrics للـ patterns**
7. ✅ **Error boundaries في React**
8. ✅ **Graceful degradation**
9. ❌ **لا silent catches** (سجل دائماً)
10. ❌ **لا تكشف stack traces** في production
