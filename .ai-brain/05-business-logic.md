# 05 - منطق الأعمال والسيناريوهات (Business Logic & Scenarios)

> مستخرج من: `BUSINESS_FLOWS_GUIDE.md` + الكود الفعلي في `src/lib/auto-journal.ts`, `src/lib/costing.ts`, `src/lib/eos-engine.ts`, `src/lib/zatca*.ts`, ومسارات `/api/sales`, `/api/purchases`, `/api/pos`, `/api/payroll`

---

## 📋 الفلوهات الـ 18 (من BUSINESS_FLOWS_GUIDE.md)

| # | الفلو | الوصف القصير | الحالة |
|---|---|---|---|
| 1 | **Quote-to-Cash (Q2C)** | عرض السعر → فاتورة → دفع → قيد محاسبي | ✅ |
| 2 | **Procure-to-Pay (P2P)** | PR → RFQ → PO → GRN → فاتورة → دفع | ✅ |
| 3 | **Hire-to-Retire (H2R)** | توظيف → رواتب → إجازات → نهاية خدمة | 🟡 |
| 4 | **Record-to-Report (R2R)** | قيد → ترحيل → ميزانية → إقفال | ✅ |
| 5 | **Plan-to-Produce (P2P-Mfg)** | MRP → MO → WIP → FG → بيع | 🟡 |
| 6 | **Acquire-to-Retire (Assets)** | شراء أصل → إهلاك → بيع/تخريد | 🟡 |
| 7 | **Order-to-Cash POS** | جلسة → بيع → إغلاق → قيد | ✅ |
| 8 | **Journal Entry Approval** | إدخال يدوي → موافقات → ترحيل | ✅ |
| 9 | **Purchase Order Approval** | PO حسب المبلغ → موافقة → إصدار | ✅ |
| 10 | **Vendor Onboarding Approval** | تسجيل → التحقق → تفعيل | 🟡 |
| 11 | **Leave Request Approval** | طلب → مدير → HR → موافقة | 🟡 |
| 12 | **Invoice Lifecycle States** | Draft → Posted → ZATCA Cleared → Paid | ✅ |
| 13 | **Manufacturing Order States** | Planned → Released → InProgress → QC → Closed | 🟡 |
| 14 | **Check Lifecycle** | استلام → إيداع → مقاصة → تحصيل | ✅ |
| 15 | **Fixed Asset Lifecycle** | شراء → تشغيل → إهلاك → بيع/تخريد | 🟡 |
| 16 | **Period Close** | 16 خطوة لإقفال الفترة المحاسبية | ✅ |
| 17 | **ZATCA E-Invoice Submission** | XML → توقيع → QR → ZATCA → Clearance | ✅ |
| 18 | **WPS Salary Submission** | راتب → SIF file → بنك → تأكيد | ✅ |

> ✅ = منفذ بالكامل | 🟡 = جزئي

---

## 🧾 الفلو 1: Quote-to-Cash (Q2C)

### المراحل:
```
1. لِيد (Lead) → CRM
2. فرصة (Opportunity) → CRM
3. عرض سعر (PriceQuote)
4. إذا وافق العميل:
   → أمر بيع (SalesOrder)
5. تجهيز البضاعة (Picking)
6. تسليم (DeliveryNote)
7. فاتورة (SalesInvoice)
   ↓ تلقائي:
   - تخفيض المخزون
   - توليد ZATCA QR + Hash + XML
   - إنشاء JournalEntry: Dr AR / Cr Revenue + Cr VAT
8. دفع (Payment Receipt)
   ↓ تلقائي:
   - JournalEntry: Dr Cash / Cr AR
   - تحديث Customer.balance
9. إذا تأخر الدفع:
   → Dunning (تذكير 1 → 2 → 3 → Legal Hold)
```

### القيود المحاسبية (`auto-journal.ts`):

**عند إصدار فاتورة:**
```
Dr  Accounts Receivable (1210)    115.00
    Cr  Sales Revenue (4110)            100.00
    Cr  VAT Output (2310)                15.00
```

