# 42 — Shipping | شركات الشحن

## 🟠 الأولوية: عالي

## 🎯 الشركات المستهدفة
- **Aramex** (محلي + دولي)
- **SMSA Express** (محلي)
- **DHL** (دولي + محلي)
- **FedEx** (دولي)
- **Saudi Post / SPL** (محلي)
- **Naqel Express** (محلي)
- **J&T Express** (e-commerce)

## 🎯 الخطة

### 42.1 — Unified Shipping Abstraction (4 أيام)
```typescript
export interface ShippingProvider {
  getRates(origin, destination, parcel): Promise<Rate[]>;
  createShipment(shipmentData): Promise<Shipment>;
  printLabel(shipmentId): Promise<Buffer>;
  trackShipment(trackingNumber): Promise<TrackingEvent[]>;
  cancelShipment(shipmentId): Promise<void>;
  webhook(payload): Promise<TrackingUpdate>;
}
```

### 42.2 — Per-Provider Integration (15 أيام total — 2-3 days each)
- API credentials management
- Account info
- Rate shopping (compare providers)
- Pickup scheduling
- Manifest generation

### 42.3 — Auto-Label Printing (3 أيام)
- AWB (Air Waybill) generation
- Thermal printer support (ZPL)
- Bulk printing

### 42.4 — Tracking Updates (4 أيام)
- Webhook receivers
- Status mapping (consistent across providers)
- Customer notifications
- Delivery confirmation

### 42.5 — COD (Cash on Delivery) (3 أيام)
- COD amount tracking
- Settlement reconciliation
- Failed delivery handling

### 42.6 — Returns (3 أيام)
- Return labels
- Return tracking
- Refund triggering

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Shipping providers integrated | 0 | 5+ |
| Label generation | manual | auto |
| Tracking updates | manual | webhook |
| Failed delivery rate | غير متابع | tracked |

## ⏱️ المدة: 32 يوم عمل
