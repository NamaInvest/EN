# البرومنتات الجاهزة — النظام / الأمان / AI / التكاملات

كل بند: **الحالة** → **سيناريو عالمي** → **فلو** → **برومنت**.

---

## S-01 — TOTP حقيقي (الحالي وهمي يقبل أي 6 أرقام!)

### الحالة الحالية
`src/lib/mfa-engine.ts` يقبل أي 6 أرقام كـ TOTP. **خطر أمني فادح**. لا يستخدم speakeasy/otplib.

### البرومنت الجاهز
```
أصلح TOTP حالاً.

1. Install: npm i otplib qrcode
2. Replace في src/lib/mfa-engine.ts:
   import { authenticator } from 'otplib';
   import { encrypt, decrypt } from './encryption';

   - generateSecret(userId): 
     const secret = authenticator.generateSecret();
     await prisma.userMFA.upsert({
       where: { userId },
       update: { totpSecret: encrypt(secret), totpEnabled: false },
       create: { userId, totpSecret: encrypt(secret), totpEnabled: false }
     });
     return secret;
   
   - generateQRCodeUri(userId, accountName):
     const mfa = await prisma.userMFA.findUnique({ where: { userId } });
     const secret = decrypt(mfa.totpSecret);
     const otpAuth = authenticator.keyuri(accountName, 'Namasoft ERP', secret);
     return await QRCode.toDataURL(otpAuth);
   
   - verifyTOTP(userId, token):
     const mfa = await prisma.userMFA.findUnique({ where: { userId } });
     if (!mfa) return false;
     const secret = decrypt(mfa.totpSecret);
     return authenticator.verify({ token, secret });

3. أضف Backup Codes:
   - generateBackupCodes(userId): 10 random 8-char codes
   - hash each via bcrypt (12 rounds), store hashes
   - verifyBackupCode(userId, code): check hash + mark as used

4. Step-up auth flow:
   - حساس operations require recent TOTP (within 5 min)
   - JournalEntry > 100K, Vendor master change, User permission change

5. UI:
   - /profile/security:
     * QR code display + secret string (manual entry)
     * "Verify code" → enable
     * Backup codes display (one-time)
     * "Regenerate codes" with confirmation
     * "Disable 2FA" with current TOTP

6. Tests:
   - register secret
   - verify valid code
   - reject invalid code
   - reject expired code (TOTP window)
   - backup code single-use
```

---

## S-02 — AI CFO Privacy (يُرسل البيانات الكاملة إلى Gemini حالياً)

### الحالة الحالية
AI CFO يبني context كامل من قاعدة البيانات (أرقام مالية، أسماء عملاء، أرصدة) ويرسل إلى Gemini API. **خطر خصوصية**.

### البرومنت الجاهز
```
أضف Privacy Filter قبل أي AI call.

1. Schema:
   AIPrivacyPolicy {
     id, name, fieldsToMask JSON, fieldsToHash JSON, fieldsToExclude JSON,
     applicableModels JSON [GEMINI|OPENAI], isActive
   }
   AIInteraction {
     id, userId, model, promptHash, responseHash, dataMasked bool,
     piiRemoved bool, cost Decimal, latencyMs, createdAt
   }

2. Engine src/lib/ai-privacy.ts:
   - sanitizePrompt(prompt, policyId):
     * regex remove: emails, phones, IBANs, national IDs
     * mask customer names: "العميل [أ]", "العميل [ب]" (consistent within session)
     * mask amounts > threshold: "[مبلغ كبير]"
     * remove specific account numbers
   - aggregateData(data): compute high-level stats only
     * total revenue (no per-customer)
     * top 5 categories (anonymized labels)
   - logAICall: store interaction without PII

3. Update endpoints:
   - /api/ai-cfo/* : sanitize before Gemini call
   - /api/ai/copilot: same
   - /api/ai-auditor: same

4. Settings:
   - admin can enable/disable AI per module
   - choose policy: STRICT (no PII) | BALANCED (masked) | OFF (raw, only on-prem)

5. UI /admin/ai-privacy:
   - policies CRUD
   - interaction log
   - cost dashboard

6. Tests:
   - PII detection accuracy
   - aggregate stats consistency
   - policy enforcement
```