**عند البيع نقداً (POS):**
```
Dr  Cash on Hand (1110)            115.00
    Cr  Sales Revenue (4110)            100.00
    Cr  VAT Output (2310)                15.00
```

**عند تكلفة المبيع (COGS):**
```
Dr  Cost of Goods Sold (5110)       80.00
    Cr  Inventory (1330)                 80.00
```

**عند استلام الدفعة:**
```
Dr  Cash / Bank (1110/1120)        115.00
    Cr  Accounts Receivable (1210)      115.00
```

### المسارات المعنية:
- `/api/sales/quotes` — عروض الأسعار
- `/api/sales/orders` — أوامر البيع
- `/api/sales/invoices` — الفواتير
- `/api/sales/delivery-notes` — التسليم
- `/api/sales/cash-application` — تطبيق الدفعات

---

## 🛍 الفلو 2: Procure-to-Pay (P2P)

### المراحل:
```
1. طلب شراء (PurchaseRequisition) — الموظف يطلب
2. موافقات حسب القيمة:
   < 5K SAR → مدير القسم
   < 50K SAR → CFO
   ≥ 50K SAR → CEO
3. طلب عروض (RFQ) لـ 3+ موردين
4. تقييم العروض → اختيار المورد
5. أمر شراء (PurchaseOrder)
6. استلام البضاعة:
   - تفتيش
   - GRN (GoodsReceiptNote)
   - إدخال المستودع
7. مطابقة ثلاثية (3-Way Match):
   PO ↔ GRN ↔ PurchaseInvoice
8. فاتورة الشراء (PurchaseInvoice)
   ↓ تلقائي:
   - JE: Dr Inventory + Dr VAT Input / Cr AP
9. ترتيب الدفع (PaymentRun)
10. دفع (PaymentTransaction)
    ↓ تلقائي:
    - JE: Dr AP / Cr Cash
```

### القيود المحاسبية:

**عند استلام البضاعة (GRN) — قبل الفاتورة:**
```
Dr  Inventory (1330)               1000.00
    Cr  GR/IR Suspense (2120)          1000.00
```

**عند الفاتورة:**
```
Dr  GR/IR Suspense (2120)           1000.00
Dr  VAT Input (1340)                 150.00
    Cr  Accounts Payable (2110)        1150.00
```

**عند الدفع:**
```
Dr  Accounts Payable (2110)         1150.00
    Cr  Bank (1120)                    1150.00
```

**WHT للموردين الأجانب (إذا applicable):**
```
Dr  Accounts Payable (2110)         1000.00
    Cr  Bank (1120)                     950.00
    Cr  WHT Payable (2350)               50.00 (5%)
```

### المسارات:
- `/api/purchases/requisitions` — طلبات الشراء
- `/api/purchases/rfq` — RFQ
- `/api/purchase-orders` — PO
- `/api/grn` — استلام البضائع
- `/api/purchases/matching` — 3-way match
- `/api/purchases` — فواتير الشراء

---

## 👥 الفلو 3: Hire-to-Retire (H2R)

### المراحل:
```
1. طلب وظيفة (JobRequisition)
2. النشر (في HR.jobs)
3. تطبيقات (Application)
4. مقابلات (Interview)
5. عرض عمل (Offer)
6. تعيين (Employee created):
   - عقد + جواز + إقامة + تأمين
   - إضافة لـ GOSI
7. خلال العمل:
   - Attendance يومي (Face-ID)
   - Salary شهري (28th cron)
   - Leaves حسب الطلب
   - Loans (سلف)
   - Evaluations سنوي
8. نهاية الخدمة:
   - استقالة/فصل/تقاعد
   - حساب EOS (Article 84-85)
   - تسوية النهائية
```

