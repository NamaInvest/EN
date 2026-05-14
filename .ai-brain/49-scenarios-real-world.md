# 49 - السيناريوهات الواقعية (Real-World Scenarios)

> 35+ سيناريو حقيقي يحدث في الشركات السعودية يومياً — مع الخطوات الكاملة والقيود والـ APIs

---

## 🛒 سيناريوهات المبيعات

### 1. عميل يشتري نقداً (POS)
**الموقف:** زبون يأتي للمحل، يأخذ منتجات، يدفع نقداً.

```
الخطوات:
1. الكاشير افتح الجلسة صباحاً:
   POST /api/pos/session/open
   { openingCash: 500 }
   
2. الزبون يقترب بمنتجاته
3. الكاشير يمسح الباركود لكل منتج (يضاف للسلة)
4. الزبون يدفع 230 SAR نقداً
5. POST /api/pos
   { items: [...], paymentMethod: 'CASH', amountPaid: 250 }
6. النظام:
   - يولّد invoice number: INV-2026-0345
   - يحسب: subtotal=200, VAT=30, total=230
   - يولّد QR (ZATCA Phase 2 — 9 tags)
   - يخفض المخزون
   - JE تلقائي:
     Dr Cash (1110)         230
        Cr Sales Rev (4110)    200
        Cr VAT Output (2310)    30
     Dr COGS (5110)         120
        Cr Inventory (1330)    120
   - يرسل للـ ZATCA (B2C reporting)
7. طباعة:
   - فاتورة 80mm thermal مع QR
   - يفتح cash drawer
8. الزبون يستلم الفاتورة + 20 SAR باقي

في نهاية اليوم:
1. POST /api/pos/session/close
   { declaredCash: 5230 }
2. النظام يقارن:
   - Expected = 500 + Sales(نقد) - Returns(نقد) = 5180
   - Declared = 5230
   - Variance = +50 SAR (زيادة، غريب!)
   - تسجيل في AuditLog للمراجعة
3. JE: Dr Cash / Cr POS Sessions
```

---

### 2. شركة تشتري بالـ Credit (B2B)
**الموقف:** شركة معتمدة تشتري بالآجل.

```
1. مندوب المبيعات يفتح فاتورة:
   POST /api/sales
   {
     customerId: 50,  // العميل المعتمد
     paymentTerms: 'NET30',
     items: [...]
   }

2. النظام يفحص:
   - customer.creditLimit = 100,000 SAR
   - customer.balance = 70,000 SAR
   - هذه الفاتورة = 25,000 SAR
   - 70,000 + 25,000 = 95,000 < 100,000 ✓ OK
   - (لو > 100,000 → block + إنذار CFO)

3. النظام:
   - يولّد فاتورة B2B (لها VAT)
   - يرسل للـ ZATCA Clearance (synchronous!)
   - ينتظر ~5 ثوان
   - clearance_uuid يعود
   - JE:
     Dr AR (1210)            28,750
        Cr Sales Rev (4110)     25,000
        Cr VAT Output (2310)     3,750
   - تحديث customer.balance += 28,750

4. إرسال الفاتورة:
   - PDF بالعربي + الإنجليزي
   - مع QR (Phase 2 — 9 tags)
   - إيميل + WhatsApp للعميل

5. بعد 30 يوم:
   - cron يفحص الـ overdue
   - إذا لم تُدفع → Dunning Level 1
   - يرسل تذكير

6. عند الدفع (يأتي شيك بقيمة 28,750):
   POST /api/finance/checks
   { type: 'RECEIVED', amount: 28750, dueDate: '+5d' }
   → JE: Dr Checks Under Collection / Cr AR

7. إيداع الشيك:
   PUT /api/finance/checks/{id}/deposit
   → JE: Dr Bank / Cr Checks Under Collection

8. مقاصة (3 أيام لاحقاً):
   PUT /api/finance/checks/{id}/clear
   → الرصيد البنكي فعلي
```

---

### 3. عميل يرجع منتج
**الموقف:** زبون اشترى أمس، يريد الإرجاع.

```
1. الكاشير يبحث عن الفاتورة الأصل:
   GET /api/sales/INV-2026-0345

2. اختيار البنود المرتجعة:
   - منتج A: كمية 1 (من أصل 2)
   - منتج B: كمية 2 (كاملة)

3. تحديد السبب:
   - PRODUCT_DEFECT / WRONG_ITEM / CUSTOMER_CHANGED_MIND
   - حالة المنتج: NEW (يعاد للمخزون) أو DAMAGED (يُتلف)

4. POST /api/sales-returns
   {
     originalInvoiceId: 12345,
     lines: [
       { productId: 1, quantity: 1, condition: 'NEW' },
       { productId: 2, quantity: 2, condition: 'NEW' }
     ],
     restockingFee: 5,  // اختياري
     returnMethod: 'CASH'
   }

5. النظام:
   - ينشئ SalesReturn
   - يزيد المخزون (للمنتجات NEW)
   - JE عكسي:
     Dr Sales Returns (4111)    150
     Dr VAT Output (2310)        22.50
        Cr Cash (1110)            172.50
     Dr Inventory (1330)         90
        Cr COGS (5110)             90
   - يولّد Credit Note بـ ZATCA
   - يطبع credit note

6. الكاشير يعطي 172.50 نقداً
7. تحديث الـ POS session: returnsTotal += 172.50
```

---

## 🛍 سيناريوهات المشتريات

### 4. شراء بضاعة من مورد
**الموقف:** أمين المخزون يحتاج إعادة طلب.

