# النقص #16: Customer Master + Credit + B2B Portal — مواصفات تفصيلية

> **المرجعيات:** SAP Business Partner، Oracle Customer Master、NetSuite CRM Master、SIMAH (KSA Credit Bureau)

---

## 1. البرومنت الكامل

```
وسّع Customer Master لمستوى enterprise:

موجود:
- prisma: Customer + CustomerCreditScore + CustomerCreditScoreHistory + CustomerCreditAction + CustomerSubscription
- src/app/customers, /api/customers
- src/app/b2b (login + shop + checkout)

النواقص:

A) Customer Master (360°):
   - Multiple bill-to / ship-to addresses
   - Multiple contacts (with roles + decision makers)
   - Customer hierarchy (parent/sub)
   - Customer category/segment (VIP/Regular/Risky)
   - KYC documents (CR, VAT cert, ID, etc.)
   - Customer lifecycle stages
   - Tags + custom fields
   - Bank account info (for refunds)
   - Tax exemption status
   - Default payment terms + currency
   - Default shipping carrier
   - Approval routing per customer

B) Credit Management:
   - Credit limit (configurable per customer)
   - Credit utilization real-time
   - Credit hold rules
   - Credit review schedule (annual/quarterly)
   - SIMAH integration (KSA credit bureau)
   - Internal scoring (payment history + dso + disputes)
   - Credit insurance (Coface, Atradius)
   - Pre-approval workflow for large orders

C) B2B Portal:
   - Self-registration (with approval)
   - Multi-user per company (with roles)
   - Product catalog (custom price list)
   - Order placement with approval workflow
   - Reorder from history
   - Order tracking
   - Invoice download + payment
   - Statement download
   - Support ticket creation
   - Document repository

D) Customer 360°:
   - Activity timeline
   - Open balance + aging
   - Total revenue + LTV
   - Last interaction
   - Open disputes
   - Sales/AR/Service combined view

E) GDPR / PDPL:
   - Data subject access request (export)
   - Right to deletion (anonymize)
   - Consent tracking
   - Data retention policy

F) APIs (40+ endpoints), UI (15 pages), Tests 60+
```

---

## 2. السيناريوهات (8)

### A — New Customer Onboarding
```
1. Sales rep: [+ Customer]
2. Wizard:
   - Company Info: name, CR, VAT
   - Contacts: 3 added (CEO, Procurement, Accounts)
   - Addresses: 2 ship-to (Riyadh, Jeddah) + 1 bill-to
   - Payment Terms: Net 30
   - Credit Limit: 500K SAR (requires CFO approval)
3. Approval workflow → CFO approves
4. KYC docs uploaded (CR copy, VAT cert)
5. Tax exemption check
6. SIMAH check (optional) → score returned
7. B2B portal credentials sent
```

### B — Credit Limit Increase Request
```
1. Customer needs higher limit (current 500K, wants 1M)
2. Sales rep: [Request Credit Increase]
3. Form: requested amount + justification + supporting docs
4. Workflow: Sales Mgr → CFO → CEO (>1M)
5. SIMAH re-check + financial statement review
6. Approved with conditions (PDC required for orders > 200K)
7. Customer notified
```

### C — Credit Hold Trigger
```
- Customer balance: 480K, limit: 500K
- New order: 100K → would exceed
- System blocks order at SO approval stage
- Options: 
  - Reduce order
  - Customer pays first
  - Manager override (with reason + temporary increase)
```

### D — B2B Self-Service Portal
```
1. Customer admin logs in
2. Browses catalog (custom prices)
3. Adds 5 items to cart
4. Checkout: selects ship-to, PO number, expected date
5. Internal approval (if exceeds employee limit)
6. Order submitted → SO created in ERP
7. Order tracking: Confirmed → Picked → Shipped (with tracking)
8. Receives invoice → pays online (Mada/STC)
9. Downloads statement
10. Opens support ticket about damaged item
```

### E — Multi-Subsidiary Customer
```
- Parent: ABC Holding
- Subs: ABC Saudi, ABC UAE, ABC Egypt
- Each sub has own:
  - Credit limit
  - Bill-to / Ship-to
  - Currency (SAR/AED/EGP)
  - Account manager
- Consolidated view at parent level:
  - Total exposure
  - Combined revenue
  - Hierarchical reports
```

