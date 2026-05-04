# النقص #17: Loyalty + Promotions + Coupons + Gift Cards — مواصفات تفصيلية

> **المرجعيات:** Salesforce Loyalty Cloud、Oracle CrowdTwist、SAP Customer Experience Loyalty、LoyaltyLion、Smile.io、Yotpo

---

## 1. البرومنت الكامل

```
وسّع نظام Loyalty + Promotions:

موجود:
- prisma: LoyaltyPoint, LoyaltyTransaction, Promotion, Coupon, CouponUsage, GiftCard
- src/app/loyalty, /promotions, /coupons, /gift-cards

النواقص:

A) Loyalty:
   - Multiple loyalty programs (per brand/region)
   - Points earning rules (per amount/SKU/category/event)
   - Bonus events (birthday, anniversary, milestone)
   - Tier benefits + thresholds
   - Tier upgrade/downgrade rules + grace
   - Points expiry policies
   - Member referral program
   - Reward catalog (redemption options)
   - Partner rewards
   - Lifetime value tracking
   - Member segmentation

B) Promotions:
   - Promotion types: % off, $ off, BOGO, bundle, X for $Y, free shipping, free gift
   - Eligibility: customer segment, product category, time window, channel (web/POS/B2B)
   - Stacking rules (priority, exclusive)
   - Coupon required vs auto-apply
   - Usage caps (per customer / total)
   - Geofencing (region/branch)

C) Coupons:
   - Single-use vs multi-use codes
   - Personalized codes
   - Mass generation
   - QR code printing
   - Gift coupons
   - Influencer codes (revenue share)

D) Gift Cards:
   - Physical + digital
   - Reload-able
   - Group cards
   - Expiry rules (KSA: regulated)
   - Refund handling
   - Lost/stolen → block

E) APIs (35+ endpoints), UI (12 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Earn + Redeem at POS
```
1. Customer enrolls in loyalty (POS)
2. Buys 200 SAR → earns 20 points (10:1 ratio)
3. Gets birthday bonus 100 points (auto)
4. Tier check: 1,500 points → Silver tier
5. Next visit: redeems 500 points = 50 SAR off
6. New balance: 1,000 points
```

### B — Stacking Promotions
```
- Cart: 3 × Product X @ 100 = 300
- Active promotions:
  - "20% off Product X" (auto)
  - "Free shipping > 250" (auto)
  - Coupon "WELCOME10" (10% off, manual)
- Engine applies in priority:
  - 20% off: 300 → 240
  - 10% coupon: 240 → 216
  - Free shipping: ✓
- Final: 216 + 0 shipping = 216
```

### C — Bundle Promo
```
- "Camera + Lens + Bag = 999 SAR" (saves 200)
- Customer adds 3 items
- Engine detects bundle eligibility
- Auto-discounts to 999
- All 3 items locked together (cannot remove one)
```

### D — Tier Upgrade
```
- Member at Bronze: 0-499 points
- Reaches 500 → auto Silver
- Notification + email
- Benefits unlock:
  - 10% bonus on every earn
  - Free shipping always
  - Birthday gift
- Annual review: if drops below 500 → grace 90 days → Bronze
```

### E — Mass Coupon Generation
```
- Marketing campaign needs 10,000 unique codes
- /coupons → [Bulk Generate]:
  - prefix: "BLACK24-"
  - count: 10,000
  - validity: 1 month
  - usage: 1 per customer
- Generated CSV → uploaded to email service
- Each code tracked individually
```

### F — Gift Card Sale & Redeem
```
- Customer buys 500 SAR digital gift card
- Activated immediately
- Code emailed/SMSed to recipient
- Recipient redeems at POS:
  - Scans QR
  - Buys 350 SAR → balance 150 remaining
- Recipient can check balance via portal
- Expiry: 3 years (KSA regulation)
```

### G — Referral Program
```
- Member shares referral code "JOHN-REF"
- Friend uses code at signup → both get 100 points
- After friend's first purchase: both get 500 bonus
- Tracked in ReferralProgram model
- Friend becomes member of referrer's network
```

### H — Birthday Bonus
```
- Cron daily 6 AM
- Find members with birthday today
- Grant 100 points (configurable)
- Send WhatsApp + email greeting
- Active for 7 days
```

---

## 3. تدفق البيانات

```
[Earn]
POST /loyalty/earn
   { customerId, source, amount?, productIds? }
   ↓ apply earning rules
   ↓ calculate points (with tier multiplier)
   ↓ create LoyaltyTransaction (EARN)
   ↓ update LoyaltyPoint balance
   ↓ check tier upgrade
   ↓ notify customer

