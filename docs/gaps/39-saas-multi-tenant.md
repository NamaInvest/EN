# النقص #39: SaaS Multi-Tenant + Subscriptions Management — مواصفات

> **المرجعيات:** AWS Multi-tenant SaaS、Stripe Connect、Chargebee、SaaS Frameworks (Vendia, Frontegg)

---

## 1. البرومنت

```
وسّع SaaS / Multi-Tenant:

موجود: Tenant, Subscription, SubscriptionPlan, master-panel, multi-tenant infra (db-per-tenant)

النواقص:
A) Tenant onboarding (zero-touch)
B) Subscription plans + add-ons
C) Usage metering + billing
D) Multi-currency tenant billing
E) White-labeling per tenant
F) Custom domain support
G) Database isolation
H) Tenant analytics + churn prediction
I) Customer success workflows
J) Trial management + conversion
K) Reseller / Agency program
L) Customer portal + self-service
APIs (40+), UI (15 pages), Tests 70+
```

---

## 2. السيناريوهات (8)

### A — Tenant Self-Sign-up
```
1. Visitor visits namasoft.com → "Start Free Trial"
2. Fills form: company, email, plan
3. Auto:
   - Create tenant record
   - Provision DB schema
   - Create admin user
   - Send welcome email
4. Trial: 14 days
5. Onboarding wizard: company info, COA template, first user
6. Day 14: trial ends → enforce subscription
```

### B — Plan Upgrade
```
- Current: Pro 500/month
- Wants: Enterprise 1500/month
- Pro-rated:
  - Days remaining in cycle: 15
  - Credit for unused Pro: 250
  - Charge for Enterprise (full): 1500
  - Net charge: 1250
- Plan switched
```

### C — Usage-Based Billing
```
- API plan: 10,000 calls/month base + $0.001 per overage
- Real-time tracking
- Dashboard shows: 8,500 used, 1,500 remaining
- End of month: 12,500 used → bill base + (2,500 × $0.001) = $2.50 overage
```

### D — Failed Payment + Suspension
```
- Auto-charge fails
- Day 1: retry + email
- Day 4: retry + WhatsApp
- Day 7: suspend access (read-only)
- Day 14: cancel
- Data retention: 30 days then purge
```

### E — White-Label Tenant
```
- Reseller buys white-label license
- Custom domain: app.theirCompany.com
- Custom logo + colors
- Custom email sender (their brand)
- Hidden Namasoft branding
- They sub-resell to their customers
```

### F — Custom Domain
```
- Tenant adds CNAME to DNS
- System verifies + provisions SSL (Let's Encrypt)
- Tenant accessible at custom URL
```

### G — Tenant Analytics
```
- Health score per tenant:
  - Active users (% of seats)
  - Feature adoption
  - Usage trend
  - Support tickets
- At-risk tenants flagged
- CS team intervenes
```

### H — Migration / Backup / Restore
```
- Tenant requests data export → ZIP with all data
- Tenant requests deletion → 30-day grace then purge
- Backup nightly to S3
- Point-in-time restore
```

---

## 3. تدفق البيانات

```
[Self Sign-up]
POST /signup
   ↓ create Tenant (status=TRIAL)
   ↓ provision DB
   ↓ seed default data
   ↓ create admin user
   ↓ send welcome email

[Subscription Renewal]
Cron daily:
   ↓ for each subscription due:
     charge payment method
     if success → extend cycle + invoice
     if fail → start dunning
     if dunning fails → suspend → cancel

[Usage Metering]
Real-time:
   ↓ each API call → increment counter
   ↓ check against plan limits
   ↓ alert if approaching cap
   ↓ at month-end → bill overage
```

---

## 4. Schema (إضافات)

