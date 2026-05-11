import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'shift-schedule-engine' });

export class ShiftScheduleEngine {
  static async publishSchedule(tenantId: string, scheduleId: number): Promise<any> {
    log.info(`Publishing shift schedule ${scheduleId}`);
    return prisma.shiftSchedule.update({
      where: { id: scheduleId },
      data: { status: 'PUBLISHED' }
    });
  }
}