---

## S-03 — Custom Fields Engine (User-Defined fields)

### الحالة الحالية
`custom-fields-engine.ts` exists لكن لا UI builder، لا UI integration on forms.

### البرومنت الجاهز
```
أكمل Custom Fields.

1. Schema:
   CustomFieldDefinition {
     id, entityType (Customer|Vendor|Product|Invoice|...), fieldName, fieldLabel JSON {ar,en},
     fieldType (TEXT|NUMBER|DATE|DATETIME|DROPDOWN|CHECKBOX|MULTISELECT|REFERENCE|FILE),
     validationRule JSON, dropdownValues JSON?, referenceEntity?,
     isRequired bool, displayOrder, sectionName, isActive,
     placeholder JSON, helpText JSON
   }
   CustomFieldValue {
     id, definitionId, entityId, valueText?, valueNumber?, valueDate?, valueJSON
     -- normalized storage based on type
   }

2. Engine:
   - getFieldsFor(entityType): returns active definitions sorted
   - validateValue(definitionId, value): check rule
   - saveFieldValues(entityId, valuesMap)
   - searchByCustomField(entityType, fieldName, value)

3. API:
   - CRUD /api/system/custom-fields/definitions
   - GET /api/system/custom-fields/[entityType]
   - POST /api/system/custom-fields/values

4. Component <CustomFieldsRenderer entityType={...} entityId={...} />:
   - reads definitions
   - renders form section dynamically
   - handles validation
   - includes in main form's submit

5. Add to forms:
   - CustomerForm, VendorForm, ProductForm, InvoiceForm, etc.
   - all fetch + render custom fields automatically

6. Reports:
   - report builder includes custom fields as columns
   - filters work on custom fields

7. UI /admin/custom-fields:
   - select entity type
   - drag-drop builder
   - section grouping
   - preview

8. Tests:
   - 5 field types × 3 entities
   - validation rules
   - search by custom field
```

---

## S-04 — Custom Report Builder (Dynamic)

### الحالة الحالية
`custom-report-engine.ts` template-based. لا visual builder.

### البرومنت الجاهز
```
بناء Report Builder ديناميكي.

1. Schema:
   ReportDefinition {
     id, name, description, entityType, joins JSON, columns JSON,
     filters JSON, groupings JSON, sortings JSON, aggregations JSON,
     visualType (TABLE|BAR|LINE|PIE|CARD|PIVOT), isShared, ownerId
   }
   ReportSchedule {
     id, reportId, frequency (DAILY|WEEKLY|MONTHLY), dayOfWeek?, dayOfMonth?,
     time, recipients JSON [{email|whatsapp|in-app}], format (PDF|EXCEL|CSV),
     isActive, lastRunAt?
   }

2. Engine src/lib/report-engine.ts:
   - buildQuery(definition):
     * dynamic Prisma SQL builder
     * JOIN tables
     * WHERE filters
     * GROUP BY
     * aggregate (SUM/AVG/COUNT/MIN/MAX)
     * apply tenant isolation
   - executeReport(definitionId, params):
     * query
     * format result
     * cache for 5 min if static
   - exportReport(reportId, format)
   - scheduleSend: cron daily checks ReportSchedule

3. API:
   - CRUD /api/reports/definitions
   - POST /api/reports/[id]/execute
   - POST /api/reports/[id]/export
   - CRUD /api/reports/[id]/schedules

4. UI /reports/builder:
   - Step 1: Select base entity
   - Step 2: Add joined entities (drag-drop)
   - Step 3: Choose columns + aggregations
   - Step 4: Add filters (visual)
   - Step 5: Group + sort
   - Step 6: Choose visualization
   - Save + share

5. UI /reports/[id]:
   - render report
   - filters bar (interactive)
   - drill-down to source documents
   - export buttons

6. Security:
   - row-level: respect tenant + cost center permissions
   - column-level: hide sensitive fields (salary unless HR role)

7. Tests:
   - simple report (sales by month)
   - complex (sales by customer × product × month with filters)
   - schedule daily
   - export PDF
```

