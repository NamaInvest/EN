# 60 - القوالب والصيغ (Templates & Formats)

> Email + PDF + Excel + Receipt + Statement + ZATCA XML

---

## 📧 Email Templates

### الـ Engine:
- `src/lib/email-template-engine.ts`
- يستخدم Handlebars (أو similar)
- متعدد اللغات (عربي + إنجليزي)

### القوالب المتاحة:
```
templates/email/
├── welcome.html              ← ترحيب موظف جديد
├── invoice.html              ← فاتورة مرسلة للعميل
├── invoice-overdue.html      ← تذكير دفع
├── invoice-paid.html         ← شكر بعد الدفع
├── payment-receipt.html      ← إيصال استلام
├── statement.html            ← كشف حساب
├── dunning-l1.html           ← تذكير ودي
├── dunning-l2.html           ← تحذير
├── dunning-l3.html           ← إنذار قانوني
├── payroll-slip.html         ← قسيمة راتب
├── eos-settlement.html       ← تسوية نهاية الخدمة
├── purchase-order.html       ← أمر شراء للمورد
├── quote.html                ← عرض سعر
├── approval-request.html     ← طلب موافقة
├── approval-decision.html    ← قرار الموافقة
├── trial-ending.html         ← تنبيه انتهاء التجربة
├── subscription-renewal.html ← تجديد اشتراك
├── password-reset.html       ← إعادة تعيين password
├── mfa-enabled.html          ← تفعيل MFA
├── security-alert.html       ← تنبيه أمني
├── backup-status.html        ← حالة النسخة الاحتياطية
├── monthly-cfo-report.html   ← تقرير CFO شهري
└── ...
```

### مثال — Invoice Email:
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>فاتورة #{{invoiceNo}}</title>
</head>
<body>
    <table>
        <tr>
            <td><img src="{{companyLogo}}" /></td>
            <td>
                <h2>{{companyName}}</h2>
                <p>VAT: {{vatNumber}}</p>
            </td>
        </tr>
    </table>
    
    <h1>فاتورة #{{invoiceNo}}</h1>
    
    <p>عزيزي {{customerName}}،</p>
    
    <p>إليك فاتورتك بقيمة {{totalAmount}} ريال:</p>
    
    <table border="1">
        <thead>
            <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{name}}</td>
                <td>{{quantity}}</td>
                <td>{{price}} ر.س</td>
                <td>{{total}} ر.س</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    
    <p>الإجمالي قبل الضريبة: {{subtotal}}</p>
    <p>ضريبة القيمة المضافة (15%): {{vatAmount}}</p>
    <p><strong>الإجمالي: {{totalAmount}}</strong></p>
    
    <p><a href="{{paymentLink}}">ادفع الآن</a></p>
    
    <img src="{{zatcaQr}}" alt="ZATCA QR" />
    
    <hr/>
    
    <p>شكراً لتعاملكم معنا.</p>
    <p>{{companyName}}</p>
</body>
</html>
```

### التخصيص:
- كل tenant يمكنه تخصيص:
  - الـ logo
  - الـ colors
  - الـ footer text
  - signature
- عبر `/settings/email-templates`

---

## 📄 PDF Templates

### الـ Engine:
- `src/lib/pdf-service.ts`
- يستخدم Puppeteer (Chromium headless)
- أو jsPDF للـ client-side

### القوالب:
```
templates/pdf/
├── invoice-a4.html           ← فاتورة A4
├── invoice-thermal-80mm.html ← فاتورة POS 80mm
├── invoice-thermal-58mm.html ← فاتورة 58mm
├── invoice-receipt.html      ← إيصال
├── credit-note.html
├── purchase-order.html
├── delivery-note.html
├── statement.html            ← كشف حساب (متعدد الصفحات)
├── payslip.html              ← قسيمة راتب
├── balance-sheet.html        ← ميزانية عمومية
├── income-statement.html     ← قائمة دخل
├── cash-flow.html
├── trial-balance.html
├── eos-settlement.html
├── contract.html             ← عقد
├── certificate-employment.html ← شهادة عمل
└── ...
```

### Invoice A4 Template Structure:
```
┌─────────────────────────────────────┐
│  [Logo]            [Company Name]    │
│  VAT: 300012345678903                │
│  CR: 7012345678                      │
│  العنوان الكامل                       │
├─────────────────────────────────────┤
│  فاتورة ضريبية #INV-2026-0345        │
│  التاريخ: 14/05/2026                 │
│                                      │
│  بيانات العميل:                       │
│  الاسم: {{customerName}}             │
│  VAT: {{customerVat}}                │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐    │
│  │ المنتج | الكمية | السعر | الإجمالي│    │
│  ├──────────────────────────────┤    │
│  │ ...                          │    │
│  └──────────────────────────────┘    │
├─────────────────────────────────────┤
│  الإجمالي قبل الضريبة:    {{subtotal}}│
│  الخصم:                {{discount}}│
│  ضريبة القيمة المضافة (15%): {{vat}}│
│  الإجمالي:            {{total}}    │
├─────────────────────────────────────┤
│  [QR Code]                          │
│  ZATCA Phase 2                       │
│  ICV: {{icv}}                        │
│  Hash: {{hash}}...                   │
├─────────────────────────────────────┤
│  [Signature]    [Stamp]              │
│  شكراً لتعاملكم معنا                  │
└─────────────────────────────────────┘
```

### Thermal Receipt (80mm) Layout:
```
================================
       {{companyName}}
   VAT: 300012345678903
