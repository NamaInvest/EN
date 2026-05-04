# النقص #42: Integrations (WhatsApp/Telegram/Email/SMS/Salla/Zid/BNPL/Webhooks) — مواصفات

> **المرجعيات:** Twilio、SendGrid、Salla Open API、Stripe Webhooks、Zapier、Make.com

---

## 1. البرومنت

```
وسّع منظومة Integrations:

موجود: WhatsApp, Telegram, Email, SMS, Salla, Zid (E-commerce), BNPL (Tabby/Tamara), Delivery Platforms

النواقص:
A) Webhook framework (incoming + outgoing)
B) WhatsApp Business API (templates + sessions + broadcast)
C) Telegram Bot
D) Email service (transactional + marketing)
E) SMS gateways (Saudi: Unifonic, Taqnyat, Mobily, STC)
F) E-commerce (Salla, Zid, Shopify, WooCommerce)
G) BNPL (Tabby, Tamara, Cashew)
H) Delivery (Aramex, SMSA, DHL, Saudi Post)
I) Payment gateways (Mada, STC Pay, PayTabs, HyperPay, Tap)
J) Government (ZATCA, GOSI, Mudad, Wathq, Najiz, Qiwa, Maroof)
K) AI providers (OpenAI, Gemini, Claude)
L) BI (Power BI, Tableau)
M) Third-party CRM/ERP (Salesforce, SAP, Oracle)
N) Calendar (Google, Outlook)
O) Storage (S3, Azure Blob)
P) Universal connector (REST/SOAP/GraphQL/Webhook)

APIs (50+), UI (15 pages), Tests 70+
```

---

## 2. السيناريوهات (10)

### A — WhatsApp Order Confirmation
```
- Customer places order
- System sends WA template "Order Confirmed":
  - Order #
  - Items
  - Total
  - Tracking link
- Customer can reply → ticket created in system
```

### B — Salla Order Sync
```
- Customer orders on Salla store
- Webhook → POST /webhooks/salla/order
- System creates SO in Namasoft
- Reduces inventory
- Generates invoice + ZATCA
- Updates Salla with status
```

### C — Tabby BNPL at Checkout
```
- POS checkout: customer chooses Tabby
- Eligibility check API
- Amount > min, customer has phone
- SMS sent to customer
- Customer approves on app
- Webhook back → POS completes sale
```

### D — Aramex Shipping
```
- DN created → "Ship via Aramex"
- API call: create AWB
- Receive tracking number
- Print label
- Real-time tracking webhooks
- POD on delivery
```

### E — Email Marketing Campaign
```
- Marketing creates campaign
- Selects segment: VIP customers
- Email template
- Schedule send
- Track opens + clicks
- ROI: which led to purchases
```

### F — Wathq KYC Lookup
```
- New vendor entry
- Enter CR (Commercial Registration)
- API → Wathq returns: company info, VAT status, sanctions check
- Auto-fill fields
- Saves manual entry
```

### G — Outlook Calendar Sync
```
- Sales rep meeting in CRM
- Auto-syncs to Outlook calendar
- Updates in Outlook → sync back to CRM
- Two-way sync
```

### H — Zapier-like Workflow
```
- Trigger: new customer created
- Actions:
  - Send welcome email
  - Add to MailChimp
  - Post to Slack #sales
  - Create folder in Drive
- All configured visually
```

### I — Universal Webhook
```
- External system needs notification
- Configure webhook: URL + event + auth
- On event → POST with payload
- Retry on failure
- HMAC signature for security
```

### J — Government Compliance Sync
```
- Daily sync with:
  - ZATCA (invoice statuses)
  - GOSI (employee changes)
  - Mudad (WPS)
  - Wathq (CR validations)
- All automated, no manual
```

---

## 3. تدفق البيانات

```
[Outgoing Webhook]
On event:
   ↓ find configured webhooks
   ↓ for each:
     prepare payload
     sign with HMAC
     POST to URL
     handle response
     retry on failure (exponential backoff)
   ↓ log result

[Incoming Webhook]
POST /webhooks/:provider
   ↓ verify signature
   ↓ parse payload
   ↓ route to handler
   ↓ acknowledge (200)
   ↓ process async if heavy

[Universal Connector]
POST /integrations/call
   { connectionId, method, endpoint, payload }
   ↓ load connection config
   ↓ apply auth (API key, OAuth, etc.)
   ↓ make HTTP call
   ↓ transform response
   ↓ return
```

