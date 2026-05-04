# النقص #18: Subscriptions + Installments + Recurring Invoices — مواصفات تفصيلية

> **المرجعيات:** Zuora、Stripe Billing、Chargebee、Recurly、SAP Subscription Management、NetSuite SuiteBilling

---

## 1. البرومنت الكامل

```
ابني نظام Subscriptions + Installments + Recurring متكامل:

موجود: prisma Installment, RecurringInvoice, CustomerSubscription، PaymentTermInstallment

النواقص:

A) Subscription Billing:
   - Multiple plans (per product/service)
   - Plan tiers (Basic/Pro/Enterprise)
   - Add-ons + metered usage
   - Free trials
   - Pro-rated upgrades/downgrades
   - Coupon application
   - Auto-renewal + cancellation
   - Dunning management for failed payments
   - Usage-based billing (cap, overage)
   - Multi-currency
   - Tax handling per jurisdiction
   - Mid-cycle changes

B) Installments:
   - Plan creator (with schedule preview)
   - Auto-deduct from card / bank
   - Late payment handling
   - Early payoff with discount
   - Default management
   - Modification mid-plan

C) Recurring Invoices:
   - Schedule generator (daily/weekly/monthly/yearly/custom)
   - Auto-send + auto-deduct
   - Pause/resume
   - Item-level recurring (vs whole invoice)

APIs (50+), UI (15 pages), Tests 60+
```

---

## 2. السيناريوهات (8)

### A — SaaS Subscription
```
1. Customer signs up: Pro plan @ 500 SAR/month
2. 14-day free trial
3. Day 14: auto-charge → first invoice 500
4. Monthly auto-renewal
5. Mid-cycle: upgrades to Enterprise @ 1500
   - Pro-rated remaining days credited
   - Charged difference
6. After 1 year: cancels
   - Service runs until end of period
   - No more renewals
```

### B — Installment Plan (BNPL Internal)
```
- 12,000 SAR purchase, 6 monthly installments
- Plan: 2,000 × 6
- Customer's card stored (PCI-compliant)
- Cron 1st of month: auto-charge
- Failed payment → retry 3 times → late fee → escalate
```

### C — Metered Usage
```
- API customer plan: 1,000 calls/month included + 0.10 SAR/call overage
- Real-time tracking
- End of month: 1,500 calls
- Bill: base 500 + (500 × 0.10) = 550 SAR
```

### D — Mid-Cycle Plan Change
```
- Currently on Pro 500/month, day 15 of cycle
- Wants Basic 200
- Options:
  - Immediate downgrade + credit 250 (15 days unused × 16.67/day)
  - End-of-period downgrade
- Customer chooses immediate → credit applied to next invoice
```

### E — Recurring Invoice
```
- Maintenance contract: 5,000 SAR/quarter
- Setup: invoice every 90 days starting 1/1/2026
- Auto-send by email
- Customer can pause for vacation period
```

### F — Failed Payment Dunning
```
- Subscription auto-charge fails
- Day 1: retry + email notification
- Day 4: retry + WhatsApp
- Day 7: retry + suspend service
- Day 14: cancel subscription + write off
```

### G — Coupon Applied to Subscription
```
- Customer applies "WELCOME50" → 50% off first 3 months
- Cycle 1-3: 250 SAR each
- Cycle 4+: 500 SAR each
```

### H — Early Payoff
```
- 6 installments, 4 paid (8K), 2 remaining (4K)
- Customer wants to settle early
- Discount offer: 200 SAR off
- Final payment: 3,800
- Plan closed
```

---

## 3. تدفق البيانات

```
[Subscribe]
POST /subscriptions { customerId, planId, paymentMethodId, couponCode? }
   ↓ create Subscription (status=TRIAL or ACTIVE)
   ↓ schedule first charge (after trial)
   ↓ store payment method (tokenized)

[Cron Daily]
   ↓ find Subscriptions due today
   ↓ charge payment method
   ↓ if success → create Invoice + JE
   ↓ if fail → retry sequence + dunning

[Cancel]
POST /subscriptions/:id/cancel { immediate?, reason }
   ↓ if immediate → end-now + refund pro-rated
   ↓ else → cancel at period end

[Upgrade/Downgrade]
POST /subscriptions/:id/change-plan { newPlanId, effective: NOW|NEXT_CYCLE }
   ↓ calculate proration
   ↓ apply credit/charge difference
   ↓ update plan
```

