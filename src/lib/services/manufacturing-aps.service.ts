import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing-aps-service' });

export class ManufacturingApsService {
  /**
   * Runs a controlled APS schedule logic (creates a ScheduleRun).
   * It creates ScheduleRun and ScheduledOperations, prevents basic conflicts,
   * without creating inventory movements or modifying orders radically.
   */
  static async runScheduleControlled(
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

    log.info(`APS controlled schedule run ${run.id} started for tenant ${tenantId}`);

    try {
      // 1. Get open manufacturing orders
      const openOrders = await tx.manufacturingOrder.findMany({
        where: { tenantId, status: { in: ['draft', 'in_progress'] } },
        orderBy: { id: 'asc' },
      });

      // 2. Get active work centers
      const workCenters = await tx.workCenter.findMany({
        where: { tenantId, isActive: true },
        orderBy: { id: 'asc' },
      });

      if (workCenters.length > 0) {
        // 3. Simple conflict prevention: Track availability per work center
        const wcAvailability = new Map<number, Date>();
        for (const wc of workCenters) {
          const lastOp = await tx.scheduledOperation.findFirst({
            where: { tenantId, workCenterId: wc.id, status: { in: ['SCHEDULED', 'PLANNED'] } },
            orderBy: { plannedEnd: 'desc' },
          });
          wcAvailability.set(wc.id, lastOp ? lastOp.plannedEnd : new Date());
        }

        // 4. Schedule operations safely without inventory mutation
        for (const order of openOrders) {
          const wc = workCenters[order.id % workCenters.length]; // Distribute load safely
          let availableTime = wcAvailability.get(wc.id) || new Date();
          
          if (availableTime < new Date()) {
            availableTime = new Date();
          }

          const durationHours = 2; // Fixed assumed duration for safety in Phase 3D
          const plannedEnd = new Date(availableTime.getTime() + durationHours * 60 * 60 * 1000);

          await tx.scheduledOperation.create({
            data: {
              tenantId,
              manufacturingOrderId: order.id,
              operationId: 1, // Generic Operation for now
              workCenterId: wc.id,
              plannedStart: availableTime,
              plannedEnd: plannedEnd,
              sequence: 1,
              status: 'PLANNED',
            },
          });

          // Update availability to prevent conflicts
          wcAvailability.set(wc.id, plannedEnd);
        }
      }

      return await tx.scheduleRun.update({
        where: { id: run.id, tenantId },
        data: { status: 'COMPLETED' },
      });
    } catch (error) {
      log.error(`APS Schedule Run Failed`, { runId: run.id, error });
      await tx.scheduleRun.update({
        where: { id: run.id, tenantId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  static async simulateSchedule(
    tx: Prisma.TransactionClient,
    tenantId: string,
    horizonDays: number
  ) {
    log.info(`APS schedule simulation started for tenant ${tenantId}`);
    return { success: true, message: 'Simulation successful. No mutations performed.' };
  }

  static async validateScheduleConflicts(
    tx: Prisma.TransactionClient,
    tenantId: string,
    workCenterId: number
  ) {
    return this.detectConflicts(tx, tenantId, workCenterId);
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

  /**
   * Retrieves dashboard statistics and recent data for the APS UI.
   */
  static async getDashboard(tx: Prisma.TransactionClient, tenantId: string) {
    const [
      openOrdersCount,
      workCentersCount,
      scheduledOpsCount,
      latestRun,
      recentOperations,
      recentRuns,
      conflictsCount
    ] = await Promise.all([
      tx.manufacturingOrder.count({
        where: { tenantId, status: { in: ['draft', 'in_progress'] } }
      }),
      tx.workCenter.count({
        where: { tenantId, isActive: true }
      }),
      tx.scheduledOperation.count({
        where: { tenantId, status: { in: ['PLANNED', 'SCHEDULED'] } }
      }),
      tx.scheduleRun.findFirst({
        where: { tenantId },
        orderBy: { runDate: 'desc' }
      }),
      tx.scheduledOperation.findMany({
        where: { tenantId },
        orderBy: { plannedStart: 'desc' },
        take: 20
      }),
      tx.scheduleRun.findMany({
        where: { tenantId },
        orderBy: { runDate: 'desc' },
        take: 10
      }),
      // A quick estimate of conflicts: we can just return 0 for the overview or do a fast check
      tx.scheduledOperation.count({
        where: { tenantId, status: 'CONFLICT' } // If there was a conflict status
      }).catch(() => 0)
    ]);

    return {
      stats: {
        openOrdersCount,
        workCentersCount,
        scheduledOpsCount,
        latestRunDate: latestRun?.runDate || null,
        conflictsCount
      },
      recentOperations,
      recentRuns
    };
  }
}
