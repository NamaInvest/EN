/**
 * Reverse Charge VAT Engine (G5)
 * ══════════════════════════════════════════════════════════════════════════════
 * ZATCA-compliant Reverse Charge Mechanism for imported services.
 *
 * When a Saudi business receives services from a foreign supplier:
 *   1. No VAT is charged by the supplier
 *   2. The recipient self-assesses VAT at 15%
 *   3. Two notional entries are created (Input VAT + Output VAT)
 *   4. Both are reported in the VAT Return (Boxes 8, 9, 10)
 *   5. Net cash effect = 0 (unless input VAT is not fully deductible)
 *
 * ZATCA Reference: VAT Implementing Regulation - Article 73
 */

import { logger } from '@/lib/logger';

const log = logger.child({ service: 'reverse-charge-vat' });

export const VAT_RATE = 0.15; // 15% KSA VAT

/** Account codes used for reverse charge entries */
export const RC_ACCOUNTS = {
  VAT_INPUT:  '2310',  // VAT Input (Deductible) — on purchases
  VAT_OUTPUT: '2300',  // VAT Output (Payable)   — on sales/self-assessed
};

export interface PurchaseInvoiceForRC {
  invoiceId:       number;
  supplierId:      number;
  supplierCountry: string;         // ISO 3166-1 alpha-2, e.g. "US", "GB"
  serviceType:     'GOODS' | 'SERVICE' | 'MIXED';
  lineAmount:      number;         // Total invoice amount (excl. VAT)
  currency:        string;
  exchangeRate:    number;         // vs SAR (1 if SAR)
  tenantId:        string;
  userId?:         number;
  date?:           string;         // ISO date string
}

export interface ReverseChargeResult {
  isReverseCharge:  boolean;
  reason?:          string;
  vatAmount:        number;        // SAR
  inputVatAccount:  string;
  outputVatAccount: string;
  journalLines: Array<{
    accountCode: string;
    debit:       number;
    credit:      number;
    description: string;
  }>;
}

/**
 * Determines whether a purchase invoice triggers reverse charge VAT.
 *
 * Rules:
 * - Supplier is outside Saudi Arabia (country != 'SA')
 * - AND invoice is for services (or mixed, proportional)
 */
export function isReverseCharge(invoice: PurchaseInvoiceForRC): boolean {
  const foreignSupplier = invoice.supplierCountry.toUpperCase() !== 'SA';
  const hasService = invoice.serviceType === 'SERVICE' || invoice.serviceType === 'MIXED';
  return foreignSupplier && hasService;
}

/**
 * Calculates the reverse charge VAT entries for a foreign service purchase.
 * Returns journal lines to be passed to auto-journal.ts.
 */
export function calculateReverseCharge(invoice: PurchaseInvoiceForRC): ReverseChargeResult {
  if (!isReverseCharge(invoice)) {
    return {
      isReverseCharge:  false,
      reason:           invoice.supplierCountry.toUpperCase() === 'SA'
        ? 'Local supplier — standard VAT applies'
        : 'Goods-only import — no reverse charge',
      vatAmount:        0,
      inputVatAccount:  RC_ACCOUNTS.VAT_INPUT,
      outputVatAccount: RC_ACCOUNTS.VAT_OUTPUT,
      journalLines:     [],
    };
  }

  const amountSAR = invoice.lineAmount * invoice.exchangeRate;
  const vatAmount = Math.round(amountSAR * VAT_RATE * 100) / 100;

  const lines = [
    // Dr VAT Input (we are entitled to deduct)
    {
      accountCode: RC_ACCOUNTS.VAT_INPUT,
      debit:       vatAmount,
      credit:      0,
      description: `VAT مدخلات ضريبة الاستيراد - فاتورة #${invoice.invoiceId} (${invoice.supplierCountry})`,
    },
    // Cr VAT Output (self-assessed liability to ZATCA)
    {
      accountCode: RC_ACCOUNTS.VAT_OUTPUT,
      debit:       0,
      credit:      vatAmount,
      description: `VAT مخرجات ضريبة الاستيراد الذاتي - فاتورة #${invoice.invoiceId} (${invoice.supplierCountry})`,
    },
  ];

  log.info('Reverse charge VAT calculated', { invoiceId: invoice.invoiceId, vatAmount, country: invoice.supplierCountry });

  return {
    isReverseCharge:  true,
    reason:           `Foreign service from ${invoice.supplierCountry} — reverse charge @ ${VAT_RATE * 100}%`,
    vatAmount,
    inputVatAccount:  RC_ACCOUNTS.VAT_INPUT,
    outputVatAccount: RC_ACCOUNTS.VAT_OUTPUT,
    journalLines:     lines,
  };
}

/**
 * Aggregates reverse charge transactions for a given period for VAT Return boxes 8-10.
 *
 * Box 8:  Total value of goods/services imported subject to reverse charge
 * Box 9:  VAT due on imports (Output VAT)
 * Box 10: Deductible input VAT on imports
 */
export interface VatReturnRCSection {
  box8_importValue:  number;   // SAR
  box9_vatDue:       number;   // SAR (Output VAT)
  box10_vatDeduct:   number;   // SAR (Input VAT, normally = box9)
  transactions:      RCTransaction[];
}

export interface RCTransaction {
  invoiceId:       number;
  supplierId:      number;
  supplierCountry: string;
  lineAmount:      number;
  vatAmount:       number;
  date:            string;
}

/**
 * Builds the VAT Return RC section from a list of reverse-charge invoices in a period.
 */
export function buildVatReturnRCSection(invoices: PurchaseInvoiceForRC[]): VatReturnRCSection {
  const rcInvoices = invoices.filter(isReverseCharge);

  let box8  = 0;
  let box9  = 0;
  let box10 = 0;
  const transactions: RCTransaction[] = [];

  for (const inv of rcInvoices) {
    const amtSAR = inv.lineAmount * inv.exchangeRate;
    const vat    = Math.round(amtSAR * VAT_RATE * 100) / 100;

    box8  += amtSAR;
    box9  += vat;   // Output VAT (self-assessed)
    box10 += vat;   // Input VAT (deductible, assuming full recovery)

    transactions.push({
      invoiceId:       inv.invoiceId,
      supplierId:      inv.supplierId,
      supplierCountry: inv.supplierCountry,
      lineAmount:      amtSAR,
      vatAmount:       vat,
      date:            inv.date ?? new Date().toISOString().split('T')[0],
    });
  }

  return {
    box8_importValue: Math.round(box8 * 100) / 100,
    box9_vatDue:      Math.round(box9 * 100) / 100,
    box10_vatDeduct:  Math.round(box10 * 100) / 100,
    transactions,
  };
}
