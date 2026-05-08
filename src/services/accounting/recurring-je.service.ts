/**
 * Recurring Journal Entry Service (Accounting 20.6)
 * Automates monthly accruals and their automatic reversal in the next period.
 * Examples: monthly depreciation, rent accruals, interest accruals.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BaseService } from '../shared/base.service';
import { BusinessContext, eventBus } from '../shared/event-bus.service';

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

export interface RecurringJETemplate {
  id:          string;
  name:        string;
  frequency:   RecurringFrequency;
  nextRunDate: Date;
  autoReverse: boolean;       // Create a reversal in the next period?
  lines: {
    accountId:    string;
    debit:        number;
    credit:       number;
    costCenterId?: string;
    memo?:        string;
  }[];
}

export class RecurringJournalService extends BaseService {
  constructor(prisma: PrismaClient, ctx: BusinessContext) {
    super(prisma, ctx);
  }

  /**
   * Process all recurring JEs due today.
   * Called by the daily BullMQ worker.
   */
  async processDueEntries(today: Date = new Date()): Promise<{
    processed: number;
    errors: { templateId: string; error: string }[];
  }> {
    const dueTemplates = await (this.db as any).recurringJETemplate.findMany({
      where: {
        tenantId: this.tenantId,
        isActive:     true,
        nextRunDate:  { lte: today },
      },
    }).catch(() => []) as any[];

    let processed = 0;
    const errors: { templateId: string; error: string }[] = [];

    for (const template of dueTemplates) {
      try {
        await this.executeTemplate(template, today);
        processed++;
      } catch (e: any) {
        errors.push({ templateId: template.id, error: e.message });
      }
    }

    return { processed, errors };
  }

  /**
   * Execute a single recurring JE template.
   */
  async executeTemplate(template: any, runDate: Date): Promise<void> {
    const lines = (template.lines as any[]) ?? [];

    const totalDebit  = lines.reduce((s: number, l: any) => s + Number(l.debit  ?? 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + Number(l.credit ?? 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`القيد غير متوازن: المدين ${totalDebit} ≠ الدائن ${totalCredit}`);
    }

    await this.db.$transaction(async (tx: any) => {
      // 1. Create the journal entry
      const je = await tx.journalEntry.create({
        data: {
          tenantId:    this.tenantId,
          bookId:      'DEFAULT',
          branchId:    this.ctx.branch?.id ?? 'default-branch',
          entryDate:   runDate,
          memo:        `${template.name} — تلقائي`,
          reference:   `REC-${template.id}`,
          status:      'posted',
          postedAt:    runDate,
          postedBy:    this.ctx.user.id,
          totalDebit:  new Decimal(totalDebit),
          totalCredit: new Decimal(totalCredit),
          createdBy:   this.ctx.user.id,
          lines: {
            create: lines.map((l: any) => ({
              accountId:    l.accountId,
              debit:        new Decimal(l.debit  ?? 0),
              credit:       new Decimal(l.credit ?? 0),
              costCenterId: l.costCenterId,
              memo:         l.memo,
            })),
          },
        },
      });

      // 2. If auto-reverse, create a reversal JE for the first day of next month
      if (template.autoReverse) {
        const reversalDate = new Date(runDate);
        reversalDate.setMonth(reversalDate.getMonth() + 1);
        reversalDate.setDate(1);

        await tx.journalEntry.create({
          data: {
            tenantId:    this.tenantId,
            bookId:      'DEFAULT',
            branchId:    this.ctx.branch?.id ?? 'default-branch',
            entryDate:   reversalDate,
            memo:        `عكس ${template.name}`,
            reference:   `REV-${je.id}`,
            status:      'draft', // Will be auto-posted when period opens
            totalDebit:  new Decimal(totalCredit), // Reversed
            totalCredit: new Decimal(totalDebit),
            createdBy:   this.ctx.user.id,
            lines: {
              create: lines.map((l: any) => ({
                accountId:    l.accountId,
                debit:        new Decimal(l.credit ?? 0), // Swapped
                credit:       new Decimal(l.debit  ?? 0),
                costCenterId: l.costCenterId,
                memo:         `عكس: ${l.memo ?? ''}`,
              })),
            },
          },
        });
      }

      // 3. Update nextRunDate
      const next = this.computeNextRun(runDate, template.frequency as RecurringFrequency);
      await tx.recurringJETemplate.update({
        where: { id: template.id },
        data:  { nextRunDate: next, lastRunDate: runDate },
      });
    });

    eventBus.afterCommit('accounting.recurring.executed', {
      templateId: template.id,
      tenantId:   this.tenantId,
      runDate:    runDate.toISOString(),
    });
  }

  private computeNextRun(from: Date, frequency: RecurringFrequency): Date {
    const d = new Date(from);
    switch (frequency) {
      case 'DAILY':     d.setDate(d.getDate() + 1);        break;
      case 'WEEKLY':    d.setDate(d.getDate() + 7);        break;
      case 'MONTHLY':   d.setMonth(d.getMonth() + 1);      break;
      case 'QUARTERLY': d.setMonth(d.getMonth() + 3);      break;
      case 'ANNUALLY':  d.setFullYear(d.getFullYear() + 1); break;
    }
    return d;
  }
}