### حساب EOS (Article 84-85):
```typescript
// من src/lib/eos-engine.ts
function calculate({ baseSalary, yearsOfService, terminationReason }): EOSCalculation {
    let entitlementRate = 0;
    
    if (terminationReason === 'EMPLOYER_DISMISSAL' || 
        terminationReason === 'DEATH' || 
        terminationReason === 'DISABILITY') {
        // كامل الحقوق
        if (yearsOfService < 5)      entitlementRate = 0.5;      // نصف راتب لكل سنة
        else                          entitlementRate = 1.0;      // راتب كامل لكل سنة
    } else if (terminationReason === 'RESIGNATION') {
        // خصومات حسب المدة
        if (yearsOfService < 2)      return { amount: 0 };       // لا حقوق
        else if (yearsOfService < 5)  entitlementRate = 1/3 * 0.5;  // 1/3 من النصف
        else if (yearsOfService < 10) entitlementRate = 2/3 * 0.5;  // 2/3 من النصف
        else                          entitlementRate = 1.0;       // كامل
    }
    
    const eosAmount = baseSalary * yearsOfService * entitlementRate;
    return { amount: eosAmount, breakdown: {...} };
}
```

### القيد للراتب الشهري:
```
Dr  Salary Expense (5210)         10000.00
    Cr  Salary Payable (2330)          8500.00
    Cr  GOSI Payable - Employee (2340)  900.00 (9%)
    Cr  Income Tax Payable (2370)         0.00 (السعودية لا تفرض)
    Cr  Loan Deductions (2360)          600.00
```

### القيد لاشتراك GOSI من المنشأة:
```
Dr  GOSI Expense - Employer (5220)  1100.00
    Cr  GOSI Payable - Employer (2341)  1100.00 (9% + 2% SANED)
```

### القيد لـ EOS:
```
Dr  EOS Expense (5230)            5000.00
    Cr  EOS Liability (2410)           5000.00
```

### المسارات:
- `/api/hr/employees` — الموظفون
- `/api/hr/attendance` — الحضور
- `/api/hr/leaves` — الإجازات
- `/api/payroll/runs` — تشغيل الرواتب
- `/api/payroll/wps` — ملف WPS
- `/api/hr/eos` — نهاية الخدمة

---

## 📊 الفلو 4: Record-to-Report (R2R)

### المراحل:
```
يومياً:
1. القيود التلقائية من المعاملات (Auto-Journal)
2. القيود اليدوية (Manual JE) — تحتاج موافقة

شهرياً:
3. مطابقة بنكية (Bank Reconciliation)
4. إقفال البنود المؤقتة (Accruals, Prepayments)
5. إهلاك الأصول الثابتة
6. FX Revaluation
7. ECL Provisioning
8. WHT Form 14
9. IFRS 16 Lease Adjustments

ربعياً:
10. VAT Return (إذا ربعي)

سنوياً:
11. Period Close (16 خطوة):
    a. تجميد كل النماذج
    b. مطابقات نهائية
    c. تقييم المخزون
    d. تسوية البنود
    e. حساب الزكاة
    f. تقفيل الأرباح
    g. تجميد الفترة
    h. توليد التقارير:
       - Trial Balance
       - Income Statement
       - Balance Sheet
       - Cash Flow Statement
       - Consolidated (إذا ينطبق)
12. Annual Tax Return (Zakat + VAT)
```

### Period Close Engine (`src/lib/period-close.ts`):
- يقفل الفترة بإضافة `FiscalPeriod.locked = true`
- بعد الإقفال: لا يمكن تعديل/إضافة قيود في الفترة
- لتعديل: يجب فتح الفترة (بصلاحية owner فقط)

---

## 🏭 الفلو 5: Plan-to-Produce (P2P-Mfg)

