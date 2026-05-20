import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing-aps-service' });

export class ManufacturingApsService {
  /**
   * Runs an APS schedule logic (creates a ScheduleRun).
   * Note: This is an architectural placeholder for the actual complex scheduling engine.
   * It runs safely within a transaction and tracks the run status.
   */
  static async runSchedule(
    tx: Prisma.TransactionClient,
    tenantId: string,
    horizonDays: number
  ) {
    const run = await tx.scheduleRun.create({
      data: {
        tenantId,
        horizonDays,
        status: 'RUNNING',
      },
    });

    log.info(`APS schedule run ${run.id} started for tenant ${tenantId}`);

    // In a real implementation, the scheduling logic would go here.
    // Since we are running within a transaction, we just update status to completed.
    const completedRun = await tx.scheduleRun.update({
      where: { id: run.id, tenantId },
      data: { status: 'COMPLETED' },
    });

    return completedRun;
  }

  /**
   * Schedules a single manufacturing operation within a given time frame at a work center.
   */
  static async scheduleOperation(
    tx: Prisma.TransactionClient,
    tenantId: string,
    manufacturingOrderId: number,
    operationId: number,
    workCenterId: number,
    plannedStart: Date,
    plannedEnd: Date,
    sequence: number = 1
  ) {
    // Validate manufacturing order belongs to tenant
    const order = await tx.manufacturingOrder.findFirst({
      where: { id: manufacturingOrderId, tenantId },
    });
    if (!order) {
      throw new Error(`Manufacturing order ${manufacturingOrderId} not found or access denied.`);
    }

    // Validate work center belongs to tenant
    const wc = await tx.workCenter.findFirst({
      where: { id: workCenterId, tenantId },
    });
    if (!wc) {
      throw new Error(`Work center ${workCenterId} not found or access denied.`);
    }

    return tx.scheduledOperation.create({
      data: {
        tenantId,
        manufacturingOrderId,
        operationId,
        workCenterId,
        plannedStart,
        plannedEnd,
        sequence,
        status: 'SCHEDULED',
      },
    });
  }

  /**
   * Retrieves the schedule for a specific manufacturing order.
   */
  static async getSchedule(
    tx: Prisma.TransactionClient,
    tenantId: string,
    manufacturingOrderId: number
  ) {
    return tx.scheduledOperation.findMany({
      where: { tenantId, manufacturingOrderId },
      orderBy: { plannedStart: 'asc' },
    });
  }

  /**
   * Detects scheduling conflicts at a specific work center.
   */
  static async detectConflicts(
    tx: Prisma.TransactionClient,
    tenantId: string,
    workCenterId: number
  ) {
    const ops = await tx.scheduledOperation.findMany({
      where: {
        tenantId,
        workCenterId,
        status: { in: ['SCHEDULED', 'PLANNED'] },
      },
      orderBy: { plannedStart: 'asc' },
    });

    const conflicts = [];
    for (let i = 0; i < ops.length - 1; i++) {
      if (ops[i].plannedEnd > ops[i + 1].plannedStart) {
        conflicts.push({
          operationA: ops[i].id,
          operationB: ops[i + 1].id,
          workCenterId,
        });
      }
    }
    return conflicts;
  }
}