```prisma
model Tenant {
  id              Int       @id @default(autoincrement())
  tenantCode      String    @unique
  
  companyName     String
  legalName       String?
  
  // Contact
  primaryEmail    String
  primaryPhone    String?
  
  // Address
  countryCode     String
  city            String?
  
  // Subscription
  subscriptionId  Int?
  subscription    Subscription? @relation(fields: [subscriptionId], references: [id])
  
  // Plan + status
  status          String    @default("TRIAL")  // TRIAL | ACTIVE | PAST_DUE | SUSPENDED | CANCELLED | DELETED
  trialEndsAt     DateTime?
  
  // Provisioning
  databaseUrl     String?   // encrypted
  databaseProvisionedAt DateTime?
  
  // Custom domain
  customDomain    String?   @unique
  customDomainSslAt DateTime?
  
  // White-label
  whiteLabelEnabled Boolean @default(false)
  brandLogoUrl    String?
  brandPrimaryColor String?
  brandAccentColor String?
  emailFromName   String?
  emailFromAddress String?
  
  // Locale
  defaultLanguage String    @default("ar")
  defaultCurrency String    @default("SAR")
  defaultTimezone String    @default("Asia/Riyadh")
  
  // Limits
  maxUsers        Int?
  maxStorageGb    Decimal?  @db.Decimal(10,2)
  
  // Stats
  activeUsersCount Int      @default(0)
  storageUsedGb   Decimal?  @db.Decimal(10,2)
  
  // Health
  healthScore     Int?      // 0-100
  churnRiskScore  Int?
  
  // Reseller
  resellerId      Int?
  reseller        Reseller? @relation(fields: [resellerId], references: [id])
  
  // Audit
  createdAt       DateTime  @default(now())
  activatedAt     DateTime?
  lastActiveAt    DateTime?
  cancelledAt     DateTime?
  deletedAt       DateTime?
  purgedAt        DateTime?
  
  users           TenantUser[]
  subscriptions   Subscription[]
  usageEvents     UsageEvent[]
  invoices        SaasInvoice[]
}

model TenantUser {
  id              Int       @id @default(autoincrement())
  tenantId        Int
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  userId          String
  
  role            String    // 'OWNER' | 'ADMIN' | 'USER'
  
  joinedAt        DateTime  @default(now())
  active          Boolean   @default(true)
  lastLoginAt     DateTime?
}

model SubscriptionPlan {
  // ... existing
  planCode        String    @unique
  name            String
  description     String?
  
  type            String    // 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'CUSTOM'
  
  basePrice       Decimal   @db.Decimal(20,4)
  currency        String    @default("SAR")
  
  billingCycle    String    @default("MONTHLY")
  
  // Features included
  maxUsers        Int?
  maxStorageGb    Decimal?  @db.Decimal(10,2)
  maxRecords      Int?
  features        String[]
  
  // Add-ons
  hasUserAddon    Boolean   @default(false)
  pricePerExtraUser Decimal? @db.Decimal(20,4)
  hasStorageAddon Boolean   @default(false)
  pricePerGb      Decimal?  @db.Decimal(20,4)
  
  // Trial
  trialDays       Int?
  
  // Limits
  apiCallsIncluded Int?
  apiOveragePrice Decimal?  @db.Decimal(20,8)
  
  active          Boolean   @default(true)
  visible         Boolean   @default(true)
}

model Subscription {
  // ... existing (covered in #18)
  tenantId        Int
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
}

model SaasInvoice {
  id              Int       @id @default(autoincrement())
  invoiceNumber   String    @unique
  tenantId        Int
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  subscriptionId  Int?
  
  cycleStart      DateTime
  cycleEnd        DateTime
  
  baseAmount      Decimal   @db.Decimal(20,4)
  addOnsAmount    Decimal?  @db.Decimal(20,4)
  usageAmount     Decimal?  @db.Decimal(20,4)
  taxAmount       Decimal?  @db.Decimal(20,4)
  totalAmount     Decimal   @db.Decimal(20,4)
  
  currency        String
  
  status          String    @default("PENDING")  // PENDING | PAID | FAILED | REFUNDED
  
  paidAt          DateTime?
  paymentMethodId Int?
  paymentRef      String?
  
  retryCount      Int       @default(0)
  
  pdfUrl          String?
}

model UsageEvent {
  id              BigInt    @id @default(autoincrement())
  tenantId        Int
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  meter           String    // 'API_CALL' | 'STORAGE' | 'EMAIL_SENT' | 'SMS_SENT'
  units           Int
  
  metadata        Json?
  
  occurredAt      DateTime  @default(now())
  
  @@index([tenantId, meter, occurredAt])
}

model TenantHealthCheck {
  id              Int       @id @default(autoincrement())
  tenantId        Int
  
  checkDate       DateTime
  
  factors         Json      // {activeUsers, featureAdoption, usageTrend, supportTickets}
  overallScore    Int
  riskScore       Int
  
  flagged         Boolean   @default(false)
  csOwnerId       String?
}

model Reseller {
  id              Int       @id @default(autoincrement())
  resellerCode    String    @unique
  companyName     String
  contactEmail    String
  
  commissionPercent Decimal @db.Decimal(5,2)
  
  whiteLabelEnabled Boolean @default(false)
  
  active          Boolean   @default(true)
  
  tenants         Tenant[]
}

model TenantBackup {
  id              Int       @id @default(autoincrement())
  tenantId        Int
  
  backupDate      DateTime
  size            BigInt
  
  s3Path          String
  encryptionKey   String?
  
  retentionDays   Int       @default(30)
  expiresAt       DateTime
}

model OnboardingProgress {
  id              Int       @id @default(autoincrement())
  tenantId        Int       @unique
  
  steps           Json      // [{step, status, completedAt}]
  currentStep     Int       @default(0)
  totalSteps      Int
  
  completedAt     DateTime?
  abandonedAt     DateTime?
}
```