================================
  فاتورة #INV-2026-0345
  التاريخ: 14/05/2026 10:30
  الكاشير: محمد
================================
 المنتج          الكمية   السعر
 -------------------------------
 بيبسي 330مل      2    4.00
 شيبس ليز         1    3.00
================================
 الإجمالي:        11.00
 الضريبة (15%):   1.65
 المجموع:        12.65
================================
   [QR Code Phase 2]
   ICV: 4567
   Hash: a1b2c3...
================================
   شكراً لزيارتكم
   فاتورة #INV-2026-0345
================================
```

### الاستخدام:
```typescript
import { generatePDF } from '@/lib/pdf-service';

const pdf = await generatePDF({
    template: 'invoice-a4',
    data: {
        companyName: 'الجاسم للتجارة',
        invoiceNo: 'INV-2026-0345',
        customerName: 'أحمد',
        items: [...],
        subtotal: 100,
        vatAmount: 15,
        totalAmount: 115,
        zatcaQr: 'data:image/png;base64,...'
    },
    options: {
        format: 'A4',
        landscape: false,
        printBackground: true
    }
});

// إرسال PDF كـ response أو حفظه
```

---

## 📊 Excel Templates

### الـ Engine:
- `src/lib/excel-service.ts`
- يستخدم ExcelJS

### الـ Use Cases:
```
1. Import Templates (للاستيراد):
   - customers-template.xlsx
   - products-template.xlsx
   - opening-balances-template.xlsx
   - employees-template.xlsx
   - chart-of-accounts-template.xlsx

2. Export Reports:
   - sales-report.xlsx
   - inventory-report.xlsx
   - trial-balance.xlsx
   - aging-report.xlsx
   - payroll-summary.xlsx

3. Government Submissions:
   - vat-return.xlsx
   - wht-form14.xlsx
   - gosi-monthly.xlsx
```

### مثال — Sales Report Export:
```typescript
async function exportSalesReport(filters: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');
    
    // Header
    sheet.columns = [
        { header: 'رقم الفاتورة', key: 'invoiceNo', width: 20 },
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'العميل', key: 'customer', width: 30 },
        { header: 'الإجمالي', key: 'subtotal', width: 15, style: { numFmt: '#,##0.00' } },
        { header: 'الضريبة', key: 'vat', width: 15, style: { numFmt: '#,##0.00' } },
        { header: 'المجموع', key: 'total', width: 15, style: { numFmt: '#,##0.00' } },
        { header: 'الحالة', key: 'status', width: 15 }
    ];
    
    // Style header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' }
    };
    
    // RTL
    sheet.views = [{ rightToLeft: true }];
    
    // Data
    const invoices = await prisma.salesInvoice.findMany({ where: filters });
    invoices.forEach(inv => {
        sheet.addRow({
            invoiceNo: inv.invoiceNo,
            date: inv.date,
            customer: inv.customer.name,
            subtotal: Number(inv.subtotal),
            vat: Number(inv.taxValue),
            total: Number(inv.total),
            status: inv.status
        });
    });
    
    // Totals row
    sheet.addRow({
        invoiceNo: 'الإجمالي',
        subtotal: { formula: `SUM(D2:D${invoices.length + 1})` },
        vat: { formula: `SUM(E2:E${invoices.length + 1})` },
        total: { formula: `SUM(F2:F${invoices.length + 1})` }
    });
    
    return await workbook.xlsx.writeBuffer();
}
```

---

## 🇸🇦 ZATCA XML Template

### Structure (UBL 2.1):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
    
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>INV-2026-0345</cbc:ID>
    <cbc:UUID>uuid-v4</cbc:UUID>
    <cbc:IssueDate>2026-05-14</cbc:IssueDate>
    <cbc:IssueTime>10:30:00</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
    
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>{{icv}}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">{{previousHash}}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">{{crNumber}}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>{{sellerName}}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>{{street}}</cbc:StreetName>
                <cbc:BuildingNumber>{{building}}</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>{{district}}</cbc:CitySubdivisionName>
                <cbc:CityName>{{city}}</cbc:CityName>
                <cbc:PostalZone>{{postalCode}}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>{{vatNumber}}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <!-- Buyer details (similar) -->
    
    <cac:InvoiceLine>
        <!-- لكل بند -->
    </cac:InvoiceLine>
    
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">{{vatAmount}}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">{{subtotal}}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">{{vatAmount}}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15</cbc:Percent>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">{{subtotal}}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">{{subtotal}}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">{{total}}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="SAR">{{total}}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
    <!-- Signature block (Phase 2) -->
    <ext:UBLExtensions>
        <!-- ECDSA signature -->
    </ext:UBLExtensions>
    
</Invoice>
```