---

## 4. Schema

```prisma
model Integration {
  id              Int       @id @default(autoincrement())
  integrationCode String    @unique
  name            String
  
  type            String    // 'WHATSAPP' | 'EMAIL' | 'SMS' | 'TELEGRAM' | 'SALLA' | 'ZID' | 'TABBY' | 'TAMARA' | 'ARAMEX' | 'ZATCA' | 'GOSI' | 'WATHQ' | 'CUSTOM'
  
  config          Json      // provider-specific
  credentials     Json      // encrypted
  
  status          String    @default("ACTIVE")  // ACTIVE | INACTIVE | ERROR
  
  lastSuccessAt   DateTime?
  lastErrorAt     DateTime?
  errorMessage    String?
  
  callsCount      BigInt    @default(0)
  
  createdAt       DateTime  @default(now())
}

model Webhook {
  id              Int       @id @default(autoincrement())
  webhookCode     String    @unique
  name            String
  
  direction       String    // 'OUTGOING' | 'INCOMING'
  
  // Outgoing
  url             String?
  events          String[]
  signingSecret   String?
  retryAttempts   Int       @default(3)
  
  // Incoming
  endpointPath    String?
  authMethod      String?   // 'HMAC' | 'BASIC' | 'API_KEY' | 'NONE'
  
  headers         Json?
  
  active          Boolean   @default(true)
  
  successCount    BigInt    @default(0)
  failureCount    BigInt    @default(0)
  lastTriggeredAt DateTime?
  
  deliveries      WebhookDelivery[]
}

model WebhookDelivery {
  id              BigInt    @id @default(autoincrement())
  webhookId       Int
  webhook         Webhook   @relation(fields: [webhookId], references: [id])
  
  event           String
  payload         Json
  
  status          String    // 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXHAUSTED'
  attempts        Int       @default(0)
  
  responseStatus  Int?
  responseBody    String?   @db.Text
  responseTimeMs  Int?
  
  nextRetryAt     DateTime?
  completedAt     DateTime?
  
  createdAt       DateTime  @default(now())
  
  @@index([status, nextRetryAt])
  @@index([webhookId, createdAt])
}

model EmailTemplate {
  id              Int       @id @default(autoincrement())
  templateCode    String    @unique
  name            String
  category        String    // 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION'
  
  subject         String
  bodyHtml        String    @db.Text
  bodyText        String    @db.Text
  
  language        String    @default("ar")
  variables       String[]  // {{variableName}}
  
  active          Boolean   @default(true)
}

model EmailDelivery {
  id              BigInt    @id @default(autoincrement())
  templateCode    String?
  
  toAddress       String
  ccAddresses     String?
  bccAddresses    String?
  fromAddress     String
  subject         String
  
  bodyHtml        String?   @db.Text
  bodyText        String?   @db.Text
  
  attachments     Json?
  
  provider        String    // 'SENDGRID' | 'SES' | 'POSTMARK' | 'MAILGUN'
  externalMessageId String?
  
  status          String    @default("QUEUED")  // QUEUED | SENT | DELIVERED | OPENED | CLICKED | BOUNCED | COMPLAINED
  
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  bouncedAt       DateTime?
  
  errorMessage    String?
  
  createdAt       DateTime  @default(now())
  
  @@index([toAddress, createdAt])
}

model SmsDelivery {
  id              BigInt    @id @default(autoincrement())
  toPhone         String
  fromSenderId    String?
  message         String    @db.Text
  
  provider        String    // 'UNIFONIC' | 'TAQNYAT' | 'MOBILY' | 'STC' | 'TWILIO'
  externalMessageId String?
  
  status          String    @default("QUEUED")
  
  costAmount      Decimal?  @db.Decimal(20,4)
  
  sentAt          DateTime?
  deliveredAt     DateTime?
  failedAt        DateTime?
  errorMessage    String?
  
  createdAt       DateTime  @default(now())
}

model WhatsappTemplate {
  id              Int       @id @default(autoincrement())
  templateName    String    @unique
  category        String    // 'TRANSACTIONAL' | 'MARKETING' | 'AUTHENTICATION'
  
  language        String
  body            String    @db.Text
  variables       String[]
  
  metaApprovalStatus String  // 'PENDING' | 'APPROVED' | 'REJECTED'
}

model WhatsappMessage {
  id              BigInt    @id @default(autoincrement())
  toPhone         String
  
  templateName    String?
  variables       Json?
  
  type            String    @default("TEMPLATE")  // TEMPLATE | TEXT | IMAGE | DOCUMENT
  content         Json
  
  status          String    @default("QUEUED")
  externalMessageId String?
  
  sentAt          DateTime?
  deliveredAt     DateTime?
  readAt          DateTime?
  
  createdAt       DateTime  @default(now())
}

model EcommerceConnection {
  id              Int       @id @default(autoincrement())
  platform        String    // 'SALLA' | 'ZID' | 'SHOPIFY' | 'WOOCOMMERCE'
  storeName       String
  storeUrl        String
  
  apiKey          String    // encrypted
  
  syncStatus      String    @default("ACTIVE")
  lastSyncAt      DateTime?
  
  syncProducts    Boolean   @default(true)
  syncOrders      Boolean   @default(true)
  syncInventory   Boolean   @default(true)
  syncCustomers   Boolean   @default(true)
}

model PaymentGatewayConnection {
  id              Int       @id @default(autoincrement())
  gateway         String    // 'MADA' | 'STC_PAY' | 'PAYTABS' | 'HYPERPAY' | 'TAP' | 'STRIPE'
  
  merchantId      String
  apiKey          String    // encrypted
  
  feeStructure    Json
  
  active          Boolean   @default(true)
}

model GovApiConnection {
  id              Int       @id @default(autoincrement())
  agency          String    // 'ZATCA' | 'GOSI' | 'MUDAD' | 'WATHQ' | 'NAJIZ' | 'QIWA' | 'MAROOF'
  
  environment     String    @default("PRODUCTION")  // SANDBOX | PRODUCTION
  endpoint        String
  
  credentials     Json      // encrypted
  
  active          Boolean   @default(true)
  lastSyncAt      DateTime?
}

model IntegrationCallLog {
  id              BigInt    @id @default(autoincrement())
  integrationId   Int?
  webhookId       Int?
  
  direction       String    // 'OUT' | 'IN'
  endpoint        String
  method          String?
  
  requestBody     Json?
  responseStatus  Int?
  responseBody    Json?
  
  durationMs      Int?
  errorMessage    String?
  
  occurredAt      DateTime  @default(now())
  
  @@index([occurredAt])
}
```

