import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ap-ocr-engine' });

/**
 * O-09: AP Automation with OCR
 * Extracts invoice data from PDFs/images using AI vision
 */

export interface ExtractedInvoice {
  vendorName?: string;
  vendorVAT?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
  lineItems?: Array<{ description: string; qty: number; unitPrice: number; total: number }>;
  currency?: string;
  confidence: number; // 0-1
}

export class APOCREngine {
  /** Extract invoice data via Gemini Vision API */
  static async extractFromBase64(base64Image: string, mimeType = 'image/jpeg'): Promise<ExtractedInvoice> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const prompt = `You are an expert invoice parser. Extract the following fields from this invoice image as JSON:
{
  "vendorName": "string",
  "vendorVAT": "string (VAT/Tax number)",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "subtotal": number,
  "vatAmount": number,
  "totalAmount": number,
  "currency": "string (ISO 4217)",
  "lineItems": [{"description":"string","qty":number,"unitPrice":number,"total":number}],
  "confidence": number (0.0-1.0, your confidence in extraction accuracy)
}
Return ONLY valid JSON. Use null for missing fields.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Image } },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini OCR error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const extracted: ExtractedInvoice = JSON.parse(text);
    log.info(`Invoice OCR: ${extracted.invoiceNumber}, confidence=${extracted.confidence}`);
    return extracted;
  }

  /** Validate extracted invoice against PO */
  static validateAgainstPO(extracted: ExtractedInvoice, poAmount: number, tolerance = 0.01): { valid: boolean; variance: number } {
    const variance = Math.abs((extracted.totalAmount ?? 0) - poAmount) / poAmount;
    return { valid: variance <= tolerance, variance };
  }
}
