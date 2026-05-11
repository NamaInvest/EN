import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface AgingBucket {
  entityId: number;
  entityName: string;
  totalRemaining: number;
  current: number;
  days30: number; // 1-30 days
  days60: number; // 31-60 days
  days90: number; // 61-90 days
  daysOver90: number; // 91+ days
}

export interface AgingReportResult {
  type: 'AR' | 'AP';
  asOfDate: Date;
  buckets: AgingBucket[];
  totals: {
    totalRemaining: number;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    daysOver90: number;
  };
}

/**
 * Aging Engine - Calculates Accounts Receivable (AR) and Accounts Payable (AP) aging buckets.
 * Highly demanded for CFO dashboards and financial compliance (ZATCA / SOCPA).
 */
export class AgingEngine {
  /**
   * Generates Accounts Receivable (AR) Aging from Sales Invoices
   */
  static async generateARAging(tenantId: string, asOfDate: Date = new Date()): Promise<AgingReportResult> {
    const invoices = await prisma.salesInvoice.findMany({
      where: {
        tenantId,
        remaining: { gt: 0 },
        date: { lte: asOfDate },
        deletedAt: null,
      },
      include: {
        customer: true,
      },
    });

    return this.calculateBuckets(invoices, 'AR', asOfDate);
  }

  /**
   * Generates Accounts Payable (AP) Aging from Purchase Invoices
   */
  static async generateAPAging(tenantId: string, asOfDate: Date = new Date()): Promise<AgingReportResult> {
    const invoices = await prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        remaining: { gt: 0 },
        date: { lte: asOfDate },
        deletedAt: null,
      },
      include: {
        supplier: true,
      },
    });

    return this.calculateBuckets(invoices, 'AP', asOfDate);
  }

  private static calculateBuckets(invoices: any[], type: 'AR' | 'AP', asOfDate: Date): AgingReportResult {
    const bucketsMap = new Map<number, AgingBucket>();

    let grandTotalRemaining = 0;
    let grandCurrent = 0;
    let grand30 = 0;
    let grand60 = 0;
    let grand90 = 0;
    let grandOver90 = 0;

    for (const inv of invoices) {
      // Determine the entity ID and Name based on AR or AP
      const entityId = type === 'AR' ? inv.customerId : inv.supplierId;
      const entity = type === 'AR' ? inv.customer : inv.supplier;
      const entityName = entity?.name || 'Unknown Entity';

      if (!entityId) continue;

      const remaining = Number(inv.remaining || 0);
      if (remaining <= 0) continue;

      // Calculate days elapsed since invoice date
      const invDate = new Date(inv.date);
      const diffTime = Math.abs(asOfDate.getTime() - invDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Retrieve or initialize bucket for this entity
      let bucket = bucketsMap.get(entityId);
      if (!bucket) {
        bucket = {
          entityId,
          entityName,
          totalRemaining: 0,
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          daysOver90: 0,
        };
        bucketsMap.set(entityId, bucket);
      }

      // Assign to correct aging bucket
      bucket.totalRemaining += remaining;
      grandTotalRemaining += remaining;

      // Assumption: standard payment term is 0 days for strict aging unless dueDate is specified.
      // Since dueDate isn't heavily enforced, we age directly from invoice date.
      if (diffDays <= 0) {
        bucket.current += remaining;
        grandCurrent += remaining;
      } else if (diffDays <= 30) {
        bucket.days30 += remaining;
        grand30 += remaining;
      } else if (diffDays <= 60) {
        bucket.days60 += remaining;
        grand60 += remaining;
      } else if (diffDays <= 90) {
        bucket.days90 += remaining;
        grand90 += remaining;
      } else {
        bucket.daysOver90 += remaining;
        grandOver90 += remaining;
      }
    }

    return {
      type,
      asOfDate,
      buckets: Array.from(bucketsMap.values()),
      totals: {
        totalRemaining: grandTotalRemaining,
        current: grandCurrent,
        days30: grand30,
        days60: grand60,
        days90: grand90,
        daysOver90: grandOver90,
      },
    };
  }
}
