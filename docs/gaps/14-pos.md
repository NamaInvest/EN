# النقص #14: POS (Terminal + Restaurant + Sessions) — مواصفات تفصيلية

> **المرجعيات:** SAP Customer Experience POS، Oracle MICROS، Lightspeed، Square، Toast (restaurant)、Foodics、TouchBistro، Loyverse
> **معايير:** ZATCA Phase 1 (B2C simplified)、PCI-DSS

---

## 1. البرومنت الكامل

```
وسّع POS لمستوى Foodics/Toast/Lightspeed:

موجود:
- src/lib/pos-session-engine.ts
- src/app/pos, src/app/restaurant-pos
- prisma: PosSession, PosSessionMovement, RestaurantZone/Table/Session

النواقص:

A) Terminal POS (Retail):
   - Cash drawer mgmt (drops/lifts/no-sale)
   - Multiple tenders (cash + card + credit + gift card + loyalty)
   - Split payments
   - Refunds (with original)
   - Returns at POS
   - Hold/recall transactions
   - Layaway / parked orders
   - Tax-exempt customer flag
   - Discount auth (manager PIN)
   - Promo auto-apply
   - Loyalty redemption inline
   - Quick-add favorites
   - Barcode + RFID scan
   - Weight scale integration
   - Customer display (line display)
   - Receipt: print + email + WhatsApp
   - Offline mode + sync

B) Restaurant POS:
   - Floor plan editor (drag-drop tables)
   - Table status: Open/Reserved/Occupied/Cleaning/Out-of-service
   - Table capacity + min/max
   - Reservations + waitlist
   - Server assignment + sections
   - Menu items + modifiers + combos
   - Order types: Dine-in / Takeaway / Delivery / Drive-thru
   - KDS (Kitchen Display System) routing
   - Course management (appetizer/main/dessert)
   - Split bill (by item / by guest / equally)
   - Tab management
   - Tip handling (cash/card/share-pool)
   - Void/comp items (with reason + auth)
   - End-of-day Z-report
   - Shift cash-up

C) Session Management:
   - Open with starting float (counted by user)
   - Real-time movements (cash in/out/drops)
   - Variance tracking
   - End-of-shift reconciliation
   - Pre-close report
   - Final close with manager approval
   - Audit trail per session

D) Hardware Integration:
   - Receipt printers (Star/Epson)
   - Cash drawers
   - Customer-facing displays
   - Barcode scanners
   - Card readers (Mada/Visa/Mastercard via integrators)
   - Kitchen printers (with routing rules)
   - QR ordering (customer scans table QR)

E) BNPL @ POS:
   - Tabby/Tamara inline
   - Eligibility check
   - Approval flow

F) APIs (35+ endpoints): انظر القسم 7

G) UI: 12 screens

H) Tests: 50+ unit, 20 integration, 10 E2E
```

---

## 2. السيناريوهات (10)

### A — Standard Retail Sale
```
1. Cashier opens session → counts cash 1,000 SAR
2. Customer brings 3 items → cashier scans barcodes
3. POS calculates: 350 SAR + VAT 52.50 = 402.50 SAR
4. Customer pays: 200 cash + 202.50 card
5. POS:
   - prints receipt with QR (ZATCA Phase 1)
   - opens cash drawer
   - logs PosSessionMovement (CASH_IN 200, CARD 202.50)
   - creates SalesInvoice (B2C simplified)
   - submits ZATCA Phase 1 hash chain
6. End of day: cashier counts drawer
   - expected: 1,000 + cash sales = 1,200
   - actual: 1,198 → variance -2 (recorded)
   - manager approves close
```

### B — Restaurant Order Flow
```
1. Server: tap table 5 (4 guests) → opens session
2. Adds items: 2 burgers + 4 drinks + 1 fries
3. Sends to kitchen → KDS displays:
   - Burger station: 2 burgers
   - Bar: 4 drinks
   - Fryer: 1 fries
4. Kitchen marks "in progress" → "ready" → server sees
5. Server delivers → customer requests "no onions" on burger 1
   - server adds modifier (free)
   - kitchen alert
6. Mid-meal: customer adds dessert → next course
7. Bill: 4 guests want to split:
   - 2 guests share burgers + fries
   - 2 guests share drinks
   - tip 15% on total
8. Multiple payments: 2 cards + 1 cash
9. Receipt printed + table marked "Cleaning"
```

