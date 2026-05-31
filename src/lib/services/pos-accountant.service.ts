import { z } from 'zod';
import { FinancialTxClient, runFinancialTx } from '@/lib/db/transaction';
import { AccountingJournalService } from '@/lib/services/accounting-journal.service';
import { assertPeriodWritable } from '@/lib/governance/period-lock';
import { EnterpriseLogger } from '@/lib/observability/logger';

export const PosSyncPayloadSchema = z.object({
  posId: z.number().int().positive(),
  sessionDate: z.string(),
  totalSales: z.number().nonnegative(),
  totalTax: z.number().nonnegative(),
  cashCollected: z.number().nonnegative(),
  salesAccountId: z.number().int().positive(),
  taxAccountId: z.number().int().positive(),
  cashAccountId: z.number().int().positive(),
});

export class PosAccountantService {
  /**
   * Sync POS session to Accounting Journal
   */
  static async syncSession(prisma: any, payload: any, tenantId: string, overrideContext: any, userId: number) {
    const data = PosSyncPayloadSchema.parse(payload);
    
    return await runFinancialTx(prisma, async (tx: FinancialTxClient) => {
      const syncDate = new Date(data.sessionDate);
      await assertPeriodWritable({
        tenantId,
        postingDate: syncDate,
        operationType: 'SYNC',
        module: 'pos',
        actor: overrideContext?.actorId || '0',
        overrideContext
      });

      // Create Accounting Journal for POS Session
      const ref = `POS-SYNC-${data.posId}-${syncDate.toISOString().split('T')[0]}`;
      const description = `تسوية نقاط البيع - نقطة ${data.posId} بتاريخ ${data.sessionDate}`;

      const journalId = await AccountingJournalService.createEntry(tx, {
        description: description,
        reference: ref,
        date: syncDate.toISOString(),
        userId: userId,
        lines: [
          // Debit: Cash collected
          { accountId: data.cashAccountId, debit: data.cashCollected, credit: 0, description },
          // Credit: Sales Revenue
          { accountId: data.salesAccountId, debit: 0, credit: data.totalSales, description },
          // Credit: Tax
          { accountId: data.taxAccountId, debit: 0, credit: data.totalTax, description },
        ]
      });

      // Update PosSyncLog
      const syncLog = await tx.posSyncLog.create({
        data: {
          tenantId,
          posId: data.posId,
          syncDate: new Date(),
          recordCount: 1,
          status: 'SUCCESS',
        }
      });

      EnterpriseLogger.traceFinancialTx('POS_SYNC', 'POS_ACCOUNTING_SYNCED', tenantId, {
        posId: data.posId,
        journalId,
        totalSales: data.totalSales
      });

      return {
        message: 'تم مزامنة نقاط البيع بنجاح',
        journalId,
        syncLogId: syncLog.id
      };
    }, `pos-sync-${tenantId}-${data.posId}`);
  }
}