[Redeem]
POST /loyalty/redeem
   { customerId, points, atTransactionId? }
   ↓ validate available points
   ↓ create LoyaltyTransaction (REDEEM)
   ↓ apply discount/reward
   ↓ update balance

[Promo Apply]
GET /promotions/applicable?customerId=X&cartItems=[...]
   ↓ for each active promo:
     check eligibility (segment, time, channel, products)
     calculate discount
   ↓ sort by priority
   ↓ apply non-conflicting
   ↓ return list of applied promos + total discount

[Coupon Validate]
POST /coupons/validate
   { code, customerId, cartTotal }
   ↓ find coupon
   ↓ check active dates
   ↓ check usage limit (per customer + total)
   ↓ check min order
   ↓ return discount amount or error
```

---

## 4. Prisma Schema (إضافات)

```prisma
model LoyaltyProgram {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  description     String?
  
  earningRatio    Decimal   @default(0.1) @db.Decimal(8,4)  // 1 point per X SAR
  redemptionRatio Decimal   @default(10) @db.Decimal(8,4)   // 1 point = X SAR off
  
  pointsExpireAfterMonths Int? // null = never
  
  active          Boolean   @default(true)
  startDate       DateTime?
  endDate         DateTime?
  
  tiers           LoyaltyTier[]
  earningRules    LoyaltyEarningRule[]
  members         LoyaltyMember[]
}

model LoyaltyTier {
  id              Int       @id @default(autoincrement())
  programId       Int
  program         LoyaltyProgram @relation(fields: [programId], references: [id])
  
  name            String    // "Bronze" | "Silver" | "Gold" | "Platinum"
  rank            Int
  pointsThreshold Int
  
  earningMultiplier Decimal @default(1) @db.Decimal(5,2)
  redemptionBonus   Decimal? @db.Decimal(5,2)
  
  benefits        Json?     // [{type, description, value}]
  
  badgeIcon       String?
  color           String?
}

model LoyaltyEarningRule {
  id              Int       @id @default(autoincrement())
  programId       Int
  program         LoyaltyProgram @relation(fields: [programId], references: [id])
  
  name            String
  type            String    // 'AMOUNT_BASED' | 'PER_PRODUCT' | 'PER_CATEGORY' | 'EVENT_BASED' | 'REFERRAL'
  
  conditions      Json      // {minAmount, productIds, categoryIds, eventType}
  pointsAwarded   Int?
  pointsFormula   String?   // "amount * 0.1"
  
  priority        Int       @default(100)
  active          Boolean   @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
}

model LoyaltyMember {
  id              Int       @id @default(autoincrement())
  programId       Int
  program         LoyaltyProgram @relation(fields: [programId], references: [id])
  customerId      Int
  
  memberCode      String    @unique
  enrollmentDate  DateTime  @default(now())
  
  currentTierId   Int?
  currentTier     LoyaltyTier? @relation(fields: [currentTierId], references: [id])
  
  pointsBalance   Int       @default(0)
  totalEarned     Int       @default(0)
  totalRedeemed   Int       @default(0)
  totalExpired    Int       @default(0)
  
  lifetimeSpend   Decimal   @default(0) @db.Decimal(20,4)
  lifetimeOrders  Int       @default(0)
  
  birthDate       DateTime?
  anniversaryDate DateTime?
  
  referralCode    String    @unique
  referredByMemberId Int?
  
  status          String    @default("ACTIVE")  // ACTIVE | SUSPENDED | CHURNED
  
  lastActivityAt  DateTime?
  
  transactions    LoyaltyTransaction[]
  rewards         LoyaltyReward[]
  referrals       LoyaltyReferral[]
}

model LoyaltyTransaction {
  // ... existing extended
  memberId        Int
  member          LoyaltyMember @relation(fields: [memberId], references: [id])
  
  type            String    // 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST' | 'BONUS' | 'REFERRAL_BONUS' | 'BIRTHDAY' | 'ANNIVERSARY'
  points          Int       // + or -
  reason          String
  ruleId          Int?
  
  invoiceId       Int?
  refundedAt      DateTime?
  
  expiresAt       DateTime?
  expired         Boolean   @default(false)
  
  occurredAt      DateTime  @default(now())
}