```
1. النظام يكتشف نقص (cron يومي):
   - منتج X: currentStock=5, minQuantity=20
   - cron ينشئ تنبيه

2. أمين المخزون يقدم PR:
   POST /api/purchases/requisitions
   {
     items: [{ productId: 1, quantity: 100 }],
     urgency: 'NORMAL',
     justification: 'مخزون منخفض'
   }
   حالة: SUBMITTED

3. الموافقة (حسب المبلغ):
   - 100 × 50 = 5000 SAR
   - رولز: < 5K → مدير القسم
   - POST /api/approvals/{id}/approve
   حالة: APPROVED

4. PO إنشاء:
   POST /api/purchase-orders
   {
     supplierId: 25,
     items: [...],
     deliveryDate: '+7d',
     paymentTerms: 'NET30'
   }
   - يُرسل للمورد (email + PDF)
   حالة: ISSUED

5. المورد يقبل:
   PUT /api/purchase-orders/{id}/acknowledge
   حالة: ACKNOWLEDGED

6. البضاعة تصل بعد 7 أيام:
   POST /api/grn
   {
     poId: 555,
     lines: [
       { productId: 1, orderedQty: 100, receivedQty: 98, condition: 'OK' },
       // 2 missing
     ]
   }
   
7. النظام:
   - يزيد ProductStock (+98)
   - JE: Dr Inventory / Cr GR/IR Suspense (98 × cost)
   - PO line: receivedQty=98, status=PARTIAL
   - تنبيه: 2 ناقصة → اتصال بالمورد

8. المورد يرسل الفاتورة:
   POST /api/purchases
   {
     poId: 555,
     supplierInvoiceNo: 'SUP-2025-789',
     items: [{ productId: 1, quantity: 98, price: 50 }]
   }

9. 3-Way Match (تلقائي):
   - PO: 100 unit @ 50 SAR
   - GRN: 98 unit
   - Invoice: 98 unit @ 50 SAR
   - الكميات تطابق ✓
   - الأسعار تطابق ✓
   - APPROVED تلقائياً
   
   لو كان السعر مختلف 51 (10% فرق):
   - tolerance > 2% → MISMATCH
   - يحتاج موافقة CFO

10. JE:
    Dr GR/IR Suspense (2120)     4900
    Dr VAT Input (1340)           735
       Cr AP (2110)                5635

11. بعد 30 يوم (Payment Run):
    POST /api/finance/payment-runs
    { invoiceIds: [...], paymentMethod: 'BANK_TRANSFER' }
    
12. CFO يوافق:
    POST /api/finance/payment-runs/{id}/approve

13. تنفيذ الدفع:
    POST /api/finance/payment-runs/{id}/execute
    - JE: Dr AP / Cr Bank (5635)
```

---

### 5. شراء خدمة من شركة أجنبية (مع WHT)
**الموقف:** شراء استشارة برمجية من شركة أمريكية بـ 50,000 SAR.

```
1. تسجيل المورد كـ Foreign Vendor:
   POST /api/vendors
   {
     name: 'TechCorp USA',
     isForeignVendor: true,
     whtCountryCode: 'US',
     whtTaxResidencyCert: 'US-TRC-2026-001',  // الشهادة
     country: 'US'
   }

2. PO + الخدمة منجزة:
3. الفاتورة:
   POST /api/purchases
   {
     supplierId: 30,
     serviceType: 'TECHNICAL_CONSULTING',  // 5% with treaty
     amount: 50000
   }

4. النظام يحسب:
   - WHT rate (default): 15% للخدمات
   - مع الـ US treaty + cert valid: 5%
   - WHT = 50000 × 5% = 2500

5. JE الفاتورة:
   Dr Consulting Expense (5510)   50000
   Dr VAT Input (RC) (1340)        7500   ← Reverse Charge
      Cr AP - TechCorp (2110)      47500   ← نخصم WHT
      Cr WHT Payable (2350)         2500
      Cr VAT Output (RC) (2310)     7500   ← Reverse Charge

6. الدفع (بعد 30 يوم):
   - تحويل 47,500 SAR للمورد
   - JE: Dr AP / Cr Bank (47500)

7. آخر الشهر:
   - تقديم Form 14 لـ ZATCA
   - دفع WHT الـ 2,500 لـ ZATCA
   - JE: Dr WHT Payable / Cr Bank
```

---

## 💼 سيناريوهات HR والرواتب

### 6. توظيف موظف جديد
**الموقف:** تعيين محاسب سعودي.

```
1. JobRequisition من المدير المالي
2. الموافقة من CEO

3. التوظيف:
   POST /api/hr/employees
   {
     fullName: 'أحمد عبدالله محمد',
     nationalId: '1012345678',
     nationality: 'SA',
     position: 'محاسب',
     department: 'المالية',
     hireDate: '2026-05-15',
     contractType: 'PERMANENT',
     baseSalary: 8000,
     housingAllowance: 1500,
     transportAllowance: 500,
     bankCode: 'RJHI',
     iban: 'SA0380000000608010167519'
   }

4. النظام يتحقق:
   - IBAN صحيح (SA + 22 char)
   - National ID صحيح
   - الراتب الإجمالي = 10,000

5. الـ Onboarding تلقائي:
   - تسجيل في GOSI:
     - subjectWage = 10,000
     - employeeContrib = 10% = 1000
     - employerContrib = 12% = 1200
   - إنشاء User account
   - إضافة للسلة المالية للراتب
   - تنبيه HR Manager
   - إرسال welcome email

6. أول راتب (في 28 من الشهر):
   cron payroll-monthly:
   - حساب الراتب:
     Gross = 8000 + 1500 + 500 = 10,000
     GOSI Employee = 1000
     Net = 9,000
   - JE:
     Dr Salary Expense (5210)       10,000
     Dr GOSI Exp Employer (5220)     1,200
        Cr Salary Payable (2330)         9,000
        Cr GOSI Payable Emp (2340)       1,000
        Cr GOSI Payable Empl (2341)      1,200

7. توليد WPS SIF:
   HDR|v3|...
   EMP|1012345678|SA0380000000608010167519|8000|1500|500|0|0|9000|RJHI
   TRL|...

8. رفع للبنك → صرف الراتب
   JE: Dr Salary Payable / Cr Bank
```

---

### 7. موظف يقدم استقالته
**الموقف:** موظف بعد 7 سنوات يقدم استقالة.

