import { PrismaClient, JournalEntry } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BaseService } from '../shared/base.service';
import { BusinessContext, eventBus } from '../shared/event-bus.service';
import { FinancialPeriodService } from './financial-period.service';

export interface CreateJournalEntryInput {
  bookId?: string;
  date: Date;
  reference?: string;
  memo?: string;
  lines: JournalLineInput[];
}

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  memo?: string;
}

export class JournalService extends BaseService {
  constructor(
    prisma: PrismaClient,
    ctx: BusinessContext
  ) {
    super(prisma, ctx);
  }

  async create(input: CreateJournalEntryInput): Promise<JournalEntry> {
    // 1. Permission check
    this.requirePermission('accounting:journal:create');

    // 2. Period check
    const periodService = new FinancialPeriodService(this.db, this.ctx);
    await periodService.requireOpenPeriod(input.date);

    // 3. Execute in transaction
    return await this.db.$transaction(async (tx: any) => {
      // 4. Validate lines and calculate totals
      let totalDebit = new Decimal(0);
      let totalCredit = new Decimal(0);

      for (const line of input.lines) {
        totalDebit = totalDebit.add(new Decimal(line.debit));
        totalCredit = totalCredit.add(new Decimal(line.credit));
      }

      // 5. Ensure the entry is balanced
      if (!totalDebit.equals(totalCredit)) {
        throw new Error(`Journal entry must balance. Debit: ${totalDebit}, Credit: ${totalCredit}`);
      }

      // 6. Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          tenantId: this.tenantId,
          // entryNo: 'JE-' + Date.now(), // Real implementation would use numberingService
          bookId: input.bookId || 'DEFAULT',
          branchId: this.ctx.branch?.id || 'default-branch',
          entryDate: input.date,
          totalDebit: totalDebit,
          totalCredit: totalCredit,
          memo: input.memo,
          reference: input.reference,
          status: 'draft',
          createdBy: this.ctx.user.id,
          lines: {
            create: input.lines.map((line: any) => ({
              accountId: line.accountId,
              debit: new Decimal(line.debit),
              credit: new Decimal(line.credit),
              costCenterId: line.costCenterId,
              memo: line.memo
            })),
          },
        },
        include: { lines: true },
      });

      // 7. Publish domain event
      eventBus.afterCommit('accounting.journal.created', {
        journalEntryId: journalEntry.id,
        tenantId: this.tenantId,
        amount: totalDebit.toString(),
      });

      return journalEntry;
    });
  }

  async post(journalEntryId: string): Promise<void> {
    return await this.db.$transaction(async (tx: any) => {
      // Find journal entry
      const entry = await tx.journalEntry.findFirstOrThrow({
        where: { id: journalEntryId, tenantId: this.tenantId }
      });

      if (entry.status !== 'draft') {
         throw new Error('Journal entry must be in draft status to post.');
      }

      // 2. Period check
      const periodService = new FinancialPeriodService(tx, this.ctx);
      await periodService.requireOpenPeriod(entry.entryDate);

      // Update status with tenant isolation
      const result = await tx.journalEntry.updateMany({
        where: { id: journalEntryId, tenantId: this.tenantId, status: 'draft' },
        data: { status: 'posted', postedAt: new Date(), postedBy: this.ctx.user.id },
      });

      if (result.count === 0) {
        throw new Error('Failed to post journal entry. It may not exist, belong to another tenant, or is not in draft status.');
      }

      // Update actual account balances (Implementation detail)
      // await this.updateAccountBalances(entry, tx);

      // Publish event
      eventBus.afterCommit('accounting.journal.posted', { journalEntryId });
    });
  }
}
