# 22 - المشتريات (Purchases & Procurement)

> P2P + RFQ + GRN + 3-Way Match + Vendor Management

---

## 📦 دورة Procure-to-Pay الكاملة

```
1. PR (Purchase Requisition) — طلب الشراء الداخلي
   POST /api/purchases/requisitions
   - Initiator: أي موظف
   - يحتوي: المواد، الكميات، السبب
   - حالة: DRAFT → SUBMITTED
   
2. Approval (موافقة)
   حسب القيمة:
   < 5K SAR    → مدير القسم
   < 50K SAR   → CFO  
   < 200K SAR  → CEO
   ≥ 200K SAR  → Board
   
   POST /api/approvals/{requestId}/approve
   - حالة PR: APPROVED
   
3. RFQ (Request for Quotation) — اختياري للمبالغ الكبيرة
   POST /api/procurement/rfq
   - 3+ موردين
   - يحدد التواريخ، الشروط
   - حالة: SENT → BIDS_RECEIVED → AWARDED
   
4. PO (Purchase Order)
   POST /api/purchase-orders
   - بعد اختيار المورد
   - يحتوي: المنتجات، الكميات، الأسعار، التواريخ
   - حالة: DRAFT → ISSUED → ACKNOWLEDGED → DELIVERED → CLOSED
   - JE: لا (التزام فقط، ليس قيد)
   
5. GRN (Goods Receipt Note)
   POST /api/grn
   - عند استلام البضاعة
   - مطابقة مع PO
   - فحص جودة
   - زيادة المخزون
   - JE: Dr Inventory / Cr GR/IR Suspense
   
6. Purchase Invoice
   POST /api/purchases (invoice)
   - يصل من المورد
   - مطابقة 3-way: PO ↔ GRN ↔ Invoice
   - JE: Dr GR/IR + VAT Input / Cr AP
   - حالة: PENDING → APPROVED → POSTED
   
7. Payment Run
   POST /api/finance/payment-runs
   - تجميع فواتير للسداد
   - حسب payment terms
   - تحديد طريقة الدفع
   
8. Payment Transaction
   POST /api/finance/payments
   - تنفيذ الدفع (Bank Transfer / Check / Cash)
   - JE: Dr AP / Cr Bank
   - تطبيق على الفواتير
   - إذا أجنبي مع WHT:
     Dr AP / Cr Bank + Cr WHT Payable
```

---

## 🎯 3-Way Match (المطابقة الثلاثية)

### المنطق:
```typescript
// PO: ما طلبناه
// GRN: ما استلمناه
// Invoice: ما دفعناه

function threeWayMatch(po, grn, invoice) {
    const tolerances = {
        quantity: 0.05,  // 5% فرق مسموح
        price: 0.02,     // 2% فرق مسموح
    };
    
    const matches = [];
    
    for (const line of invoice.lines) {
        const poLine = po.lines.find(l => l.productId === line.productId);
        const grnLine = grn.lines.find(l => l.productId === line.productId);
        
        // 1. هل المنتج في الـ PO؟
        if (!poLine) {
            matches.push({ status: 'NOT_IN_PO', line });
            continue;
        }
        
        // 2. هل تم استلامه؟
        if (!grnLine || grnLine.received < line.quantity) {
            matches.push({ status: 'INSUFFICIENT_GRN', line });
            continue;
        }
        
        // 3. هل الكمية في tolerance؟
        const qtyDiff = Math.abs(line.quantity - poLine.quantity) / poLine.quantity;
        if (qtyDiff > tolerances.quantity) {
            matches.push({ status: 'QUANTITY_MISMATCH', line, diff: qtyDiff });
            continue;
        }
        
        // 4. هل السعر في tolerance؟
        const priceDiff = Math.abs(line.price - poLine.price) / poLine.price;
        if (priceDiff > tolerances.price) {
            matches.push({ status: 'PRICE_MISMATCH', line, diff: priceDiff });
            continue;
        }
        
        matches.push({ status: 'MATCHED', line });
    }
    
    return {
        allMatched: matches.every(m => m.status === 'MATCHED'),
        matches
    };
}
```

### النتائج:
- ✅ **All Matched:** ترحيل تلقائي للفاتورة
- ⚠️ **Issues found:** يدخل approval workflow
- ❌ **Failed:** يُرفض ويُرسل للمورد للتصحيح

### المسار:
- `/api/purchases/three-way-match`
- `/api/purchases/matching`

---

## 🏢 إدارة الموردين (Vendor Management)