### C — Refund of Previous Sale
```
1. Customer brings old receipt
2. Cashier scans receipt QR → POS retrieves invoice
3. Selects items to refund (partial OK)
4. Reason: dropdown (defective/wrong size/etc.)
5. Refund method: original (card → reversal) or store credit
6. Manager PIN required if > 200 SAR
7. POS creates credit memo + reverses inventory
8. Receipt printed
```

### D — Held Transaction (Layaway)
```
1. Customer wants 5 items but forgot wallet
2. Cashier: [Hold] → enter customer name + phone
3. Transaction parked
4. 30 min later: customer returns
5. [Recall] → searches by phone → reopens
6. Completes payment normally
```

### E — Loyalty + Promo at POS
```
1. Customer scans loyalty card → 2,500 points balance
2. POS auto-applies "Buy 2 Get 1 Free" promo
3. Customer asks to redeem 1,000 points = 50 SAR off
4. Final: items 200 - promo 50 - loyalty 50 = 100 SAR
5. New points earned: 100 / 10 = 10 points
6. Receipt shows tier progress
```

### F — KDS Workflow
```
1. Order sent to KDS
2. Items routed by station (printer rules):
   - hot food → Hot Kitchen
   - cold food → Cold Station
   - drinks → Bar
   - desserts → Pastry
3. Each station sees only its items
4. Station marks "in progress" → "ready"
5. Server gets notification when all "ready"
6. Cooking time tracked → analytics
```

### G — Reservation + Waitlist
```
1. Customer calls: "Table for 4, 8 PM tomorrow"
2. Hostess: /restaurant-pos/reservations → check availability
3. Books table 12 → reservation confirmed
4. Customer arrives → checked in → seated
5. If table not ready → added to waitlist
6. SMS sent when ready
```

### H — End-of-Day Z-Report
```
- Manager: [Close Day]
- POS generates Z-report:
  - total sales (cash + card + other)
  - tax breakdown
  - top items
  - voids/comps with reasons
  - tip breakdown
  - cash variance per cashier
- Submit to ZATCA daily summary
- Files locked for the day
```

### I — Offline Mode
```
- Internet down → POS continues offline:
  - sales saved locally
  - hash chain maintained
  - cash drawer works
- Internet restored → auto-sync:
  - upload queued sales
  - re-validate ZATCA chain
  - alert if discrepancy
```

### J — Tabby BNPL @ POS
```
- Customer wants 2,500 SAR purchase → BNPL
- POS: [Tabby] → SMS sent to customer's phone
- Customer approves on phone (3 min)
- POS receives confirmation → completes sale
- 4 installments to Tabby; merchant gets cash now
```

---

## 3. تدفق البيانات

```
[Open Session]
POST /pos/sessions/open
   { terminalId, openingFloat, branchId }
      ↓
   create PosSession (status=OPEN)
   ↓
[Sale]
POST /pos/checkout
   { lines, payments, customerId?, loyaltyCardId? }
      ↓
   validate payments sum = total
   ↓
   create SalesInvoice (B2C simplified)
   ↓
   submit to ZATCA Phase 1
   ↓
   apply loyalty earn/redeem
   ↓
   create PosSessionMovement per payment
   ↓
   reduce stock
   ↓
   print receipt
   ↓
[Close Session]
POST /pos/sessions/close
   { closingFloat (counted), declarationsByDenomination }
      ↓
   compute expected vs counted
   variance = counted - expected
   ↓
   if variance > tolerance → require manager approval
   ↓
   PosSession.status = CLOSED
   ↓
   generate Z-report PDF
   ↓
   create JEs:
     DR Cash Bank (counted) / CR Sales
     DR/CR Variance Account
```

---

## 4. Prisma Schema (إضافات)