---

## 5. Forms (10)

A: Integration Setup (per provider)
B: Webhook Configuration
C: Email Template Editor
D: WhatsApp Template Submit (Meta approval)
E: SMS Provider Setup
F: E-commerce Sync Mapping
G: Payment Gateway Config
H: Workflow Automation (visual)
I: API Key Management
J: Custom Connector Builder

---

## 6. Tables (10)

A: Active Integrations
B: Webhook Deliveries
C: Email Sent (with status)
D: SMS Sent
E: WhatsApp Conversations
F: E-commerce Sync Status
G: Payment Gateway Transactions
H: Government API Calls
I: Integration Errors (logs)
J: Workflow Executions

---

## 7. Buttons (30+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-integration-add | + تكامل | 🟢 admin |
| btn-integration-test | اختبار | 🟦 admin |
| btn-integration-disable | تعطيل | 🟡 admin |
| btn-webhook-create | + webhook | 🟢 admin |
| btn-webhook-trigger-test | اختبار | 🟦 admin |
| btn-webhook-resend-failed | إعادة الفاشل | 🟦 admin |
| btn-email-template-create | + قالب بريد | 🟢 marketing |
| btn-email-test-send | إرسال اختبار | 🟦 marketing |
| btn-whatsapp-template-submit | تقديم Meta | 🟦 marketing |
| btn-whatsapp-broadcast | بث جماعي | 🟦 marketing |
| btn-sms-bulk-send | SMS جماعي | 🟦 marketing |
| btn-salla-connect | ربط Salla | 🟢 admin |
| btn-salla-sync-now | مزامنة الآن | 🟦 admin |
| btn-zid-connect | ربط Zid | 🟢 admin |
| btn-tabby-eligibility-check | فحص Tabby | 🟦 cashier |
| btn-tabby-create-session | إنشاء جلسة | 🟢 cashier |
| btn-tamara-similar | Tamara | 🟢 cashier |
| btn-aramex-create-awb | إنشاء AWB | 🟦 shipping |
| btn-aramex-track | تتبع | ⬜ viewer |
| btn-zatca-onboard | تفعيل ZATCA | 🟢 cfo |
| btn-gosi-sync | مزامنة GOSI | 🟦 hr |
| btn-mudad-submit-wps | إرسال WPS | 🟦 payroll |
| btn-wathq-lookup | بحث Wathq | 🟦 procurement |
| btn-payment-gateway-connect | + بوابة دفع | 🟢 admin |
| btn-calendar-sync | مزامنة التقويم | 🟦 user |
| btn-workflow-create | + workflow | 🟢 admin |
| btn-workflow-test | اختبار | 🟦 admin |
| btn-workflow-disable | تعطيل | 🟡 admin |
| btn-api-key-rotate | تدوير المفتاح | 🟡 admin |
| btn-api-key-revoke | إلغاء | 🔴 admin |
| btn-integration-cost | تكلفة التكامل | ⬜ cfo |
| btn-export-integration-logs | تصدير logs | ⬜ admin |

