# البرومنتات الجاهزة — POS / CRM / Portals / Fleet / Restaurant

كل بند: **الحالة** → **سيناريو عالمي** → **فلو** → **برومنت**.

---

## P-01 — CRM Pipeline / Opportunities / Activities (Salesforce-style)

### الحالة الحالية
Leads فقط موجودة. لا Opportunities، لا Pipeline، لا Activities (calls/meetings/tasks).

### السيناريو العالمي
المندوب يبدأ Lead → Qualified → Opportunity ($100k، 60% probability) → Proposal → Won/Lost. يسجل كل اتصال/اجتماع/email. مدير المبيعات يشاهد pipeline forecast Q1: $1.2M weighted.

### فلو البيانات
```
[Lead Created] → [Qualified?] ──No──→ [Lost]
                       │
                      Yes
                       ▼
                [Opportunity Created]
                  - amount, close date
                  - stage, probability
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
         [Activities] [Notes] [Documents]
              │
              ▼
        [Stage Progression]
        Prospect → Qualify → Proposal → Negotiate → Won/Lost
              │
              ▼
        [Won → Convert to Sales Order]
              │
              ▼
        [Commission Tracking]
```

### البرومنت الجاهز
```
بناء CRM Pipeline.

1. Schema:
   Account { -- separate from Customer (CRM concept)
     id, name, industry, size (SME|MID|LARGE|ENTERPRISE), website,
     parentAccountId?, ownerId, createdAt
   }
   Contact {
     id, accountId, firstName, lastName, title, email, phone, mobile,
     isDecisionMaker bool, reportsToContactId?, createdBy
   }
   Opportunity {
     id, accountId, name, amount Decimal, currency,
     stage (PROSPECTING|QUALIFICATION|PROPOSAL|NEGOTIATION|CLOSED_WON|CLOSED_LOST),
     probability Decimal, expectedCloseDate, actualCloseDate?,
     ownerId, source, leadId?, products JSON, lostReason?,
     wonReason?, customerId? (after conversion)
   }
   Activity {
     id, type (CALL|EMAIL|MEETING|TASK|NOTE), subject, description,
     accountId?, contactId?, opportunityId?, leadId?,
     ownerId, dueDate?, completedAt?, durationMinutes?,
     outcome (POSITIVE|NEUTRAL|NEGATIVE)?
   }
   PipelineStage { id, code, name, defaultProbability, sortOrder, isWon bool, isLost bool }

2. Engine src/lib/crm-engine.ts:
   - convertLeadToOpportunity(leadId, accountData):
     * create Account + Contact
     * create Opportunity
     * mark Lead.status = CONVERTED
   - winOpportunity(oppId, customerData):
     * create Customer (if not exist)
     * create SalesOrder from products
     * update Opportunity stage = CLOSED_WON
     * trigger commission calculation
   - forecastPipeline(period, ownerId?):
     * weighted: sum(opp.amount × opp.probability)
     * by stage breakdown
     * trend vs last period

3. Activities timeline:
   - on every call/meeting/email: log
   - "next action" field on opportunity
   - email integration: log emails to/from contact's email automatically

4. API:
   - CRUD /api/crm/accounts
   - CRUD /api/crm/contacts
   - CRUD /api/crm/opportunities
   - POST /api/crm/leads/[id]/convert
   - POST /api/crm/opportunities/[id]/win
   - POST /api/crm/opportunities/[id]/lose
   - CRUD /api/crm/activities
   - GET /api/crm/forecast?period&ownerId

5. UI /crm:
   - Dashboard: pipeline funnel + forecast + recent activities
   - Accounts list + 360 view
   - Opportunities Kanban (drag stages)
   - Opportunity detail: timeline + activities + products
   - Activities calendar
   - Reports: win rate by source, by rep, by stage

6. Mobile:
   - log call quickly
   - voice notes
   - email log

7. Tests:
   - lead → opportunity conversion
   - won → customer + SO creation
   - forecast computation
   - activity timeline ordering
```

---

## P-02 — Customer Self-Service Portal (B2B)

### الحالة الحالية
B2B login + shop API موجودان لكن لا portal كامل (orders، statements، support).

