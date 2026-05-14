# 23 - المخزون والمستودعات (Inventory & Warehousing)

> Products + Warehouses + Movements + Costing + Batches + Serials + AI Vision

---

## 📦 هيكل المنتجات

### النماذج الأساسية:
```prisma
Category {
    name, parentId   // شجرة هرمية
    description, image
}

Product {
    name, nameEn, barcode, sku
    categoryId
    buyPrice, sellPrice
    taxRate, taxType
    minQuantity, maxQuantity
    currentStock        // مجموع كل المستودعات
    isService           // إذا خدمة (لا مخزون)
    isExportable        // للزكاة (Zero-Rated)
    weight, dimensions
    images: Json
    barcodes: Json      // متعددة
    deletedAt
}

ProductUnit {
    productId, unitId
    sellPrice, factor (1, 12, 144, ...)
    isBase, parentUnitId
    barcode             // باركود الكرتون مثلاً
    // مثال: حبة (1) ← علبة (12) ← كرتون (144)
}

ProductVariant {
    productId, variantName
    sku, barcode
    price, stock
    attributes: Json    // { color: 'Red', size: 'L' }
}

ProductSerialNumber {
    productId, serialNumber
    stockId, binId
    status: 'AVAILABLE' | 'SOLD' | 'RETURNED' | 'DEFECTIVE'
    warrantyExpiry
}

ProductBatch {
    productId, batchNo
    manufactureDate, expiryDate
    initialQuantity, currentQuantity
}
```

---

## 🏭 المستودعات والمواقع

### الهيكل الهرمي:
```
Stock (المستودع الرئيسي)
  ├── WarehouseZone (المنطقة)
  │     ├── WarehouseBin (الرف/المربع)
  │     │     └── ProductStock (الكمية في هذا الرف)
```

### النماذج:
```prisma
Stock {
    warehouse, name, address
    branchId, manager
    active
}

WarehouseZone {
    stockId, zoneName, zoneType
    temperature: 'AMBIENT' | 'COLD' | 'FROZEN'
}

WarehouseBin {
    zoneId, binCode, capacity
    height, width, depth
    type: 'PALLET' | 'SHELF' | 'BIN'
}

ProductStock {
    productId, stockId, binId?
    quantity
    reservedQuantity   // محجوز لـ orders
    availableQuantity  // = quantity - reservedQuantity
}
```

---

## 🔄 حركات المخزون

### النموذج:
```prisma
StockMovement {
    sourceStockId, destinationStockId
    productId, quantity, uomId
    type: 'GRN' | 'SALE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN' | 'PRODUCTION' | 'WASTE'
    reference         // PO/Invoice/Transfer ID
    referenceType     // 'PURCHASE_INVOICE' | 'SALES_INVOICE' | ...
    movedAt, movedByUserId
    notes
}
```

### أنواع الحركات:

| النوع | المصدر | الوجهة | التأثير |
|---|---|---|---|
| **GRN** | (NULL) | المستودع | +Quantity |
| **SALE** | المستودع | (NULL) | -Quantity |
| **TRANSFER** | مستودع A | مستودع B | +/- في الاتجاهين |
| **ADJUSTMENT** | المستودع | (NULL) | ± Quantity |
| **RETURN** | (NULL/Customer) | المستودع | +Quantity |
| **PRODUCTION_IN** | (NULL) | المستودع | +Quantity (Finished) |
| **PRODUCTION_OUT** | المستودع | (NULL) | -Quantity (Raw) |
| **WASTE** | المستودع | (NULL) | -Quantity |

---

## 💰 التكلفة (Costing — `src/lib/costing.ts`)

### الطرق المدعومة:

#### 1. FIFO (First-In, First-Out):
```typescript
function fifoCost(productId, quantity) {
    const batches = await getBatches(productId, orderBy: 'receivedAt ASC');
    
    let remaining = quantity;
    let totalCost = 0;
    const consumed = [];
    
    for (const batch of batches) {
        if (remaining <= 0) break;
        
        const take = Math.min(remaining, batch.quantity);
        totalCost += take * batch.unitCost;
        consumed.push({ batchId: batch.id, quantity: take });
        remaining -= take;
        batch.quantity -= take;
    }
    
    return { totalCost, unitCost: totalCost / quantity, consumed };
}
```

#### 2. LIFO (Last-In, First-Out):
نفس المنطق لكن `orderBy: 'receivedAt DESC'`

#### 3. Weighted Average:
```typescript
function averageCost(productId) {
    const stocks = await getProductStocks(productId);
    
    const totalValue = stocks.reduce((s, p) => s + p.quantity * p.unitCost, 0);
    const totalQuantity = stocks.reduce((s, p) => s + p.quantity, 0);
    
    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}
```

