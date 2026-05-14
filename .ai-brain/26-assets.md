# 26 - الأصول الثابتة (Fixed Assets)

> Acquisition + Depreciation + Transfer + Disposal + Impairment + Lease (IFRS 16)

---

## 🏗 دورة حياة الأصل الثابت

```
Acquisition → Operation → Depreciation → (Transfer / Maintenance / Impairment) → Disposal
```

---

## 📋 النماذج

### Asset Registry:
```prisma
FixedAsset {
    assetNo
    description, descriptionEn
    assetCategoryId
    
    purchaseDate, purchaseInvoiceId
    cost, salvageValue, usefulLifeMonths
    
    depreciationMethod: 'SL' | 'DDB' | 'SYD' | 'UOP'
    depreciationStartDate
    accumulatedDepreciation, netBookValue
    
    locationId, custodianEmployeeId
    serialNumber, manufacturer, model
    
    quantity            // إذا متعدد (مثل 5 كراسي)
    
    insuranceInfo: Json
    warrantyExpiry
    
    status: 'IN_USE' | 'IDLE' | 'IN_TRANSIT' | 'UNDER_MAINTENANCE' | 'IMPAIRED' | 'DISPOSED'
    
    images: Json
    documents: Json
    
    deletedAt
}

FixedAssetCategory {
    categoryName
    accountId           // حساب الأصل
    accumDepAccountId   // حساب الإهلاك المتراكم
    depreciationRate    // %
    usefulLifeMonths    // الافتراضي
}

AssetDepreciationLog {
    assetId, period
    depreciationAmount, accumulatedAt
    method, basis
    journalEntryId
}

AssetTransferRecord {
    assetId
    fromLocationId, toLocationId
    fromCustodianId, toCustodianId
    transferDate, reason
}

AssetMaintenanceRecord {
    assetId
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION'
    maintenanceDate, cost
    description, vendor
}

AssetImpairmentRecord {
    assetId
    impairmentAmount, reason
    recordedAt
    journalEntryId
}

AssetInsuranceClaim {
    assetId, claimNo
    incidentDate, claimDate
    amount, status
    settledAt, settledAmount
}

AssetReclassification {
    assetId
    fromCategoryId, toCategoryId
    reason, reclassifiedAt
}

AssetDocument {
    assetId
    documentType: 'INVOICE' | 'WARRANTY' | 'INSURANCE' | 'MANUAL' | ...
    fileUrl
}
```

---

## 💰 الاقتناء (Acquisition)

### السيناريو:
```
1. شراء الأصل (PO + GRN + Invoice):
   - PR → PO → GRN → Invoice
   - يتم تحديد: "هذا أصل ثابت" في الـ Invoice
   
2. POST /api/fixed-assets:
   {
       description, categoryId,
       cost, salvageValue, usefulLifeMonths,
       depreciationMethod,
       purchaseDate, purchaseInvoiceId,
       locationId, custodianEmployeeId
   }
   
3. النظام:
   a. ينشئ FixedAsset
   b. يحسب التكاليف الإضافية (Landed Costs):
      - النقل، التركيب، التأمين
      - Dr Asset / Cr Bank for each
   c. JE الافتتاح:
      Dr  Fixed Asset (1410)      100000
          Cr  Bank/AP                   100000
   d. تحديد تاريخ بداية الإهلاك
   e. يُدرج في الـ register
```

### مثال:
- شراء سيارة بـ 100,000 SAR
- صلاحية: 5 سنوات (60 شهر)
- Salvage: 10,000
- طريقة الإهلاك: Straight-Line
- Monthly Depreciation: (100,000 - 10,000) / 60 = 1,500 SAR/month

---

## 📉 الإهلاك (Depreciation)

### الطرق المدعومة:

#### 1. Straight-Line (SL):
```
Monthly = (Cost - Salvage) / Useful Life in Months
```
**الاستخدام:** الأصول التي تُستخدم بشكل ثابت (مباني، سيارات إدارية)

#### 2. Declining Balance (DB / DDB):
```
Rate = 2 / Useful Life (Years) = 200% / Useful Life
Monthly Depreciation = Beginning NBV × (Rate / 12)
```
**الاستخدام:** الأصول التي تفقد قيمتها سريعاً (إلكترونيات، تكنولوجيا)