```prisma
model PosSession {
  // ... existing
  terminalId            String
  cashierUserId         String
  branchId              Int
  
  openedAt              DateTime    @default(now())
  closedAt              DateTime?
  
  openingFloat          Decimal     @db.Decimal(20,4)
  countedClosing        Decimal?    @db.Decimal(20,4)
  expectedClosing       Decimal?    @db.Decimal(20,4)
  variance              Decimal?    @db.Decimal(20,4)
  
  status                String      @default("OPEN")  // OPEN | CLOSING | CLOSED | RECONCILED
  
  // Z-report
  zReportUrl            String?
  zReportGeneratedAt    DateTime?
  
  // Reconciliation
  reconciledByUserId    String?
  reconciledAt          DateTime?
  reconciliationNotes   String?
  
  // Stats
  totalSales            Decimal     @default(0) @db.Decimal(20,4)
  totalRefunds          Decimal     @default(0) @db.Decimal(20,4)
  totalDiscounts        Decimal     @default(0) @db.Decimal(20,4)
  totalVoids            Decimal     @default(0) @db.Decimal(20,4)
  totalComps            Decimal     @default(0) @db.Decimal(20,4)
  txnCount              Int         @default(0)
  
  movements             PosSessionMovement[]
  invoices              PosInvoice[]
  cashDeclaration       PosCashDeclaration?
}

model PosSessionMovement {
  // ... existing
  type                  String      // CASH_IN | CASH_OUT | DROP | LIFT | NO_SALE | TIP_OUT | PAID_OUT | PAID_IN
  paymentMethod         String?     // CASH | CARD | MADA | APPLE_PAY | STC_PAY | TABBY | TAMARA
  amount                Decimal     @db.Decimal(20,4)
  reason                String?
  invoiceId             Int?
  authorizedByUserId    String?
  occurredAt            DateTime    @default(now())
  
  @@index([sessionId, type])
}

model PosCashDeclaration {
  id                    Int         @id @default(autoincrement())
  sessionId             Int         @unique
  session               PosSession  @relation(fields: [sessionId], references: [id])
  
  // Denominations (SAR)
  count500              Int         @default(0)
  count200              Int         @default(0)
  count100              Int         @default(0)
  count50               Int         @default(0)
  count20               Int         @default(0)
  count10              Int         @default(0)
  count5                Int         @default(0)
  count1                Int         @default(0)
  count50hl             Int         @default(0)  // halalas 0.50
  count25hl             Int         @default(0)
  count10hl             Int         @default(0)
  count5hl              Int         @default(0)
  count1hl              Int         @default(0)
  totalCounted          Decimal     @db.Decimal(20,4)
  
  declaredAt            DateTime    @default(now())
  declaredByUserId      String
}

model RestaurantZone {
  // ... existing (floor plan)
  layoutData            Json?       // x/y coordinates per table
}

model RestaurantTable {
  // ... existing
  capacity              Int         @default(4)
  minSeating            Int         @default(1)
  maxSeating            Int         @default(8)
  status                String      @default("AVAILABLE")  // AVAILABLE | RESERVED | OCCUPIED | CLEANING | OOS
  reservationId         Int?
  serverUserId          String?
  
  // Visual
  shape                 String      @default("RECTANGLE")  // RECTANGLE | CIRCLE | SQUARE
  positionX             Int?
  positionY             Int?
  rotation              Int         @default(0)
}

model RestaurantSession {
  // ... existing
  tableId               Int
  serverUserId          String
  guestCount            Int
  
  status                String      @default("OPEN")  // OPEN | ORDERING | EATING | PAYING | CLOSED
  
  startedAt             DateTime    @default(now())
  closedAt              DateTime?
  
  orderType             String      @default("DINE_IN")  // DINE_IN | TAKEAWAY | DELIVERY | DRIVE_THRU
  
  courses               RestaurantCourse[]
  splitBills            SplitBill[]
  
  totalSubtotal         Decimal?    @db.Decimal(20,4)
  totalTax              Decimal?    @db.Decimal(20,4)
  totalServiceCharge    Decimal?    @db.Decimal(20,4)
  totalTip              Decimal?    @db.Decimal(20,4)
  totalGrand            Decimal?    @db.Decimal(20,4)
}

model RestaurantCourse {
  id                    Int         @id @default(autoincrement())
  sessionId             Int
  session               RestaurantSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  courseNumber          Int         // 1=appetizer, 2=main, 3=dessert
  courseName            String
  itemIds               Int[]
  sentToKitchenAt       DateTime?
  servedAt              DateTime?
}

model KdsTicket {
  id                    Int         @id @default(autoincrement())
  invoiceId             Int?
  sessionId             Int?
  station               String      // 'HOT' | 'COLD' | 'BAR' | 'PASTRY' | 'GRILL'
  items                 Json
  status                String      @default("PENDING")  // PENDING | IN_PROGRESS | READY | SERVED
  createdAt             DateTime    @default(now())
  startedAt             DateTime?
  completedAt           DateTime?
  cookTimeSeconds       Int?
  alertedLate           Boolean     @default(false)
}

model TableReservation {
  id                    Int         @id @default(autoincrement())
  reservationNumber     String      @unique
  customerName          String
  customerPhone         String
  partySize             Int
  reservedDate          DateTime
  reservedTime          String      // HH:mm
  durationMinutes       Int         @default(120)
  
  tableId               Int?
  status                String      @default("CONFIRMED")  // PENDING | CONFIRMED | SEATED | NO_SHOW | CANCELLED | COMPLETED
  
  specialRequests       String?
  occasion              String?     // BIRTHDAY | ANNIVERSARY | BUSINESS | OTHER
  
  reminderSentAt        DateTime?
  arrivedAt             DateTime?
  seatedAt              DateTime?
  
  createdByUserId       String?
  createdAt             DateTime    @default(now())
}

model PosTender {
  id                    Int         @id @default(autoincrement())
  invoiceId             Int
  method                String      // CASH | CARD | MADA | APPLE_PAY | STC_PAY | LOYALTY | GIFT_CARD | TABBY | TAMARA | STORE_CREDIT
  amount                Decimal     @db.Decimal(20,4)
  
  // Card-specific
  cardLast4             String?
  cardType              String?
  authorizationCode     String?
  acquirerReference     String?
  
  // Loyalty / Gift
  loyaltyPointsRedeemed Int?
  giftCardCode          String?
  
  // BNPL
  bnplOrderId           String?
  bnplProvider          String?
  
  receivedAt            DateTime    @default(now())
  voidedAt              DateTime?
  voidedReason          String?
}

model PosHeldTransaction {
  id                    Int         @id @default(autoincrement())
  terminalId            String
  cartData              Json        // full cart snapshot
  customerName          String?
  customerPhone         String?
  notes                 String?
  heldAt                DateTime    @default(now())
  heldByUserId          String
  recalledAt            DateTime?
  recalledByUserId      String?
  expiresAt             DateTime?   // auto-clear after X hours
}

model PosTerminal {
  id                    Int         @id @default(autoincrement())
  terminalCode          String      @unique
  name                  String
  branchId              Int
  
  printerConfig         Json?
  cashDrawerConfig      Json?
  cardReaderConfig      Json?
  customerDisplayConfig Json?
  
  active                Boolean     @default(true)
  lastSyncAt            DateTime?
  
  // ZATCA per terminal
  zatcaCsr              String?     @db.Text
  zatcaCertificate      String?     @db.Text
  zatcaIcvCounter       Int         @default(0)
  zatcaPih              String?
}
```