---

## S-05 — Distributed Task Queue (Bull/Redis)

### الحالة الحالية
Cron يعمل على نفس الخادم. Heavy tasks (PDF generation، email batch) تبطئ HTTP.

### البرومنت الجاهز
```
بناء Job Queue.

1. Install: npm i bullmq ioredis

2. Setup src/lib/queue/:
   - queues: emailQueue, pdfQueue, reportQueue, dunningQueue, syncQueue, webhookQueue
   - workers: src/workers/{email,pdf,report,...}.ts

3. Move heavy tasks:
   - email send → emailQueue.add(...)
   - PDF generation → pdfQueue.add(...)
   - bulk sync → syncQueue
   - dunning run → dunningQueue
   - webhooks dispatch → webhookQueue with retry

4. Config:
   - Redis connection (cluster optional)
   - retry policies: 3x exp backoff
   - dead letter queue for failed jobs
   - rate limiting per queue

5. Monitoring:
   - bull-board UI (admin only)
   - metrics: jobs queued, processed, failed, latency

6. Workers:
   - separate Node process (PM2 ecosystem.config.js)
   - horizontal scale (multiple workers)

7. UI /admin/jobs:
   - queue stats
   - retry failed jobs
   - cancel pending

8. Tests:
   - queue + dequeue
   - retry on failure
   - rate limit
```

---

## S-06 — Redis Caching Layer

### الحالة الحالية
لا caching. كل request يضرب DB.

### البرومنت الجاهز
```
أضف Redis Cache.

1. Install: npm i ioredis @upstash/redis

2. Setup src/lib/cache.ts:
   - getOrSet(key, ttl, fetcher): cache aside pattern
   - invalidate(pattern): on writes
   - tags: invalidate by tag

3. Apply to:
   - settings (rare changes, high reads): cache 1 hour
   - product list: cache 5 min, invalidate on edit
   - reports: cache 5 min
   - chart of accounts: cache 1 hour
   - currency rates: cache 30 min

4. Cache keys pattern:
   - tenant:{tenantId}:entity:{type}:{id}
   - tenant:{tenantId}:report:{reportId}:{paramsHash}

5. Invalidation:
   - on Prisma update/create/delete: invalidate related keys
   - Prisma middleware

6. Headers:
   - Cache-Control on API responses
   - ETag support

7. Tests:
   - cache hit/miss
   - invalidation on update
   - TTL expiration
```

---

## S-07 — API Rate Limiting + API Keys

### الحالة الحالية
`rate-limit.ts` exists basic. لا API keys management for tenant.

### البرومنت الجاهز
```
بناء API Keys + Rate Limiting.

1. Schema:
   ApiKey {
     id, tenantId, name, key (hashed), prefix (visible 8 chars),
     scopes JSON, rateLimit JSON, lastUsedAt?, expiresAt?,
     ipWhitelist JSON?, isActive, createdBy
   }
   ApiUsage {
     id, apiKeyId, endpoint, method, statusCode, latencyMs, ipAddress, createdAt
   }

2. Rate Limiting:
   - Redis-based sliding window
   - per API key: 1000/hour default, configurable
   - per IP for unauthenticated
   - per endpoint quotas (e.g., /api/upload: 50/hour)

3. Middleware:
   - check Authorization Bearer or X-API-Key header
   - validate + scope check
   - apply rate limit
   - log usage

4. API:
   - CRUD /api/admin/api-keys
   - GET /api/admin/api-keys/[id]/usage
   - POST /api/admin/api-keys/[id]/regenerate

5. UI /admin/api-keys:
   - keys list (one-time secret display)
   - usage charts
   - revoke
   - whitelist IPs

6. Documentation:
   - generate OpenAPI spec automatically
   - interactive docs (Swagger UI)

7. Tests:
   - rate limit enforcement
   - scope check
   - key expiry
```