### المراحل:
```
1. توقع الطلب (Demand Forecast — AI)
2. MRP (Material Requirements Planning):
   - حساب احتياجات المواد
   - إنشاء PR/PO تلقائياً للنواقص
3. أمر إنتاج (ManufacturingOrder):
   - استناداً إلى BOM (Recipe)
4. سحب المواد (Material Issue)
   ↓ JE: Dr WIP / Cr Raw Materials
5. التنفيذ:
   - تسجيل الـ Labor
   - تسجيل الـ Machine Hours
   - تسجيل الـ Waste
6. مراقبة الجودة (QC):
   - فحص → Pass/Fail/Rework
7. إنهاء الإنتاج:
   ↓ JE: Dr Finished Goods / Cr WIP
8. نقل إلى المستودع
9. متاح للبيع
```

### القيود:
**عند سحب المواد:**
```
Dr  WIP Inventory (1331)            5000.00
    Cr  Raw Materials Inventory (1332)  5000.00
```

**عند تسجيل عمالة وآلات:**
```
Dr  WIP Inventory (1331)            3000.00
    Cr  Direct Labor (5310)             2000.00
    Cr  Manufacturing Overhead (5320)   1000.00
```

**عند إكمال الإنتاج:**
```
Dr  Finished Goods Inventory (1333)  8000.00
    Cr  WIP Inventory (1331)             8000.00
```

**Variance Analysis (نهاية الشهر):**
```
Dr  Cost Variance (5330)             200.00
    Cr  Finished Goods                   200.00
```

### المسارات:
- `/api/manufacturing/boms` — BOM
- `/api/manufacturing/mrp-engine` — MRP
- `/api/manufacturing/orders` — أوامر الإنتاج
- `/api/manufacturing/work-orders` — أوامر العمل
- `/api/manufacturing/qc` — فحص الجودة

---

## 🛒 الفلو 7: Order-to-Cash POS

### السيناريو الكامل لجلسة POS:

```
1. الكاشير يفتح الجلسة:
   POST /api/pos/session/open
   Body: { userId, branchId, openingCash }
   
2. خلال الجلسة:
   - مسح المنتج بالباركود
   - إضافة للسلة
   - اختيار طريقة الدفع:
     a. نقد
     b. شبكة (mada/Visa/MC)
     c. آجل (للعملاء المعتمدين)
     d. تقسيط (Tabby/Tamara)
     e. مختلط (cash + card)
   - طباعة الفاتورة (مع QR ZATCA Phase 1)
   - في الخلفية: إرسال للـ ZATCA Phase 2
   
3. المرتجعات:
   - مسح فاتورة الأصل
   - اختيار البنود
   - تحديد سبب الإرجاع
   - استرداد المبلغ
   
4. عمليات إضافية:
   - سحب من الصندوق (Cash Withdrawal)
   - إيداع في الصندوق (Cash Deposit)
   - تحويل لكاشير آخر
   
5. إغلاق الجلسة:
   POST /api/pos/session/close
   Body: { sessionId, declaredCash }
   
   النظام يحسب:
   - Expected Cash = OpeningCash + Sales(نقد) - Returns(نقد) ± Deposits/Withdrawals
   - Variance = DeclaredCash - ExpectedCash
   - إذا |Variance| > tolerance → AuditLog + إخطار
```

### القيود (لكل بيع نقدي):
```
Dr  Cash on Hand (1110)            115.00
    Cr  Sales Revenue (4110)           100.00
    Cr  VAT Output (2310)               15.00
```

### القيد عند الإغلاق:
```
Dr  Cash (نهاية الجلسة)              5000.00
    Cr  POS Sessions (مؤقت)           5000.00
```

### المسارات:
- `/api/pos/session/open`
- `/api/pos/session/close`
- `/api/pos/invoices` — بيع
- `/api/pos/returns` — مرتجعات
- `/api/pos/cash-movements` — حركات الصندوق

---

## 💸 الفلو 8: Journal Entry Approval

