/**
 * CashFlowIndirectService — قائمة التدفقات النقدية (الطريقة غير المباشرة)
 * يُستخدم مع FinancialStatementsEngine لتجميع IAS 7 بتفصيل أكثر
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export class CashFlowIndirectService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  async generateCashFlow(from: Date, to: Date) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const gl = async (from_code: string, to_code: string) => {
      const rows = await prisma.journalLine?.groupBy?.({
        by: ['accountCode'],
        where: { tenantId, accountCode: { gte: from_code, lte: to_code }, journalEntry: { status: 'POSTED', date: { gte: from, lte: to } } },
        _sum: { debit: true, credit: true },
      }).catch(() => []) ?? [];
      return rows.reduce((s: number, r: any) => s + Number(r._sum.credit ?? 0) - Number(r._sum.debit ?? 0), 0);
    };

    const netProfit      = await gl('4000', '5999');  // إيرادات - مصروفات
    const depreciation   = -1 * await gl('5220', '5229');
    const arChange       = await gl('1200', '1299');
    const invChange      = await gl('1300', '1329');
    const apChange       = -1 * await gl('2100', '2199');
    const operating      = new Decimal(netProfit + depreciation - arChange - invChange + apChange).toDecimalPlaces(2);

    const capex          = await gl('1400', '1499');
    const investing      = new Decimal(-capex).toDecimalPlaces(2);

    const debtNet        = -1 * await gl('2500', '2699');
    const financing      = new Decimal(debtNet).toDecimalPlaces(2);

    const netChange      = operating.add(investing).add(financing);
    const openingCash    = new Decimal(await gl('1110', '1119')).sub(netChange);
    const closingCash    = openingCash.add(netChange);

    return {
      period: { from, to },
      operating: {
        netProfit: new Decimal(netProfit).toDecimalPlaces(2),
        depreciation: new Decimal(depreciation).toDecimalPlaces(2),
        arChange: new Decimal(-arChange).toDecimalPlaces(2),
        invChange: new Decimal(-invChange).toDecimalPlaces(2),
        apChange: new Decimal(apChange).toDecimalPlaces(2),
        total: operating,
      },
      investing: { capex: new Decimal(-capex).toDecimalPlaces(2), total: investing },
      financing: { debtNet: new Decimal(debtNet).toDecimalPlaces(2), total: financing },
      summary: { netChange, openingCash: openingCash.toDecimalPlaces(2), closingCash: closingCash.toDecimalPlaces(2) },
    };
  }
}