### البرومنت الجاهز
```
بناء B2B Customer Portal.

1. Pages /portal/customer:
   - login + 2FA
   - dashboard (open balance, recent invoices, alerts)
   - /orders (history + reorder + track)
   - /quotes (received quotes + accept online)
   - /invoices (download + pay online)
   - /statements (monthly download)
   - /products (browse catalog with custom pricing)
   - /support (tickets)
   - /profile (update contact, addresses, payment methods)

2. Custom Pricing:
   - per-customer price lists
   - per-customer discount %
   - per-customer credit terms

3. Online Payment:
   - integrate payment gateway (Moyasar)
   - "Pay" button on each open invoice
   - auto-allocation to oldest open

4. Reorder:
   - view past orders
   - "Reorder" button → pre-fills cart with same items

5. API:
   - /api/portal/customer/* (separate JWT auth)
   - /api/portal/customer/orders
   - /api/portal/customer/invoices/[id]/pay
   - /api/portal/customer/quotes/[id]/accept

6. Notifications:
   - email + WhatsApp on:
     * new invoice
     * payment received
     * order status change
     * quote received

7. Tests:
   - login + 2FA
   - reorder flow
   - online payment
   - statement download
```

---

## P-03 — Restaurant Table Management + KDS

### الحالة الحالية
`/api/pos/restaurant/floor/` partial. لا KDS (Kitchen Display System) كامل، لا table reservation system.

### البرومنت الجاهز
```
أكمل Restaurant module.

1. Schema:
   Floor { id, name, branchId, layout JSON } -- visual map
   Table {
     id, floorId, code, position (x,y), seats, type (REGULAR|VIP|OUTDOOR),
     status (FREE|OCCUPIED|RESERVED|DIRTY|BLOCKED), currentOrderId?
   }
   TableReservation {
     id, tableId, customerName, phone, partySize, reservedAt,
     duration, status (PENDING|CONFIRMED|SEATED|NO_SHOW|COMPLETED), notes
   }
   KitchenDisplay {
     id, branchId, screenName, stationType (HOT|COLD|GRILL|BAR|DRINKS), categoryFilter JSON
   }
   OrderItem (extend SalesInvoiceLine):
     ADD modifier JSON (e.g., {salt: "less", spice: "extra"}),
     ADD kitchenStation, ADD orderTime, ADD prepStartedAt?, ADD readyAt?, ADD servedAt?

2. Workflow:
   STEP 1: Host seats party → status=OCCUPIED + open new tab
   STEP 2: Server takes order → POS adds items
   STEP 3: Items dispatched to KDS by station (hot/cold/bar)
   STEP 4: Cook marks "preparing" → "ready"
   STEP 5: Runner delivers → "served"
   STEP 6: Customer requests bill → split bill option
   STEP 7: Pay → close order → cleanup → status=DIRTY → CLEAN
   STEP 8: Free for next party

3. Engine:
   - assignTable(reservationId, tableId)
   - sendItemsToKitchen(orderId, items): split per station, push to KDS
   - splitBill(orderId, splitConfig): equal/by-item/by-percent

4. API:
   - GET /api/restaurant/floor/[floorId]/tables (real-time SSE)
   - POST /api/restaurant/tables/[id]/seat
   - POST /api/restaurant/orders/[id]/send-to-kitchen
   - POST /api/kds/items/[id]/preparing
   - POST /api/kds/items/[id]/ready
   - POST /api/restaurant/orders/[id]/split-bill
   - CRUD /api/restaurant/reservations

5. UI:
   - /restaurant/floor: visual map with table colors (status)
   - /restaurant/reservations: calendar + list
   - /kds/[stationId]: kitchen display fullscreen + tickets
     * timer per ticket
     * audio alert on new
     * touch to mark "ready"
   - /restaurant/server: mobile waiter app
     * select table → add items → modifiers
     * voice ordering optional

6. Tests:
   - seat → order → KDS → ready → serve → pay flow
   - split bill 3 ways
   - reservation no-show
```

---

## P-04 — Fleet GPS Tracking + Preventive Maintenance

### الحالة الحالية
Fleet dashboard exists but no GPS real-time, no preventive maintenance schedule.

