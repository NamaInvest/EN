/**
 * CashFlowForecastService — توقع التدفقات النقدية (13 أسبوعاً)
 * النماذج: LiquidityForecast, OpenItem, PayrollRun
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type FlowCategory = 'AR_INFLOW' | 'AP_OUTFLOW' | 'PAYROLL' | 'TAX' | 'CAPEX' | 'LOAN';

export interface WeeklyForecast {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  categories: Record<FlowCategory, Decimal>;
  netFlow: Decimal;
  cumulativeCash: Decimal;
}

export interface CashFlowForecastReport {
  scenarioId: string;
  generatedAt: Date;
  openingBalance: Decimal;
  weeks: WeeklyForecast[];
  totalInflows: Decimal;
  totalOutflows: Decimal;
  closingBalance: Decimal;
  minimumCash: { week: number; amount: Decimal };
}

export class CashFlowForecastService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  async forecast(
    startDate: Date = new Date(),
    scenarioId = 'BASE',
    openingBalance: Decimal = new Decimal(0),
  ): Promise<CashFlowForecastReport> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const [arItems, apItems, lastPayroll] = await Promise.all([
      prisma.openItem.findMany({ where: { tenantId, partyType: 'customer', dueDate: { gte: startDate } } }).catch(() => []),
      prisma.openItem.findMany({ where: { tenantId, partyType: 'vendor',   dueDate: { gte: startDate } } }).catch(() => []),
      prisma.payrollRun.findFirst({ where: { tenantId, status: 'POSTED' }, orderBy: { createdAt: 'desc' } }).catch(() => null),
    ]);

    const monthlyPayroll = new Decimal(lastPayroll?.totalNet ?? 0);
    const weeks: WeeklyForecast[] = [];
    let cumulativeCash = openingBalance;
    let minCash = { week: 1, amount: openingBalance };

    for (let w = 1; w <= 13; w++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (w - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const cats: Record<FlowCategory, Decimal> = {
        AR_INFLOW: new Decimal(0), AP_OUTFLOW: new Decimal(0),
        PAYROLL: new Decimal(0),  TAX: new Decimal(0),
        CAPEX: new Decimal(0),    LOAN: new Decimal(0),
      };

      for (const item of arItems) {
        const due = new Date(item.dueDate);
        if (due >= weekStart && due <= weekEnd) cats.AR_INFLOW = cats.AR_INFLOW.add(new Decimal(item.openAmount));
      }
      for (const item of apItems) {
        const due = new Date(item.dueDate);
        if (due >= weekStart && due <= weekEnd) cats.AP_OUTFLOW = cats.AP_OUTFLOW.add(new Decimal(item.openAmount));
      }
      // الرواتب: تُدفع في أول الشهر
      if (weekStart.getDate() <= 5) cats.PAYROLL = monthlyPayroll;

      const netFlow = cats.AR_INFLOW.sub(cats.AP_OUTFLOW).sub(cats.PAYROLL).sub(cats.TAX).sub(cats.CAPEX).sub(cats.LOAN);
      cumulativeCash = cumulativeCash.add(netFlow);
      if (cumulativeCash.lt(minCash.amount)) minCash = { week: w, amount: cumulativeCash };

      weeks.push({ weekNumber: w, weekStart, weekEnd, categories: cats, netFlow, cumulativeCash });
    }

    // حفظ في DB
    await prisma.liquidityForecast.deleteMany({ where: { tenantId, scenarioId } }).catch(() => null);
    const records = weeks.flatMap((wk) =>
      (Object.entries(wk.categories) as [FlowCategory, Decimal][]).map(([cat, amount]) => ({
        tenantId, scenarioId, forecastDate: wk.weekStart, weekNumber: wk.weekNumber, category: cat, expectedAmount: amount,
      })),
    );
    if (records.length) await prisma.liquidityForecast.createMany({ data: records }).catch(() => null);

    const totalInflows  = weeks.reduce((s, wk) => s.add(wk.categories.AR_INFLOW), new Decimal(0));
    const totalOutflows = weeks.reduce((s, wk) => s.add(wk.categories.AP_OUTFLOW).add(wk.categories.PAYROLL), new Decimal(0));

    return { scenarioId, generatedAt: new Date(), openingBalance, weeks, totalInflows, totalOutflows, closingBalance: cumulativeCash, minimumCash: minCash };
  }
}