```
1. تقديم الاستقالة:
   - رسمياً 2 شهر مقدماً
   - HR يدخل التاريخ النهائي

2. حساب EOS:
   POST /api/hr/eos/calculate
   {
     employeeId: 50,
     terminationReason: 'RESIGNATION',
     exitDate: '2026-07-15'
   }

   حساب:
   - baseSalary = 10,000
   - yearsOfService = 7
   - Article 85 (resignation), 5-10 years → 2/3
   - الكامل (لو فُصل) = 2.5 × 10000 + (7-5) × 10000 = 45,000
   - مع التعديل = 45,000 × 2/3 = 30,000 SAR

3. تسوية نهائية:
   - الراتب لأيام العمل
   - رصيد الإجازات السنوية المتبقية (× الراتب اليومي)
   - EOS
   - Loans المتبقية (تُخصم)

4. JE النهائية:
   Dr Salary Expense              5,000  (نصف الشهر)
   Dr Leave Compensation         2,000
   Dr EOS Liability             30,000
   Dr Loan Receivable            -3,000  (يُخصم من المستحق)
      Cr Bank                          34,000

5. تحديث:
   - Employee.status = TERMINATED
   - Employee.terminationDate = exit date
   - GOSI: إنهاء الاشتراك
   - Qiwa: إنهاء العقد
   - WPS: إزالة من البطش القادم

6. التسليم النهائي:
   - بطاقة العمل
   - الأجهزة (laptop, phone)
   - شهادة عمل
   - يُغلق User account
```

---

### 8. موظف يطلب سلفة
**الموقف:** موظف يحتاج 5000 SAR كسلفة.

```
1. POST /api/hr/loans
   {
     employeeId: 50,
     loanAmount: 5000,
     installments: 5,
     reason: 'مصاريف طبية'
   }
   monthlyInstallment = 1000

2. الموافقة:
   - HR Manager (< 10K)
   - أو CFO (10K-50K)

3. الصرف (نقد أو bank):
   JE: Dr Employee Loan Receivable / Cr Bank (5000)

4. كل شهر (تلقائياً في payroll):
   - PayrollRunItem.loanDeduction = 1000
   - JE: Dr Salary Payable / Cr Employee Loan Receivable (1000)
   - تحديث Loan.paidInstallments + remainingBalance

5. بعد 5 شهور:
   - remainingBalance = 0
   - status: PAID
```

---

## 💰 سيناريوهات المحاسبة

### 9. إقفال الشهر (Month-End Close)
**الموقف:** نهاية شهر مايو 2026، نريد إقفال محاسبي.

```
الفترة: من 1-31 مايو

1. اليوم 1 من يونيو، 6 صباحاً:
   - cron-end-of-month يبدأ

2. الخطوات الـ 16:
   a. Pre-close checks:
      - لا فواتير في DRAFT
      - كل GRN له فاتورة (or accrual)
      - كل bank statement مُسوّى
      
   b. Accruals (المستحقات):
      - مصروفات استحقت ولم تُسجل بعد
      - مثلاً: فاتورة كهرباء لشهر مايو (تصل في يونيو)
      - JE: Dr Utilities Exp / Cr Accrued Expenses
      
   c. Prepayments amortization:
      - تأمين دفعنا 12,000 سنوياً
      - شهرياً يستهلك 1,000
      - JE: Dr Insurance Exp / Cr Prepaid Insurance
      
   d. Depreciation:
      - cron-depreciation-monthly
      - لكل أصل: حساب الإهلاك الشهري
      - JE: Dr Dep Exp / Cr Accum Dep
      
   e. FX Revaluation:
      - cron-fx-revaluation
      - للحسابات بعملات أجنبية
      - مقارنة بسعر اليوم الأخير
      - JE: Dr/Cr FX Gain/Loss
      
   f. ECL (Expected Credit Loss):
      - cron-ecl
      - حساب المخصص للعملاء المتعثرين
      - JE: Dr Bad Debt Exp / Cr Allowance
      
   g. Inventory valuation:
      - تحديث averageCost
      - حساب WIP لإنتاج لم يكتمل
      - JE: variances if any
      
   h. WHT submission:
      - Form 14 شهري
      - دفع WHT للـ ZATCA
      - JE: Dr WHT Payable / Cr Bank
      
   i. GOSI submission:
      - ملف شهري
      - دفع لـ GOSI
      - JE: Dr GOSI Payable / Cr Bank
      
   j. Bank reconciliation final:
      - مطابقة كل الحسابات البنكية
      - تسوية الفروقات
      
   k. AR Aging:
      - تقرير أعمار الديون
      - تحديث dunning levels
      
   l. AP Aging:
      - تقرير أعمار الموردين
      - تحديد الـ payment runs
      
   m. Trial Balance:
      - يجب أن يتوازن (Dr = Cr)
      - إذا لا → خطأ، investigate
      
   n. Statements:
      - P&L
      - Balance Sheet
      - Cash Flow
      - تجميع للـ Dashboard
      
   o. Notify Stakeholders:
      - CFO email مع التقارير
      - Owner notification
      
   p. Lock Period:
      - POST /api/accounting/period-close/{id}/lock
      - FiscalPeriod.locked = true
      - لا يمكن تعديل/إضافة قيود في مايو بعد الآن
      - تعديل لاحقاً: يحتاج owner permission + audit log

3. حالة الفترة: CLOSED ✓
```

---

### 10. اكتشاف خطأ في قيد POSTED
**الموقف:** الـ controller اكتشف خطأ في قيد POSTED من شهر مضى.