---

## 4. Prisma Schema (إضافات)

```prisma
model SubscriptionPlan {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  description     String?
  
  productId       Int?
  
  billingCycle    String    // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
  cycleInterval   Int       @default(1)
  
  basePrice       Decimal   @db.Decimal(20,4)
  currency        String    @default("SAR")
  setupFee        Decimal?  @db.Decimal(20,4)
  
  trialDays       Int?
  
  cancelMode      String    @default("END_OF_PERIOD")  // IMMEDIATE | END_OF_PERIOD
  
  // Tiered/metered
  hasUsage        Boolean   @default(false)
  usageMeter      String?
  includedUnits   Int?
  overagePrice    Decimal?  @db.Decimal(20,4)
  usageCap        Int?
  
  // Add-ons
  allowedAddOnIds Int[]
  
  active          Boolean   @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
}

model Subscription {
  id              Int       @id @default(autoincrement())
  subscriptionNumber String @unique
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  planId          Int
  plan            SubscriptionPlan @relation(fields: [planId], references: [id])
  
  status          String    @default("TRIAL")  // TRIAL | ACTIVE | PAUSED | PAST_DUE | CANCELLED | EXPIRED
  
  startDate       DateTime
  trialEndsAt     DateTime?
  currentPeriodStart DateTime
  currentPeriodEnd DateTime
  
  cancelAt        DateTime?
  cancelledAt     DateTime?
  endedAt         DateTime?
  
  cancelReason    String?
  
  // Payment
  paymentMethodId Int?
  
  // Pricing override
  customPrice     Decimal?  @db.Decimal(20,4)
  
  // Coupon
  couponId        Int?
  
  // Usage tracking
  currentCycleUsage Int     @default(0)
  totalUsage      Int       @default(0)
  
  invoices        SubscriptionInvoice[]
  events          SubscriptionEvent[]
  addOns          SubscriptionAddOn[]
}

model SubscriptionAddOn {
  id              Int       @id @default(autoincrement())
  subscriptionId  Int
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  
  addOnPlanId     Int
  quantity        Int       @default(1)
  startDate       DateTime
  endDate         DateTime?
}

model SubscriptionInvoice {
  id              Int       @id @default(autoincrement())
  subscriptionId  Int
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  
  cycleStart      DateTime
  cycleEnd        DateTime
  
  baseAmount      Decimal   @db.Decimal(20,4)
  usageAmount     Decimal?  @db.Decimal(20,4)
  addOnAmount     Decimal?  @db.Decimal(20,4)
  prorationAmount Decimal?  @db.Decimal(20,4)
  discountAmount  Decimal?  @db.Decimal(20,4)
  taxAmount       Decimal?  @db.Decimal(20,4)
  totalAmount     Decimal   @db.Decimal(20,4)
  
  status          String    @default("PENDING")  // PENDING | PAID | FAILED | DISPUTED | REFUNDED
  
  invoiceId       Int?      // link to SalesInvoice
  
  attemptCount    Int       @default(0)
  nextAttemptAt   DateTime?
  
  paidAt          DateTime?
  failureReason   String?
  
  createdAt       DateTime  @default(now())
}

model SubscriptionEvent {
  id              Int       @id @default(autoincrement())
  subscriptionId  Int
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  
  type            String    // 'CREATED' | 'TRIAL_END' | 'RENEWED' | 'UPGRADED' | 'DOWNGRADED' | 'PAUSED' | 'RESUMED' | 'CANCELLED' | 'PAYMENT_FAILED' | 'PAYMENT_RETRY' | 'EXPIRED'
  data            Json?
  occurredAt      DateTime  @default(now())
  performedByUserId String?
}

model SubscriptionUsage {
  id              Int       @id @default(autoincrement())
  subscriptionId  Int
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  meter           String
  units           Int
  occurredAt      DateTime  @default(now())
  source          String?
  
  @@index([subscriptionId, occurredAt])
}

model InstallmentPlan {
  id              Int       @id @default(autoincrement())
  planNumber      String    @unique
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  invoiceId       Int?
  totalAmount     Decimal   @db.Decimal(20,4)
  currency        String
  
  installmentCount Int
  installmentAmount Decimal @db.Decimal(20,4)
  
  startDate       DateTime
  
  // Payment method
  paymentMethodId Int?
  
  status          String    @default("ACTIVE")  // ACTIVE | COMPLETED | DEFAULTED | CANCELLED | EARLY_PAYOFF
  
  defaultedAt     DateTime?
  earlyPayoffDate DateTime?
  earlyPayoffDiscount Decimal? @db.Decimal(20,4)
  
  schedule        InstallmentSchedule[]
  
  createdAt       DateTime  @default(now())
}

model InstallmentSchedule {
  id              Int       @id @default(autoincrement())
  planId          Int
  plan            InstallmentPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  installmentNumber Int
  dueDate         DateTime
  amount          Decimal   @db.Decimal(20,4)
  
  status          String    @default("PENDING")  // PENDING | PAID | PAID_LATE | OVERDUE | WAIVED
  paidAt          DateTime?
  paidAmount      Decimal?  @db.Decimal(20,4)
  paymentInvoiceId Int?
  
  attempts        Int       @default(0)
  lastAttemptAt   DateTime?
  
  lateFeeApplied  Decimal?  @db.Decimal(20,4)
  
  @@unique([planId, installmentNumber])
}

model RecurringInvoiceTemplate {
  id              Int       @id @default(autoincrement())
  templateNumber  String    @unique
  name            String
  
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  frequency       String    // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CRON'
  cronExpression  String?
  
  nextRunDate     DateTime
  lastRunDate     DateTime?
  
  endDate         DateTime?
  occurrencesLimit Int?
  occurrencesCount Int      @default(0)
  
  // Template
  description     String?
  lines           Json      // [{productId, qty, price, description}]
  
  paymentTerms    String?
  currency        String
  
  // Auto-actions
  autoSendEmail   Boolean   @default(true)
  autoCharge      Boolean   @default(false)
  paymentMethodId Int?
  
  // Status
  active          Boolean   @default(true)
  pausedUntil     DateTime?
  
  generatedInvoices Int     @default(0)
  totalGenerated  Decimal   @default(0) @db.Decimal(20,4)
  
  createdAt       DateTime  @default(now())
}

model PaymentMethod {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  type            String    // 'CARD' | 'BANK_ACCOUNT' | 'WALLET' | 'TABBY' | 'TAMARA'
  
  // Card (tokenized via processor)
  cardToken       String?   // not raw PAN
  cardLast4       String?
  cardBrand       String?
  cardExpiry      String?   // MM/YY
  cardholderName  String?
  
  // Bank
  iban            String?
  bankName        String?
  
  isDefault       Boolean   @default(false)
  active          Boolean   @default(true)
  
  validatedAt     DateTime?
  
  createdAt       DateTime  @default(now())
}
```

