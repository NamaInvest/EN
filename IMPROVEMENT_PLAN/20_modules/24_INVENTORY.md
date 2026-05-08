# 24 — Inventory | المخزون

## 🟠 الأولوية: عالي | الاكتمال: 34%

## 🔍 الموجود
- Product, ProductStock, StockMovement
- [src/lib/costing.ts](../../src/lib/costing.ts) (FIFO/LIFO/Average)
- ProductBatch
- Stocktake basic

## 🔴 الفجوات
- لا Multi-warehouse transfers تلقائي
- لا Reorder Point + Auto-PO suggestions
- Serial Number tracking ضعيف
- Lot/Batch with expiry غير مكتمل
- لا Cycle Counting
- لا ABC Analysis
- لا Slow-moving / Dead stock reports
- Inventory valuation reports ضعيفة
- لا Landed Cost calculation
- لا Inventory write-off workflow
- لا Quality Inspection tracking
- Forecasting بدائي

## 🎯 الخطة

### 24.1 — Multi-Warehouse + Transfers (7 أيام)
- Warehouse hierarchy (region → branch → bin)
- Transfer orders (request → approve → ship → receive)
- In-transit inventory tracking

### 24.2 — Reorder + Auto-PO (5 أيام)
- ROP (Reorder Point) per item per warehouse
- Safety stock calculation
- EOQ (Economic Order Quantity)
- Auto-generate PR/PO

### 24.3 — Serial + Lot/Batch (8 أيام)
- Full lifecycle: receive → store → sell → return
- Expiry alerts (30/60/90 days)
- FEFO (First-Expired-First-Out)
- Recall management

### 24.4 — Cycle Counting (5 أيام)
- ABC-based frequency
- Variance analysis
- Auto-adjust JE

### 24.5 — Analytics (6 أيام)
- ABC Analysis (80/15/5)
- Slow-moving (no movement 90+ days)
- Dead stock
- Stock turnover ratio
- Days of supply

### 24.6 — Landed Cost (5 أيام)
- Allocation: freight, insurance, customs, broker
- Multiple methods (by quantity, value, weight)
- Auto-update item cost

### 24.7 — Quality Inspection (4 أيام)
- Inspection plans per item
- Sampling rules
- Quarantine workflow
- Reject + return to vendor

### 24.8 — Demand Forecasting (6 أيام)
- Moving average، Exponential smoothing
- Seasonal decomposition
- ML model (Prophet)
- Forecast accuracy tracking

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Stockout rate | غير مقاس | < 2% |
| Inventory turns | غير مقاس | tracked |
| Cycle count accuracy | غير محدد | > 98% |
| Auto-PO suggestions | لا | weekly |

## ⏱️ المدة: 46 يوم عمل