### F — KYC Document Expiry
```
- Customer's CR (Commercial Registration) expires in 30 days
- Cron triggers alert
- Email to customer + AR
- Status: KYC_PENDING_RENEWAL
- New orders flagged for follow-up
- After expiry + 30d grace: account suspended
```

### G — GDPR Right to Deletion
```
- Customer requests deletion
- /api/customers/:id/gdpr-delete
- System:
  - anonymizes personal data (name → "Deleted Customer X", email → null, phone → null)
  - retains transactional records (legal requirement)
  - removes from marketing lists
  - logs deletion event
- Cannot reverse
```

### H — SIMAH Credit Check
```
- Pre-approval for new customer
- POST /credit/simah-check { customerId }
- Calls SIMAH API → score returned
- score < 500 → rejection
- score 500-700 → reduced limit (50%)
- score > 700 → full limit
- Result stored + linked to credit decision
```

---

## 3. تدفق البيانات

```
[Create Customer]
POST /customers
   ↓ create Customer
   ↓ create CustomerContact[] + Address[] + KYC docs
   ↓ if creditLimit > X → trigger approval workflow
   ↓ create CustomerCreditScore (initial)
   ↓ trigger SIMAH check (if enabled)
   ↓ generate B2B portal credentials (if requested)

[Credit Hold Check]
Real-time on order creation:
   ↓ get customer.creditLimit + currentExposure (open AR)
   ↓ if order amount + exposure > limit → block
   ↓ block reason: CREDIT_LIMIT_EXCEEDED

[B2B Order]
POST /b2b/checkout (B2B JWT)
   ↓ validate customer + portal user
   ↓ apply price list
   ↓ check internal approval (if user has limit)
   ↓ create SalesOrder
```

---

## 4. Prisma Schema

