# BPF #5: Order-to-Delivery (O2D) — End-to-End

> **المرجعيات:** SAP SD/LE (Sales & Logistics)、Oracle OM、Manhattan WMS、Blue Yonder
> **الموديولات:** Sales, Inventory, WMS, Logistics, Carriers, Returns, AR

---

## 1) الفلو

```
[SO Approved]
   ↓ stock check
[Allocation/Reservation]
   ↓ pick wave creation
[Pick List Generated]
   ↓ picker walks warehouse
[Pick Confirmation]
   ↓ pack station
[Pack + Weight Verify]
   ↓ shipping label
[Carrier Booking]
   ↓ carrier picks up
[In Transit]
   ↓ tracking events
[Out for Delivery]
   ↓ customer signs
[PoD (Proof of Delivery)]
   ↓ delivered status
[Customer Acknowledgement]
   ↓ optional
[Returns Possible]
   ↓ if needed
[RMA Workflow]
   ↓ closed
```

**~13 events، 6 موديولات**

---

## 2) البرومنت

```
بناء O2D orchestration:

موجود: SO, DN, Inventory, ProductStock, Carriers (Aramex, SMSA), DeliveryPlatforms

النواقص:
A) Wave management (batch multiple orders for efficient picking)
B) Pick path optimization (TSP-like)
C) Mobile pick app with offline support
D) Real-time carrier rate shopping
E) Multi-carrier label generation
F) Branded tracking page for customer
G) Live ETA updates from carrier API
H) Failed delivery recovery workflow
I) Returns inbound to RMA seamless

أنشئ:
- src/lib/o2d-orchestrator.ts
- src/lib/wave-manager.ts
- src/lib/carrier-rates.ts
- prisma: O2DJourney, Wave (already exists in #20), CarrierBooking
- UI: /shipping/wave-management + mobile pick app
```

---

## 3) السيناريوهات (8)

### A — Standard Single Order
```
SO 5 items → DN created → Pick list → Picked → Packed (1 box) → Aramex booked → Tracking sent to customer → Delivered next day → PoD signed → SO complete
```

### B — Wave Picking (50 orders)
```
50 SOs ready to ship today
Wave manager creates "Morning Wave"
- Combined: 350 line items
- Sorted by warehouse zone for optimal path
- Single picker walks once → picks 350 items
- Sort station: groups by order
- Pack stations: 50 boxes
- Carrier pickup at 14:00
- 30% time savings vs picking each order individually
```

### C — Multi-package Shipment
```
SO with 200 items, too big for one box
- Split: 5 boxes of 40 each
- Each box: own tracking + label
- Customer sees: "5 packages, all tracking numbers"
- Some delivered → partial PoD
- All delivered → SO marked complete
```

### D — International Shipping
```
SO to Dubai customer
- DN with international flag
- Customs declaration auto-generated
- DHL booked with Incoterms (DDP)
- Tracking + customs clearance updates
- Delivered to UAE customer → PoD
```

### E — Failed Delivery
```
Aramex tries to deliver, customer not home
- Attempt 1: failed
- Auto SMS to customer with reschedule link
- Customer picks new time
- Attempt 2: success
- PoD captured

Or: 3 failed attempts → returned to sender → re-stocking process
```

### F — Damaged in Transit
```
Customer receives box, contents damaged
- Reports via WhatsApp / portal
- Photos uploaded
- RMA initiated
- Replacement shipment + insurance claim
- Original goods picked up by carrier
```

### G — Drop-Ship (Customer Order Direct from Vendor)
```
SO with drop-ship flag
- Auto PO to vendor
- Vendor ships directly to customer
- Tracking from vendor
- PoD at customer location
- No internal warehouse handling
```

### H — Click-and-Collect (BOPIS)
```
Customer orders online, picks up at branch
- SO with collect flag
- Branch staff prepares
- SMS to customer "Ready for pickup"
- Customer arrives at branch
- ID + order # verified
- Handed over → PoD electronic
- No carrier involved
```

### sad-1 — Out of Stock During Pick
```
Picker scans bin, but qty actually short (data mismatch)
- Substitute? Customer wait?
- Manager decides
- If substitute → swap product (with SO update)
- If wait → backorder + partial ship
- Inventory adjustment to fix mismatch
```

### sad-2 — Carrier Loses Shipment
```
Aramex confirms package lost
- Insurance claim (or carrier liable)
- Reship to customer (free)
- DN status: LOST
- Reverse inventory if not insured / claim
```

---

## 4) JEs / Inventory Movements

```
[SO Approved + Reserved]
   ↓ no JE (reservation only)
   ↓ Stock: qty reserved (not consumed)
[Pick Confirmation]
   ↓ no JE (still in our possession)
[DN Created (shipped)]
   ↓ JE: DR COGS / CR Inventory  (per IFRS 15: revenue not until delivered)
   ↓ Stock: qty out (no longer in our warehouse)
[Delivery Confirmed (PoD)]
   ↓ JE: DR AR / CR Sales Revenue  (revenue recognized)
   ↓ JE: DR Tax Receivable / CR VAT Output
   ↓ Open item created
[Returns]
   ↓ JE: DR Sales Returns / CR AR  (revenue reversal)
   ↓ JE: DR Inventory / CR COGS  (inventory back)
```

---

## 5) Schema (Cross-Module)