---

## 5. Forms (8)

A: Self Sign-up
B: Onboarding Wizard
C: Plan Selector
D: Custom Domain Setup
E: White-Label Configuration
F: User Invitation
G: Cancel / Pause Subscription
H: Reseller Setup

---

## 6. Tables (8)

A: Tenants Master
B: Subscriptions
C: SaaS Invoices
D: Usage Stats per Tenant
E: Health Scores
F: Resellers
G: Onboarding Progress
H: Failed Payments

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-tenant-signup | تسجيل (public) | 🟢 anonymous |
| btn-tenant-create-internal | + tenant داخلي | 🟢 namasoft admin |
| btn-tenant-suspend | إيقاف | 🔴 namasoft admin |
| btn-tenant-restore | استعادة | 🟢 namasoft admin |
| btn-tenant-delete | حذف نهائي | 🔴 namasoft super admin |
| btn-tenant-impersonate | الدخول كـ tenant | 🔴 super admin (audited) |
| btn-tenant-export-data | تصدير البيانات | 🟦 tenant owner |
| btn-tenant-purge | مسح كامل | 🔴 super admin |
| btn-plan-create | + خطة | 🟢 product mgr |
| btn-plan-archive | أرشفة | 🟡 product mgr |
| btn-subscription-upgrade | ترقية | 🟢 tenant owner |
| btn-subscription-downgrade | تخفيض | 🟡 tenant owner |
| btn-subscription-pause | إيقاف مؤقت | 🟡 tenant owner |
| btn-subscription-cancel | إلغاء | 🔴 tenant owner |
| btn-onboarding-resume | استكمال التهيئة | 🟦 tenant owner |
| btn-onboarding-skip | تخطّي | 🟡 tenant owner |
| btn-custom-domain-add | + نطاق مخصص | 🟢 tenant admin |
| btn-custom-domain-verify | التحقق DNS | 🟦 tenant admin |
| btn-white-label-config | إعداد white-label | 🟢 tenant admin |
| btn-user-invite | دعوة مستخدم | 🟢 tenant admin |
| btn-user-remove | إزالة | 🔴 tenant admin |
| btn-payment-retry | إعادة محاولة الدفع | 🟦 namasoft + tenant |
| btn-health-check-run | فحص الصحة | 🟦 cs |
| btn-health-flag | علم في خطر | 🟡 cs |
| btn-cs-intervene | تدخل CS | 🟦 cs |
| btn-reseller-create | + reseller | 🟢 namasoft mgr |
| btn-reseller-pay-commission | دفع العمولة | 🟢 namasoft finance |
| btn-backup-restore | استعادة backup | 🔴 super admin + tenant approval |
| btn-tenant-analytics | تحليلات | ⬜ namasoft mgr |