model LoyaltyReward {
  id              Int       @id @default(autoincrement())
  programId       Int
  
  type            String    // 'DISCOUNT' | 'PRODUCT' | 'EXPERIENCE' | 'CHARITY' | 'PARTNER'
  name            String
  description     String?
  pointsCost      Int
  
  imageUrl        String?
  termsAndConditions String? @db.Text
  
  inventoryQuantity Int?    // null = unlimited
  
  active          Boolean   @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  
  redemptions     LoyaltyRewardRedemption[]
}

model LoyaltyRewardRedemption {
  id              Int       @id @default(autoincrement())
  rewardId        Int
  reward          LoyaltyReward @relation(fields: [rewardId], references: [id])
  memberId        Int
  
  pointsRedeemed  Int
  status          String    @default("REQUESTED")  // REQUESTED | APPROVED | FULFILLED | CANCELLED
  
  requestedAt     DateTime  @default(now())
  fulfilledAt     DateTime?
  
  shippingInfo    Json?
}

model LoyaltyReferral {
  id              Int       @id @default(autoincrement())
  referrerMemberId Int
  referrerMember  LoyaltyMember @relation(fields: [referrerMemberId], references: [id])
  
  refereeMemberId Int?
  refereeEmail    String?
  refereePhone    String?
  
  status          String    @default("PENDING")  // PENDING | SIGNED_UP | FIRST_PURCHASE | REWARDED | EXPIRED
  
  signedUpAt      DateTime?
  firstPurchaseAt DateTime?
  rewardedAt      DateTime?
  
  referrerPoints  Int?
  refereePoints   Int?
}

model Promotion {
  // ... existing
  type            String    // 'PERCENT_OFF' | 'FIXED_OFF' | 'BOGO' | 'BUNDLE' | 'X_FOR_Y' | 'FREE_SHIPPING' | 'FREE_GIFT' | 'TIERED'
  
  // Conditions
  minOrderAmount  Decimal?  @db.Decimal(20,4)
  minQty          Int?
  
  // Discount specifics
  discountValue   Decimal?  @db.Decimal(20,4)
  discountType    String?   // PERCENT | FIXED
  buyQty          Int?
  getQty          Int?
  bundleProducts  Int[]?
  bundlePrice     Decimal?  @db.Decimal(20,4)
  freeProductId   Int?
  
  // Eligibility
  customerSegmentIds Int[]?
  productCategoryIds Int[]?
  productIds      Int[]?
  excludeProductIds Int[]?
  
  channels        String[]  // WEB | POS | B2B | APP
  branches        Int[]?
  
  // Usage
  maxUsesTotal    Int?
  maxUsesPerCustomer Int?
  
  // Time
  startDate       DateTime
  endDate         DateTime
  daysOfWeek      Int[]?    // 0=Sun..6=Sat
  hoursStart      String?   // HH:mm
  hoursEnd        String?
  
  // Stacking
  priority        Int       @default(100)
  isExclusive     Boolean   @default(false)  // cannot stack with others
  requiresCoupon  Boolean   @default(false)
  
  // Stats
  usageCount      Int       @default(0)
  totalDiscountGiven Decimal? @db.Decimal(20,4)
  
  active          Boolean   @default(true)
}

model Coupon {
  // ... existing
  campaignId      Int?
  
  type            String    // SINGLE_USE | MULTI_USE | PERSONALIZED
  
  promotionId     Int?
  promotion       Promotion? @relation(fields: [promotionId], references: [id])
  
  // Personalized
  assignedCustomerId Int?
  
  // Influencer
  influencerCode  Boolean   @default(false)
  revenueSharePercent Decimal? @db.Decimal(5,2)
  
  // Usage tracking
  maxUsesPerCustomer Int?    @default(1)
  
  qrCodeUrl       String?
}