---

## 5. Forms & Fields

### Form A: Subscribe Customer
| Field | Type | Required |
|-------|------|----------|
| customerId | autocomplete | ✓ |
| planId | dropdown | ✓ |
| startDate | datepicker | ✓ |
| paymentMethodId | dropdown | ✓ |
| couponCode | text | ✗ |
| addOns | multi-select | ✗ |
| customPrice | money | ✗ |

### Form B: Installment Plan Creator
| Field | Type | Required |
|-------|------|----------|
| customerId | autocomplete | ✓ |
| invoiceId | dropdown | ✗ (or amount) |
| totalAmount | money | ✓ |
| installmentCount | number | ✓ |
| frequency | dropdown | ✓ |
| firstDueDate | datepicker | ✓ |
| paymentMethodId | dropdown | ✓ |
| autoCharge | toggle | ✓ |

### Form C: Recurring Invoice Template
| Field | Type | Required |
|-------|------|----------|
| customerId | autocomplete | ✓ |
| frequency | dropdown | ✓ |
| nextRunDate | datepicker | ✓ |
| endDate | datepicker | ✗ |
| lines | dynamic table | ✓ min 1 |
| autoSend | toggle | ✓ |
| autoCharge | toggle | ✓ |

### Form D: Plan Change
| Field | Type | Required |
|-------|------|----------|
| subscriptionId | hidden | ✓ |
| newPlanId | dropdown | ✓ |
| effective | radio | ✓ NOW/NEXT_CYCLE |
| reason | textarea | ✗ |