```
المشكلة: قيد بقيمة 5000 SAR، الحساب كان خطأ.

❌ غير مسموح: تعديل القيد مباشرة (POSTED)

✅ الطريقة الصحيحة:

1. إنشاء Reversal Entry:
   POST /api/accounting/journal/{id}/reverse
   - يولّد قيد عكسي تلقائياً
   - نفس المبلغ، نفس الحسابات، عكس Dr/Cr
   - يربطه بالأصل

2. حالة القيد الأصل: REVERSED
3. يُنشئ قيد جديد بالحساب الصحيح:
   POST /api/accounting/journal
   - تفاصيل صحيحة
   - description: "تصحيح JE-2026-0123 — حساب خاطئ"

4. الأثر:
   - الفترة السابقة (مايو) — لا تتغير في الـ trial balance
   - الفترة الحالية (يونيو) — يحتوي القيدان (reversal + correction)
   - net effect = صفر على مايو، +/- على يونيو

5. لو الفترة مفتوحة:
   - يمكن تعديل القيد مباشرة (DRAFT)
   - أو reversal كما أعلاه

6. لو الفترة مقفلة:
   - فقط reversal in current period
   - يحتاج موافقة CFO
```

---

### 11. عميل يدفع جزئياً
**الموقف:** فاتورة 10,000 SAR، عميل دفع 3,000 فقط.

```
1. استلام الدفعة:
   POST /api/finance/payments
   {
     type: 'INCOMING',
     customerId: 50,
     amount: 3000,
     method: 'BANK_TRANSFER',
     reference: 'BT-2026-12345',
     appliedTo: [{ invoiceId: 999, amount: 3000 }]
   }

2. النظام:
   - JE: Dr Bank / Cr AR (3000)
   - تحديث Invoice.paidAmount += 3000
   - Invoice.status: 'POSTED' → 'PARTIAL_PAID' (7000 outstanding)
   - تحديث Customer.balance -= 3000

3. إذا الدفعة بدون allocation محددة (FIFO):
   - النظام يطبقها على أقدم فاتورة أولاً

4. كشف الحساب:
   GET /api/accounting/customer-statement/{customerId}
   - يعرض كل الفواتير
   - الدفعات المطبقة
   - الرصيد المتبقي
```

---

## 🏭 سيناريوهات الإنتاج

### 12. إنتاج 100 كيلو كيك
**الموقف:** مصنع حلويات يصنع كيك شوكولا.

```
1. أمر الإنتاج:
   POST /api/manufacturing/orders
   {
     productId: 100,  // كيك شوكولا 1 kg
     quantity: 100,   // نريد 100 كيلو
     recipeId: 5,
     dueDate: '+2d'
   }

2. حسب الـ BOM:
   لـ 100 كيك:
   - طحين: 50 kg
   - سكر: 30 kg
   - شوكولا: 10 kg
   - بيض: 400 حبة
   - زبدة: 20 kg

3. تخصيص المواد (Release):
   - فحص المتوفر في المخزون
   - حجز الكميات (reservedQty)
   - حالة: RELEASED

4. سحب المواد (Material Issue):
   POST /api/manufacturing/{moId}/issue-materials
   - تخفيض ProductStock للمواد الخام
   - JE:
     Dr WIP Inventory (1331)    8000
        Cr Raw Materials (1332)    8000

5. بدء الإنتاج:
   - WorkOrder 1: Mixing (Mixer center, 30 min)
   - WorkOrder 2: Baking (Oven, 45 min × 5 batches)
   - WorkOrder 3: Cooling
   - WorkOrder 4: Packaging
   
   لكل WO:
   - تسجيل ساعات العمالة
   - تسجيل ساعات الآلة
   - تسجيل أي إهدار (Wastage)

6. تسجيل الـ Labor:
   POST /api/manufacturing/labor
   - 3 عمال × 4 ساعات × 30 SAR/hour = 360 SAR
   - JE:
     Dr WIP                    360
        Cr Direct Labor (5310)    360

7. تسجيل Overhead:
   - Electricity, depreciation, rent allocation
   - allocation per labor hour = 50 SAR/hour
   - 12 hours × 50 = 600 SAR
   - JE:
     Dr WIP                    600
        Cr Manufacturing OH (5320) 600

8. QC:
   POST /api/manufacturing/{moId}/qc
   - فحص 10 عينة
   - Pass: 95, Fail (تالف): 5
   - الإهدار = 5 × cost = 95 SAR

9. إنهاء MO:
   POST /api/manufacturing/{moId}/close
   - تكلفة كل كيكة:
     Total Cost = 8000 + 360 + 600 = 8960
     Cost per unit = 8960 / 95 = 94.32 SAR (بسبب 5 تالفة)
   
   - JE:
     Dr Finished Goods (1333)   8960
        Cr WIP (1331)              8960
   - StockMovement: زيادة المنتج النهائي 95 وحدة

10. Variance Analysis:
    - Standard Cost = 80 SAR per unit
    - Actual Cost = 94.32 SAR
    - Variance = 14.32 SAR per unit × 95 = 1360 (Unfavorable)
    - JE:
      Dr Variance Exp (5330)    1360
         Cr Finished Goods            1360
    - تحقيق: لماذا زادت التكلفة؟
```

---

## 🏦 سيناريوهات الخزينة

### 13. مطابقة بنكية شهرية
**الموقف:** مطابقة الـ Bank statement مع الكتب.

```
1. استيراد كشف البنك (شهر مايو):
   POST /api/accounting/bank-statements/upload
   - CSV من البنك
   - 250 معاملة

2. Auto-Match:
   POST /api/accounting/bank-recon/auto-match
   النظام يحاول مطابقة:
   - 180 معاملة matched تلقائياً (72%):
     - 100 بـ Reference (confidence 1.0)
     - 60 بـ Amount + Date (confidence 0.8)
     - 20 بـ Description fuzzy (confidence 0.6)
   - 70 معاملة pending (28%)

3. المحاسب يراجع الـ pending:
   - معاملات بنكية بدون قيد:
     - رسوم بنكية 15 SAR → JE: Dr Bank Fees / Cr Bank
     - فوائد 250 SAR → JE: Dr Bank / Cr Interest Income
   - قيود بدون معاملة بنكية:
     - شيك صادر لم يُصرف بعد → Outstanding
     - إيداع لم يصل البنك → Deposit in Transit

4. الفروقات:
   - Book balance: 1,250,000
   - Bank statement balance: 1,238,000
   - Difference: 12,000
   - Reconciling items:
     + Outstanding Checks: 18,000
     - Deposits in Transit: 5,000
     - Bank Fees: 1,000 (recorded)
   - Reconciled: 1,238,000 + 18,000 - 5,000 - 1,000 = 1,250,000 ✓

5. Finalize:
   POST /api/accounting/bank-recon/{id}/finalize
   - status: COMPLETED
   - تحديث Bank.actualBalance
```