---

## 5. Forms & Fields

### Form A: POS Checkout (full screen)
- Item list (drag/scan to add)
- Customer search + loyalty
- Discount auth modal (manager PIN)
- Tenders panel (multiple methods)
- Payment confirmation
- Receipt options (print/email/WhatsApp)

### Form B: Open Session
| Field | Type | Required |
|-------|------|----------|
| terminalId | dropdown | ✓ |
| openingFloat | money | ✓ |
| denomination breakdown | composite | ✗ |
| notes | textarea | ✗ |

### Form C: Close Session
| Field | Type | Required |
|-------|------|----------|
| countedAmount | money | ✓ |
| denomination breakdown | composite | ✓ |
| notes | textarea | conditional (if variance) |
| managerPin | password | conditional (if > tolerance) |

### Form D: Reservation
| Field | Type | Required |
|-------|------|----------|
| customerName | text | ✓ |
| customerPhone | tel | ✓ |
| partySize | number | ✓ |
| date + time | datetimepicker | ✓ |
| duration | number | ✓ default 120 |
| specialRequests | textarea | ✗ |
| occasion | dropdown | ✗ |
| sendReminderSMS | toggle | ✓ default true |

### Form E: Refund/Return
| Field | Type | Required |
|-------|------|----------|
| originalReceipt | scan/search | ✓ |
| linesToRefund | dynamic with checkbox | ✓ min 1 |
| reason | dropdown | ✓ |
| refundMethod | radio | ✓ |
| managerPin | password | conditional |