### السيناريو:
```
1. المحاسب يُدخل قيد يدوي:
   POST /api/accounting/journal
   Body: { entryDate, description, lines[] }
   - حالة: DRAFT
   
2. التحقق التلقائي:
   - Dr = Cr (tolerance 0.01)
   - الحسابات موجودة
   - الفترة مفتوحة
   
3. إذا المبلغ > threshold:
   → ApprovalRequest يُنشأ
   → إشعار للمعتمدين
   
4. المعتمد يفتح Approvals Inbox:
   GET /api/approvals/inbox
   
5. القرار:
   a. APPROVE → status: POSTED + ترحيل
   b. REJECT → status: REJECTED + سبب
   c. NEED_INFO → إعادة للمحاسب
   
6. الترحيل (Posting):
   - تحديث Account.balance
   - إنشاء AuditLog
   - إرسال webhooks (je.posted)
```

### حدود الموافقات (Approval Thresholds):
```
< 1000 SAR    → المحاسب نفسه
< 10,000 SAR  → Senior Accountant
< 50,000 SAR  → CFO
≥ 50,000 SAR  → CEO
```

---

## 🇸🇦 الفلو 17: ZATCA E-Invoice Submission

### السيناريو الكامل:

**أ. التهيئة (مرة واحدة):**
```
1. الشركة تطلب CSID:
   POST /api/zatca/onboard
   Body: { otp, businessInfo }
   
2. النظام:
   a. توليد ECDSA Key Pair (secp256r1)
   b. توليد CSR (Certificate Signing Request)
   c. POST إلى ZATCA: /compliance
   d. استلام Compliance CSID
   e. اختبار مع 6 فواتير تجريبية:
      - 3 B2B (clearance)
      - 3 B2C (reporting)
   f. POST إلى ZATCA: /production-csid
   g. استلام Production CSID
   h. حفظ في DB: { compliance_csid, production_csid }
```

**ب. لكل فاتورة:**
```
1. إنشاء الفاتورة في DB
2. توليد UBL 2.1 XML:
   - <cbc:ID>{invoiceNo}</cbc:ID>
   - <cbc:UUID>{uuid_v4}</cbc:UUID>
   - <cbc:IssueDate>{date}</cbc:IssueDate>
   - <cac:AccountingSupplierParty>{...}</cac:AccountingSupplierParty>
   - <cac:AccountingCustomerParty>{...}</cac:AccountingCustomerParty>
   - <cac:InvoiceLine>...</cac:InvoiceLine>
   - <cac:TaxTotal>...</cac:TaxTotal>
   
3. توليد ICV (Invoice Counter Value):
   - من Settings.zatca_invoice_counter
   - يزيد +1 لكل فاتورة (لا فجوات)
   
4. توليد PIH (Previous Invoice Hash):
   - SHA-256 للفاتورة السابقة
   - الأولى = "64-char zero hash" (64 صفر)
   
5. التوقيع الإلكتروني:
   - ECDSA-SHA256 على XML باستخدام Production CSID
   - استخدام مكتبة zatca-xml-js
   
6. توليد QR Code (Phase 2 — 9 tags):
   1. Seller Name
   2. VAT Number
   3. Timestamp (ISO 8601)
   4. Total with VAT
   5. VAT Amount
   6. Invoice Hash
   7. ECDSA Signature
   8. ECDSA Public Key
   9. (للـ B2B) Certificate
   
7. الإرسال:
   B2B (Tax Invoice):
   → POST /clearance/single
   → ينتظر الرد (synchronous)
   → إذا CLEARED → status = 'cleared', clearance_uuid مخزن
   → إذا rejected → status = 'rejected', error logged
   
   B2C (Simplified Invoice):
   → POST /reporting/single
   → خلال 24 ساعة (asynchronous)
   → status = 'reported'
   
8. إذا فشل الإرسال:
   - يدخل قائمة retry (zatca-worker cron)
   - 3 محاولات مع exponential backoff
   - بعد 3 → ينبه المسؤول
```