---

## S-08 — Webhooks (Configurable Outgoing)

### الحالة الحالية
Webhooks الواردة (Salla/Zid) تعمل. لا outgoing webhooks للـ tenant.

### البرومنت الجاهز
```
بناء Outgoing Webhooks.

1. Schema:
   WebhookSubscription {
     id, tenantId, name, url, events JSON [INVOICE_CREATED|PAYMENT_RECEIVED|...],
     secret (for HMAC), isActive, retryPolicy JSON
   }
   WebhookDelivery {
     id, subscriptionId, event, payload JSON, attemptCount,
     status (PENDING|DELIVERED|FAILED), responseStatus?, responseBody?, lastAttemptAt
   }

2. Engine src/lib/webhook-dispatcher.ts:
   - dispatchEvent(eventName, payload):
     * find subscriptions matching event
     * for each: queue delivery via Redis queue
   - deliverWebhook(deliveryId):
     * sign payload with secret (HMAC SHA256)
     * POST to url with timeout 30s
     * on 2xx: mark DELIVERED
     * on fail: retry 5x exponential (1m, 5m, 30m, 2h, 12h)

3. Trigger points (insert in code):
   - on Sales Invoice posted
   - on Payment received
   - on PO approved
   - on Stock alert
   - on customer created
   - on inventory low

4. API:
   - CRUD /api/webhooks/subscriptions
   - GET /api/webhooks/deliveries?subscriptionId
   - POST /api/webhooks/deliveries/[id]/retry

5. UI /admin/webhooks:
   - subscription manager
   - test endpoint button
   - delivery history with retry
   - signature info

6. Tests:
   - HMAC signature
   - retry on fail
   - dispatch on event
```

---

## S-09 — Backup / Restore Automation

### الحالة الحالية
Cron backup exists لكن manual restore process.

### البرومنت الجاهز
```
بناء Backup System.

1. Strategy:
   - daily full pg_dump → S3
   - hourly WAL archiving (point-in-time recovery)
   - 30-day retention rolling
   - weekly backup retained 1 year
   - encrypted at rest (AES-256)

2. Schema:
   BackupRecord {
     id, type (FULL|INCREMENTAL|WAL), startedAt, completedAt,
     sizeBytes, location (S3 key), tenantId?, status,
     restoreTestedAt?, errorMessage?
   }

3. Engine src/lib/backup-engine.ts:
   - performBackup(type): exec pg_dump → encrypt → upload
   - testRestore(backupId): restore to ephemeral DB → validate row count
   - restoreFromBackup(backupId, targetDb): admin-only

4. Cron:
   - /api/cron/backup-daily (already exists)
   - /api/cron/backup-test-monthly (verify integrity)

5. UI /admin/backups:
   - list with size + age
   - download encrypted backup
   - test restore button
   - restore wizard (admin + 2FA + reason)

6. Disaster Recovery Runbook:
   - documentation in docs/dr-runbook.md
   - RPO 1 hour, RTO 4 hours

7. Tests:
   - backup creation
   - decrypt + restore to test DB
   - PITR restoration
```

---

## S-10 — SSO (SAML / OIDC / NAFATH)

### الحالة الحالية
Local + Clerk auth. لا enterprise SSO.

