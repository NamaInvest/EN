import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'aps-engine' });

export class APSEngine {
  static async runSchedule(tenantId: string, horizonDays: number) {
    const run = await prisma.scheduleRun.create({ data: { tenantId, horizonDays, status: 'RUNNING' } });
    log.info(`APS schedule run ${run.id} started for tenant ${tenantId}`);
    await prisma.scheduleRun.update({ where: { id: run.id }, data: { status: 'COMPLETED' } });
    return run;
  }

  /** Use existing ScheduledOperation model with correct field names */
  static async scheduleOperation(manufacturingOrderId: number, operationId: number, workCenterId: number, plannedStart: Date, plannedEnd: Date, tenantId: string, sequence = 1) {
    return prisma.scheduledOperation.create({
      data: { tenantId, manufacturingOrderId, operationId, workCenterId, plannedStart, plannedEnd, sequence, status: 'SCHEDULED' },
    });
  }

  static async getSchedule(tenantId: string, manufacturingOrderId: number) {
    return prisma.scheduledOperation.findMany({
      where: { tenantId, manufacturingOrderId },
      orderBy: { plannedStart: 'asc' },
    });
  }

  static async detectConflicts(tenantId: string, workCenterId: number) {
    const ops = await prisma.scheduledOperation.findMany({
      where: { tenantId, workCenterId, status: { in: ['SCHEDULED', 'PLANNED'] } },
      orderBy: { plannedStart: 'asc' },
    });
    const conflicts = [];
    for (let i = 0; i < ops.length - 1; i++) {
      if (ops[i].plannedEnd > ops[i + 1].plannedStart) {
        conflicts.push({ a: ops[i].id, b: ops[i + 1].id });
      }
    }
    return conflicts;
  }
}