### اختيار الطريقة:
- في `Settings.costing_method = 'FIFO' | 'LIFO' | 'AVERAGE'`
- معظم الشركات السعودية تستخدم **FIFO** (متوافق مع IFRS)

---

## 📅 FEFO (First Expired, First Out)

### للمنتجات قابلة الانتهاء (الأدوية، الأغذية):
```typescript
function fefoCost(productId, quantity) {
    const batches = await getBatches(productId, {
        where: { expiryDate: { gt: new Date() } },
        orderBy: 'expiryDate ASC'  // الأقرب انتهاءً أولاً
    });
    
    // باقي المنطق مثل FIFO
}
```

### الإنذارات:
- 90 يوم قبل الانتهاء → تنبيه
- 30 يوم → تنبيه حرج
- منتهي → منع البيع تلقائياً + تنبيه للمحاسب لـ write-off

### الـ Cron:
- `/api/cron/document-expiry` يفحص يومياً

---

## 🔢 الترقيم التسلسلي (Serial Numbers)

### للمنتجات الفريدة (إلكترونيات، سيارات، إلخ):
```prisma
ProductSerialNumber {
    productId, serialNumber
    status: 'AVAILABLE' | 'SOLD' | 'RETURNED' | 'DEFECTIVE'
    purchasedPrice, soldPrice
    soldDate, soldToInvoiceId
    warrantyExpiry
    binId
}
```

### الـ Flow:
```
1. GRN يستلم 5 لابتوبات:
   - يدخل 5 serial numbers
2. عند البيع:
   - الكاشير يختار serial number محدد
   - status: AVAILABLE → SOLD
3. عند الإرجاع:
   - status: SOLD → RETURNED
4. تتبع الضمان:
   - GET /api/inv/serials/{serial}
```

---

## 📋 الجرد (Stocktake)

### الأنواع:

#### 1. Full Stocktake (سنوي):
```
1. تجميد الحركات
2. كل موظف يأخذ منطقة
3. يعدّ كل المنتجات يدوياً
4. النظام يقارن:
   System Qty vs Counted Qty
5. الفروقات:
   إذا |variance| > tolerance → تسوية + JE
6. ترحيل الفروقات:
   Dr/Cr Inventory Adjustment / Inventory
```

#### 2. Cycle Count (شهري/أسبوعي):
```
1. اختيار سلوكي:
   - المنتجات A (الأعلى قيمة): أسبوعياً
   - المنتجات B (متوسطة): شهرياً
   - المنتجات C (الأقل): ربعياً
2. عدّ منطقة واحدة في اليوم
3. تسوية فروقات صغيرة
```

#### 3. AI Vision Stocktake (متقدم):
- المستخدم يصور المنتجات بكاميرا الموبايل
- Gemini Vision يتعرف على المنتجات
- يعد الكميات تلقائياً
- المسار: `/stocktake/vision`

### النماذج:
```prisma
Stocktake {
    warehouseId, status
    countedDate, finalizedDate
    method: 'FULL' | 'CYCLE' | 'AI_VISION'
}
StocktakeItem {
    stocktakeId, productId
    systemQuantity, countedQuantity
    variance
    notes
}
```

---

## 🔁 التحويلات (Transfers)

### بين المستودعات:
```
1. طلب التحويل:
   POST /api/stock-transfers
   { sourceStockId, destinationStockId, lines: [...] }
   - حالة: PENDING
   - يحجز في المصدر (reservedQuantity)
   
2. الموافقة:
   POST /api/stock-transfers/{id}/approve
   - حالة: IN_TRANSIT
   - يخفض من المصدر (موضوع نظرياً في الطريق)
   
3. الاستلام في الوجهة:
   POST /api/stock-transfers/{id}/receive
   - حالة: COMPLETED
   - يزيد في الوجهة
   - لا JE (نفس الشركة، نفس الحساب)
```

### Smart Transfers (AI):
- النظام يقترح تحويلات لتوازن المخزون
- مثال: فرع A بفائض، فرع B بنقص → تحويل
- المسار: `/smart-transfers`, `/api/smart-transfers`

---

## 📊 WMS (Warehouse Management System)

### الميزات:
- **Picking Waves:** تجميع orders للتجهيز بكفاءة
- **Putaway:** اقتراح أفضل bin للمنتج الجديد
- **Cross-docking:** نقل مباشر من GRN لـ DN بدون تخزين
- **Slotting:** تحسين توزيع المنتجات في المستودع

### الـ Flow (Picking):
```
1. تجميع orders → Wave
   POST /api/inventory/wms/waves
   - 10-20 order معاً
   - تحسين المسار في المستودع
   
2. النظام يطبع picking list:
   - مرتبة حسب موقع الـ bin
   - يقلل المشي
   
3. العامل يتبع الـ list:
   - يمسح barcode لكل picked item
   - النظام يحدّث ProductStock فوراً
   
4. التحقق في نقطة التجميع
5. Packaging → Shipping
```