---

### 14. شيك من عميل ارتد
**الموقف:** عميل دفع بشيك، ارتد لعدم كفاية الرصيد.

```
1. الشيك مستلم من قبل بـ 10,000 SAR:
   PUT /api/finance/checks/{id}/deposit
   - status: DEPOSITED
   - JE: Dr Bank / Cr Checks Under Collection

2. البنك يرتدّ الشيك بعد 5 أيام:
   PUT /api/finance/checks/{id}/bounce
   { reason: 'Insufficient funds' }

3. النظام:
   - status: BOUNCED
   - JE عكسي:
     Dr Customer AR (1210)      10000  ← إعادة المديونية
     Dr Bank Fees (5710)            50  ← رسوم البنك
        Cr Bank (1120)                  10050

4. الإجراءات:
   - تنبيه CFO
   - إيقاف الـ credit للعميل:
     customer.creditHold = true
   - dunning level → 2
   - WhatsApp + Email للعميل
   - إذا تكرر:
     - بلاغ شرعي
     - فتح قضية في Najiz
```

---

## 📦 سيناريوهات المخزون

### 15. اكتشاف نقص في الجرد
**الموقف:** جرد دوري يكشف نقص 5 وحدات من منتج.

```
1. POST /api/stocktake
   { warehouseId: 1, type: 'CYCLE' }

2. الموظف يعدّ:
   - منتج X: System says 100, Counted = 95
   - variance = -5 (نقص)
   - reason: ربما سرقة، تلف، خطأ في التسجيل

3. تحقيق:
   - مراجعة StockMovement آخر شهر
   - مراجعة AuditLog
   - فحص الـ CCTV

4. التسوية (إذا confirmed):
   POST /api/stocktake/{id}/finalize
   - StockMovement (type: ADJUSTMENT_OUT, qty: -5)
   - JE:
     Dr Inventory Loss (5920)   500  (5 × cost 100)
        Cr Inventory (1330)          500

5. تسجيل:
   - في AuditLog
   - إذا سرقة → بلاغ شرعي
   - تعزيز الأمن
```

---

### 16. منتج اقترب من الانتهاء
**الموقف:** منتج دواء سينتهي خلال 60 يوم.

```
1. cron-document-expiry يومي:
   - يفحص ProductBatch
   - يجد batch بـ expiryDate < +90d

2. تنبيهات:
   - 90 days: Notice
   - 60 days: Warning
   - 30 days: Critical
   - 7 days: URGENT

3. الإجراءات:
   - وضع المنتج في "Quick Sale" (خصم)
   - عرض على الزبائن المعتادين
   - إذا 30 days: stop ordering more
   - إذا 7 days: prepare for write-off

4. عند الانتهاء:
   - System blocks selling (في POS)
   - يحتاج write-off:
     POST /api/inventory/write-off
     { productId, batchNo, quantity, reason: 'EXPIRED' }
   - JE: Dr Inventory Loss / Cr Inventory
```

---

## 🇸🇦 سيناريوهات ZATCA

### 17. ZATCA يرفض فاتورة
**الموقف:** فاتورة B2B أُرسلت، ZATCA رفضها.

```
1. الفاتورة الصلية:
   - أنشئت
   - أُرسلت للـ Clearance
   - response: REJECTED

2. سبب الرفض (مثال):
   - "Invalid customer VAT number"

3. النظام:
   - Invoice.zatcaStatus = 'rejected'
   - Invoice.zatcaResponse = error message
   - تنبيه CFO

4. الإصلاح:
   - الفاتورة لم تُرحّل محاسبياً بعد (حالة DRAFT)
   - تعديل الـ customer VAT
   - إعادة الإرسال:
     POST /api/zatca/retry/{invoiceId}
   - إذا CLEARED → JE تُرحّل

5. لو الفاتورة كانت POSTED (مرحّلة) قبل الإرسال:
   - يجب إصدار Credit Note
   - ثم فاتورة جديدة بالبيانات الصحيحة
```

---

### 18. تكرار ICV (مشكلة حرجة!)
**الموقف:** اكتشفنا أن ICV تكرّر بسبب race condition.

```
السبب: عمليتان إنشاء فاتورة في نفس الوقت.

❌ الخطر: ZATCA ترفض كل الفواتير اللاحقة!

الحل:
1. إيقاف فوراً:
   - block new invoices في الـ POS
   - block ZATCA submissions

2. التشخيص:
   - استعلام DB:
     SELECT zatcaIcv, COUNT(*) FROM sales_invoice GROUP BY zatcaIcv HAVING COUNT(*) > 1;
   - يكشف الـ duplicates

3. الإصلاح:
   - تحديد الفاتورة "الصحيحة" (الأقدم)
   - الباقي → ICV جديد (next available)
   - إعادة توقيع XML
   - إعادة إرسال

4. الوقاية المستقبلية:
   - استخدام SERIALIZABLE transactions:
     await prisma.$transaction(async (tx) => {
       const counter = await tx.setting.findUnique({...});
       const newIcv = parseInt(counter.value) + 1;
       await tx.setting.update({...});
       // ... use newIcv
     }, { isolationLevel: 'Serializable' });
   - أو استخدام Database SEQUENCE
```

---

## 🤖 سيناريوهات AI

### 19. AI Auditor يكشف احتيال
**الموقف:** Auditor يومي يكتشف نشاط مشبوه.

