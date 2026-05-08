# 25 — Manufacturing | التصنيع

## 🟠 الأولوية: عالي | الاكتمال: 40%

## 🔍 الموجود
- Recipe, RecipeIngredient (BOM basic)
- ManufacturingOrder
- WorkCenter, Machine
- QualityInspection

## 🔴 الفجوات
- BOM متعدد المستويات ضعيف
- لا Routing operations
- MRP (Material Requirements Planning) غير مكتمل
- WIP (Work In Progress) tracking ضعيف
- لا Capacity Planning
- لا Production Scheduling
- لا Shop Floor Control (SFC)
- Wastage/Yield tracking ضعيف
- لا By-product handling
- لا Subcontracting
- لا Maintenance integration
- Cost roll-up ضعيف

## 🎯 الخطة

### 25.1 — Multi-level BOM (6 أيام)
```typescript
// Recipe with phantom assemblies
{
  finishedItem: 'CAR-001',
  components: [
    { item: 'ENGINE-A', qty: 1, isPhantom: true,
      subBOM: [{ item: 'PISTON', qty: 4 }, ...] },
    { item: 'WHEEL', qty: 4 },
  ],
}
```

### 25.2 — Routing & Operations (5 أيام)
- Operations sequence per item
- Setup time + Run time
- Resource (machine + labor)
- Standard cost roll-up

### 25.3 — MRP Engine (10 أيام)
```
Demand (Sales orders + Forecast)
    ↓
- On-hand inventory
- Open POs
    ↓
Net Requirements
    ↓
Suggested PRs + WOs
```

### 25.4 — WIP & Production Tracking (7 أيام)
- Material issue from raw → WIP
- Operation reporting
- Move tickets
- Auto-WIP valuation

### 25.5 — Capacity Planning (6 أيام)
- Available capacity per work center
- Loading vs capacity
- Bottleneck identification
- What-if analysis

### 25.6 — Shop Floor Control (8 أيام)
- Mobile app for operators
- Barcode scanning
- Operation start/stop
- Quality check at each operation

### 25.7 — Wastage + Yield (4 أيام)
- Standard yield % per operation
- Actual vs standard variance
- Auto-write-off

### 25.8 — Subcontracting (5 أيام)
- Send materials to subcontractor
- Track outside processing
- Receive finished goods

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| OEE (Overall Equipment Effectiveness) | غير مقاس | tracked |
| Schedule adherence | غير مقاس | > 90% |
| Yield variance | غير مقاس | tracked |
| WO cycle time | غير مقاس | tracked |

## ⏱️ المدة: 51 يوم عمل