```prisma
model Customer {
  // ... existing
  
  // Hierarchy
  parentCustomerId    Int?
  parentCustomer      Customer?   @relation("CustomerHierarchy", fields: [parentCustomerId], references: [id])
  subCustomers        Customer[]  @relation("CustomerHierarchy")
  
  // Segmentation
  segment             String?     // 'VIP' | 'STRATEGIC' | 'STANDARD' | 'AT_RISK'
  tier                String?     // 'TIER_1' | 'TIER_2' | 'TIER_3'
  industry            String?
  size                String?
  
  // Lifecycle
  lifecycleStage      String      @default("PROSPECT")
  customerSince       DateTime?
  
  // Tax
  taxExempt           Boolean     @default(false)
  taxExemptionNumber  String?
  taxExemptionExpiry  DateTime?
  
  // Default settings
  defaultPaymentTerm  String?
  defaultCurrency     String      @default("SAR")
  defaultShipMethod   String?
  defaultPriceListId  Int?
  
  // KYC
  kycStatus           String      @default("PENDING")  // PENDING | VERIFIED | EXPIRED | REJECTED
  kycVerifiedAt       DateTime?
  kycExpiresAt        DateTime?
  
  // Tags
  tags                String[]
  customFields        Json?
  
  // Bank account
  bankAccountIban     String?
  bankAccountName     String?
  
  // Marketing
  marketingOptIn      Boolean     @default(false)
  marketingOptInDate  DateTime?
  unsubscribedAt      DateTime?
  
  // Relations
  addresses           CustomerAddress[]
  contacts            CustomerContact[]
  kycDocuments        CustomerKycDocument[]
  portalUsers         CustomerPortalUser[]
  notes               CustomerNote[]
  
  @@index([segment, tier, lifecycleStage])
  @@index([parentCustomerId])
}

model CustomerAddress {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  type            String    // 'BILL_TO' | 'SHIP_TO' | 'BOTH'
  isDefault       Boolean   @default(false)
  
  label           String?   // "Main Office", "Warehouse 2"
  attentionTo     String?
  street1         String
  street2         String?
  city            String
  state           String?
  postalCode      String?
  country         String    @default("SA")
  
  phone           String?
  fax             String?
  
  geoLat          Float?
  geoLng          Float?
  
  active          Boolean   @default(true)
}

model CustomerContact {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  firstName       String
  lastName        String
  jobTitle        String?
  department      String?
  email           String?
  phone           String?
  mobile          String?
  
  isPrimary       Boolean   @default(false)
  isDecisionMaker Boolean   @default(false)
  isAccountant    Boolean   @default(false)
  
  preferredLanguage String  @default("ar")
  preferredChannel  String? // EMAIL | PHONE | WHATSAPP | SMS
  
  active          Boolean   @default(true)
}

model CustomerKycDocument {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  documentType    String    // 'COMMERCIAL_REG' | 'VAT_CERT' | 'NATIONAL_ID' | 'PASSPORT' | 'IBAN_LETTER' | 'TAX_CERT' | 'OTHER'
  documentNumber  String?
  issuedDate      DateTime?
  expiryDate      DateTime?
  
  fileUrl         String
  fileName        String
  
  verified        Boolean   @default(false)
  verifiedAt      DateTime?
  verifiedByUserId String?
  
  uploadedAt      DateTime  @default(now())
  uploadedByUserId String
}

model CustomerCreditScore {
  // ... existing extended
  customerId          Int       @unique
  
  internalScore       Int       // 0-100
  externalSimahScore  Int?
  externalSimahDate   DateTime?
  
  paymentHistoryScore Int?
  dsoScore            Int?
  disputesScore       Int?
  exposureScore       Int?
  
  recommendation      String?   // 'APPROVE' | 'CONDITIONAL' | 'REJECT' | 'REVIEW'
  
  lastReviewDate      DateTime?
  nextReviewDate      DateTime?
  
  riskCategory        String?   // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

model CreditApprovalRequest {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  requestedAmount Decimal   @db.Decimal(20,4)
  currentLimit    Decimal   @db.Decimal(20,4)
  justification   String    @db.Text
  
  supportingDocs  Json?
  
  status          String    @default("PENDING")  // PENDING | APPROVED | REJECTED | CONDITIONALLY_APPROVED
  conditions      String?   @db.Text
  
  approvalChain   Json      // [{level, approverUserId, status, decidedAt, comments}]
  
  finalApprovalAt DateTime?
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  
  requestedByUserId String
  requestedAt     DateTime  @default(now())
}

model CustomerPortalUser {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  email           String    @unique
  passwordHash    String
  firstName       String
  lastName        String
  phone           String?
  
  role            String    @default("USER")  // ADMIN | MANAGER | USER | ACCOUNTANT
  permissions     String[]
  
  approvalLimit   Decimal?  @db.Decimal(20,4)  // requires approval if order > limit
  
  active          Boolean   @default(true)
  emailVerified   Boolean   @default(false)
  mfaEnabled      Boolean   @default(false)
  
  lastLoginAt     DateTime?
  loginCount      Int       @default(0)
  
  createdAt       DateTime  @default(now())
}

model CustomerNote {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  type            String    // 'GENERAL' | 'CREDIT' | 'COMMERCIAL' | 'COMPLAINT' | 'INTERNAL'
  visibility      String    @default("INTERNAL")  // INTERNAL | EXTERNAL
  
  subject         String
  body            String    @db.Text
  
  pinnedUntil     DateTime?
  
  createdByUserId String
  createdAt       DateTime  @default(now())
}

model CustomerInteraction {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  type            String    // 'CALL' | 'EMAIL' | 'MEETING' | 'COMPLAINT' | 'SUPPORT' | 'PURCHASE' | 'PAYMENT'
  channel         String?
  occurredAt      DateTime  @default(now())
  
  description     String?
  outcome         String?
  
  recordedByUserId String
}

model CustomerSegment {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  
  criteria        Json      // {minRevenue, minOrders, lifecycleStage, tags, etc.}
  
  members         Customer[]?
  
  // Benefits
  defaultPriceListId Int?
  defaultDiscountPercent Decimal? @db.Decimal(5,2)
  
  active          Boolean   @default(true)
}
```

---

## 5. Forms & Fields

### Form A: Customer Master (Wizard)
- Step 1: Company info (name, CR, VAT, parent)
- Step 2: Addresses (multi)
- Step 3: Contacts (multi, decision makers)
- Step 4: Payment & Credit (terms, limit, currency)
- Step 5: KYC documents (upload)
- Step 6: Tags & custom fields
- Step 7: Portal users (optional)
- Step 8: Review & Save

### Form B: Credit Limit Increase Request
| Field | Type | Required |
|-------|------|----------|
| customerId | hidden | ✓ |
| requestedAmount | money | ✓ |
| justification | textarea | ✓ min 100 |
| supportingDocs | file upload | ✓ |
| conditions accepted | checkbox | ✓ |