### النماذج:
```prisma
Customer {  // مشترك للعملاء والموردين
    type: 1  // 1 = supplier
    name, taxNumber, crNo
    address, city, country
    paymentTerms: 'NET30' | 'NET60' | '2/10 NET30' | ...
    creditLimit: Decimal
    isForeignVendor: Boolean
    whtCountryCode: String?
    whtTaxResidencyCert: String?
    bankAccounts: Json
}

SupplierContract {
    supplierId, contractNo
    startDate, endDate
    paymentTerms, discountTerms
    minOrderValue, autoRenew
    status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
}

VendorScorecard {
    vendorId
    period
    onTimeDelivery: 0-100%
    qualityScore: 0-100%
    priceCompetitiveness: 0-100%
    responsiveness: 0-100%
    overallScore: 0-100%
}
```

### الـ Onboarding:
```
1. تسجيل المورد:
   POST /api/vendors
   Body: { name, taxNumber, crNo, contact, address }
   
2. التحقق التلقائي:
   - VAT number صحيح (15 رقم)
   - CR number صحيح (10 رقم)
   - البريد فريد
   
3. Approval (للمبالغ الكبيرة):
   - Finance Manager يراجع
   - يتحقق من السمعة
   - يفحص PEP/Sanctions lists (مستقبلاً)
   
4. تفعيل:
   - status: ACTIVE
   - يصبح available في PO
   
5. تقييم دوري:
   - VendorScorecard شهرياً (cron)
   - بناءً على PO/GRN/Invoice history
```

---

## 📝 RFQ (Request for Quotation)

### السيناريو:
```
1. PR كبير (> 50K SAR) → يحتاج RFQ
2. POST /api/procurement/rfq:
   {
       title, description, deadline,
       items: [{ productId, quantity, requiredDate }],
       suppliers: [vendorId1, vendorId2, vendorId3]
   }
3. النظام يرسل للموردين:
   - Email + WhatsApp مع رابط الـ Vendor Portal
4. كل مورد يقدم عرضه:
   POST /api/procurement/rfq/{id}/bid
   { 
       supplierId,
       items: [{ price, deliveryDate, terms }],
       validUntil
   }
5. الـ Buyer يراجع العروض:
   GET /api/procurement/rfq/{id}/bids
   - مقارنة سعر، جودة، توقيت، شروط
6. الترسية (Award):
   POST /api/procurement/rfq/{id}/award
   { winningBidId }
   ↓ تحول إلى PO تلقائياً
```

---

## 🚚 GRN (Goods Receipt Note)

### السيناريو:
```
1. البضاعة تصل
2. أمين المستودع يفتح PO المعنية:
   GET /api/purchase-orders/{id}
3. POST /api/grn:
   {
       poId,
       lines: [{
           productId,
           orderedQty,    // من الـ PO
           receivedQty,   // الفعلي
           condition: 'OK' | 'DAMAGED' | 'EXPIRED',
           batchNo,       // إذا batch tracking
           expiryDate,    // إذا قابل للانتهاء
           serialNumbers, // إذا serial tracking
           binId          // أين خُزن
       }]
   }
4. النظام:
   a. يزيد ProductStock
   b. ينشئ StockMovement (type: GRN)
   c. يحدّث PO line: receivedQty
   d. JE: Dr Inventory / Cr GR/IR Suspense
   e. إذا الكمية كاملة → PO status: DELIVERED
5. فحص الجودة (اختياري):
   POST /api/quality/inspections
   - Sample size
   - Pass/Fail
   - إذا fail → يُعاد للمورد
```

### الفروق المسموحة:
- **Over-receipt:** عادة 5% (يحتاج موافقة)
- **Under-receipt:** يبقى الـ PO مفتوحاً (Pending balance)

---

## 💵 Payment Runs

### السيناريو:
```
1. CFO يحدد فواتير للسداد:
   GET /api/purchases?status=APPROVED&dueWithin=7d
2. POST /api/finance/payment-runs:
   {
       runDate, currency,
       invoiceIds: [1, 2, 3, ...],
       paymentMethod: 'BANK_TRANSFER' | 'CHECK' | 'CASH'
   }
3. النظام:
   a. يجمع الفواتير
   b. يحسب الإجمالي
   c. يولد ملف بنكي (CSV/SWIFT):
      account, name, amount, reference
   d. حالة الـ run: PENDING_APPROVAL
4. CFO يوافق:
   POST /api/finance/payment-runs/{id}/approve
   ↓
5. تنفيذ الدفع:
   POST /api/finance/payment-runs/{id}/execute
   ↓
   لكل فاتورة:
     - JE: Dr AP / Cr Bank
     - إذا WHT: Dr AP / Cr Bank + Cr WHT Payable
     - تحديث Invoice.paidAmount + status
     - تحديث Vendor.balance
```