### الجداول المعنية:
```prisma
Settings {
    zatca_environment: 'simulation' | 'production'
    zatca_invoice_counter: number    // ICV
    zatca_last_pih: string           // PIH
    zatca_compliance_csid: string
    zatca_production_csid: string
    zatca_ecdsa_public_key: string
    zatca_ecdsa_private_key: string  // مشفر بـ AES-256-GCM
}

SalesInvoice {
    zatcaStatus: 'pending' | 'sent' | 'cleared' | 'rejected'
    zatcaHash: string
    zatcaQr: string                  // Base64 TLV
    zatcaXml: string                  // XML الخام
    zatcaSignedXml: string            // XML الموقع
    zatcaUuid: string
    zatcaIcv: number
    zatcaPih: string
    clearanceUuid: string             // من ZATCA
    cleared: boolean
    clearedAt: DateTime
}
```

### المسارات:
- `/api/zatca/onboard` — تهيئة CSID
- `/api/zatca/qr` — توليد QR (Phase 1)
- `/api/zatca/xml` — توليد XML
- `/api/zatca/generate-request` — إرسال للـ ZATCA
- `/api/zatca/callback` — Callback (إذا async)
- `/api/cron/zatca-batch-submit` — Batch retry
- `/api/cron/zatca-worker` — Queue processor

---

## 💼 الفلو 18: WPS Salary Submission

### السيناريو:
```
1. تشغيل الرواتب الشهري:
   POST /api/payroll/runs
   Body: { month, year }
   
2. النظام يحسب لكل موظف:
   - Base Salary
   - Allowances (housing, transport, ...)
   - Deductions (loans, advances)
   - GOSI Employee (9% للسعودي)
   - Net Salary
   
3. الموافقة على الـ Run:
   - HR Manager
   - CFO (إذا total > 100K)
   
4. توليد SIF File (Mudad 2026 spec):
   HDR:
     version: "v3"
     employerId: "{ZATCA_VAT}"
     bank: "RJHI"  (Al Rajhi)
     month/year: 2026-05
     recordCount: 50
     totalAmount: 425000.00
   
   EMP records (لكل موظف):
     national_id: "1234567890"
     iban: "SA0380000000608010167519"  (24 char، تبدأ SA)
     basic_salary: 5000
     housing: 1500
     transport: 500
     deductions: 200
     net: 6800
     bank_code: "RJHI"
   
   TRL:
     totalBasic: 250000
     totalAllowances: 100000
     totalDeductions: 10000
     totalNet: 340000
   
5. تنزيل SIF:
   GET /api/payroll/wps/{batchId}/download
   
6. رفع للبنك (يدوياً حالياً):
   - الـ HR/Finance يرفع الـ SIF
   - البنك يصرف الرواتب
   
7. تأكيد الصرف:
   POST /api/payroll/wps/{batchId}/confirm
   - status: 'paid'
   - paidAt: timestamp
   
8. القيد المحاسبي:
   Dr  Salary Payable (2330)        340000
       Cr  Bank (1120)                  340000
   
9. GOSI:
   - في 15 من الشهر التالي:
   - يصدر GOSIMonthlyFile
   - GET /api/payroll/gosi/{month}/download
   - يُرفع لـ GOSI portal
   - QC على المبالغ
```

### بنوك سعودية مدعومة (`SAUDI_BANKS` map):
```
RJHI  — مصرف الراجحي
SNB   — البنك الأهلي السعودي
BSFR  — البنك السعودي الفرنسي
ANB   — البنك العربي الوطني
ALBI  — مصرف الإنماء
RIBL  — بنك الرياض
SIBR  — البنك السعودي للاستثمار
BAJZ  — بنك الجزيرة
BSAU  — البنك السعودي البريطاني (ساب)
INMA  — بنك البلاد
```

---

## 🏦 الفلو 14: Check Lifecycle (الشيكات)