### Form E: Cancel Subscription
| Field | Type | Required |
|-------|------|----------|
| subscriptionId | hidden | ✓ |
| immediate | toggle | ✓ |
| reason | dropdown | ✓ |
| feedback | textarea | ✗ |

### Form F: Add Payment Method
| Field | Type | Required |
|-------|------|----------|
| type | radio | ✓ |
| iframe (card) | secure | conditional |
| iban | text | conditional |
| isDefault | toggle | ✓ |

---

## 6. Tables & Columns

### Grid A: Subscriptions
- Sub #, Customer, Plan, Status, Cycle Start/End, Next Renewal, MRR, Lifetime Value, Trial Ends, Cancel At

### Grid B: Subscription Invoices
- Cycle, Amount, Status, Attempts, Last Attempt, Next Attempt, Paid At

### Grid C: Subscription Events Timeline
- Date, Type, Data, Performed By

### Grid D: Installment Plans
- Plan #, Customer, Total, Count, Next Due, Status, Defaulted, Days Past Due

### Grid E: Installment Schedule
- # / N, Due Date, Amount, Paid Amount, Status, Attempts, Late Fee

### Grid F: Recurring Templates
- Template #, Customer, Frequency, Next Run, Last Run, Generated Count, Active

### Grid G: Payment Methods
- Type, Last 4 / IBAN, Brand, Expiry, Default, Validated

---

## 7. Buttons & Actions (selected)

| Button | Color | Permission |
|--------|-------|------------|
| btn-sub-create | + | 🟢 sales |
| btn-sub-upgrade | ⬆ ترقية | 🟦 sales |
| btn-sub-downgrade | ⬇ تخفيض | 🟡 sales |
| btn-sub-pause | إيقاف | 🟡 sales |
| btn-sub-resume | استئناف | 🟢 sales |
| btn-sub-cancel | إلغاء | 🔴 sales + reason |
| btn-sub-renew-now | تجديد الآن | 🟦 ar |
| btn-sub-charge-retry | إعادة المحاولة | 🟦 ar |
| btn-installment-create | + خطة أقساط | 🟢 ar |
| btn-installment-modify | تعديل | 🟡 ar_supervisor |
| btn-installment-early-payoff | سداد مبكر | 🟢 customer/cashier |
| btn-installment-default | تعليق كمتعثر | 🔴 ar_manager |
| btn-installment-waive | إعفاء قسط | 🔴 cfo + reason |
| btn-recurring-create | + قالب متكرر | 🟢 ar |
| btn-recurring-pause | إيقاف مؤقت | 🟡 ar |
| btn-recurring-run-now | تشغيل الآن | 🟦 ar |
| btn-recurring-end | إنهاء | 🔴 ar_supervisor |
| btn-payment-method-add | + طريقة دفع | 🟢 customer/sales |
| btn-payment-method-default | افتراضي | 🟦 customer/sales |
| btn-payment-method-validate | التحقق | 🟢 sales |
| btn-payment-method-remove | حذف | 🔴 customer + sales |
| btn-usage-record | تسجيل استخدام | 🟦 system |
| btn-plan-create | + خطة اشتراك | 🟢 marketing_mgr |
| btn-plan-archive | أرشفة | 🟡 marketing_mgr |
| btn-prorate-preview | معاينة الـ proration | ⬜ ar |
| btn-export-mrr | تصدير MRR | ⬜ cfo |
| btn-churn-analysis | تحليل churn | ⬜ marketing |
| btn-coupon-apply-sub | تطبيق كوبون | 🟢 marketing |

