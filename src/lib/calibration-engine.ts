import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'calibration-engine' });

export class CalibrationEngine {
  static async getDueEquipment(tenantId: string, daysAhead = 30) {
    const cutoff = new Date(Date.now() + daysAhead * 86400000);
    return prisma.calibratableEquipment.findMany({
      where: { tenantId, nextCalibrationDue: { lte: cutoff } },
    });
  }

  static async recordCalibration(equipmentId: number, performedBy: number, result: 'PASS' | 'FAIL' | 'ADJUSTED', certificateUrl?: string) {
    const equip = await prisma.calibratableEquipment.findUniqueOrThrow({ where: { id: equipmentId } });
    const nextDueDate = new Date(Date.now() + equip.calibrationFrequencyDays * 86400000);
    log.info(`Calibration recorded for equipment ${equipmentId}: ${result}, next due: ${nextDueDate.toISOString().slice(0, 10)}`);
    await prisma.calibratableEquipment.update({ where: { id: equipmentId }, data: { lastCalibrated: new Date(), nextCalibrationDue: nextDueDate } });
    return prisma.calibrationRecord.create({ data: { equipmentId, calibrationDate: new Date(), performedBy, result, certificateUrl, nextDueDate } });
  }

  static async getOverdue(tenantId: string) {
    return prisma.calibratableEquipment.findMany({ where: { tenantId, nextCalibrationDue: { lt: new Date() } } });
  }
}