```
1. استلام شيك (Customer Check Received):
   POST /api/finance/checks
   - status: 'received'
   - JE: Dr Checks Under Collection (1115) / Cr AR
   
2. إيداع (Deposit):
   - status: 'deposited'
   - JE: Dr Bank / Cr Checks Under Collection
   
3. المقاصة (Clearing) — 1-3 أيام:
   - status: 'cleared'
   - الرصيد البنكي محدث فعلياً
   
4. إذا ارتد (Bounced):
   - status: 'bounced'
   - JE عكسي: Dr Customer / Cr Bank
   - رسوم البنك:
     JE: Dr Bank Fees / Cr Bank
   - إذا متعمد → بلاغ شرعي

5. للشيكات الصادرة (للموردين):
   POST /api/finance/checks/issued
   - status: 'issued'
   - JE: Dr AP / Cr Checks Issued (2115)
   - عند الصرف:
     - status: 'cashed'
     - JE: Dr Checks Issued / Cr Bank
```

---

## 🏗 الفلو 15: Fixed Asset Lifecycle

### المراحل:
```
1. اقتناء (Acquisition):
   POST /api/fixed-assets
   - PO + GRN كأصل ثابت
   - تصنيف (Category) → معدل الإهلاك
   - JE: Dr Fixed Asset / Cr Bank or AP
   
2. التشغيل:
   - تتبع المسؤول، الموقع
   - صيانة دورية (AssetMaintenanceRecord)
   
3. الإهلاك الشهري (Cron 28):
   POST /api/cron/depreciation-monthly
   
   حسب الطريقة:
   a. Straight-Line:
      Monthly Depreciation = (Cost - Salvage) / Life in Months
   
   b. Declining Balance:
      Monthly = Beginning NBV × (Rate / 12)
   
   c. Units of Production:
      Monthly = (Cost - Salvage) × (Units Used / Total Units)
   
   JE: Dr Depreciation Expense / Cr Accumulated Depreciation
   
4. التحويل (Transfer):
   - بين الفروع
   - بين المسؤولين
   - JE: لا قيد (محاسبياً نفس الشيء)
   
5. الإنخفاض (Impairment):
   - إذا قيمته السوقية أقل من NBV
   - JE: Dr Impairment Loss / Cr Asset
   
6. البيع (Disposal):
   - حساب الربح/الخسارة
   - JE:
     Dr  Bank (سعر البيع)            10000
     Dr  Accumulated Depreciation     8000
         Cr  Fixed Asset                  15000
         Cr  Disposal Gain (4910)          3000
   
7. التخريد (Write-off):
   - بدون عوائد
   - JE:
     Dr  Accumulated Depreciation     8000
     Dr  Loss on Write-off (5910)     7000
         Cr  Fixed Asset                  15000
```

---

## 🏪 سيناريو POS مفصّل (المطعم)

```
1. الكاشير يفتح الجلسة
2. النادل يأخذ طلب من طاولة:
   POST /api/restaurant/table/{tableId}/order
   - يضاف للطلب
   - حالة الطاولة: 'occupied'
   
3. الطلب يذهب للمطبخ (KDS):
   - شاشة المطبخ تعرض الطلب
   - الطبّاخ يضع "in progress"
   - عند الانتهاء: "ready"
   
4. النادل يقدم الطلب:
   - حالة: 'served'
   
5. الزبون يطلب الفاتورة:
   - الطباعة الأولية (Bill — قبل الدفع)
   - يدفع
   
6. الدفع:
   - نقد / شبكة / split
   - إصدار الفاتورة ZATCA
   - JE تلقائي
   
7. الطاولة تُفرّغ:
   - حالة: 'cleaning' → 'available'
```

---

## 💡 ملاحظات للـ AI

عند العمل على ميزة أعمال:
1. **اقرأ الفلو** في `BUSINESS_FLOWS_GUIDE.md` أولاً
2. **افحص `auto-journal.ts`** لمعرفة القيود التلقائية
3. **استخدم `prisma.$transaction`** للعمليات المركبة
4. **لا تتجاوز الموافقات** (Approval workflows)
5. **سجل في AuditLog** الأحداث الحساسة
6. **اختبر مع بيانات حقيقية** قبل النشر
