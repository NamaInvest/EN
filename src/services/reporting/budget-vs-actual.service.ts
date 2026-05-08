/**
 * BudgetVsActualService — تقرير الموازنة مقابل الفعلي
 *
 * النماذج: Budget, BudgetLine, JournalLine, Account, CostCenter
 *
 * المخرج: مقارنة تفصيلية لكل حساب وكل مركز تكلفة:
 *   الموازنة | الفعلي | الفارق | نسبة التنفيذ
 *
 * معيار: IAS 34 / SOCPA — إعداد التقارير المالية
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type VarianceType = 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK';

export interface BudgetVsActualLine {
  accountId: number;
  accountCode: string;
  accountName: string;
  costCenterId?: number;
  costCenterName?: string;
  budgetAmount: Decimal;
  actualAmount: Decimal;
  variance: Decimal;
  variancePct: Decimal;
  utilizationPct: Decimal;
  status: VarianceType;
}

export interface BudgetVsActualReport {
  budgetId: number;
  budgetName: string;
  fiscalYear: number;
  from: Date;
  to: Date;
  lines: BudgetVsActualLine[];
  totalBudget: Decimal;
  totalActual: Decimal;
  totalVariance: Decimal;
  overallUtilizationPct: Decimal;
  linesOverBudget: number;
  generatedAt: Date;
}

export class BudgetVsActualService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * توليد تقرير الموازنة مقابل الفعلي لميزانية محددة
   */
  async generate(budgetId: number, from: Date, to: Date): Promise<BudgetVsActualReport> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // 1. جلب الموازنة وبنودها
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, nameAr: true } },
            costCenter: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!budget) throw new Error(`الموازنة ${budgetId} غير موجودة`);

    // 2. جلب الأرقام الفعلية من GL للفترة
    const actualByAccount = await prisma.journalLine.groupBy({
      by: ['accountId', 'costCenterId'],
      where: {
        tenantId,
        journalEntry: {
          status: 'POSTED',
          date: { gte: from, lte: to },
        },
      },
      _sum: { debit: true, credit: true },
    }).catch(() => []);

    // فهرسة للبحث السريع
    const actualMap = new Map<string, Decimal>();
    for (const row of actualByAccount) {
      const key = `${row.accountId ?? 0}_${row.costCenterId ?? 0}`;
      const net = new Decimal(row._sum.debit ?? 0).sub(new Decimal(row._sum.credit ?? 0)).abs();
      actualMap.set(key, net);
    }

    // 3. بناء التقرير
    const lines: BudgetVsActualLine[] = budget.lines.map((bl: any) => {
      const key = `${bl.accountId}_${bl.costCenterId ?? 0}`;
      const budgetAmount = new Decimal(bl.allocatedAmount);
      const actualAmount = actualMap.get(key) ?? new Decimal(0);
      const variance = budgetAmount.sub(actualAmount);
      const variancePct = budgetAmount.isZero()
        ? new Decimal(0)
        : variance.div(budgetAmount).mul(100).toDecimalPlaces(2);
      const utilizationPct = budgetAmount.isZero()
        ? new Decimal(0)
        : actualAmount.div(budgetAmount).mul(100).toDecimalPlaces(2);

      let status: VarianceType;
      if (variance.lt(-budgetAmount.mul(0.05))) status = 'UNFAVORABLE'; // تجاوز 5%
      else if (variance.gt(budgetAmount.mul(0.1))) status = 'FAVORABLE';  // وفر أكثر من 10%
      else status = 'ON_TRACK';

      return {
        accountId: bl.accountId,
        accountCode: bl.account?.code ?? '',
        accountName: bl.account?.nameAr ?? bl.account?.name ?? '',
        costCenterId: bl.costCenterId ?? undefined,
        costCenterName: bl.costCenter?.name ?? undefined,
        budgetAmount,
        actualAmount,
        variance,
        variancePct,
        utilizationPct,
        status,
      };
    });

    const totalBudget  = lines.reduce((s, l) => s.add(l.budgetAmount), new Decimal(0));
    const totalActual  = lines.reduce((s, l) => s.add(l.actualAmount), new Decimal(0));
    const totalVariance = totalBudget.sub(totalActual);
    const overallUtilizationPct = totalBudget.isZero()
      ? new Decimal(0)
      : totalActual.div(totalBudget).mul(100).toDecimalPlaces(2);
    const linesOverBudget = lines.filter((l) => l.status === 'UNFAVORABLE').length;

    return {
      budgetId,
      budgetName: budget.name,
      fiscalYear: budget.fiscalYear,
      from,
      to,
      lines,
      totalBudget,
      totalActual,
      totalVariance,
      overallUtilizationPct,
      linesOverBudget,
      generatedAt: new Date(),
    };
  }

  /**
   * تحديث الأرقام الفعلية في BudgetLine.spentAmount
   */
  async syncActuals(budgetId: number): Promise<void> {
    const report = await this.generate(
      budgetId,
      new Date(new Date().getFullYear(), 0, 1),
      new Date(),
    );
    const prisma = this.prisma as any;
    for (const line of report.lines) {
      await prisma.budgetLine.updateMany({
        where: { budgetId, accountId: line.accountId, costCenterId: line.costCenterId ?? null },
        data: { spentAmount: line.actualAmount, variance: line.variance },
      });
    }
  }
}
