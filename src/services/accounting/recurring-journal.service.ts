/**
 * RecurringJournalService — القيود المحاسبية الدورية والعكسية
 *
 * النماذج: JournalTemplate, JournalTemplateLine, JournalEntry, JournalLine
 *
 * الحالات:
 *  - MONTHLY: إيجار، استهلاك، تأمين، رواتب ثابتة
 *  - QUARTERLY / YEARLY: مصاريف سنوية مستحقة
 *  - AUTO_REVERSE: قيود مستحقات في نهاية الشهر تُعكس أول الشهر التالي
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface RecurringRunResult {
  templateId: number;
  templateName: string;
  journalEntryId: number;
  reversalEntryId?: number;
  postedDate: Date;
  totalAmount: Decimal;
}

export class RecurringJournalService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * تشغيل جميع القيود الدورية المستحقة حتى اليوم
   */
  async runDue(asOfDate: Date = new Date()): Promise<RecurringRunResult[]> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const templates = await prisma.journalTemplate.findMany({
      where: {
        tenantId,
        isRecurring: true,
        nextRunDate: { lte: asOfDate },
        OR: [{ endDate: null }, { endDate: { gte: asOfDate } }],
      },
      include: { lines: true },
    });

    const results: RecurringRunResult[] = [];
    for (const tmpl of templates) {
      const result = await this._postTemplate(tmpl, asOfDate);
      results.push(result);
    }
    return results;
  }

  /**
   * ترحيل قيد من قالب محدد
   */
  private async _postTemplate(template: any, date: Date): Promise<RecurringRunResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const totalDebit = template.lines.reduce(
      (s: Decimal, l: any) => s.add(new Decimal(l.debit ?? 0)),
      new Decimal(0),
    );

    const result = await prisma.$transaction(async (tx: any) => {
      // القيد الأصلي
      const je = await tx.journalEntry.create({
        data: {
          tenantId,
          reference: `REC-${template.id}-${date.toISOString().slice(0, 7)}`,
          description: template.description ?? template.name,
          date,
          status: 'POSTED',
          sourceType: 'RECURRING_TEMPLATE',
          sourceId: template.id,
          lines: {
            create: template.lines.map((l: any) => ({
              tenantId,
              accountId: l.accountId,
              costCenterId: l.costCenterId,
              debit: new Decimal(l.debit ?? 0),
              credit: new Decimal(l.credit ?? 0),
              description: l.description,
            })),
          },
        },
      });

      let reversalEntry: any = null;

      // القيد العكسي (أول يوم الشهر التالي)
      if (template.autoReverse) {
        const reversalDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        reversalEntry = await tx.journalEntry.create({
          data: {
            tenantId,
            reference: `REV-${template.id}-${date.toISOString().slice(0, 7)}`,
            description: `عكس: ${template.name}`,
            date: reversalDate,
            status: 'POSTED',
            sourceType: 'AUTO_REVERSAL',
            sourceId: je.id,
            lines: {
              create: template.lines.map((l: any) => ({
                tenantId,
                accountId: l.accountId,
                costCenterId: l.costCenterId,
                // عكس الأرقام
                debit: new Decimal(l.credit ?? 0),
                credit: new Decimal(l.debit ?? 0),
                description: `عكس: ${l.description ?? ''}`,
              })),
            },
          },
        });
      }

      // تحديث تاريخ التشغيل التالي
      const nextRun = this._calcNextRun(template.frequency, date);
      await tx.journalTemplate.update({
        where: { id: template.id },
        data: { nextRunDate: nextRun },
      });

      return { je, reversalEntry };
    });

    return {
      templateId: template.id,
      templateName: template.name,
      journalEntryId: result.je.id,
      reversalEntryId: result.reversalEntry?.id,
      postedDate: date,
      totalAmount: totalDebit,
    };
  }

  /**
   * حساب تاريخ التشغيل التالي
   */
  private _calcNextRun(frequency: string, from: Date): Date {
    const d = new Date(from);
    switch (frequency) {
      case 'DAILY':     d.setDate(d.getDate() + 1); break;
      case 'WEEKLY':    d.setDate(d.getDate() + 7); break;
      case 'MONTHLY':   d.setMonth(d.getMonth() + 1); break;
      case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break;
      case 'YEARLY':    d.setFullYear(d.getFullYear() + 1); break;
    }
    return d;
  }
}
