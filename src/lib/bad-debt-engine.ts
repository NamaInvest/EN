export interface Invoice {
  invoiceId: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  probabilityOfDefault: number; // calculated percentage
  requiredProvision: number; // amount to be provisioned
}

export interface BadDebtReport {
  asOfDate: Date;
  tenantId: string;
  totalReceivables: number;
  totalOverdue: number;
  totalProvisionRequired: number;
  invoices: Invoice[];
  summaryByAging: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '91-120': number;
    '120+': number;
  };
}

/**
 * Expected Credit Loss (ECL) & Bad Debt Provision Engine (IFRS 9 / IAS 39)
 * Evaluates overdue invoices and applies a progressive probability of default matrix
 * to calculate the required bad debt provision.
 */
export class BadDebtEngine {
  static async calculateProvision(tenantId: string): Promise<BadDebtReport> {
    try {
      // Mock data representing open accounts receivable
      const mockReceivables = [
        { id: 'INV-2026-101', customer: 'Saudi Aramco', amount: 450000, due: new Date(Date.now() - 15 * 86400000) }, // 15 days overdue
        { id: 'INV-2026-098', customer: 'SABIC', amount: 120000, due: new Date(Date.now() - 45 * 86400000) }, // 45 days overdue
        { id: 'INV-2026-050', customer: 'Local Tech LLC', amount: 35000, due: new Date(Date.now() - 75 * 86400000) }, // 75 days overdue
        { id: 'INV-2025-999', customer: 'Gulf Traders', amount: 85000, due: new Date(Date.now() - 110 * 86400000) }, // 110 days overdue
        { id: 'INV-2025-600', customer: 'Defunct Corp', amount: 200000, due: new Date(Date.now() - 150 * 86400000) }, // 150 days overdue
        { id: 'INV-2026-120', customer: 'STC', amount: 500000, due: new Date(Date.now() + 10 * 86400000) }, // Not overdue
      ];

      const invoices: Invoice[] = [];
      let totalReceivables = 0;
      let totalOverdue = 0;
      let totalProvisionRequired = 0;
      const summaryByAging = { '0-30': 0, '31-60': 0, '61-90': 0, '91-120': 0, '120+': 0 };

      const now = new Date();

      for (const rec of mockReceivables) {
        totalReceivables += rec.amount;
        let daysOverdue = Math.floor((now.getTime() - rec.due.getTime()) / 86400000);
        if (daysOverdue < 0) daysOverdue = 0;

        let probabilityOfDefault = 0; // Standard matrix for IFRS 9 simplified approach

        if (daysOverdue > 0) {
          totalOverdue += rec.amount;
          
          if (daysOverdue <= 30) {
            probabilityOfDefault = 0.05; // 5%
            summaryByAging['0-30'] += rec.amount;
          } else if (daysOverdue <= 60) {
            probabilityOfDefault = 0.15; // 15%
            summaryByAging['31-60'] += rec.amount;
          } else if (daysOverdue <= 90) {
            probabilityOfDefault = 0.30; // 30%
            summaryByAging['61-90'] += rec.amount;
          } else if (daysOverdue <= 120) {
            probabilityOfDefault = 0.60; // 60%
            summaryByAging['91-120'] += rec.amount;
          } else {
            probabilityOfDefault = 1.00; // 100% provision for > 120 days
            summaryByAging['120+'] += rec.amount;
          }
        }

        const requiredProvision = rec.amount * probabilityOfDefault;
        totalProvisionRequired += requiredProvision;

        invoices.push({
          invoiceId: rec.id,
          customerName: rec.customer,
          amount: rec.amount,
          dueDate: rec.due,
          daysOverdue,
          probabilityOfDefault: Math.round(probabilityOfDefault * 100),
          requiredProvision: Math.round(requiredProvision)
        });
      }

      // Sort by highest provision required
      invoices.sort((a, b) => b.requiredProvision - a.requiredProvision);

      return {
        asOfDate: now,
        tenantId,
        totalReceivables,
        totalOverdue,
        totalProvisionRequired: Math.round(totalProvisionRequired),
        invoices,
        summaryByAging
      };

    } catch (error: any) {
      console.error('BadDebtEngine Error:', error);
      throw new Error(`Failed to calculate Bad Debt Provision: ${error.message}`);
    }
  }
}