### Form F: Held Transaction
| Field | Type | Required |
|-------|------|----------|
| customerName | text | ✓ |
| customerPhone | tel | ✓ |
| notes | textarea | ✗ |
| holdDuration | dropdown | ✓ 1h/4h/24h |

---

## 6. Tables & Columns

### Grid A: Sessions Today
| Column | Width |
|--------|-------|
| Terminal | 130 |
| Cashier | user | 150 |
| Opened | datetime | 150 |
| Closed | datetime | 150 |
| Sales | money | 130 |
| Refunds | money | 110 |
| Variance | money | 110 (red if !=0) |
| Status | badge | 110 |
| Actions: [View] [Z-Report] [Close] [Reopen] | 200 |

### Grid B: Transactions
| Column | Width |
|--------|-------|
| Time | 110 |
| Receipt # | 130 |
| Cashier | 130 |
| Customer | 200 |
| Items | counter | 80 |
| Subtotal | money | 130 |
| Tax | money | 100 |
| Total | money | 130 |
| Tenders | badges | 200 |
| Status | badge | 110 |
| ZATCA | icon | 80 |
| Actions: [Print] [Email] [Refund] [Void] | 200 |

### Grid C: Floor Plan (visual)
- Drag-drop tables
- Color codes per status
- Click table → table detail / open session

### Grid D: Reservations
| Column | Width |
|--------|-------|
| Date | 110 |
| Time | 80 |
| Customer | 180 |
| Phone | 130 |
| Party | number | 80 |
| Table | 100 |
| Status | badge | 110 |
| Actions: [Confirm] [Seat] [No-Show] [Cancel] | 200 |

### Grid E: KDS Tickets
| Column | Width |
|--------|-------|
| Ticket # | 100 |
| Time | 110 |
| Table/Order | 130 |
| Items | text | 250 |
| Station | badge | 110 |
| Status | badge | 130 |
| Cook Time | seconds + alert | 110 |
| Actions: [Start] [Ready] [Bump] | 200 |

### Grid F: Held Transactions
| Column | Width |
|--------|-------|
| Held At | datetime | 150 |
| Customer | 180 |
| Phone | 130 |
| Items | counter | 80 |
| Total | money | 130 |
| Expires | countdown | 130 |
| Actions: [Recall] [Discard] | 150 |

---

## 7. Buttons & Actions