### Form C: B2B Self-Registration
- Company info + admin user contact
- → submitted → manual approval

### Form D: B2B Portal User
| Field | Type | Required |
|-------|------|----------|
| email | email | ✓ |
| firstName + lastName | text | ✓ |
| role | dropdown | ✓ |
| approvalLimit | money | ✗ |
| permissions | checkboxes | ✗ |

### Form E: KYC Document Upload
- documentType, number, issuedDate, expiryDate, file

### Form F: Customer Note
- type, visibility, subject, body, pinnedUntil

---

## 6. Tables & Columns

### Grid A: Customers Master
| Column | Width |
|--------|-------|
| Code | 100 |
| Name | 220 |
| Type | badge | 100 |
| Segment | badge | 100 |
| Tier | badge | 100 |
| Industry | 130 |
| Currency | 80 |
| Credit Limit | money | 130 |
| Outstanding | money | 130 |
| Available | money | 130 |
| Utilization | progress | 110 |
| KYC | badge | 100 |
| Lifecycle | badge | 110 |
| Created | date | 110 |
| Last Activity | date | 130 |
| Actions: [View 360] [Edit] [Credit Action] | 250 |

### Grid B: Customer 360° (single page)
- Header: name, logo, segment, balance, credit util
- Tabs: Overview / Contacts / Addresses / Orders / Invoices / Payments / Statements / Activities / Notes / Documents / KYC / Portal Users

### Grid C: Credit Approval Queue
| Column | Width |
|--------|-------|
| Customer | 200 |
| Requested | money | 130 |
| Current Limit | money | 130 |
| Increase | money | 130 |
| Justification | text | 250 |
| Status | badge | 130 |
| Workflow Stage | step | 200 |
| Days Open | number | 100 |
| Actions: [Approve] [Reject] [Add Conditions] | 250 |

### Grid D: Portal Users
| Column | Width |
|--------|-------|
| Customer | 200 |
| User | 180 |
| Email | 200 |
| Role | badge | 100 |
| Approval Limit | money | 130 |
| Active | toggle | 80 |
| MFA | badge | 80 |
| Last Login | datetime | 150 |
| Actions: [Edit] [Reset PW] [Disable] | 200 |

### Grid E: KYC Document Status
| Column | Width |
|--------|-------|
| Customer | 200 |
| Document Type | badge | 130 |
| Number | text | 130 |
| Issued | date | 110 |
| Expires | date | 110 |
| Days to Expire | number | 110 (red <30) |
| Verified | toggle | 80 |
| Actions: [View] [Verify] [Request Renewal] | 220 |

---

## 7. Buttons & Actions

| ID | الزر | اللون | Permission |
|----|------|-------|------------|
| btn-customer-create | + عميل | 🟢 | role.sales |
| btn-customer-import | استيراد جماعي | ⬜ | role.sales_supervisor |
| btn-customer-merge | دمج | 🟡 | role.sales_manager |
| btn-customer-archive | أرشفة | 🔴 | role.sales_manager + reason |
| btn-customer-anonymize-gdpr | حذف GDPR | 🔴 | role.dpo + multi-step |
| btn-credit-increase-request | طلب زيادة الحد | 🟡 | role.sales |
| btn-credit-approve | اعتماد الحد | 🟢 | role.cfo |
| btn-credit-reject | رفض | 🔴 | role.cfo + reason |
| btn-credit-temporary-override | تجاوز مؤقت | 🟡 | role.cfo + duration |
| btn-credit-simah-check | فحص SIMAH | 🟦 | role.credit |
| btn-credit-recalc-score | إعادة احتساب | ⬜ | role.credit |
| btn-credit-schedule-review | جدولة مراجعة | ⬜ | role.credit |
| btn-address-add | + عنوان | 🟢 | role.sales |
| btn-address-set-default | افتراضي | 🟦 | role.sales |
| btn-address-deactivate | تعطيل | 🔴 | role.sales |
| btn-contact-add | + اتصال | 🟢 | role.sales |
| btn-contact-set-primary | جعله رئيسياً | 🟦 | role.sales |
| btn-kyc-upload | رفع وثيقة | 🟦 | role.sales |
| btn-kyc-verify | تحقق | 🟢 | role.compliance |
| btn-kyc-request-renewal | طلب تجديد | 🟡 | role.compliance |
| btn-portal-user-create | + مستخدم بوابة | 🟢 | role.sales |
| btn-portal-user-reset-pw | إعادة كلمة السر | 🟡 | role.sales |
| btn-portal-send-credentials | إرسال البيانات | 🟦 | role.sales |
| btn-note-add | + ملاحظة | 🟢 | any |
| btn-note-pin | تثبيت | 🟦 | role.sales |
| btn-export-customer-360 | تصدير شامل | ⬜ | role.sales |
| btn-customer-statement | كشف حساب | 🟦 | role.ar |
| btn-customer-aging | تحليل أعمار | ⬜ | role.ar |
| btn-segment-create | + شريحة | 🟢 | role.sales_manager |
| btn-segment-recompute-members | إعادة حساب الأعضاء | ⬜ | role.sales_manager |

