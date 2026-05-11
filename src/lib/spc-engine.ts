import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'spc-engine' });

/** Western Electric Rule 1: point beyond 3σ */
function detectOutOfControl(mean: number, ucl: number, lcl: number): boolean {
  return mean > ucl || mean < lcl;
}

export class SPCEngine {
  static async addMeasurement(chartId: number, subgroupNumber: number, measurements: number[]) {
    const chart = await prisma.spcChart.findUniqueOrThrow({ where: { id: chartId } });
    const mean = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const range = Math.max(...measurements) - Math.min(...measurements);
    const outOfControl = detectOutOfControl(mean, Number(chart.ucl), Number(chart.lcl));
    if (outOfControl) log.warn(`SPC: chart ${chartId} subgroup ${subgroupNumber} OUT OF CONTROL`);
    return prisma.spcMeasurement.create({ data: { chartId, subgroupNumber, measurements, mean, range, outOfControl } });
  }

  static async getViolations(chartId: number) {
    return prisma.spcMeasurement.findMany({ where: { chartId, outOfControl: true }, orderBy: { occurredAt: 'desc' } });
  }
}
