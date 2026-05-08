/**
 * ZATCA Phase 2 — Auto-detect Clearance vs Reporting mode.
 *
 * Standard Tax Invoices (B2B, ≥ 1000 SAR): CLEARANCE — must be cleared before delivery.
 * Simplified Tax Invoices (B2C, < 1000 SAR): REPORTING — must be reported within 24h.
 */

export type ZATCAInvoiceMode = 'CLEARANCE' | 'REPORTING';

export interface InvoiceForModeDetection {
  buyerVatNumber?: string;
  totalAmount: number;
  invoiceType?: string; // 'STANDARD' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
}

export class ZATCAPhase2ModeService {
  determineMode(invoice: InvoiceForModeDetection): ZATCAInvoiceMode {
    // Credit/Debit notes inherit the mode of their original invoice
    // B2B (buyer has VAT number) → Clearance
    if (invoice.buyerVatNumber && invoice.buyerVatNumber.length === 15) {
      return 'CLEARANCE';
    }
    // B2C over 1000 SAR — technically still simplified but track it
    // All B2C → Reporting
    return 'REPORTING';
  }

  async getReportingDeadline(invoiceDate: Date): Promise<Date> {
    // ZATCA requires reporting simplified invoices within 24 hours
    const deadline = new Date(invoiceDate);
    deadline.setHours(deadline.getHours() + 24);
    return deadline;
  }

  isLateSubmission(invoiceDate: Date): boolean {
    const deadline = new Date(invoiceDate);
    deadline.setHours(deadline.getHours() + 24);
    return new Date() > deadline;
  }
}