model GiftCard {
  // ... existing
  type            String    @default("DIGITAL")  // PHYSICAL | DIGITAL
  
  // Recipient
  recipientName   String?
  recipientEmail  String?
  recipientPhone  String?
  giftMessage     String?   @db.Text
  
  // Scheduling
  deliveryDate    DateTime?
  delivered       Boolean   @default(false)
  deliveredAt     DateTime?
  
  // Reload
  reloadable      Boolean   @default(false)
  
  // Group
  groupId         String?   // for group cards
  
  // Status
  status          String    @default("ACTIVE")  // ACTIVE | USED | EXPIRED | BLOCKED | LOST
  blockedAt       DateTime?
  blockedReason   String?
  
  // Issued
  issuedAt        DateTime  @default(now())
  issuedByUserId  String?
  purchaseInvoiceId Int?
  
  transactions    GiftCardTransaction[]
}

model GiftCardTransaction {
  id              Int       @id @default(autoincrement())
  giftCardId      Int
  giftCard        GiftCard  @relation(fields: [giftCardId], references: [id])
  
  type            String    // PURCHASE | RELOAD | REDEEM | REFUND | EXPIRE | ADJUSTMENT
  amount          Decimal   @db.Decimal(20,4)
  
  invoiceId       Int?
  
  occurredAt      DateTime  @default(now())
  performedByUserId String?
}
```

---

## 5. Forms & Fields

### Form A: Loyalty Program
- Code, name, ratios (earn/redeem), points expiry, tiers (multi), earning rules

### Form B: Earning Rule
- Type, conditions, points formula, priority, dates

### Form C: Promotion
- Type, conditions, discount specifics, eligibility, channels, time, stacking rules

### Form D: Coupon Bulk Generator
- Prefix, count, validity, max uses, restrictions, output format

### Form E: Gift Card Issue
- Type, amount, recipient info, message, delivery date, reload toggle

### Form F: Reward Catalog Item
- Type, name, description, points cost, inventory, dates

---

## 6. Tables & Columns

### Grid A: Loyalty Members
- Member code, customer, tier, points balance, lifetime spend, last activity, status

### Grid B: Loyalty Transactions
- Date, member, type, points, reason, balance after

### Grid C: Promotions
- Name, type, dates, channels, usage count, total discount, active

### Grid D: Coupons
- Code, type, discount, max uses, used, valid dates, status

### Grid E: Gift Cards
- Code (masked), type, initial bal, current bal, recipient, status, expiry

### Grid F: Reward Catalog
- Name, type, points cost, inventory, redemptions

### Grid G: Referrals
- Referrer, referee, status, signedup, purchased, reward issued

---

## 7. Buttons & Actions

| ID | الزر | اللون | Permission |
|----|------|-------|------------|
| btn-program-create | + برنامج ولاء | 🟢 | role.marketing_mgr |
| btn-tier-create | + تير | 🟢 | role.marketing_mgr |
| btn-rule-create | + قاعدة كسب | 🟢 | role.marketing_mgr |
| btn-member-enroll | + عضو | 🟢 | role.cashier |
| btn-points-grant | إضافة نقاط | 🟦 | role.cashier |
| btn-points-deduct | خصم نقاط | 🔴 | role.marketing_mgr |
| btn-points-bulk-grant | إضافة جماعية | 🟦 | role.marketing_mgr |
| btn-tier-upgrade-manual | ترقية يدوية | 🟦 | role.marketing_mgr |
| btn-tier-recompute | إعادة حساب التيرات | ⬜ | role.admin |
| btn-points-expire-run | تشغيل انتهاء النقاط | ⬜ | role.admin |
| btn-promo-create | + عرض ترويجي | 🟢 | role.marketing |
| btn-promo-clone | استنساخ | ⬜ | role.marketing |
| btn-promo-pause | إيقاف مؤقت | 🟡 | role.marketing |
| btn-promo-end | إنهاء فوري | 🔴 | role.marketing_mgr |
| btn-coupon-create | + كوبون | 🟢 | role.marketing |
| btn-coupon-bulk-generate | + جماعي | 🟦 | role.marketing |
| btn-coupon-export-csv | تصدير CSV | ⬜ | role.marketing |
| btn-coupon-print-qr | طباعة QR | ⬜ | role.marketing |
| btn-giftcard-issue | إصدار بطاقة هدية | 🟢 | role.cashier |
| btn-giftcard-reload | إعادة شحن | 🟢 | role.cashier |
| btn-giftcard-block | حظر | 🔴 | role.manager + reason |
| btn-giftcard-refund | استرداد | 🔴 | role.cfo |
| btn-giftcard-check-balance | فحص الرصيد | 🟦 | role.cashier OR self |
| btn-reward-create | + مكافأة | 🟢 | role.marketing_mgr |
| btn-reward-redeem | استبدال | 🟢 | role.cashier |
| btn-referral-track | تتبع الإحالات | ⬜ | role.marketing |
| btn-referral-reward | مكافأة الإحالة | 🟢 | role.marketing |
| btn-export-loyalty | تصدير | ⬜ | role.marketing |
| btn-birthday-cron-trigger | تشغيل الميلاد | ⬜ | role.admin |
| btn-segment-promo-target | استهداف بشريحة | 🟦 | role.marketing |

---

## 8. Search & Filters

- Members: tier, status, points range, lifetime spend, last activity
- Transactions: type, date range, member, expired
- Promotions: type, channel, active, dates
- Coupons: type, used, expired, customer
- Gift cards: status, balance range, expiry

---

## 9. Reports & Exports

- Loyalty Member Listing
- Tier Distribution
- Points Liability (financial)
- Top Earners / Redeemers
- Promotion Performance
- Coupon Redemption Rate
- Gift Card Liability
- Referral Effectiveness
- Channel Performance

---

## 10. Dashboards & Widgets

- KPIs: Active Members / Points Liability / Promo Sales / Gift Card Balance
- Charts: Tier mix, Promo trend, Coupon usage
- Lists: Expiring points, Top promotions

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Tier upgraded | email + WhatsApp | member |
| Points expiring 30d | email | member |
| Birthday | WhatsApp | member |
| Promo started | email broadcast | segment |
| Coupon issued | email/SMS | customer |
| Gift card delivered | email | recipient |
| Referral milestone | email | referrer |

---

## 12. Permissions Matrix

| Action | Cashier | Marketing | Mktg Mgr | CFO |
|--------|---------|-----------|----------|-----|
| Enroll member | ✓ | ✓ | ✓ | ✓ |
| Earn points | auto | ✓ | ✓ | ✓ |
| Redeem points | ✓ | ✓ | ✓ | ✓ |
| Manual adjust | ✗ | ✗ | ✓ | ✓ |
| Create promotion | ✗ | ✓ | ✓ | ✓ |
| End promotion | ✗ | ✗ | ✓ | ✓ |
| Bulk coupons | ✗ | ✓ | ✓ | ✓ |
| Issue gift card | ✓ | ✓ | ✓ | ✓ |
| Block gift card | ✗ | ✗ | ✓ | ✓ |
| Refund gift card | ✗ | ✗ | ✗ | ✓ |

---

## 13. Integrations

- Salesforce Loyalty Cloud (sync)
- Email/WhatsApp/SMS (notifications)
- Payment processors (gift card top-up)
- POS terminals (real-time sync)
- E-commerce platforms

---

## 14. Keyboard Shortcuts

- `Ctrl+L` Loyalty lookup
- `Ctrl+P` Apply promo
- `Ctrl+G` Gift card scan

---

## 15. Mobile / Print

- Member app (balance + redeem)
- Gift card print template
- Coupon print w/ QR

---

## 16. Audit & Logging

- Every points transaction → AuditLog
- Manual adjustments require reason
- Gift card blocks → audit
- Promotion changes versioned

---

## 17. Test Cases

```typescript
describe('Earning', () => {
  test('amount-based earning')
  test('tier multiplier applied')
  test('birthday bonus')
})

describe('Redemption', () => {
  test('insufficient points blocks')
  test('partial redemption')
})

describe('Promotion Stacking', () => {
  test('priority order respected')
  test('exclusive prevents others')
  test('eligibility rules enforced')
})

describe('Gift Cards', () => {
  test('balance updates on redeem')
  test('expiry blocks redemption')
  test('block prevents use')
  test('reload increases balance')
})

describe('Referrals', () => {
  test('rewards on first purchase')
  test('cannot self-refer')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Member uses points after refund | recompute |
| Tier downgrade with active benefits | grace period |
| Promo conflicts with coupon | priority |
| Gift card balance < transaction | partial + alert |
| Coupon used twice (race) | unique constraint + idempotency |
| Member has multiple loyalty programs | per program separate |
| Refund of loyalty-earning purchase | clawback points |
| Birthday on Feb 29 | use Feb 28 in non-leap |

---

**نهاية مواصفات #17** • 8 سيناريوهات • 11 جداول • 6 forms • 7 grids • 30 button • 9 reports