| ID | الزر | اللون | Permission |
|----|------|-------|------------|
| btn-open-session | فتح الجلسة | 🟢 | role.cashier |
| btn-close-session | إغلاق الجلسة | 🔴 | role.cashier + manager |
| btn-cash-drop | إيداع نقدي | 🟦 | role.cashier |
| btn-cash-lift | سحب نقدي | 🟦 | role.cashier + manager |
| btn-no-sale | فتح الدرج بدون بيع | 🟡 | role.cashier + reason |
| btn-paid-out | صرف من الخزينة | 🟦 | role.cashier + manager + reason |
| btn-add-item | إضافة صنف | 🟢 | role.cashier |
| btn-scan | مسح Barcode | 🟦 | role.cashier |
| btn-customer-search | بحث عميل | 🟦 | role.cashier |
| btn-apply-loyalty | تطبيق نقاط الولاء | 🟢 | role.cashier |
| btn-apply-coupon | تطبيق كوبون | 🟢 | role.cashier |
| btn-apply-discount | خصم يدوي | 🟡 | manager PIN if > X% |
| btn-tax-exempt | إعفاء ضريبي | 🟡 | manager PIN |
| btn-hold | تأجيل المعاملة | 🟦 | role.cashier |
| btn-recall | استرجاع المؤجلة | 🟦 | role.cashier |
| btn-void-line | إلغاء سطر | 🔴 | role.cashier + reason |
| btn-void-transaction | إلغاء المعاملة | 🔴 | manager PIN |
| btn-checkout | إتمام البيع | 🟢 | role.cashier |
| btn-add-tender | إضافة طريقة دفع | 🟦 | role.cashier |
| btn-print-receipt | طباعة | ⬜ | role.cashier |
| btn-email-receipt | إرسال بالبريد | 🟦 | role.cashier |
| btn-whatsapp-receipt | إرسال WhatsApp | 🟢 | role.cashier |
| btn-refund | استرداد | 🔴 | role.cashier + manager |
| btn-return | إرجاع | 🔴 | role.cashier + manager |
| btn-z-report | تقرير Z | ⬜ | role.cashier |
| btn-x-report | تقرير X (mid-day) | ⬜ | role.cashier |
| btn-table-open | فتح طاولة | 🟢 | role.server |
| btn-table-close | إغلاق طاولة | 🟦 | role.server |
| btn-table-transfer | نقل الطاولة | 🟡 | role.server + manager |
| btn-table-merge | دمج طاولات | 🟦 | role.server |
| btn-table-split | تقسيم طاولة | 🟦 | role.server |
| btn-send-to-kitchen | إرسال للمطبخ | 🟢 | role.server |
| btn-recall-from-kitchen | إلغاء من المطبخ | 🔴 | manager + reason |
| btn-comp-item | مجاني (مع مدير) | 🟡 | manager PIN + reason |
| btn-split-bill | تقسيم الفاتورة | 🟦 | role.server |
| btn-add-tip | إضافة بقشيش | 🟦 | role.server |
| btn-tip-pool | توزيع البقشيش | 🟦 | role.manager |
| btn-reservation-create | + حجز | 🟢 | role.host |
| btn-reservation-confirm | تأكيد | 🟢 | role.host |
| btn-reservation-seat | تجلسته | 🟢 | role.host |
| btn-reservation-no-show | لم يحضر | 🔴 | role.host |
| btn-reservation-cancel | إلغاء | 🔴 | role.host |
| btn-kds-start | بدء التحضير | 🟦 | role.kitchen |
| btn-kds-ready | جاهز | 🟢 | role.kitchen |
| btn-kds-bump | إلغاء/تخطي | 🔴 | role.kitchen + reason |
| btn-bnpl-tabby | Tabby | 🟦 | role.cashier |
| btn-bnpl-tamara | Tamara | 🟦 | role.cashier |
| btn-loyalty-enroll | تسجيل في الولاء | 🟢 | role.cashier |
| btn-floor-plan-edit | تعديل المخطط | ⬜ | role.manager |
| btn-terminal-config | إعدادات الجهاز | ⬜ | role.admin |
| btn-offline-sync | مزامنة | 🟦 | role.cashier |

---

## 8. Search & Filters

### Sessions:
- Date range, Cashier, Terminal, Branch, Status, Has variance, Variance range

### Transactions:
- Date range, Cashier, Tender method, Has refund, Has void, Customer, ZATCA status, Amount range

### KDS:
- Station, Status, Late items (cook time > X), Today only

### Reservations:
- Date range, Status, Phone, Party size, Has special request

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Daily Sales (Z-Report) | per cashier/terminal/branch |
| Hourly Sales | by hour heat map |
| Items Sold | top sellers, slow movers |
| Tender Analysis | mix per period |
| Variance Report | cash differences |
| Voids/Comps Report | with reasons + auth |
| Tip Report | total + per server |
| Refunds Report | with reasons |
| Cook Time Analysis | KDS performance |
| Table Turnover | utilization rate |
| Reservation Report | confirmed vs no-show |
| Server Performance | sales per server |
| Promo/Coupon Performance | redemption rate |
| Loyalty Engagement | enrollments, redemptions |

---

## 10. Dashboards & Widgets

- KPIs: Today's Sales / Open Tables / In Kitchen / Avg Ticket / Variance
- Charts: Hourly sales, Tender mix, Top items
- Lists: Late KDS tickets, Held transactions, Today's reservations

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Session opened | in-app | manager |
| Variance > tolerance | email + in-app | manager |
| KDS ticket > X minutes | bell + light | kitchen + server |
| Reservation reminder | SMS | customer (1h before) |
| Held transaction expiring | in-app | cashier |
| Manager PIN required | popup | manager |
| ZATCA submission failed | in-app | cashier |
| Card payment declined | popup | cashier |
| Cash drawer open too long | alert | cashier |
| Low inventory alert | in-app | manager |