---

## 8. Search & Filters

- Search: by name, code, CR, VAT, phone, email
- Filter: segment, tier, industry, lifecycle, currency, credit util range, KYC status, has open opps

---

## 9. Reports & Exports

- Customer Master Listing
- Customer 360 Report (per customer)
- Credit Exposure Report
- KYC Compliance Status
- Portal User Activity
- Customer Lifecycle Distribution
- Top 100 Customers (by revenue)
- Customer Concentration Risk
- Inactive Customers (no activity X months)
- New Customers Trend

---

## 10. Dashboards & Widgets

- KPIs: Total Customers / Active / At Risk / Credit Util %
- Charts: Revenue concentration, Lifecycle distribution, KYC status
- Lists: KYC expiring, Pending credit approvals, Recent customers

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| New customer created | in-app | sales mgr |
| KYC document expiring | email | customer + AR |
| Credit limit exceeded | email | sales + AR |
| Credit increase request | in-app | approver |
| Customer becomes inactive | email | account owner |
| Portal user reset PW | email | user |
| Customer self-registered | email | sales + admin |

---

## 12. Permissions Matrix

| Action | Sales | Sales Mgr | Credit Mgr | CFO | DPO |
|--------|-------|-----------|-----------|-----|-----|
| Create customer | ✓ | ✓ | ✗ | ✓ | ✗ |
| Edit basic | ✓ | ✓ | ✗ | ✓ | ✗ |
| Set credit limit | ✗ | ✗ | ✓ | ✓ | ✗ |
| Increase credit | ✗ | ✗ | ✓ small | ✓ | ✗ |
| KYC verify | ✗ | ✗ | ✓ | ✓ | ✗ |
| Anonymize (GDPR) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Manage portal | ✓ | ✓ | ✗ | ✓ | ✗ |
| View credit score | ✗ | ✓ | ✓ | ✓ | ✗ |
| Override credit hold | ✗ | ✗ | ✗ | ✓ | ✗ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| SIMAH (KSA) | external credit bureau |
| Coface / Atradius | credit insurance |
| Wathq (KSA) | CR verification |
| Maroof (KSA) | reputation check |
| Salesforce / HubSpot | CRM sync |
| Email/WhatsApp | notifications |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Customer search |
| `Ctrl+N` | New customer |
| `Ctrl+E` | Edit current |

---

## 15. Mobile / Print

- Mobile: customer 360, contact list
- Print: customer master sheet, KYC checklist

---

## 16. Audit & Logging

- Customer creates/edits → AuditLog
- Credit changes → CreditAction history
- KYC verifications logged
- GDPR anonymizations immutable

---

## 17. Test Cases

```typescript
describe('Customer Master', () => {
  test('multi-address default logic')
  test('hierarchy parent/sub')
  test('segment auto-assignment')
})

describe('Credit', () => {
  test('exposure calculation real-time')
  test('hold blocks new orders')
  test('temporary override works')
  test('SIMAH integration')
})

describe('B2B Portal', () => {
  test('self-registration approval flow')
  test('approval limit enforcement')
  test('reorder from history')
})

describe('GDPR', () => {
  test('anonymization preserves transactions')
  test('cannot reverse')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Same CR exists | suggest merge |
| Currency conversion in credit | use spot rate at check |
| Customer in multiple segments | use highest tier |
| KYC expired during open order | warn but allow |
| Credit increase mid-order | use new limit |
| Portal user creates order > approval limit | escalate |
| Subsidiary order against parent credit | configurable |

---

**نهاية مواصفات #16** • 8 سيناريوهات • 9 جداول • 6 forms • 5 grids • 30 button • 10 reports
