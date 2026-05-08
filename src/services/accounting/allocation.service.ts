/**
 * AllocationService — توزيع المصاريف على مراكز التكلفة
 *
 * يدعم وضعين:
 *   dryRun: معاينة التوزيع بدون ترحيل
 *   execute: ترحيل قيود التوزيع في transaction واحدة
 *
 * النماذج المستخدمة: AllocationRun, JournalEntry, JournalLine, CostCenter
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface AllocationDestination {
  account: string;
  costCenter: string;
  percentage: Decimal;
}

export interface AllocationRule {
  id: string;
  sourceAccount: string;
  destinations: AllocationDestination[];
}

export interface AllocationPreviewLine {
  costCenter: string;
  account: string;
  percentage: Decimal;
  amount: Decimal;
}

export interface AllocationDryRun {
  lines: AllocationPreviewLine[];
  totalAllocated: Decimal;
  totalPercentage: Decimal;
  difference: Decimal; // يجب أن يكون 0 للتوزيع الصحيح
  isBalanced: boolean;
}

export type AllocationMethod = 'FIXED_PERCENT' | 'EQUAL' | 'DRIVER_BASED';

export interface AllocationExecuteResult {
  success: boolean;
  journalEntryId?: number;
  allocationRunId?: number;
  lines: AllocationPreviewLine[];
  memo: string;
}

export class AllocationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * معاينة التوزيع — يحسب المبالغ بدون كتابة أي بيانات
   */
  async dryRun(
    rule: AllocationRule,
    totalAmount: Decimal,
    periodId?: string,
  ): Promise<AllocationDryRun> {
    this._validateRule(rule);

    const lines: AllocationPreviewLine[] = rule.destinations.map((dest) => ({
      costCenter: dest.costCenter,
      account: dest.account,
      percentage: dest.percentage,
      amount: totalAmount.mul(dest.percentage).div(100).toDecimalPlaces(2),
    }));

    const totalAllocated = lines.reduce(
      (sum, l) => sum.add(l.amount),
      new Decimal(0),
    );
    const totalPercentage = rule.destinations.reduce(
      (sum, d) => sum.add(d.percentage),
      new Decimal(0),
    );
    const difference = totalAmount.sub(totalAllocated);

    return {
      lines,
      totalAllocated,
      totalPercentage,
      difference,
      isBalanced: difference.abs().lte(new Decimal('0.01')), // سماح بفلس واحد للتقريب
    };
  }

  /**
   * تنفيذ التوزيع — يُنشئ JournalEntry + AllocationRun في transaction واحدة
   */
  async execute(
    rule: AllocationRule,
    periodId: string,
    memo?: string,
  ): Promise<AllocationExecuteResult> {
    this._validateRule(rule);

    // 1. جلب مجموع رصيد الحساب المصدر في الفترة
    const sourceBalance = await this._getSourceBalance(
      rule.sourceAccount,
      periodId,
    );

    if (sourceBalance.isZero()) {
      return {
        success: true,
        lines: [],
        memo: 'لا يوجد رصيد للتوزيع في هذه الفترة',
      };
    }

    const preview = await this.dryRun(rule, sourceBalance, periodId);

    if (!preview.isBalanced) {
      throw new Error(
        `التوزيع غير متوازن. الفرق: ${preview.difference.toFixed(2)} ريال`,
      );
    }

    // 2. إنشاء قيد التوزيع وسجل الـ AllocationRun في transaction واحدة
    const result = await this.prisma.$transaction(async (tx) => {
      // قيد محاسبي للتوزيع
      const je = await (tx as any).journalEntry.create({
        data: {
          tenantId: this.ctx.tenant.id,
          reference: `ALLOC-${rule.id}-${periodId}`,
          description: memo ?? `توزيع على مراكز التكلفة — القاعدة ${rule.id}`,
          date: new Date(),
          status: 'POSTED',
          lines: {
            create: [
              // سطر دائن للحساب المصدر (إغلاق الرصيد)
              {
                accountId: rule.sourceAccount,
                credit: sourceBalance,
                debit: new Decimal(0),
                tenantId: this.ctx.tenant.id,
              },
              // سطور مدينة لكل مركز تكلفة
              ...preview.lines.map((line) => ({
                accountId: line.account,
                costCenterId: line.costCenter,
                debit: line.amount,
                credit: new Decimal(0),
                tenantId: this.ctx.tenant.id,
              })),
            ],
          },
        },
      });

      // سجل AllocationRun للتدقيق
      const run = await (tx as any).allocationRun.create({
        data: {
          tenantId: this.ctx.tenant.id,
          ruleId: parseInt(rule.id, 10),
          fiscalPeriodId: parseInt(periodId, 10),
          sourceAmount: sourceBalance,
          journalEntryId: je.id,
          status: 'COMPLETED',
        },
      });

      return { je, run };
    });

    return {
      success: true,
      journalEntryId: result.je.id,
      allocationRunId: result.run.id,
      lines: preview.lines,
      memo: memo ?? `توزيع على ${preview.lines.length} مراكز تكلفة`,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private _validateRule(rule: AllocationRule): void {
    if (!rule.destinations || rule.destinations.length === 0) {
      throw new Error('يجب تحديد وجهة واحدة على الأقل للتوزيع');
    }
    const total = rule.destinations.reduce(
      (sum, d) => sum.add(d.percentage),
      new Decimal(0),
    );
    if (total.gt(new Decimal('100.01'))) {
      throw new Error(`مجموع النسب (${total.toFixed(2)}%) يتجاوز 100%`);
    }
  }

  private async _getSourceBalance(
    accountCode: string,
    periodId: string,
  ): Promise<Decimal> {
    const lines = await (this.prisma as any).journalLine.aggregate({
      where: {
        tenantId: this.ctx.tenant.id,
        account: { code: accountCode },
        journalEntry: {
          fiscalPeriodId: parseInt(periodId, 10),
          status: 'POSTED',
        },
      },
      _sum: { debit: true, credit: true },
    });

    const debit = new Decimal(lines._sum.debit ?? 0);
    const credit = new Decimal(lines._sum.credit ?? 0);
    return debit.sub(credit);
  }
}