### البرومنت الجاهز
```
بناء Enterprise SSO.

1. Schema:
   SSOProvider {
     id, tenantId, type (SAML|OIDC|GOOGLE|MICROSOFT|NAFATH),
     name, config JSON (entryPoint, cert, clientId, ...),
     attributeMapping JSON (email, firstName, ...), isActive
   }

2. Library: next-auth or custom implementation

3. Saudi NAFATH:
   - National ID-based authentication
   - integrate with Absher
   - returns: full name (Arabic + English), national ID, validity

4. SAML 2.0:
   - SP metadata generation
   - assertion validation
   - signed responses

5. OIDC:
   - authorization code flow
   - PKCE
   - token validation

6. JIT Provisioning:
   - on first SSO login: create user with mapped attributes
   - assign default role per tenant config

7. API:
   - CRUD /api/admin/sso-providers
   - GET /api/auth/sso/[providerId]/login
   - POST /api/auth/sso/[providerId]/callback
   - GET /api/auth/sso/[providerId]/metadata (SAML SP metadata)

8. UI:
   - admin: provider config
   - login page: "Sign in with [Provider]" buttons
   - tenant config: enforce SSO for all users

9. Tests:
   - SAML round-trip
   - OIDC code flow
   - JIT user creation
```

---

## S-11 — Multi-Time-Zone Support

### الحالة الحالية
كل التطبيق يفترض Asia/Riyadh.

### البرومنت الجاهز
```
بناء Multi-TZ.

1. Schema:
   ALTER User: ADD timezone DEFAULT 'Asia/Riyadh'
   ALTER Branch: ADD timezone
   ALTER Tenant: ADD defaultTimezone

2. Storage:
   - all timestamps in UTC (current default)
   - dateOnly fields keep as DATE (no TZ)

3. Display:
   - convert UTC → user.timezone in client
   - use date-fns-tz or dayjs/timezone

4. Reports:
   - user can choose: "report in my TZ" vs "branch TZ"
   - period definitions: midnight in branch TZ

5. Schedules:
   - cron defined in UTC but displayed in user TZ
   - "send report at 9 AM" → in user TZ → translate to UTC

6. Tests:
   - DST transitions
   - multiple TZ users on same data
```

---

## S-12 — Observability / APM (Sentry / DataDog)

### الحالة الحالية
`observability.ts` basic. لا APM real.

### البرومنت الجاهز
```
أضف Observability.

1. Tools:
   - Sentry (error tracking + performance)
   - OpenTelemetry (tracing)
   - Prometheus + Grafana (metrics)

2. Sentry:
   - install @sentry/nextjs
   - capture errors automatically
   - performance traces on API routes
   - source maps upload

3. Custom Metrics:
   - JE posting time
   - Auto-journal duration
   - DB query slow log (>500ms)
   - cache hit ratio

4. Dashboards:
   - request latency p50/p95/p99
   - error rate per endpoint
   - DB connection pool
   - queue depth

5. Alerting:
   - PagerDuty/Slack on:
     * error rate > 5%
     * p95 latency > 2s
     * disk > 80%
     * failed payment runs

6. Health endpoints:
   - GET /api/health/db (Postgres ping)
   - GET /api/health/cache (Redis ping)
   - GET /api/health/queue (Redis Bull)
   - GET /api/health/storage (S3 ping)
   - GET /api/health/gov-apis (Mudad/Qiwa/ZATCA ping)

7. Logs:
   - structured JSON logs
   - correlation IDs across requests
   - aggregate to ELK or DataDog Logs

8. Tests:
   - health endpoints
   - log structure validation
```

---

# ملخص فجوات النظام الـ 12

| # | الفجوة | الأولوية |
|---|------|------|
| S-01 | TOTP حقيقي | 🔴 أمن حرج |
| S-02 | AI Privacy Filter | 🔴 خصوصية |
| S-03 | Custom Fields Builder | 🟠 |
| S-04 | Custom Report Builder | 🟠 |
| S-05 | Distributed Job Queue (Bull) | 🟠 |
| S-06 | Redis Caching | 🟠 |
| S-07 | API Keys + Rate Limiting | 🟠 |
| S-08 | Outgoing Webhooks | 🟡 |
| S-09 | Backup/Restore Automation | 🔴 |
| S-10 | Enterprise SSO + NAFATH | 🟡 |
| S-11 | Multi-Time-Zone | 🟡 |
| S-12 | Observability/APM | 🟠 |
