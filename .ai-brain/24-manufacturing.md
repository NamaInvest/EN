# 24 - التصنيع (Manufacturing)

> BOM + MO + MRP + WO + QC + WorkCenters + Costing

---

## 🏭 المفاهيم الأساسية

### الهيكل:
```
Recipe (BOM)
  ├── RecipeIngredient (المواد الخام)
  ├── RecipeOperation (العمليات)
  └── RecipeByProduct (المنتجات الثانوية)

ManufacturingOrder (MO)
  ├── يستند على Recipe
  ├── ManufacturingWastage (الإهدار)
  ├── ManufacturingCost (التكاليف)
  └── QualityCheck (مراقبة الجودة)

WorkCenter ← Machine ← MachineTelemetry
```

---

## 📋 BOM (Bill of Materials)

### النموذج:
```prisma
Recipe {
    productId          // المنتج النهائي
    recipeNo
    quantity           // الكمية الإنتاجية (مثلاً: 1 batch = 100 وحدة)
    revision           // الإصدار
    status: 'DRAFT' | 'APPROVED' | 'OBSOLETE'
    standardCost       // التكلفة المعيارية
    deletedAt
}

RecipeIngredient {
    recipeId
    rawProductId       // المادة الخام
    quantity           // الكمية المطلوبة
    unitId
    wastagePercent     // نسبة الإهدار المتوقعة
    isOptional
}

RecipeOperation {
    recipeId
    operationNo
    workCenterId
    duration           // بالدقائق
    setupTime
    laborCost          // لكل ساعة
    overheadCost
    description
}

RecipeByProduct {
    recipeId
    byProductId        // منتج ثانوي
    quantity           // الكمية الناتجة
    type: 'BY_PRODUCT' | 'SCRAP' | 'WASTE'
    salvageValue
}
```

### مثال BOM:
```
المنتج النهائي: كيك شوكولا (1 كيلو)
المواد الخام:
  - طحين: 500g
  - سكر: 200g
  - بيض: 4 حبات
  - شوكولا: 100g
العمليات:
  1. خلط (Mixer) — 15 دقيقة
  2. خبز (Oven) — 30 دقيقة
  3. تبريد — 10 دقائق
  4. تغليف — 5 دقائق
المنتجات الثانوية: لا
```

---

## 🛠 Manufacturing Order (MO)

### دورة الحياة:
```
PLANNED → RELEASED → IN_PROGRESS → QC → CLOSED
                         ↓
                      CANCELLED
```

### النموذج:
```prisma
ManufacturingOrder {
    moNo
    productId          // ما يُصنع
    quantity           // الكمية المطلوبة
    recipeId           // BOM المستخدم
    plannedStartDate, plannedEndDate
    actualStartDate, actualEndDate
    status
    priority: 1-10
    sourceOrderId      // (اختياري) إذا من SO
    notes
}
```

### الـ Flow:
```
1. إنشاء MO:
   POST /api/manufacturing/orders
   Body: { productId, quantity, recipeId, dueDate }
   ↓
   حالة: PLANNED
   
2. تخطيط الموارد (MRP):
   - فحص المواد الخام المتوفرة
   - فحص قدرة الـ work centers
   - إنشاء PR للمواد الناقصة
   
3. إصدار MO:
   POST /api/manufacturing/orders/{id}/release
   ↓
   حالة: RELEASED
   - إنشاء WorkOrders لكل operation
   - حجز المواد
   
4. تنفيذ:
   POST /api/manufacturing/work-orders/{id}/start
   ↓
   حالة: IN_PROGRESS
   - سحب المواد (Material Issue):
     JE: Dr WIP / Cr Raw Materials
   - تسجيل العمل (Labor)
   - تسجيل الإهدار
   
5. مراقبة الجودة:
   POST /api/manufacturing/quality
   ↓
   حالة: QC
   - فحص: Pass / Fail / Rework
   - إذا Fail → إعادة عمل أو إهدار
   
6. الإغلاق:
   POST /api/manufacturing/orders/{id}/close
   ↓
   حالة: CLOSED
   - JE: Dr Finished Goods / Cr WIP
   - تسوية التكاليف:
     - فعلي مقابل معياري
     - Variance JE
```