```
1. cron-daily-audit (3 AM):
   - فحص آخر 24 ساعة
   - High-risk events:
     - 02:30 AM: حذف فاتورة بقيمة 50,000 SAR
     - 02:35 AM: نفس الموظف حذف فاتورة 30,000
     - 02:40 AM: إصدار فاتورة جديدة بقيمة 5,000 لنفس العميل
   
2. Pattern detection:
   - 🔴 Pattern: "Refund Fraud"
   - الموظف ربما:
     - حذف الفواتير
     - أخذ الـ cash difference
     - أصدر فاتورة بقيمة أقل لتغطية

3. Risk Score: 9/10 🔴

4. AI prompt → Gemini:
   "حلل هذا النمط واقترح إجراءات"

5. Response:
   "احتمال احتيال عالٍ. توصيات:
    1. تعليق موظف X فوراً
    2. مراجعة كل عملياته آخر شهر
    3. فحص CCTV
    4. تحقق من POS sessions variance"

6. Telegram للـ Owner:
   🔴 تنبيه أمني — Risk 9/10
   تفاصيل + توصيات
```

---

### 20. AI CFO يقترح تحسينات
**الموقف:** التقرير اليومي يحذر من مشكلة سيولة.

```
1. cron-cfo-report (8 AM):
   - تجميع KPIs
   - Privacy filter
   - Send to Gemini

2. تحليل:
   - Cash Position: 50,000 SAR
   - AP due this week: 250,000 SAR
   - AR expected: 100,000 SAR
   - Net: -100,000 SAR (Shortage!)

3. Gemini response:
   🔴 تحذير سيولة:
   "النقد الحالي لا يكفي لتغطية الالتزامات المستحقة.
    
    التوصيات:
    1. تواصل مع 3 عملاء كبار لتحصيل 200K MTD
    2. تأجيل دفعة المورد X (200K) بأسبوع
    3. استخدام line of credit إذا متوفر
    4. تأجيل المصاريف غير الحرجة
    
    المخاطر:
    - تأخير الرواتب (28 من الشهر)
    - رسوم تأخير من الموردين"

4. للـ Owner:
   - Email بالتقرير
   - Action items

5. Owner يقرر:
   - تواصل شخصي مع العملاء الكبار
   - تفاوض مع المورد X
```

---

## 🔧 سيناريوهات تقنية

### 21. السيرفر crashed
**الموقف:** الموقع down، PM2 يقول stopped.

```
1. تنبيه Sentry + Uptime monitor
2. SSH للسيرفر:
   ssh root@46.4.188.170

3. تشخيص:
   pm2 status        → main-site: stopped, 50 restarts
   pm2 logs main-site --err → "Out of memory"

4. الحل المؤقت:
   pm2 restart main-site
   # يعمل لكن قد يفشل مرة أخرى

5. الحل الجذري:
   # 1. زيادة memory:
   pm2 delete main-site
   NODE_OPTIONS="--max-old-space-size=4096" pm2 start ...
   
   # 2. أو إضافة swap:
   fallocate -l 4G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile && swapon /swapfile
   
   # 3. تحقيق:
   - أي memory leak في الكود؟
   - استعلامات DB تجلب بيانات كثيرة؟
   - Workers تستخدم RAM؟

6. الوقاية:
   - Memory monitoring في Sentry
   - Auto-restart لو > 80%
   - Alert في Telegram
```

---

### 22. Migration فشل لمستأجر
**الموقف:** نشر تحديث، 5 مستأجرين فشل عندهم.

```
1. تنبيه من deploy.js
2. السبب: column NOT NULL مع بيانات فارغة

3. التشخيص:
   ssh root@46.4.188.170
   cd /www/wwwroot/namainvist.com
   grep "db push failed" logs/*.log

4. لكل tenant:
   psql "postgresql://.../aljassim_db"
   \# فحص:
   SELECT * FROM products WHERE new_col IS NULL;
   \# إصلاح:
   UPDATE products SET new_col = 'default' WHERE new_col IS NULL;
   \# إعادة:
   npx prisma@5.22.0 db push --schema=... --accept-data-loss

5. التحقق:
   curl https://aljassim.namainvist.com/api/health

6. الوقاية:
   - في الـ schema، استخدم nullable أولاً
   - backfill الـ defaults
   - ثم اجعلها NOT NULL في migration ثاني
```

---

### 23. الفاتورة لم تُرسل لـ ZATCA
**الموقف:** فاتورة عمرها 25 ساعة لم تُرسل (B2C — 24h deadline).

```
1. cron-zatca-worker (كل 5 دقائق):
   - يفحص zatcaStatus = 'pending'
   - يعيد المحاولة
   
2. الـ Self-healer (يومياً):
   - يكتشف الفواتير العالقة
   - يحاول إصلاح
   - إذا فشل > 3 → manual intervention

3. التشخيص اليدوي:
   GET /api/zatca/diagnose/{invoiceId}
   النتيجة:
   - "ZATCA API timeout"
   - "Production CSID expired"

4. الإصلاح:
   - إذا CSID انتهى:
     POST /api/zatca/onboard/refresh
   - إذا ZATCA service down:
     - انتظار
     - أو SLA breach
   - إذا data issue:
     - إصلاح + retry

5. الوقاية:
   - مراقبة CSID expiry (تجديد قبل 30 يوم)
   - Health check لـ ZATCA API
   - Retry policy ذكي
```

---

## 👥 سيناريوهات الإدارة

### 24. عميل يفقد كلمة السر
**الموقف:** مستخدم نسي password.

```
1. صفحة Login → "نسيت كلمة السر؟"
2. يدخل بريده
3. POST /api/auth/forgot-password
4. النظام:
   - يولّد reset token (1 hour validity)
   - يرسل email: "اضغط هنا لإعادة التعيين"
5. المستخدم ينقر:
   - GET /reset-password?token=...
   - يدخل password جديد
6. POST /api/auth/reset-password
   { token, newPassword }
7. النظام:
   - يتحقق من token (valid + not expired)
   - يحدّث passwordHash
   - يلغي الـ sessions الحالية (sessionToken = null)
8. الـ User يعود لـ login بـ password الجديد
```

---

### 25. ترقية موظف لـ admin
**الموقف:** Admin يريد منح صلاحيات admin لموظف.

