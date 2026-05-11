import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'tna-engine' });

interface PunchData {
  tenantId: string;
  employeeId: number;
  punchType: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT';
  deviceId?: number;
  geoLatitude?: number;
  geoLongitude?: number;
  matchConfidence?: number;
}

export class TNAEngine {
  static async recordPunch(data: PunchData) {
    log.info(`Punch: ${data.punchType} for employee ${data.employeeId}`);
    return prisma.attendancePunch.create({ data: { ...data, punchTime: new Date() } });
  }

  /** Validate punch is within an approved geofence (example: HQ 24.7136,46.6753) */
  static validateGeofence(lat: number, lng: number, fenceLat: number, fenceLng: number, radiusMeters = 200): boolean {
    const R = 6371000;
    const dLat = ((lat - fenceLat) * Math.PI) / 180;
    const dLng = ((lng - fenceLng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((fenceLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= radiusMeters;
  }

  static async getDailySummary(tenantId: string, employeeId: number, date: Date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);
    return prisma.attendancePunch.findMany({ where: { tenantId, employeeId, punchTime: { gte: start, lte: end } }, orderBy: { punchTime: 'asc' } });
  }
}