---

## 📊 MRP (Material Requirements Planning)

### المنطق:
```typescript
function runMRP() {
    // 1. تحصيل المتطلبات
    const requirements = [
        // من Sales Orders
        ...await getOpenSalesOrders(),
        // من Manufacturing Orders Released
        ...await getReleasedMOs(),
        // من Reorder Rules
        ...await getReorderRequirements()
    ];
    
    // 2. حساب الـ Net Requirements
    for (const req of requirements) {
        const onHand = await getStock(req.productId);
        const onOrder = await getPendingPOs(req.productId);
        const reserved = await getReservedQty(req.productId);
        
        const available = onHand + onOrder - reserved;
        const netRequired = req.quantity - available;
        
        if (netRequired > 0) {
            // 3. اقتراح:
            if (isPurchased(req.productId)) {
                // إنشاء PR
                await suggestPurchaseRequisition({
                    productId: req.productId,
                    quantity: netRequired,
                    requiredDate: req.requiredDate
                });
            } else {
                // إنشاء MO
                await suggestManufacturingOrder({
                    productId: req.productId,
                    quantity: netRequired,
                    dueDate: req.requiredDate
                });
            }
        }
    }
}
```

### الـ Cron:
- `/api/cron/predictive-po` (أسبوعياً) — MRP run

### المسارات:
- `/api/manufacturing/mrp-engine`
- `/manufacturing/mrp-dashboard`

---

## 🏗 Work Centers & Machines

### النموذج:
```prisma
WorkCenter {
    workCenterNo, name
    type: 'MACHINE' | 'LABOR' | 'BOTH'
    capacity            // ساعات يومياً
    efficiency          // %
    costPerHour
    branchId
}

Machine {
    machineNo
    workCenterId
    description
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN'
    location
    purchaseDate, depreciation
    assetId             // ربط بـ FixedAsset
}

MachineMaintenance {
    machineId
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE'
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
    cost, downtime
    nextScheduled
}

MachineTelemetry {
    machineId, metric, value
    recordedAt
    // مثال: temperature, vibration, power_usage
}
```

### OEE (Overall Equipment Effectiveness):
```
OEE = Availability × Performance × Quality

Availability = (Run Time / Planned Production Time) × 100%
Performance = (Total Count / (Run Time × Ideal Run Rate)) × 100%
Quality = (Good Count / Total Count) × 100%

Target: 85% (World Class)
```

### المسار:
- `/api/manufacturing/oee`
- `/manufacturing/mes-oee`

---

## 🔬 Quality Control

### النماذج:
```prisma
QualityCheck {
    moId, productId, batchNo
    sampleSize, totalProduced
    passCount, failCount, reworkCount
    status: 'PENDING' | 'PASSED' | 'FAILED'
    inspector, checkedDate
    notes
}

QualityInspection {
    checkId
    parameter           // 'WEIGHT' | 'COLOR' | 'DIMENSION' | ...
    expectedValue, actualValue
    tolerance
    result: 'PASS' | 'FAIL'
}

NCR (NonConformance Report) {
    moId, batchNo
    description, severity
    rootCause
    correctiveAction
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
}

CAPA (Corrective & Preventive Action) {
    ncrId
    type: 'CORRECTIVE' | 'PREVENTIVE'
    description, assignedTo, dueDate
    status, effectiveness
}
```

### المسارات:
- `/api/quality`
- `/api/manufacturing/qc`
- `/api/manufacturing/capa`
- `/quality`, `/quality/inspections`, `/quality/ncrs`

---

## 💸 Manufacturing Costing

### العناصر الثلاثة:
1. **Direct Materials** — المواد الخام
2. **Direct Labor** — العمالة المباشرة
3. **Manufacturing Overhead** — التكاليف غير المباشرة