### المسارات:
- `/api/inventory/wms`
- `/api/inventory/wms/putaway`
- `/wms`, `/wms/waves`

---

## 🏷️ Barcode Management

### الأنواع المدعومة:
- **EAN-13** (الأكثر شيوعاً للبيع بالتجزئة)
- **UPC-A**
- **CODE-128**
- **QR Code**

### المسار:
- `/barcode` — UI لطباعة الباركود
- يستخدم `bwip-js` للتوليد

### الـ Flow:
```
1. اختر المنتج/المنتجات
2. اختر القالب (50/sheet, 100/sheet, ...)
3. اطبع
4. الصق على المنتج
```

### Multi-Barcode:
- المنتج الواحد قد يكون له barcodes متعددة
- مثال: علبة (12 حبة) لها barcode مختلف عن الحبة
- يدار عبر `ProductUnit.barcode`

---

## 📡 AI Vision Inventory

### الوصف:
استخدام Gemini Vision لجرد سريع.

### الـ Flow:
```
1. المستخدم يفتح /inventory/ai-vision
2. يلتقط صورة لرف المنتجات
3. POST /api/stocktake/vision
   Body: FormData with image
4. Gemini Vision يحدد:
   - أنواع المنتجات (matched بـ DB)
   - الكميات التقديرية
5. النظام يقارن مع DB:
   - إذا match: OK
   - إذا variance > tolerance: تنبيه
6. المستخدم يؤكد ويترحل
```

### الدقة:
- ~70-85% (تقديري)
- يحتاج تحقق بشري
- يوفر 80% من وقت الجرد التقليدي

---

## 📈 تقارير المخزون

### الأساسية:
| التقرير | الوصف |
|---|---|
| **Stock Level** | الكمية الحالية لكل منتج |
| **Stock Valuation** | تقييم المخزون (FIFO/LIFO/Avg) |
| **Stock Movements** | حركات الفترة |
| **Reorder Report** | المنتجات تحت الحد الأدنى |
| **Slow Moving** | المنتجات منخفضة الحركة |
| **Dead Stock** | منتجات بلا حركة > 6 أشهر |
| **Expiry Report** | المنتجات قابلة الانتهاء |
| **ABC Analysis** | تصنيف 80/15/5 |
| **Aging** | عمر المخزون |

### المسارات:
- `/api/inventory/reports`
- `/api/inventory/abc-analysis`

---

## 🎯 Reorder & Demand Forecasting

### Reorder Rules:
```prisma
Product {
    minQuantity     // الحد الأدنى
    maxQuantity     // الحد الأقصى
    reorderQty      // الكمية المطلوبة
    leadTimeDays    // وقت التوريد
}
```

### Reorder Logic:
```typescript
// /api/cron/reorder-alerts (يومياً)
const products = await prisma.product.findMany({
    where: {
        currentStock: { lt: { _ref: 'minQuantity' } }
    }
});

for (const product of products) {
    // إنشاء PR تلقائي (اختياري)
    if (autoReorder) {
        await createPurchaseRequisition({
            items: [{ productId, quantity: product.reorderQty }],
            urgency: 'HIGH'
        });
    }
    
    // إشعار
    await sendNotification('Low stock alert', product);
}
```

### AI Demand Forecast (`/api/ai/demand-forecast`):
- يستخدم آخر 90 يوم
- Moving average + Trend detection
- يقترح reorder quantities ذكية

---

## 🌡️ التتبع المتقدم

### Cold Chain (الأدوية، الأطعمة):
- درجة الحرارة لكل zone
- IoT sensors (مستقبلاً)
- Alert عند خروج من النطاق

### Lot/Batch Tracking:
- لكل دفعة: تاريخ التصنيع، الانتهاء، المورد
- Traceability كاملة من المورد للعميل
- مفيد لـ recalls

### Traceability:
- `/api/inventory/traceability`
- مدخل: serial أو batch → كل الحركات

---

## 🎯 Best Practices

1. ✅ **GRN فوراً عند الاستلام** (لا تأخير)
2. ✅ **Picking مع barcode scanning** (لا يدوي)
3. ✅ **Cycle count شهري** للمنتجات A
4. ✅ **FEFO للأدوية والأغذية**
5. ✅ **Min/Max set** لكل منتج
6. ✅ **Bins واضحة** بـ labels
7. ✅ **Audit trail** لكل تعديل
8. ❌ **لا تعديل المخزون يدوياً** بدون JE adjustment
9. ❌ **لا تبيع منتج منتهي** (system block)
