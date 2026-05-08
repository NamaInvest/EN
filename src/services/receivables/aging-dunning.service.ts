import { Decimal } from '@prisma/client/runtime/library';

export class AgingAndDunningService {
  async generateAgingReport(tenantId: string, asOfDate: Date) {
    // Stub: 0-30, 31-60, 61-90, 91-120, 120+
    return {
      buckets: {
        '0-30': new Decimal(0),
        '31-60': new Decimal(0),
        '61-90': new Decimal(0),
        '91-120': new Decimal(0),
        '120+': new Decimal(0),
      },
      totalOutstanding: new Decimal(0),
    };
  }

  async processDunningRun(tenantId: string) {
    // Stub: Run dunning process and send reminders
    return { success: true, remindersSent: 0 };
  }
}
