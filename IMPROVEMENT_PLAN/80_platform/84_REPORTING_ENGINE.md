# 84 — Reporting Engine | محرك التقارير

## 🟠 الأولوية: عالي

## 🔍 الموجود
- jspdf, xlsx packages
- بسيط

## 🔴 الفجوات
- لا templates engine
- لا centralized PDF generation
- لا scheduled reports
- لا custom report builder
- Excel exports غير متّسقة

## 🎯 الخطة

### 84.1 — PDF Generation Engine (8 أيام)
**Options:**
- **Puppeteer** (HTML → PDF, الأقوى)
- **PDFKit** (programmatic)
- **jsPDF** (client-side, ضعيف)
- **react-pdf** (React-based)

**التوصية:** Puppeteer (HTML templates أسهل للتعديل).

```typescript
export class PDFService {
  async generate(template: string, data: any): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const html = await renderTemplate(template, data);
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdf;
  }
}
```

### 84.2 — Templates Library (10 أيام)
**ZATCA-compliant invoice:**
- Standard tax invoice (B2B)
- Simplified tax invoice (B2C)
- Credit note
- Debit note

**Other:**
- Quote / SO / DN / Receipt
- PO / GRN / Invoice
- Payslip
- Statement of Account
- Trial Balance / P&L / BS / CF
- Audit reports
- Dashboard PDF

### 84.3 — Multi-Language Templates (3 أيام)
- Arabic (RTL) + English (LTR)
- Bilingual templates
- Per-tenant branding

### 84.4 — Excel Export Engine (5 أيام)
```typescript
import ExcelJS from 'exceljs';

export class ExcelService {
  async export(data: any[], options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(options.sheetName);
    sheet.views = [{ rightToLeft: options.rtl }];
    
    sheet.columns = options.columns;
    sheet.addRows(data);
    
    // Formatting
    sheet.getRow(1).font = { bold: true };
    sheet.getColumn('amount').numFmt = '#,##0.00';
    
    // Freeze headers
    sheet.views[0].state = 'frozen';
    sheet.views[0].ySplit = 1;
    
    return await workbook.xlsx.writeBuffer();
  }
}
```

### 84.5 — Custom Report Builder (12 أيام)
- Drag-drop fields
- Filters (date, status, etc.)
- Grouping
- Calculations
- Charts (Recharts)
- Save & share
- Schedule

### 84.6 — Scheduled Reports (5 أيام)
- Cron-based delivery
- Email + WhatsApp
- Per-recipient personalization
- Conditional (only if changes)

### 84.7 — Report Caching (3 أيام)
- Cache expensive reports
- Invalidate on data changes
- Pre-generate common reports

### 84.8 — Print Preview UI (3 أيام)
- WYSIWYG preview
- Page break indicators
- Layout options

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| PDF templates | بسيط | 20+ |
| Generation time | غير مقاس | < 2s |
| Custom reports | لا | self-service |
| Scheduled reports | لا | per role |

## ⏱️ المدة: 49 يوم عمل