### البرومنت الجاهز
```
بناء Fleet متقدم.

1. Schema:
   Vehicle (extend): currentOdometer, lastServiceOdometer, fuelType, tankCapacity,
     gpsDeviceId?, currentDriverId?, status (ACTIVE|MAINTENANCE|RETIRED)
   GPSPosition {
     id, vehicleId, lat Decimal, lng Decimal, speed, heading,
     address?, timestamp, batteryLevel
   }
   MaintenanceSchedule {
     id, vehicleId, type (OIL|TIRES|BRAKES|INSPECTION|INSURANCE|REGISTRATION),
     intervalKm?, intervalMonths?, lastDoneAt, lastDoneOdometer,
     nextDueAt, nextDueOdometer
   }
   Trip {
     id, vehicleId, driverId, startTime, endTime?, startOdometer, endOdometer?,
     fuelUsed Decimal, route JSON, customerVisits JSON, status
   }

2. Engine:
   - ingestGPS(vehicleId, lat, lng, speed): real-time stream
   - computeRoute(vehicleId, start, end): from GPSPosition history
   - alertMaintenanceDue(): cron daily
     * find schedules with nextDueAt ≤ today + 30 days
     * notify fleet manager + driver
   - costPerKm(vehicleId, period): (fuel + maintenance + insurance) / km

3. GPS providers:
   - Wialon, Gpsgate, or custom devices via MQTT
   - SIM-based GPS hardware

4. API:
   - POST /api/fleet/gps/ingest (webhook from GPS device)
   - GET /api/fleet/vehicles/[id]/live-position
   - GET /api/fleet/vehicles/[id]/route?from&to
   - CRUD /api/fleet/maintenance-schedules
   - GET /api/fleet/maintenance-due

5. UI /fleet:
   - Live map (Leaflet/Mapbox) with all vehicles
   - Vehicle detail: GPS history, fuel, maintenance
   - Maintenance dashboard (red = overdue, yellow = soon)
   - Driver scoring (speed violations, harsh braking)

6. Tests:
   - GPS ingestion + storage
   - distance computation
   - maintenance alert triggering
   - cost-per-km report
```

---

## P-05 — Marketing Automation / Email Campaigns / WhatsApp Broadcast

### الحالة الحالية
WhatsApp send/broadcast partial. Email exists. لا campaign management، لا automation rules.

### البرومنت الجاهز
```
بناء Marketing module.

1. Schema:
   Campaign {
     id, name, channel (EMAIL|SMS|WHATSAPP|MULTI), targetSegmentId,
     subject, bodyTemplate, sendAt?, status, stats JSON
   }
   CustomerSegment {
     id, name, criteria JSON, dynamicRefresh bool, customerCount, lastRefreshedAt
   }
   AutomationRule {
     id, name, trigger (NEW_CUSTOMER|ORDER_PLACED|CART_ABANDONED|BIRTHDAY|INACTIVE_30D),
     condition JSON, actions JSON [{channel, template, delay}],
     isActive
   }
   MessageLog {
     id, campaignId? OR ruleId?, customerId, channel, sentAt, deliveredAt?, openedAt?,
     clickedAt?, repliedAt?, status, errorMessage?
   }

2. Engine:
   - segmentCustomers(criteria): SQL builder → customer list
     * total spend > X
     * last order > 30 days ago
     * city = Riyadh
     * has product category
   - executeCampaign(campaignId):
     * fetch segment
     * personalize template per customer
     * dispatch via channel (rate limit: WhatsApp 30/min)
     * log results
   - automationCron(): daily check triggers
     * birthday: send greeting
     * cart abandoned 24h: send reminder
     * inactive 30d: re-engagement

3. Templates:
   - drag-drop email builder
   - {{customer.name}}, {{order.total}}, {{coupon.code}} variables
   - A/B testing

4. API:
   - CRUD /api/marketing/segments
   - CRUD /api/marketing/campaigns
   - POST /api/marketing/campaigns/[id]/execute
   - CRUD /api/marketing/automation-rules
   - GET /api/marketing/analytics/[campaignId]

5. UI /marketing:
   - Segments builder (visual)
   - Campaigns list + scheduler
   - Email/WhatsApp template editor
   - Automation flow builder (visual)
   - Analytics dashboard (open rate, click rate, conversion)

6. Tests:
   - segment SQL generation
   - personalization
   - rate limiting
   - automation trigger
```

---

## P-06 — Loyalty Tiers + Cashback

### الحالة الحالية
Loyalty points basic. لا tiers، لا cashback، لا VIP benefits.

### البرومنت الجاهز
```
أكمل Loyalty.

1. Schema:
   LoyaltyTier {
     id, name, code (BRONZE|SILVER|GOLD|PLATINUM), minSpendYearly,
     pointsMultiplier Decimal, freeShipping bool, exclusiveDiscount Decimal,
     benefits JSON
   }
   CustomerLoyalty {
     id, customerId, currentTier, totalPointsEarned, currentPointsBalance,
     yearToDateSpend, tierExpiresAt
   }
   Cashback {
     id, customerId, sourceInvoiceId, amount, expiresAt, redeemedAt?, redeemedInvoiceId?
   }

2. Engine:
   - earnPoints(customerId, invoice):
     * basePoints = invoice.amount × ratePerSAR
     * bonus = basePoints × tier.multiplier
     * total earned
   - redeemPoints(customerId, points): adds discount to next invoice
   - upgradeTier(customerId): annual evaluation
   - cashbackEarn: % of every purchase as store credit
   - cashbackRedeem: applied at checkout

3. API:
   - CRUD /api/loyalty/tiers
   - GET /api/loyalty/customers/[id]
   - POST /api/loyalty/redeem
   - POST /api/loyalty/cashback/redeem

4. UI /marketing/loyalty:
   - Tiers config
   - Customer leaderboard
   - Per-customer view
   - POS integration: show available points/cashback

5. Tests:
   - tier upgrade after threshold
   - point redemption discount
   - cashback expiry
```

