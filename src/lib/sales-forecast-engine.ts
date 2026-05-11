import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales-forecast-engine' });

export class SalesForecastEngine {
  static async submitForecast(tenantId: string, userId: number, period: string, commitAmount: number, bestCaseAmount: number) {
    log.info(`Forecast submitted: user ${userId}, period ${period}, commit ${commitAmount}`);
    return prisma.forecastCommit.create({ data: { tenantId, userId, period, commitAmount, bestCaseAmount } });
  }

  static async updateActual(tenantId: string, userId: number, period: string, actualAmount: number) {
    return prisma.forecastCommit.updateMany({ where: { tenantId, userId, period }, data: { actualAmount } });
  }

  static async rollup(tenantId: string, period: string) {
    const commits = await prisma.forecastCommit.findMany({ where: { tenantId, period } });
    return {
      totalCommit:   commits.reduce((s, c) => s + Number(c.commitAmount), 0),
      totalBestCase: commits.reduce((s, c) => s + Number(c.bestCaseAmount), 0),
      totalActual:   commits.reduce((s, c) => s + Number(c.actualAmount ?? 0), 0),
      reps: commits.length,
    };
  }
}
