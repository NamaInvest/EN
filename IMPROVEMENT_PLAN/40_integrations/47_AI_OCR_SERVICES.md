# 47 — AI / OCR Services | خدمات الذكاء الاصطناعي

## 🟡 الأولوية: متوسط

## 🎯 الخدمات
- **Google Vision API** — OCR + image analysis
- **AWS Textract** — invoice extraction
- **Azure Form Recognizer** — structured documents
- **Google Document AI** — invoice processing
- **Tesseract** (open source)
- **OpenAI GPT-4 Vision** (للحالات المعقّدة)
- **Anthropic Claude Vision**
- **Saudi NLP services** (للعربية)

## 🎯 الخطة

### 47.1 — Multi-Provider OCR Abstraction (5 أيام)
```typescript
export interface OCRProvider {
  extractText(image: Buffer): Promise<string>;
  extractInvoice(image: Buffer): Promise<InvoiceData>;
  extractTable(image: Buffer): Promise<Table>;
  extractID(image: Buffer): Promise<IDData>;
}

class GoogleVisionOCR implements OCRProvider { ... }
class AWSTextractOCR implements OCRProvider { ... }
class AzureFormRecognizerOCR implements OCRProvider { ... }
```

### 47.2 — Provider Routing (3 أيام)
- اختر الأنسب per use case:
  - Invoices → AWS Textract
  - Saudi ID → Google Vision (Arabic better)
  - Tables → Azure Form Recognizer
  - Fallback → Gemini Vision
- Cost optimization
- Latency optimization

### 47.3 — Saudi-Specific OCR (8 أيام)
- Saudi invoice format
- Iqama / National ID extraction
- Commercial Registration
- VAT certificates
- Bank statements (Arabic)

### 47.4 — Invoice Extraction Pipeline (5 أيام)
1. Upload PDF/image
2. Pre-process (rotation, deskew, denoise)
3. OCR (best provider)
4. LLM structuring (Gemini)
5. Validation
6. User confirmation
7. Save to ERP

### 47.5 — Cost Tracking (3 أيام)
- Per-call cost
- Per-tenant budget
- Provider comparison
- Auto-route to cheapest

### 47.6 — Quality Monitoring (3 أيام)
- Accuracy benchmarks
- Drift detection
- Provider fallback
- A/B testing

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| OCR providers | 1 (Gemini) | 4+ |
| OCR accuracy | غير مقاس | > 95% |
| Avg cost per invoice | غير مقاس | optimized |
| Provider redundancy | لا | 3-tier |

## ⏱️ المدة: 27 يوم عمل
