import { z } from 'zod';
import { Chain } from '../base/chain.interface';

// Stubs to avoid large missing files
async function invokeChain(name: string, args: any, ctx: any) { return { valid: true, issues: [], success: true, id: '123' }; }

export const invoiceProcessChain: Chain<any, any> = {
  name: 'invoice.process',
  description: 'OCR → Validate → Match PO → Post JE',
  inputSchema: z.object({ imageUrl: z.string().url() }),
  outputSchema: z.object({
    invoiceId: z.string(),
    status: z.enum(['posted', 'pending_review']),
    journalEntryId: z.string().optional(),
    matchedPO: z.string().optional(),
    issues: z.array(z.string()),
  }),

  async execute(input, ctx) {
    // Step 1: OCR
    const extracted = await invokeChain('ocr.invoice_extract', { imageUrl: input.imageUrl }, ctx);
    
    // Step 2 & 3: Match & Validate stubs
    return {
      invoiceId: 'INV-001',
      status: 'posted',
      journalEntryId: 'JE-001',
      matchedPO: 'PO-001',
      issues: [],
    };
  },
};
