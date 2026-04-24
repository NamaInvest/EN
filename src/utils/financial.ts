import { z } from 'zod';

// Zod schema for validating financial input
export const FinancialInputSchema = z.object({
  subtotal: z.number().min(0, "Subtotal cannot be negative"),
  discount: z.number().min(0, "Discount cannot be negative").default(0),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100").default(15), // KSA VAT is 15%
});

export type FinancialInput = z.infer<typeof FinancialInputSchema>;

export interface FinancialResult {
  subtotalAfterDiscount: number;
  taxAmount: number;
  total: number;
}

/**
 * Calculates financial totals including discount and tax.
 */
export function calculateFinancials(input: FinancialInput): FinancialResult {
  // Validate input using Zod
  const validData = FinancialInputSchema.parse(input);

  const subtotalAfterDiscount = Math.max(0, validData.subtotal - validData.discount);
  const taxAmount = subtotalAfterDiscount * (validData.taxRate / 100);
  const total = subtotalAfterDiscount + taxAmount;

  return {
    subtotalAfterDiscount: Number(subtotalAfterDiscount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