---

## 🌐 Vendor Portal

### الميزات:
- المورد يدخل بـ credentials منفصلة
- يرى الـ POs الموجهة له
- يقدم عروض على RFQs
- يرفع فواتيره مباشرة (مع PO reference)
- يتابع حالة المدفوعات

### المسارات:
- `/api/portal/vendor/login`
- `/api/portal/vendor/orders`
- `/api/portal/vendor/invoices`
- `/api/portal/vendor/rfq`
- `/api/procurement/vendor-portal`
- `/vendor-portal` — UI

---

## 📊 Vendor Scorecard

### الـ KPIs:
1. **On-Time Delivery (OTD):**
   ```
   OTD = (GRNs on-time / Total GRNs) × 100%
   ```

2. **Quality Score:**
   ```
   Quality = (Accepted units / Total received) × 100%
   ```

3. **Price Competitiveness:**
   ```
   مقارنة بـ market average
   ```

4. **Responsiveness:**
   ```
   متوسط وقت الرد على RFQs
   ```

5. **Overall Score:** weighted average

### الـ Cron:
- `/api/cron/vendor-scoring` (شهرياً)
- يحدّث `VendorScorecard`

### الاستخدام:
- ترتيب الموردين عند RFQ
- إعادة تفاوض العقود
- إنذار للموردين الضعفاء

---

## 📋 AI OCR للفواتير

### الـ Flow:
```
1. المحاسب يرفع صورة فاتورة المورد
   POST /api/purchases/ocr
   Body: FormData with image
2. النظام يرسلها لـ Gemini Vision:
   - يستخرج: supplier name, VAT no, invoice no, date, items, totals
3. الـ AI يرجع structured data:
   {
       supplier: { name, vatNumber },
       invoiceNo, date,
       items: [{ description, quantity, price }],
       subtotal, vat, total
   }
4. المحاسب يراجع ويعدل
5. POST /api/purchases (invoice)
   - يطابق مع PO الموجود (إذا وجد)
   - ينشئ الفاتورة
```

### الدقة:
- ~85-95% للفواتير العربية
- يحتاج مراجعة بشرية
- يحفظ الصورة الأصلية للأرشيف

---

## 🇸🇦 WHT للموردين الأجانب

### الفحص التلقائي:
```typescript
// عند الدفع لمورد أجنبي:
async function processPayment(invoice, vendor) {
    if (vendor.isForeignVendor) {
        const wht = await calculateWHT(invoice.id, invoice.serviceType);
        
        if (wht > 0) {
            // الدفع الصافي = الفاتورة - WHT
            const netPayment = invoice.total - wht;
            
            // JE:
            await postJournalEntry({
                lines: [
                    { account: 'AP', debit: invoice.total },
                    { account: 'BANK', credit: netPayment },
                    { account: 'WHT_PAYABLE', credit: wht }
                ]
            });
            
            // تقديم Form 14 شهرياً (تلقائي عبر cron)
        }
    }
}
```

---

## 🔁 مرتجعات الشراء (Purchase Returns)

### السيناريو:
```
1. اكتشاف عيب في البضاعة
2. POST /api/purchase-returns:
   {
       originalInvoiceId,
       lines: [{ productId, quantity, reason }],
       returnAction: 'REFUND' | 'CREDIT_NOTE' | 'REPLACE'
   }
3. النظام:
   a. يخفض المخزون
   b. JE عكسي:
      Dr AP / Cr Inventory + VAT Input
   c. إذا المورد سعودي + ZATCA:
      → يستلم Credit Note منه
   d. تحديث Vendor.balance
```

---

## 🎯 Best Practices

1. ✅ **كل شراء يمر بـ PR → PO** (إلا الـ petty cash)
2. ✅ **3-Way Match إجباري** قبل الدفع
3. ✅ **GRN مع فحص الجودة** للبضائع الحساسة
4. ✅ **Vendor Scorecard** يُراجع كل ربع
5. ✅ **WHT تلقائي** للموردين الأجانب
6. ✅ **Payment terms** محددة في العقد
7. ✅ **Multiple bids** للمشتريات الكبيرة
8. ❌ **لا تدفع** بدون فاتورة approved
9. ❌ **لا تستلم بضاعة** بدون PO (إلا cash purchase)