---

## 8. Search & Filters

- Tenants: status, plan, country, health score, reseller
- Subscriptions: plan, status, MRR
- Invoices: status, tenant, period
- Usage: meter, tenant, period
- Resellers: active

---

## 9. Reports

- MRR / ARR
- Churn Rate
- Trial Conversion
- Customer LTV
- Tenant Activity
- Usage by Meter
- Top Tenants by Revenue
- Reseller Performance
- Failed Payments
- Health Score Distribution

---

## 10. Dashboards

- KPIs: MRR / Active Tenants / Trials / Churn % / NRR (Net Revenue Retention)
- Charts: MRR trend, Cohort retention, Plan mix
- Lists: Trial ending soon, At-risk, Failed payments, Top growers

---

## 11. Notifications

- Trial ending (3d)
- Trial converted
- Payment success/failure
- Subscription upgraded
- Tenant suspended
- High churn risk
- Custom domain verified
- Reseller commission due

---

## 12. Permissions

| Action | Tenant Owner | Tenant Admin | NS CS | NS Admin | NS Super |
|--------|--------------|--------------|-------|----------|----------|
| View own | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage own | ✓ | ✓ | ✗ | ✓ | ✓ |
| Cancel own | ✓ | ✗ | ✗ | ✓ | ✓ |
| View all | ✗ | ✗ | ✓ | ✓ | ✓ |
| Suspend | ✗ | ✗ | ✗ | ✓ | ✓ |
| Impersonate | ✗ | ✗ | ✓ audited | ✓ audited | ✓ audited |
| Delete tenant | ✗ | ✗ | ✗ | ✗ | ✓ |
| Plan changes | ✗ | ✗ | ✗ | ✗ | ✓ |
| Reseller setup | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- Stripe / PayTabs (recurring billing)
- DNS providers (custom domains)
- Let's Encrypt (SSL)
- AWS S3 (backups)
- Cloudflare (CDN per tenant)
- Email service (per tenant from address)

---

## 14. Shortcuts

- `Ctrl+T` Tenant search
- `Ctrl+I` Invoice generate

---

## 15. Mobile / Print

- Tenant admin mobile dashboard
- Print: invoices, contracts

---

## 16. Audit

- Tenant lifecycle events
- Impersonation events (highly audited)
- Plan changes
- Custom domain changes
- Health score history

---

## 17. Tests

```typescript
describe('Tenant Provisioning', () => { /* DB creation, seed */ })
describe('Trial → Paid', () => { /* conversion flow */ })
describe('Usage Metering', () => { /* counters, overage */ })
describe('White-label', () => { /* domain, branding */ })
describe('Reseller', () => { /* commission calc */ })
describe('Backup/Restore', () => { /* point-in-time */ })
describe('Multi-tenant Isolation', () => { /* no cross-tenant data leak */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Concurrent signups same email | reject duplicate |
| Custom domain DNS fails | retry + alert |
| Trial extended past expiry | manual override |
| Reseller dispute | mediation |
| Tenant deletes own data | grace period |
| Backup restore conflicts | latest wins |
| Plan downgrade with active features | warn → disable |

---

**نهاية #39** • 8 سيناريوهات • 9 جداول • 8 forms • 8 grids • 28 button • 10 reports