---

## P-07 — Field Service / Repair Tickets

### الحالة الحالية
`/api/field-service/` exists. Maintenance partial. لا full ticketing system.

### البرومنت الجاهز
```
بناء Field Service.

1. Schema:
   ServiceTicket {
     id, customerId, productId?, serialNumber?, issue, severity, status,
     reportedAt, scheduledAt?, completedAt?, technicianId,
     warrantyClaimId? (link to warranty if applicable)
   }
   ServiceVisit {
     id, ticketId, technicianId, scheduledStart, scheduledEnd,
     actualStart?, actualEnd?, location, status
   }
   ServiceTask {
     id, visitId, description, partsUsed JSON, laborMinutes, cost
   }
   ServiceContract {
     id, customerId, products JSON, startDate, endDate, includesParts bool,
     includesLabor bool, monthlyFee, status
   }

2. Workflow:
   - Customer reports issue → ticket created
   - Dispatcher schedules visit + assigns technician
   - Technician (mobile app):
     * sees route + tickets
     * starts visit → GPS check-in
     * captures issue (photos)
     * uses parts (deducts from inventory)
     * customer signs digitally
   - Auto-invoice generated (if not under contract)

3. API:
   - CRUD /api/service/tickets
   - POST /api/service/visits/[id]/start
   - POST /api/service/visits/[id]/complete
   - POST /api/service/tickets/[id]/invoice

4. Mobile (PWA):
   - tickets queue
   - navigation to address
   - parts catalog
   - signature capture

5. UI /service:
   - Ticket queue (Kanban)
   - Dispatcher dashboard (schedule visualization)
   - Technician utilization report

6. Tests:
   - ticket → visit → invoice flow
   - SLA tracking
```

---

## P-08 — Payment Gateway Integration (Mada/Visa/Apple Pay/STC Pay)

### الحالة الحالية
لا integration حقيقي مع gateways رئيسية. POS supports cash + card manually.

### البرومنت الجاهز
```
بناء Payment Gateway Integration.

1. Schema:
   PaymentGateway {
     id, provider (MOYASAR|HYPERPAY|PAYTABS|STRIPE|GEIDEA|STC_PAY),
     credentials JSON (encrypted), env (TEST|PROD), isActive
   }
   PaymentTransaction {
     id, gatewayId, invoiceId, amount, currency, method (MADA|VISA|MASTER|AMEX|APPLE_PAY|GOOGLE_PAY|STC_PAY),
     providerTransactionId, status, failureReason?,
     createdAt, capturedAt?, refundedAt?
   }
   SavedPaymentMethod {
     id, customerId, gatewayId, type, last4, expiry, providerToken (encrypted), isDefault
   }

2. Engine src/lib/payment-gateway/:
   - moyasar.ts (الأكثر استخداماً سعودياً): create payment, capture, refund
   - hyperpay.ts (Mada specific)
   - apple-pay.ts (browser API + merchant validation)
   - stc-pay.ts
   - common interface: createCharge / refund / saveMethod

3. Integration:
   - online checkout: redirect to gateway iframe
   - tokenize for repeat customers
   - webhook for confirmation
   - auto-create payment + JE on success

4. API:
   - POST /api/payments/charge { invoiceId, gatewayId, ... }
   - POST /api/payments/refund/[transactionId]
   - POST /api/payments/webhooks/[provider]
   - GET /api/payments/methods?customerId

5. UI:
   - admin: gateway config
   - checkout: payment selector
   - customer portal: saved methods management

6. Tests:
   - test mode charges
   - 3DS challenge
   - refund flow
   - webhook signature verification
```

---

# ملخص فجوات POS/CRM/Portals الـ 8

| # | الفجوة | الأولوية |
|---|------|------|
| P-01 | CRM Pipeline + Opportunities | 🔴 |
| P-02 | Customer Self-Service Portal | 🟠 |
| P-03 | Restaurant Tables + KDS | 🟠 |
| P-04 | Fleet GPS + Preventive Maint | 🟡 |
| P-05 | Marketing Automation | 🟠 |
| P-06 | Loyalty Tiers + Cashback | 🟡 |
| P-07 | Field Service Ticketing | 🟡 |
| P-08 | Payment Gateway Integration | 🔴 |