---

## 8. Search & Filters

- Integrations: type, status
- Webhooks: direction, event, status
- Email: status, recipient, date
- SMS: status, provider
- WhatsApp: phone, template, status
- Errors: integration, severity, date

---

## 9. Reports

- Integration Health (per provider)
- Webhook Delivery Stats
- Email Performance (open/click rates)
- SMS Cost Analysis
- WhatsApp Engagement
- E-commerce Sync Stats
- Payment Gateway Reconciliation
- Government API Compliance

---

## 10. Dashboards

- KPIs: Active Integrations / Webhooks Failed / Email Open Rate / SMS Cost MTD
- Charts: Integration uptime, Cost trend
- Lists: Failed webhooks, Sync errors, Recent broadcasts

---

## 11. Notifications

- Integration error
- Webhook delivery failed (retries exhausted)
- Sync error
- Payment gateway issue
- Government API timeout
- Cost approaching budget
- API key expiring

---

## 12. Permissions

| Action | User | Marketing | Admin | Super |
|--------|------|-----------|-------|-------|
| Use integrations | ✓ | ✓ | ✓ | ✓ |
| Configure | ✗ | ✗ | ✓ | ✓ |
| Create webhooks | ✗ | ✗ | ✓ | ✓ |
| Send broadcasts | ✗ | ✓ | ✓ | ✓ |
| API keys | ✗ | ✗ | ✓ | ✓ |
| Custom connectors | ✗ | ✗ | ✗ | ✓ |
| View error logs | ✗ | ✗ | ✓ | ✓ |
| Cost reports | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations (this is the integration module itself)

Inherits everything in description above.

---

## 14. Shortcuts

- `Ctrl+I` Integration search
- `Ctrl+W` Webhooks

---

## 15. Mobile / Print

- Mobile: integration health quick view
- Print: integration audit reports

---

## 16. Audit

- All API calls logged
- Webhook deliveries
- Credential changes
- Configuration changes

---

## 17. Tests

```typescript
describe('Webhook Delivery', () => { /* signing, retry, idempotency */ })
describe('Email', () => { /* templates, attachments, tracking */ })
describe('WhatsApp', () => { /* templates, sessions, broadcast */ })
describe('Salla Sync', () => { /* products, orders, inventory */ })
describe('Tabby', () => { /* eligibility, session, callback */ })
describe('ZATCA', () => { /* clearance, retry */ })
describe('Wathq', () => { /* CR lookup */ })
describe('Universal Connector', () => { /* REST, SOAP, custom auth */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| External API down | retry + fallback |
| Webhook URL changes | reject + alert |
| Rate limit hit | backoff |
| Credentials expired | refresh OAuth or alert |
| Conflicting data sync | manual reconciliation |
| Duplicate webhook | idempotency key |
| Large payload | streaming or chunking |

---

**نهاية #42** • 10 سيناريوهات • 11 جداول • 10 forms • 10 grids • 32 button • 8 reports
