import { z } from 'zod';
import { FinancialTxClient, runFinancialTx } from '@/lib/db/transaction';
import { AccountingJournalService } from '@/lib/services/accounting-journal.service';
import { assertPeriodWritable } from '@/lib/governance/period-lock';
import { EnterpriseLogger } from '@/lib/observability/logger';

export const ICPayloadSchema = z.object({
  action:        z.enum(['post', 'preview', 'net']),
  fromTenantId:  z.string(),
  toTenantId:    z.string(),
  amount:        z.number().positive().optional(),
  currency:      z.string().default('SAR'),
  exchangeRate:  z.number().positive().default(1),
  description:   z.string().optional().default('معاملة بينية'),
  type:          z.enum(['LOAN', 'SERVICE', 'GOODS', 'DIVIDEND', 'CAPITAL', 'NETTING']).optional().default('SERVICE'),
  fiscalYearId:  z.number().int().positive().optional().default(1),
  icReceivableAccountId: z.number().int().positive().optional(),
  icPayableAccountId:    z.number().int().positive().optional(),
  userId:        z.number().int().positive().or(z.string()).transform(Number).optional().default(0),
  period:        z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export class InterCompanyService {
  static async processICAction(prisma: any, payload: any, currentTenantId: string, overrideContext: any) {
    const data = ICPayloadSchema.parse(payload);
    const { action, fromTenantId, toTenantId, amount = 0, exchangeRate, description, type, fiscalYearId, icReceivableAccountId, icPayableAccountId, userId, currency } = data;

    if (fromTenantId === toTenantId) {
      throw new Error('fromTenantId and toTenantId must be different');
    }

    const sarAmount = Math.round(amount * exchangeRate * 100) / 100;
    const now = new Date();
    const ref = `IC-${fromTenantId}-${toTenantId}-${now.toISOString().split('T')[0].replace(/-/g,'')}`;

    if (action === 'net') {
      return await runFinancialTx(prisma, async (tx: FinancialTxClient) => {
        // Enforce period lock
        await assertPeriodWritable({
          tenantId: fromTenantId,
          postingDate: now,
          operationType: 'NETTING',
          module: 'InterCompany',
          actor: overrideContext?.actorId || '0',
          overrideContext
        });

        const lines = await tx.iCNettingLine.findMany({
          where: {
            status: 'OPEN',
            OR: [
              { debtorTenantId: fromTenantId, creditorTenantId: toTenantId },
              { debtorTenantId: toTenantId,   creditorTenantId: fromTenantId },
            ],
          },
        });

        const totalDebtor   = lines.filter((l: any) => l.debtorTenantId   === fromTenantId).reduce((s: number, l: any) => s + Number(l.amount || 0), 0);
        const totalCreditor = lines.filter((l: any) => l.creditorTenantId === fromTenantId).reduce((s: number, l: any) => s + Number(l.amount || 0), 0);
        const net           = Math.round((totalDebtor - totalCreditor) * 100) / 100;

        for (const l of lines) {
          await tx.iCNettingLine.update({
            where: { id: l.id },
            data: { status: 'NETTED', nettedAt: now }
          });
        }
        
        // Tracing hook
        EnterpriseLogger.traceFinancialTx('IC_NET', 'NETTING_COMPLETE', fromTenantId, { toTenantId, net });

        return {
          action: 'net', fromTenantId, toTenantId, ref,
          linesNetted: lines.length, netBalance: net,
          message: `✅ تمت المقاصة البينية — صافي: ${net.toLocaleString('ar-SA')} ر.س`,
        };
      }, `ic-netting-${fromTenantId}`);
    }

    if (action === 'post') {
      return await runFinancialTx(prisma, async (tx: FinancialTxClient) => {
        // Enforce period locks for BOTH entities
        await assertPeriodWritable({
          tenantId: fromTenantId,
          postingDate: now,
          operationType: 'POST',
          module: 'InterCompany',
          actor: overrideContext?.actorId || '0',
          overrideContext
        });
        await assertPeriodWritable({
          tenantId: toTenantId,
          postingDate: now,
          operationType: 'POST',
          module: 'InterCompany',
          actor: overrideContext?.actorId || '0',
          overrideContext
        });

        // 1. Create From Journal using standard AccountingJournalService
        const fromJournal = await AccountingJournalService.createEntry(tx, {
          description: `معاملة بينية إلى ${toTenantId}: ${description}`,
          reference: `${ref}-FROM`,
          date: now.toISOString(),
          userId: userId,
          lines: [
            { accountId: icReceivableAccountId ?? 1, debit: sarAmount, credit: 0, description },
            { accountId: icPayableAccountId    ?? 2, debit: 0, credit: sarAmount, description },
          ]
        });

        // 2. Create To Journal using standard AccountingJournalService
        const toJournal = await AccountingJournalService.createEntry(tx, {
          description: `معاملة بينية من ${fromTenantId}: ${description}`,
          reference: `${ref}-TO`,
          date: now.toISOString(),
          userId: userId,
          lines: [
            { accountId: 3, debit: sarAmount, credit: 0, description }, // IC Expense/Receivable
            { accountId: 4, debit: 0, credit: sarAmount, description }, // IC Payable
          ]
        });

        // 3. Record Netting Line
        await tx.iCNettingLine.create({
          data: {
            debtorTenantId:    fromTenantId,
            creditorTenantId:  toTenantId,
            amount:            sarAmount,
            currency,
            type,
            description,
            reference:         ref,
            status:            'OPEN',
            fromJournalId:     fromJournal.id,
            toJournalId:       toJournal.id,
            tenantId:          fromTenantId
          },
        });

        // Tracing hook
        EnterpriseLogger.traceFinancialTx('IC_POST', 'IC_TRANSACTION_POSTED', fromTenantId, { toTenantId, sarAmount });

        return {
          action: 'post', ref, fromTenantId, toTenantId, type, sarAmount, currency,
          fromJournalId: fromJournal.id, toJournalId: toJournal.id,
          message: `✅ تم ترحيل المعاملة البينية — ${sarAmount.toLocaleString('ar-SA')} ر.س`,
        };
      }, `ic-post-${fromTenantId}`);
    }
    
    throw new Error('Unsupported action');
  }
}
