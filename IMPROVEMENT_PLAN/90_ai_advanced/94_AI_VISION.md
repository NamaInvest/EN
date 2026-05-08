# 94 — AI Vision | الرؤية الحاسوبية

## 🟠 الأولوية: عالي

## 🔍 الموجود
- face-api.js (للتعرّف على الوجه)
- OCR للفواتير (Gemini Vision)

## 🎯 Use Cases
- Invoice extraction (OCR + structuring)
- ID card scanning (Iqama/National ID)
- Document classification
- Signature verification
- Face attendance
- Inventory counting (visual)
- Damage detection (للتأمين)
- Receipt scanning (expenses)

## 🎯 الخطة

### 94.1 — Vision Provider Abstraction (3 أيام)
```typescript
export interface VisionProvider {
  extractText(image: Buffer): Promise<string>;
  classifyDocument(image: Buffer): Promise<DocType>;
  detectObjects(image: Buffer): Promise<Object[]>;
  detectFaces(image: Buffer): Promise<Face[]>;
  compareSignatures(sig1, sig2): Promise<Similarity>;
  analyzeInvoice(image: Buffer): Promise<InvoiceData>;
}
```

### 94.2 — Saudi ID Scanner (5 أيام)
**يستخرج تلقائياً:**
- Saudi ID / Iqama number
- Name (Arabic + English)
- Date of birth
- Expiry
- Photo
- Family
- Nationality

استخدامات:
- Customer onboarding
- Employee onboarding
- KYC checks

### 94.3 — Invoice Vision Pipeline (8 أيام)
```
PDF/Image upload
   ↓
Pre-processing (rotation, deskew, contrast)
   ↓
OCR (Gemini Vision / Tesseract)
   ↓
Layout analysis (detect: header, lines table, totals, footer)
   ↓
LLM structuring (extract fields)
   ↓
Validation (math checks, VAT calculation)
   ↓
User review
   ↓
Save to ERP
```

### 94.4 — Face Attendance (8 أيام)
- Enroll employee photos (consent required!)
- Real-time attendance check-in
- Anti-spoofing (liveness detection)
- Mask detection
- Face recognition vs ID card cross-check
- PDPL compliance

### 94.5 — Signature Verification (5 أيام)
- Collect signature samples on enrollment
- Compare on cheques / contracts
- Confidence score
- Human review for low confidence

### 94.6 — Document Classification (5 أيام)
- Auto-classify uploaded documents:
  - Invoice
  - Receipt
  - Contract
  - ID document
  - Bank statement
  - Salary certificate
  - Medical report
- Route to appropriate workflow

### 94.7 — Receipt Scanning (4 أيام)
- Mobile capture (camera)
- OCR
- Expense categorization
- Auto-create expense entry
- Reimbursement workflow

### 94.8 — Inventory Vision (10 أيام)
**Future:**
- Camera in warehouse
- Auto-count stock
- Detect missing items
- Verify deliveries
- Damage detection

### 94.9 — Visual QC (Manufacturing) (8 أيام)
- Detect defects in produced items
- Compare to "golden" sample
- Reject before shipping
- Statistical process control

### 94.10 — Cost Optimization (3 أيام)
- Cache repeated images
- Local processing for simple tasks
- API calls only for complex
- Provider selection per use case

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Vision use cases | 1 | 10+ |
| ID scan accuracy | لا | > 98% |
| Invoice extraction | basic | comprehensive |
| Face recognition | جزئي | production |

## ⏱️ المدة: 59 يوم عمل