---

## 12. Permissions Matrix

| Action | Cashier | Server | Host | Kitchen | Manager | Admin |
|--------|---------|--------|------|---------|---------|-------|
| Open/close session | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Process sale | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Apply discount > X% | PIN | PIN | ✗ | ✗ | ✓ | ✓ |
| Void transaction | PIN | PIN | ✗ | ✗ | ✓ | ✓ |
| Refund | with mgr | with mgr | ✗ | ✗ | ✓ | ✓ |
| No-sale (drawer) | ✓ + reason | ✗ | ✗ | ✗ | ✓ | ✓ |
| Cash lift | with mgr | ✗ | ✗ | ✗ | ✓ | ✓ |
| Modify table assignments | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Create reservation | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Comp items | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Edit menu | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Configure terminal | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| End-of-day Z-report | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| View other cashiers' sessions | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Mada / Visa / MC payment processors | card payments |
| Apple Pay / STC Pay / Google Pay | mobile wallets |
| Tabby / Tamara | BNPL |
| Star / Epson printers | receipts + kitchen |
| Cash drawers (any) | open via ESC/POS |
| Toledo / Mettler scales | weight items |
| Honeywell / Zebra scanners | barcode |
| Customer-facing displays | LCD live |
| QR ordering platforms | self-service |
| Foodics / Toast (data sync if migrating) | — |
| ZATCA Phase 1 | B2C simplified hash chain |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F1` | Help |
| `F2` | Customer search |
| `F3` | Discount |
| `F4` | Hold |
| `F5` | Recall |
| `F6` | Void line |
| `F7` | Print receipt |
| `F8` | Apply loyalty |
| `F9` | Manager PIN |
| `F10` | Tender (open payment) |
| `Esc` | Cancel current line |
| `Enter` | Add scanned item |
| `Ctrl+R` | Refund mode |
| `Ctrl+Z` | Undo last |

---

## 15. Mobile / Print

- Mobile POS (waiter handheld)
- QR ordering by customer
- Receipt formats (Saudi VAT compliant)
- Kitchen ticket formats
- Z/X reports

---

## 16. Audit & Logging

- Every transaction → audit trail
- Voids/Comps → require reason + manager
- Discount applications → who authorized
- Cash drawer opens → logged
- Variance adjustments → require approval

---

## 17. Test Cases

```typescript
describe('Session', () => {
  test('opens with starting float')
  test('records every cash movement')
  test('computes expected closing correctly')
  test('handles variance > tolerance')
  test('Z-report includes all sales')
})

describe('Transaction', () => {
  test('multi-tender adds to total')
  test('split payment (cash + card)')
  test('refund creates negative txn')
  test('void requires manager')
  test('hold/recall preserves cart')
})

describe('Restaurant', () => {
  test('table state machine')
  test('KDS routing by station')
  test('split bill arithmetic')
  test('tip pool calculation')
})

describe('Hardware', () => {
  test('printer fallback if offline')
  test('cash drawer kick command')
  test('barcode scan adds item')
})

describe('Offline Mode', () => {
  test('sales saved locally')
  test('hash chain maintained')
  test('sync on reconnect')
})

describe('ZATCA Phase 1', () => {
  test('hash chain unbroken')
  test('QR generated correctly')
  test('handles offline queue')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Cashier logs out mid-transaction | hold + assign to manager |
| Card payment timeout | retry + manual auth |
| Receipt printer out of paper | warn + email/WhatsApp fallback |
| Cash drawer stuck | manual override + log |
| Customer changes mind after card swiped | void + reverse |
| Restaurant table walk-out | mark as walk-out + close session as loss |
| Two servers same table conflict | optimistic lock |
| KDS station offline | route to fallback |
| ZATCA chain broken (gap detected) | alert + recovery procedure |
| BNPL approved then customer cancels | reverse tender + refund |
| Loyalty card scanned but expired | suggest renewal |
| Discount stacks (loyalty + coupon + promo) | apply per priority order |
| Tax change mid-transaction | use rate at start of tx |
| Refund of tip | reverse separately |
| Power loss during close | resume from last commit |

---

**نهاية مواصفات النقص #14**

> 10 سيناريوهات • 11 جداول schema • 6 forms • 6 grids • 50 button • 14 reports