#### 3. Sum-of-Years' Digits (SYD):
```
SYD = N(N+1)/2  where N = useful life in years
Year n depreciation = (Cost - Salvage) × (N - n + 1) / SYD
```
**الاستخدام:** نادراً (محاسبياً)

#### 4. Units of Production (UOP):
```
Depreciation = (Cost - Salvage) × (Units Used / Total Expected Units)
```
**الاستخدام:** الماكينات الإنتاجية، السيارات (بـ KM)

### الإهلاك الشهري (Cron):
```typescript
// /api/cron/depreciation-monthly (يوم 28 من كل شهر)
const assets = await prisma.fixedAsset.findMany({
    where: { 
        status: { in: ['IN_USE', 'IDLE'] },
        netBookValue: { gt: 0 }
    }
});

for (const asset of assets) {
    const dep = calculateMonthlyDepreciation(asset);
    
    // سجل
    await prisma.assetDepreciationLog.create({
        data: { assetId: asset.id, period: thisMonth, amount: dep }
    });
    
    // JE
    await postJournalEntry({
        lines: [
            { account: 'DEPRECIATION_EXP', debit: dep, costCenterId: asset.locationId },
            { account: 'ACCUMULATED_DEPRECIATION', credit: dep }
        ]
    });
    
    // تحديث الأصل
    await prisma.fixedAsset.update({
        where: { id: asset.id },
        data: {
            accumulatedDepreciation: { increment: dep },
            netBookValue: { decrement: dep }
        }
    });
}
```

### Engine (`src/lib/depreciation-engine.ts` — 490 سطر):
- يدعم كل الطرق
- يأخذ في الاعتبار:
  - Mid-year acquisitions (نسبة الأشهر)
  - Mid-year disposals
  - Holiday periods (إيقاف مؤقت)
  - Asset additions (تحسينات تزيد الـ cost)

---

## 🔁 التحويلات (Transfers)

### الأنواع:
1. **بين الفروع:** سيارة تنتقل من فرع للآخر
2. **بين الأقسام:** كمبيوتر من قسم لآخر
3. **بين المسؤولين:** المحاسب القديم → الجديد

### الـ Flow:
```
1. POST /api/fixed-assets/{id}/transfer:
   {
       fromLocationId, toLocationId,
       fromCustodianId, toCustodianId,
       transferDate, reason
   }
2. النظام:
   a. ينشئ AssetTransferRecord
   b. يحدّث FixedAsset.locationId و custodianEmployeeId
   c. لا JE (نفس الشركة، الحساب)
   d. توقيع إلكتروني من الجهتين
```

---

## 🔧 الصيانة (Maintenance)

### الأنواع:
- **Preventive (وقائية):** مجدولة (كل 6 أشهر مثلاً)
- **Corrective (إصلاحية):** عند العطل
- **Calibration (معايرة):** للأجهزة الدقيقة
- **Predictive (تنبؤية):** بناءً على telemetry (AI)

### السيناريو:
```
1. تحديد موعد:
   POST /api/maintenance
   { assetId, type, scheduledDate, estimatedCost }
2. تنفيذ:
   - تسجيل التكلفة
   - رفع الفاتورة
3. JE:
   Dr Maintenance Expense / Cr Bank or AP
```

### الـ CMMS Module:
- `/cmms`, `/cmms/work-orders`
- إدارة شاملة للصيانة

---

## 📉 الانخفاض (Impairment) — IFRS 36

### متى:
- القيمة السوقية أقل من الـ NBV
- تلف فعلي
- تطور تكنولوجي يجعل الأصل قديماً
- خسائر استخدام

### الـ Flow:
```
1. الاكتشاف (سنوياً أو عند علامات):
   - مقارنة Recoverable Amount مع NBV
   - Recoverable Amount = max(Fair Value, Value in Use)
   
2. إذا Recoverable < NBV:
   POST /api/fixed-assets/{id}/impair
   { impairmentAmount, reason }
   
3. JE:
   Dr  Impairment Loss (5920)    20000
       Cr  Asset Impairment (1419)    20000
   
4. تحديث:
   asset.netBookValue -= impairmentAmount
   asset.status = 'IMPAIRED'
```

### الانعكاس (Reversal):
- إذا تحسنت الظروف، يمكن عكس الانخفاض (جزئياً)
- لا يتجاوز الـ NBV الأصلي قبل الانخفاض

---

## 🚮 التخريد (Disposal)

### الأنواع:

#### 1. البيع (Sale):
```
1. POST /api/fixed-assets/{id}/dispose:
   { type: 'SALE', salePrice, salePartner, saleDate }

2. حسابات:
   NBV = Cost - Accumulated Depreciation
   Gain/Loss = SalePrice - NBV
   
3. JE:
   Dr  Bank                          15000  (سعر البيع)
   Dr  Accumulated Depreciation      80000
       Cr  Fixed Asset                    100000
       Cr  Gain on Disposal (4910)            ... (إذا ربح)
   OR
       Dr  Loss on Disposal (5910)           ... (إذا خسارة)
```

#### 2. الخردة (Scrap):
```
بدون عوائد:
Dr  Accumulated Depreciation      80000
Dr  Loss on Disposal (5910)       20000
    Cr  Fixed Asset                    100000
```

#### 3. السرقة/الفقدان:
```
1. تقديم claim للتأمين
2. تسجيل خسارة مؤقتة
3. عند استلام التعويض:
   Dr  Bank                          10000
   Dr  Loss on Disposal               10000
   Dr  Accum Dep                     80000
       Cr  Fixed Asset                    100000
```

---

## 🏠 IFRS 16 — Leases

### المفهوم:
- قبل IFRS 16: الإيجار operating (مصروف فقط)
- بعد IFRS 16: الإيجار يُسجل كأصل (Right-of-Use) + التزام

### الـ Flow:
```
1. توقيع عقد إيجار طويل (> 1 سنة):
   POST /api/finance/leases
   {
       lessor, asset,
       startDate, endDate, leasePeriodMonths,
       monthlyPayment, totalPayments,
       discountRate (e.g., 5%)
   }

2. حساب الـ Lease Liability (Present Value):
   PV = Σ (Payment / (1 + r)^n)
   
3. الاعتراف الأولي:
   Dr  ROU Asset (1420)                95000
       Cr  Lease Liability (2420)            95000

4. شهرياً (Cron `/api/cron/ifrs16-monthly`):
   a. Lease Payment:
      Dr  Lease Liability                  ... (Principal portion)
      Dr  Interest Expense (5710)          ... (Interest portion)
          Cr  Bank                              ... (Full payment)
   
   b. Amortization of ROU:
      Dr  Amortization Exp (5611)          ... 
          Cr  ROU Accumulated Amort             ...
```

### المسارات:
- `/api/finance/leases`
- `/fixed-assets` (UI shared)
- `/api/cron/ifrs16-monthly`

---

## 📊 تقارير الأصول

| التقرير | الوصف |
|---|---|
| **Asset Register** | كل الأصول مع NBV |
| **Depreciation Schedule** | جدول الإهلاك الشهري/السنوي |
| **Transfer Log** | سجل التحويلات |
| **Maintenance Cost** | تكلفة الصيانة لكل أصل |
| **Disposal Report** | الأصول المباعة + الربح/الخسارة |
| **CWIP Report** | الأصول قيد الإنشاء |
| **Insurance Coverage** | حالة التأمين |

---

## 🚧 CWIP (Construction Work in Progress)

### للأصول قيد الإنشاء:
```prisma
ConstructionInProgress {
    description, projectId
    estimatedCompletion
    accumulatedCost     // يزيد مع كل مصروف
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
}
```

### الـ Flow:
```
1. بدء المشروع
2. لكل مصروف:
   Dr CWIP / Cr Bank or AP
3. عند الاكتمال:
   - تحويل CWIP إلى FixedAsset
   - بدء الإهلاك
   - JE:
     Dr Fixed Asset (e.g., Building) / Cr CWIP
```

### الحالة في النظام:
- **Schema جاهز** ✅
- **UI ناقص** 🟡
- **Engine جزئي** 🟡

---

## 🎯 Best Practices

1. ✅ **تصنيف صحيح** عند الاقتناء (Category مهم)
2. ✅ **تسجيل serial number** لكل أصل
3. ✅ **تحديد custodian** لكل أصل
4. ✅ **Insurance لكل الأصول الثمينة**
5. ✅ **فحص سنوي للانخفاض**
6. ✅ **Audit Trail** لكل تحويل
7. ✅ **JE تلقائي للإهلاك** عبر cron
8. ✅ **IFRS 16 للإيجارات > 12 شهر**
9. ❌ **لا تسجل مصاريف صيانة** كـ asset (إلا تحسينات كبيرة)
10. ❌ **لا تنسى تسوية الإهلاك** قبل الإقفال السنوي