---

## 8. Search & Filters

- Subscriptions: status, plan, customer, MRR range, trial ending soon, cancel at risk
- Installments: status, customer, days overdue, plan, default risk
- Recurring: frequency, next run, customer, active
- Payment methods: type, expiring soon

---

## 9. Reports & Exports

- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost ratio)
- Trial Conversion
- Plan Mix
- Usage Reports
- Failed Payments
- Revenue Recognition Schedule
- Installment Aging
- Recurring Invoice Performance

---

## 10. Dashboards & Widgets

- KPIs: MRR, ARR, Churn %, Trials Active, At Risk, LTV
- Charts: MRR trend, Churn cohort, Plan mix
- Lists: Trial ending, Past due, Upcoming renewals

---

## 11. Notifications

- Trial ending (3d)
- Payment success/failure
- Renewal reminder
- Plan change confirmation
- Cancellation confirmation
- Card expiring soon
- Usage approaching cap
- Installment due
- Installment overdue
- Recurring invoice generated

---

## 12. Permissions Matrix

| Action | Sales | AR | AR Mgr | CFO | Customer |
|--------|-------|-----|--------|-----|----------|
| Subscribe | ✓ | ✓ | ✓ | ✓ | ✓ self |
| Cancel | ✓ | ✗ | ✓ | ✓ | ✓ self |
| Plan change | ✓ | ✗ | ✓ | ✓ | ✓ self |
| Custom price | ✗ | ✗ | ✗ | ✓ | ✗ |
| Manage payment | ✓ | ✓ | ✓ | ✓ | ✓ own |
| Waive installment | ✗ | ✗ | ✗ | ✓ | ✗ |
| View MRR/ARR | ✗ | ✓ | ✓ | ✓ | ✗ |
| Edit plans | ✗ | ✗ | ✗ | ✓ | ✗ |

---

## 13. Integrations

- Stripe / PayTabs / Mada / Tap Payments (cards)
- Tabby / Tamara (BNPL)
- SADAD (KSA) / SAB / NCB (bank debits)
- Email/WhatsApp/SMS (notifications)
- Accounting auto-journal

---

## 14. Keyboard Shortcuts

- `Ctrl+S` Subscribe
- `Ctrl+I` Installment plan
- `Ctrl+R` Recurring template

---

## 15. Mobile / Print

- Mobile: subscription management portal
- Print: installment schedule sheet

---

## 16. Audit & Logging

- All subscription lifecycle events
- Plan changes (audit history)
- Failed payment attempts
- Manual overrides (waivers, custom prices)

---

## 17. Test Cases

```typescript
describe('Subscription Lifecycle', () => {
  test('trial → active → renewed')
  test('upgrade prorated correctly')
  test('downgrade at next cycle')
  test('cancellation immediate vs end-of-period')
})

describe('Failed Payment Dunning', () => {
  test('retry sequence')
  test('suspend after X failures')
  test('cancel after Y days')
})

describe('Usage-based', () => {
  test('within cap → base only')
  test('overage charged correctly')
  test('cap stops usage')
})

describe('Installment', () => {
  test('schedule generation')
  test('auto-charge')
  test('early payoff discount')
  test('default workflow')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Customer cancels mid-trial | end immediately, no charge |
| Plan upgraded then immediately cancelled | refund proration |
| Card expires mid-cycle | retry + email + grace |
| Customer changes payment method while past due | retry latest with new method |
| Multiple subscriptions same customer | each separate |
| Refund of past invoice | no clawback of usage |
| Currency redenomination | use rate at cycle start |

---

**نهاية مواصفات #18** • 8 سيناريوهات • 9 جداول • 6 forms • 7 grids • 28 button • 12 reports