### الحساب:
```typescript
function calculateMOCost(moId) {
    const materialCost = sum(materialIssues);
    const laborCost = sum(workOrders.map(w => w.hours * w.workCenter.costPerHour));
    const overheadAllocation = (laborCost + materialCost) * overheadRate;
    
    const totalCost = materialCost + laborCost + overheadAllocation;
    const unitCost = totalCost / mo.quantity;
    
    return { materialCost, laborCost, overheadAllocation, totalCost, unitCost };
}
```

### Standard vs Actual:
```prisma
ManufacturingCost {
    moId
    costType: 'MATERIAL' | 'LABOR' | 'OVERHEAD'
    standardAmount      // المعياري (من BOM)
    actualAmount        // الفعلي
    variance            // الانحراف
    varianceReason
}
```

### الـ Variance Analysis:
- **Material Price Variance** = (Actual Price - Std Price) × Actual Qty
- **Material Usage Variance** = (Actual Qty - Std Qty) × Std Price
- **Labor Rate Variance** = (Actual Rate - Std Rate) × Actual Hours
- **Labor Efficiency Variance** = (Actual Hours - Std Hours) × Std Rate

---

## 📦 Subcontracting (مقاولات فرعية)

### السيناريو:
- جزء من الإنتاج يُسلم لشركة خارجية
- مثال: نرسل الـ MO لمصنع صبغ → يصبغ → يعيد

### الـ Flow:
```
1. إنشاء MO عادي
2. تحديد بعض operations كـ subcontract
3. عند هذه الخطوة:
   - يُنشأ Purchase Order للمقاول
   - يُحجز المخزون للإرسال
4. عند الاستلام:
   - GRN
   - استمرار MO
5. التكلفة:
   - تُضاف للمنتج
```

---

## 🌱 Co-products & By-products

### Co-products (منتجات مشتركة):
- مثال: مصنع ألبان → حليب + قشدة (كلاهما رئيسي)
- التكاليف تُوزع بنسبة (Sales Value or Physical)

### By-products (منتجات ثانوية):
- مثال: نشارة الخشب من قطع الأخشاب
- قيمة قليلة → تُسجل بقيمة الـ salvage

### Waste/Scrap:
- لا قيمة
- يُسجل كـ loss

---

## 📡 Industry 4.0 Features

### Digital Twin:
- نموذج رقمي للماكينة
- محاكاة الـ outputs قبل التشغيل
- المسار: `/manufacturing/digital-twin`

### Blockchain Trace:
- تتبع المنتجات على blockchain
- شفافية كاملة للعميل
- المسار: `/manufacturing/blockchain-trace`

### Predictive Maintenance:
- AI يتنبأ بفشل الماكينات
- بناءً على Telemetry
- يجدول صيانة قبل الفشل

---

## 📈 الميزات المنفذة vs الناقصة

### ✅ منفذ:
- BOM (Recipe + Ingredients + Operations)
- MO Lifecycle
- Work Centers + Machines
- Basic QC
- Material Issue + Completion

### 🟡 جزئي:
- MRP (Engine موجود، UI محدود)
- Standard Costing
- Variance Analysis
- OEE
- Subcontracting

### ❌ غير مكتمل:
- Real-time Shopfloor (شاشة الإنتاج لحظية)
- Lean Manufacturing (Kanban tools)
- APS (Advanced Planning & Scheduling)
- Digital Twin (UI placeholder)
- Predictive Maintenance (AI ناقص)

---

## 🎯 Best Practices

1. ✅ **BOM دقيق** لكل منتج
2. ✅ **Standard Cost** محدّث ربعياً
3. ✅ **QC في كل marshalling point**
4. ✅ **Maintenance Schedule** للماكينات
5. ✅ **NCR + CAPA** لكل مشكلة جودة
6. ✅ **Variance Analysis** شهرياً
7. ✅ **OEE tracking** لكل work center
8. ❌ **لا تتجاوز** فحص الجودة
9. ❌ **لا تنسى الإهدار** في الـ BOM
