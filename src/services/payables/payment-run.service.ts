export class PaymentRunService {
  async selectInvoicesForPayment(tenantId: string, dueDate: Date) {
    // Stub: Select due invoices, considering early payment discounts
    return { success: true, invoicesSelected: 0, totalAmount: 0 };
  }

  async generateBankFile(batchId: string, format: 'SARIE' | 'SWIFT') {
    // Stub: Generate bank payment file
    return { success: true, fileContent: 'bank file data' };
  }
}