---

## 📃 SIF Template (WPS)

### Format (Mudad v3):
```
HDR|v3|{employerVAT}|{bankCode}|{period}|{count}|{totalAmount}
EMP|{nationalId}|{iban}|{basic}|{housing}|{transport}|{other}|{deductions}|{net}|{bankCode}
EMP|...
DED|{nationalId}|{deductionType}|{amount}|{reason}  (اختياري)
TRL|{totalBasic}|{totalAllowances}|{totalDeductions}|{totalNet}|{count}
```

### مثال:
```
HDR|v3|300012345678903|RJHI|2026-05|150|425000.00
EMP|1234567890|SA0380000000608010167519|5000.00|1500.00|500.00|0.00|200.00|6800.00|RJHI
EMP|2345678901|SA0480000000608010267530|4500.00|1500.00|400.00|0.00|150.00|6250.00|SNB
...
DED|1234567890|LOAN|200.00|Monthly loan installment
TRL|750000.00|350000.00|45000.00|1055000.00|150
```

---

## 🎨 Print Template Customization

### للـ Customer:
```
/settings/print-templates

تخصيص:
- الـ Logo
- Header/Footer text
- Colors
- Fonts
- Layout (A4 vs Letter vs Custom)
- اللغة (عربي / إنجليزي / ثنائي)
- العناصر الـ optional (signature, stamp, watermark)
```

### Template Variables الـ Available:
```
{{companyName}}, {{vatNumber}}, {{crNumber}}
{{companyAddress}}, {{companyPhone}}, {{companyEmail}}
{{customerName}}, {{customerVat}}, {{customerAddress}}
{{invoiceNo}}, {{invoiceDate}}, {{dueDate}}
{{items}}, {{subtotal}}, {{vatAmount}}, {{totalAmount}}
{{paymentTerms}}, {{paymentMethod}}
{{zatcaQr}}, {{zatcaHash}}, {{zatcaIcv}}
{{signature}}, {{stamp}}
{{footerText}}, {{terms}}
```

---

## 🌐 Multilingual

### اللغات المدعومة:
- **العربية** (default — RTL)
- **English** (LTR)

### Number Formatting:
```typescript
// Arabic numerals (default):
formatNumber(1234.56, 'ar'); // "١٬٢٣٤٫٥٦"

// English numerals:
formatNumber(1234.56, 'en'); // "1,234.56"

// SAR currency:
formatCurrency(100, 'SAR', 'ar'); // "١٠٠٫٠٠ ر.س"
formatCurrency(100, 'SAR', 'en'); // "100.00 SAR"
```

### Date Formatting:
```typescript
// Gregorian
formatDate(new Date(), 'gregorian', 'ar'); // "14 مايو 2026"

// Hijri
formatDate(new Date(), 'hijri'); // "26 شوال 1447"

// Dual
formatDate(new Date(), 'dual'); // "14 مايو 2026 / 26 شوال 1447"
```

---

## 🎬 Email Sending Process

```
1. Trigger event (e.g., invoice created)
2. Template selected (based on event + tenant + language)
3. Variables resolved
4. HTML rendered
5. Inlined CSS
6. Added to emailQueue (BullMQ)
7. Worker picks up
8. SMTP send via nodemailer
9. Track delivery
10. Update EmailLog
```

### النموذج:
```prisma
EmailLog {
    to, subject, template
    sentAt, deliveredAt
    openedAt, clickedAt  // tracking
    status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'COMPLAINED'
    errorMessage
}
```

---

## 🎯 Best Practices

1. ✅ **Templates separated** من الـ logic
2. ✅ **i18n** من البداية
3. ✅ **Test rendering** في كل اللغات
4. ✅ **Preview** قبل الإرسال
5. ✅ **Track delivery** + opens
6. ✅ **Branding consistent**
7. ✅ **Mobile-responsive** emails
8. ✅ **Plain text fallback**
9. ❌ **لا hardcoded text** في الـ templates
10. ✅ **A/B testing** للـ subject lines
