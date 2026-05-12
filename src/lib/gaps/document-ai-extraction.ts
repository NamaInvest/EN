/**
 * Document AI Extraction Engine
 *
 * Extracts structured data from invoices, receipts, ID cards, and contracts
 * using vision LLMs (multimodal). Output schema is validated with Zod.
 */

import { z } from 'zod';

export const InvoiceExtractionSchema = z.object({
  vendorName: z.string().optional(),
  vendorVatNumber: z.string().optional(),
  vendorCRNumber: z.string().optional(),
  invoiceNumber: z.string(),
  invoiceDate: z.string(), // ISO date
  dueDate: z.string().optional(),
  currency: z.string().default('SAR'),
  lines: z.array(
    z.object({
      description: z.string(),
      qty: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      vatRate: z.number().min(0).max(1).default(0.15),
      lineTotal: z.number(),
    })
  ),
  subtotal: z.number(),
  vatTotal: z.number(),
  grandTotal: z.number(),
  paymentTerms: z.string().optional(),
  poReferences: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});
export type ExtractedInvoice = z.infer<typeof InvoiceExtractionSchema>;

export const ReceiptExtractionSchema = z.object({
  merchantName: z.string(),
  receiptDate: z.string(),
  total: z.number(),
  vatTotal: z.number().default(0),
  items: z.array(
    z.object({
      description: z.string(),
      qty: z.number().positive().default(1),
      amount: z.number().nonnegative(),
    })
  ).default([]),
});
export type ExtractedReceipt = z.infer<typeof ReceiptExtractionSchema>;

export const IqamaExtractionSchema = z.object({
  iqamaNumber: z.string().regex(/^[12]\d{9}$/),
  fullName: z.string(),
  fullNameAr: z.string().optional(),
  dateOfBirth: z.string(),
  nationality: z.string(),
  occupation: z.string().optional(),
  expiryDate: z.string(),
  issuingOffice: z.string().optional(),
});
export type ExtractedIqama = z.infer<typeof IqamaExtractionSchema>;

/* ---------------- LLM Prompts ---------------- */

export const INVOICE_EXTRACTION_PROMPT = `
أنت محرك استخراج بيانات للفواتير. استخرج البيانات من الفاتورة المرفقة كصورة بدقة عالية.

أعد JSON بالشكل التالي بالضبط:
{
  "vendorName": "اسم المورد",
  "vendorVatNumber": "رقم ضريبي 15 رقم يبدأ بـ 3",
  "vendorCRNumber": "السجل التجاري",
  "invoiceNumber": "رقم الفاتورة",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD أو null",
  "currency": "SAR / USD / ...",
  "lines": [
    { "description": "...", "qty": 0, "unitPrice": 0, "vatRate": 0.15, "lineTotal": 0 }
  ],
  "subtotal": 0,
  "vatTotal": 0,
  "grandTotal": 0,
  "paymentTerms": "Net 30 / Cash / ...",
  "poReferences": ["PO-1234"],
  "warnings": ["تم استخدام تخمين للحقول الناقصة"]
}

قواعد:
- إذا كانت الفاتورة عربية، النصوص بالعربي. إذا إنجليزية، بالإنجليزي.
- التحقق من أن subtotal + vatTotal = grandTotal (تسامح 0.01).
- إذا غير واضح: أضف في warnings.
- لا تعد أي نص خارج JSON.
`.trim();

export const IQAMA_EXTRACTION_PROMPT = `
أنت تستخرج بيانات الإقامة السعودية. أعد JSON:
{
  "iqamaNumber": "10 أرقام تبدأ بـ 1 أو 2",
  "fullName": "Latin name",
  "fullNameAr": "الاسم العربي",
  "dateOfBirth": "YYYY-MM-DD",
  "nationality": "ISO country code",
  "occupation": "...",
  "expiryDate": "YYYY-MM-DD",
  "issuingOffice": "..."
}
لا نص خارج JSON.
`.trim();

/* ---------------- Extraction with Validation ---------------- */

export interface VisionLLM {
  extract(prompt: string, fileUrl: string): Promise<string>;
}

export async function extractInvoice(llm: VisionLLM, fileUrl: string): Promise<ExtractedInvoice> {
  const raw = await llm.extract(INVOICE_EXTRACTION_PROMPT, fileUrl);
  const cleaned = stripCodeFence(raw);
  const parsed = JSON.parse(cleaned);
  const validated = InvoiceExtractionSchema.parse(parsed);
  // Cross-check totals
  const sumLines = validated.lines.reduce((s, l) => s + l.lineTotal, 0);
  if (Math.abs(sumLines - validated.subtotal) > 0.5) {
    validated.warnings.push(`مجموع البنود ${sumLines} لا يساوي المجموع الفرعي ${validated.subtotal}`);
  }
  if (Math.abs(validated.subtotal + validated.vatTotal - validated.grandTotal) > 0.01) {
    validated.warnings.push('الـ subtotal + VAT لا يساوي الإجمالي');
  }
  return validated;
}

export async function extractReceipt(llm: VisionLLM, fileUrl: string): Promise<ExtractedReceipt> {
  const raw = await llm.extract(
    'استخرج بيانات إيصال POS كـ JSON: { merchantName, receiptDate (YYYY-MM-DD), total, vatTotal, items: [{ description, qty, amount }] }. لا نص خارج JSON.',
    fileUrl
  );
  const cleaned = stripCodeFence(raw);
  return ReceiptExtractionSchema.parse(JSON.parse(cleaned));
}

export async function extractIqama(llm: VisionLLM, fileUrl: string): Promise<ExtractedIqama> {
  const raw = await llm.extract(IQAMA_EXTRACTION_PROMPT, fileUrl);
  const cleaned = stripCodeFence(raw);
  return IqamaExtractionSchema.parse(JSON.parse(cleaned));
}

function stripCodeFence(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
}

/* ---------------- Cross-Validation against ZATCA registry ---------------- */

export interface ZatcaVendorLookup {
  vatNumber: string;
  name?: string;
  isActive?: boolean;
}

/**
 * Validates extracted invoice against ZATCA registry.
 * Returns warnings to attach to the InvoiceCapture record.
 */
export async function validateExtractedInvoiceAgainstZatca(
  extracted: ExtractedInvoice,
  lookup: (vatNumber: string) => Promise<ZatcaVendorLookup | null>
): Promise<string[]> {
  const warnings: string[] = [];
  if (!extracted.vendorVatNumber) {
    warnings.push('لم يتم العثور على رقم ضريبي للمورد على الفاتورة');
    return warnings;
  }
  if (!/^3\d{14}$/.test(extracted.vendorVatNumber)) {
    warnings.push('الرقم الضريبي لا يطابق صيغة ZATCA (15 رقم تبدأ بـ 3)');
  }
  const z = await lookup(extracted.vendorVatNumber);
  if (!z) {
    warnings.push('الرقم الضريبي غير موجود في سجل ZATCA');
  } else if (z.isActive === false) {
    warnings.push('المورد غير نشط في سجل ZATCA');
  }
  return warnings;
}