```prisma
model O2DJourney {
  id              Int       @id @default(autoincrement())
  salesOrderId    Int       @unique
  
  currentStage    String    // 'ALLOCATED' | 'PICK' | 'PACK' | 'SHIP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'FAILED'
  
  stageTimings    Json
  
  totalPackages   Int       @default(1)
  totalWeight     Decimal?  @db.Decimal(10,2)
  
  carrierId       Int?
  trackingNumbers String[]
  
  estimatedDelivery DateTime?
  actualDelivery  DateTime?
  
  podSignature    String?
  podPhotoUrl     String?
  
  health          String    @default("ON_TRACK")
}

model CarrierBooking {
  id              Int       @id @default(autoincrement())
  deliveryNoteId  Int
  
  carrier         String    // 'ARAMEX' | 'SMSA' | 'DHL' | 'NAQEL' | 'SAUDI_POST'
  service         String    // 'EXPRESS' | 'STANDARD' | 'ECONOMY'
  trackingNumber  String    @unique
  
  shipmentValue   Decimal?  @db.Decimal(20,4)
  insuranceValue  Decimal?  @db.Decimal(20,4)
  shippingCost    Decimal   @db.Decimal(20,4)
  
  pickupScheduled DateTime?
  pickedUpAt      DateTime?
  deliveredAt     DateTime?
  
  trackingEvents  Json[]    // [{timestamp, status, location, description}]
  
  failedAttempts  Int       @default(0)
  failureReason   String?
}

model PickWave {
  // see #20 (Inventory)
}

model PickList {
  // see #20
}

model Pod {
  // Proof of Delivery
  id              Int       @id @default(autoincrement())
  deliveryNoteId  Int       @unique
  
  signedAt        DateTime
  signedBy        String?
  signatureImage  String?
  photoUrl        String?
  geoLocation     Json?
  
  receiverIdNumber String?  // for COD or restricted items
  notes           String?
  
  capturedByUserId String?
}
```

---

## 6) Forms (6)

A: Wave Creation
B: Pick Confirmation (mobile)
C: Pack Verification
D: Carrier Booking
E: PoD Capture (mobile)
F: Failed Delivery Reschedule

---

## 7) Tables

A: O2D Pipeline (visual)
B: Today's Picks (per warehouse)
C: In Transit (with carrier tracking)
D: Failed Deliveries
E: Carrier Performance
F: SLA Breaches

---

## 8) Buttons

| ID | الزر | المرحلة |
|----|------|---------|
| btn-o2d-allocate | تخصيص المخزون | start |
| btn-o2d-wave-create | + موجة | wave |
| btn-o2d-pick-start | بدء التحضير | pick |
| btn-o2d-pick-confirm | تأكيد سطر | pick |
| btn-o2d-pack | تجهيز التغليف | pack |
| btn-o2d-rate-shop | مقارنة الأسعار | book |
| btn-o2d-book-carrier | حجز شركة الشحن | book |
| btn-o2d-print-label | طباعة label | book |
| btn-o2d-mark-shipped | تعليم كمشحون | ship |
| btn-o2d-track | تتبع | transit |
| btn-o2d-pod-capture | التقاط PoD | delivery |
| btn-o2d-mark-failed | تسجيل فشل | failed |
| btn-o2d-reschedule | إعادة جدولة | failed |
| btn-o2d-returns-process | معالجة الإرجاع | returns |

---

## 9) Reports

- Order Cycle Time (per stage)
- Pick Productivity (per picker)
- Carrier Performance (OTD, damage rate, cost)
- Failed Delivery Analysis
- Wave Efficiency
- Tracking Visibility (% with active tracking)

---

## 10) Notifications

| Event | Recipient |
|-------|-----------|
| Wave released | pickers |
| Pick complete | warehouse mgr |
| Ready to ship | shipping team |
| Carrier picked up | customer |
| In transit updates | customer |
| Out for delivery | customer |
| Delivered | customer + sales |
| Failed delivery | customer + sales rep |
| Stuck in transit | shipping mgr |
| SLA breach | shipping mgr + sales |

---

## 11) Permissions

| Action | Picker | Wh Mgr | Shipping | CSR |
|--------|--------|--------|----------|-----|
| Create wave | ✗ | ✓ | ✓ | ✗ |
| Confirm pick | ✓ | ✓ | ✗ | ✗ |
| Pack | ✗ | ✓ | ✓ | ✗ |
| Book carrier | ✗ | ✓ | ✓ | ✗ |
| Capture PoD | ✗ | ✗ | ✓ (or driver) | ✗ |
| Reschedule | ✗ | ✗ | ✓ | ✓ |

---

## 12) Integrations

- Aramex API (rate shop + booking + tracking)
- SMSA API
- DHL API
- Saudi Post (SPL)
- Naqel
- Mobile barcode scanners
- Carrier webhooks (status updates)
- WhatsApp/SMS (customer notifications)

---

## 13) Tests

```typescript
describe('O2D Cycle', () => {
  test('allocate stock on SO approve')
  test('wave with 50 orders picked efficiently')
  test('multi-package shipment splits correctly')
  test('international shipping with customs')
  test('failed delivery reschedule flow')
  test('drop-ship bypasses warehouse')
  test('PoD captured from mobile')
})
```

---

## 14) Edge Cases

| Case | Behavior |
|------|----------|
| Inventory mismatch at pick | substitute or backorder |
| Carrier down | switch carrier |
| Customer changes address mid-shipment | recall + redirect (if possible) |
| Package broken on arrival | RMA + insurance |
| Weight different from estimated | re-charge or absorb |
| Wrong item picked | swap with correct |

---

## 15) إحصائيات BPF #5

- 6 موديولات • 13 stages • inventory + JE per shipment
- 4 جداول • 6 forms • 6 grids • 14 buttons cross-module

---

**انتهى BPF #5 / 8.**
