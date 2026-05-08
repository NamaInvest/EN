import { Decimal } from '@prisma/client/runtime/library';

export class BadDebtService {
  async calculateECL(tenantId: string, asOfDate: Date) {
    // Stub: IFRS 9 Expected Credit Loss model
    return {
      totalECL: new Decimal(0),
      stage1: new Decimal(0),
      stage2: new Decimal(0),
      stage3: new Decimal(0),
    };
  }

  async postProvisionJournalEntry(tenantId: string, amount: Decimal) {
    // Stub: Create journal entry for bad debt provision
    return { success: true, journalEntryId: 'je-id' };
  }
}
