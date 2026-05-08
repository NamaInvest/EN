export class PurchasePriceVarianceService {
  async calculatePPV(poId: string, invoiceId: string) {
    // Stub: Variance reports
    // Auto-allocate to inventory or COGS
    return { success: true, varianceAmount: 0, allocation: 'COGS' };
  }
}