```
1. مدخل من Admin فقط:
   PUT /api/users/{id}
   { role: 'admin' }

2. النظام:
   - يحدّث User.role
   - تنبيه في AuditLog:
     - action: ROLE_CHANGED
     - from: 'employee', to: 'admin'
     - by: admin_user_id

3. AI Auditor يكتشف (في الليلة):
   - Risk score +3
   - إذا في غير ساعات العمل: +1 أخرى
   - إذا الـ admin الأصلي مختلف عن المعتاد: +1

4. تنبيه Telegram إذا Risk > 7:
   "🟠 ترقية صلاحيات: Y → admin
    تمت بواسطة: X في 02:30 AM
    هل هذا متوقع؟"

5. الإجراء:
   - مراجعة من Owner
   - تأكيد أو revert
```

---

### 26. حذف مستأجر (آخر مرحلة)
**الموقف:** عميل ألغى اشتراكه نهائياً.

```
خطوات الـ ICE Admin:

1. التحذير:
   - 30 يوم قبل: email "اشتراكك ينتهي"
   - 7 يوم قبل: تحذير نهائي
   - 0 يوم: انتهاء + grace period

2. Grace Period (90 يوم):
   - status: EXPIRED
   - read-only access
   - يمكن استرداد البيانات

3. بعد 90 يوم:
   - Backup كامل:
     - pg_dump tenant DB
     - حفظ في Archive (S3)
     - notify customer
   
4. الحذف الفعلي:
   - DROP DATABASE {tenant}_db
   - حذف TenantAccount (soft)
   - حذف files (S3, attachments)
   - تنظيف cache + sessions

5. الاحتفاظ:
   - فقط: Audit Log (10 سنوات للقانون)
   - الفواتير المرحّلة لـ ZATCA (لا يمكن حذفها)

6. تأكيد:
   - Email للعميل: "تم حذف بياناتك بالكامل"
   - مع شهادة الحذف (للـ PDPL)
```

---

## 🎯 سيناريوهات خاصة

### 27. POS يعمل offline (انقطع الإنترنت)
**الموقف:** متجر في مول، انقطع الإنترنت.

```
1. PWA يكتشف:
   - navigator.onLine = false
   - يعرض banner: "Offline Mode"

2. POS يكمل العمل:
   - المنتجات من IndexedDB cache
   - العملاء من IndexedDB
   - الجلسة الحالية محفوظة محلياً

3. كل فاتورة:
   - تُحفظ في IndexedDB ('pending-invoices')
   - QR Code مولد محلياً (Phase 1 بسيط)
   - تطبع
   - status: 'pending-sync'

4. عند عودة الإنترنت:
   - Background Sync ينطلق
   - يرسل الفواتير المعلقة:
     - JE posting
     - ZATCA submission (Phase 2 — proper signing)
     - تحديث المخزون في DB الـ tenant

5. إذا conflict (مستحيل في POS عادي):
   - last-write-wins
   - أو manual review
```

---

### 28. أصل تالف (Total Loss)
**الموقف:** سيارة الشركة تالفة في حادث (Total Loss).

```
1. الحادث:
   - تقرير مرور
   - تأمين

2. مطالبة التأمين:
   POST /api/assets/insurance-claim
   { assetId: 100, claimAmount: 80000 }

3. شركة التأمين تدفع 70,000 SAR

4. إجراء الـ Disposal:
   POST /api/fixed-assets/{id}/dispose
   {
     disposalType: 'INSURED_LOSS',
     insurancePayout: 70000,
     disposalDate: '2026-05-14'
   }

5. الحساب:
   - Original cost: 100,000
   - Accum Depreciation: 60,000
   - NBV: 40,000
   - Insurance payout: 70,000
   - Gain on disposal: 70,000 - 40,000 = 30,000

6. JE:
   Dr Bank (Insurance proceeds)    70,000
   Dr Accumulated Depreciation     60,000
      Cr Fixed Asset (1410)             100,000
      Cr Gain on Disposal (4910)         30,000

7. Asset.status = 'DISPOSED'
```

---

### 29. اكتشاف سرقة موظف
**الموقف:** الجرد يكشف نقص متعمد.

```
1. الجرد يكشف:
   - 50 وحدة مفقودة (قيمة 25,000 SAR)
   - من نفس المنتج كل شهر

2. التحقيق:
   - مراجعة CCTV
   - مراجعة الـ access log
   - مقابلات الموظفين

3. اكتشاف الموظف:
   - تأكيد السرقة

4. الإجراءات:
   - تعليق فوري للموظف
   - فتح بلاغ شرعي
   - تسوية محاسبية:
     - JE: Dr Inventory Loss (5920) / Cr Inventory
   - مقاضاة:
     - فتح قضية في Najiz
     - مطالبة بالتعويض
   - فصل قانوني (مع EOS deduction)

5. الوقاية:
   - تعزيز Audit
   - فصل الواجبات (Segregation of Duties)
   - CCTV
   - random spot checks
```

---

### 30. اكتشاف خطأ في الـ VAT حسابياً
**الموقف:** اكتشاف أن VAT يُحسب 14% بدل 15% لشهر مضى.

```
المشكلة: bug في الكود حسب VAT بـ 14% لمدة 30 يوم.

التأثير: تم إصدار 500 فاتورة بـ VAT خاطئ.

الحل:
1. إصلاح الـ bug فوراً
2. لكل فاتورة متأثرة:
   - إصدار Credit Note (لإلغاء الفاتورة الخاطئة)
   - إصدار فاتورة جديدة بـ VAT صحيح
   - الفرق في الـ VAT:
     - 14% → 15% = +1% (إضافي)
     - يجب جمعه من العميل (إذا لم يدفع) أو دفعه (إذا دفع زيادة)

3. التقديم لـ ZATCA:
   - Adjustment في VAT Return
   - VAT تحت التحصيل += differences

4. التواصل مع العملاء:
   - Email موضح المشكلة
   - فاتورة معدلة

5. الوقاية:
   - Test cases لكل rate
   - Automated checks
   - Code review مكثف للـ tax logic
```

---

## 💸 سيناريوهات إضافية

### 31. تحويل عملة (FX)
**الموقف:** فاتورة بـ USD من مورد أجنبي.

```
1. الفاتورة بـ 1,000 USD
2. سعر اليوم: 1 USD = 3.75 SAR
3. JE:
   Dr Expense                  3,750  (1000 × 3.75)
   Dr VAT Input (RC)             563  (15% × 3750)
      Cr AP - USD                 3,750  (foreignAmount: 1000 USD)
      Cr VAT Output (RC)            563

4. شهرياً (FX Revaluation):
   - السعر الجديد: 1 USD = 3.80 SAR
   - New value: 1000 × 3.80 = 3,800
   - Old value: 3,750
   - Difference: +50 (loss because we owe more)
   - JE:
     Dr FX Loss (5930)            50
        Cr AP - USD                  50

5. عند الدفع (بسعر 3.78):
   - دفعنا: 1000 × 3.78 = 3,780
   - Realized FX:
     - Original: 3,750
     - Last revaluation: 3,800
     - Paid: 3,780
   - Realized gain on payment: 3800 - 3780 = 20
   - JE:
     Dr AP - USD                3,800
        Cr Bank                       3,780
        Cr Realized FX Gain (4920)      20
```

---

### 32. توزيع المصروفات (Allocation)
**الموقف:** فاتورة إيجار 10,000 SAR لمبنى به 3 أقسام.

```
1. السبب: المبنى مشترك بين Sales, HR, Finance.

2. توزيع:
   - Sales: 50% = 5000
   - HR: 30% = 3000
   - Finance: 20% = 2000

3. JE تفصيلي:
   Dr Rent Exp - Sales (5510)      5,000  costCenterId: 'CC-SALES'
   Dr Rent Exp - HR (5510)         3,000  costCenterId: 'CC-HR'
   Dr Rent Exp - Finance (5510)    2,000  costCenterId: 'CC-FIN'
      Cr Bank (1120)                   10,000

4. Allocation Rule (للأتمتة):
   POST /api/accounting/allocations
   {
     fromAccount: '5510',
     toAccounts: [
       { account: '5510', costCenterId: 'CC-SALES', percentage: 50 },
       { account: '5510', costCenterId: 'CC-HR', percentage: 30 },
       { account: '5510', costCenterId: 'CC-FIN', percentage: 20 }
     ]
   }

5. التقرير:
   - P&L per Cost Center
   - يعرض المصروف موزع
```

---

### 33. تجديد عقد إيجار
**الموقف:** عقد إيجار شقة سنوي ينتهي.

```
1. cron-contract-expiry يومي:
   - 30 يوم قبل: تنبيه
   - 7 يوم: تحذير حرج

2. التجديد:
   POST /api/rem/leases/{id}/renew
   {
     newEndDate: '+1y',
     newMonthlyRent: 5000,  // إذا زادت
     rentIncrement: 5  // 5% per CPI
   }

3. النظام:
   - Lease.endDate updated
   - يولّد RentInvoice schedule للسنة الجديدة
   - JE: لا (الـ rent يُحسب شهرياً)

4. IFRS 16 (إذا applies):
   - إعادة حساب ROU Asset
   - إعادة حساب Lease Liability
   - JE تعديل
```

---

### 34. شراء asset بالتقسيط
**الموقف:** شراء سيارة بـ 120,000 SAR على 4 سنوات.

```
1. الشراء:
   - Down payment: 30,000
   - 48 monthly installments × 2,000 = 96,000
   - Total: 126,000 (مع فوائد 6,000)

2. JE الافتتاح:
   Dr Fixed Asset (Vehicle)       126,000
   Dr Interest Prepaid (1450)       6,000   (يستهلك على 48 شهر)
      Cr Bank (Down payment)              30,000
      Cr Notes Payable (2420)             96,000

3. كل شهر:
   - دفع 2,000:
     Dr Notes Payable                 2,000
        Cr Bank                            2,000
   
   - استهلاك الفائدة (شهرياً):
     6,000 / 48 = 125 per month
     Dr Interest Expense (5710)        125
        Cr Interest Prepaid                125

4. إهلاك السيارة (شهرياً):
   - 120,000 / (5 years × 12) = 2,000
   - JE: Dr Dep Exp / Cr Accum Dep
```

---

### 35. إعادة هيكلة دين
**الموقف:** قرض بنكي 500,000 يُعاد جدولته.

```
الأصل: 5 سنوات، installment 10,000/شهر
الجديد: 7 سنوات، installment 7,500/شهر (لتخفيف الضغط)

1. الـ Bank Agreement
2. تعديل في النظام:
   - Loan.totalMonths: 60 → 84
   - Loan.monthlyInstallment: 10,000 → 7,500
3. JE: لا (نفس الـ outstanding)
4. الفرق:
   - تخفيف Cash Outflow
   - زيادة الفائدة الإجمالية
   - يُفيد السيولة
```

---

## 🎯 خلاصة السيناريوهات

### المبادئ المتكررة:
1. ✅ **كل عملية → JE تلقائي** عبر auto-journal
2. ✅ **State Machine** لكل document
3. ✅ **Audit Trail** لكل تغيير
4. ✅ **Approval Workflows** للمبالغ الكبيرة
5. ✅ **AI Monitoring** للأنماط الشاذة
6. ✅ **ZATCA** لكل فاتورة B2B/B2C
7. ✅ **Multi-tenant isolation** على كل مستوى
8. ✅ **Cron Jobs** للأتمتة الدورية
9. ✅ **Webhooks** للتكامل الخارجي
10. ✅ **Fallback يدوي** عند فشل automation

### كل سيناريو يجب أن يأخذ في الاعتبار:
- [ ] الـ JE المرتبطة
- [ ] State transitions
- [ ] Approvals required
- [ ] ZATCA implications
- [ ] Notifications
- [ ] Audit log
- [ ] Reversal scenarios (rollback)
- [ ] Multi-tenant isolation
- [ ] Saudi compliance
