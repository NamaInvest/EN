import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ehs-engine' });

export class EHSEngine {
  static async reportIncident(tenantId: string, data: {
    reportedBy: number;
    occurredAt: Date;
    location: string;
    severity: 'NEAR_MISS' | 'FIRST_AID' | 'RECORDABLE' | 'LOST_TIME' | 'FATALITY';
    description: string;
  }) {
    const incidentNumber = `INC-${Date.now()}`;
    log.warn(`Safety incident reported: ${data.severity} at ${data.location}`);
    return prisma.safetyIncident.create({ data: { tenantId, incidentNumber, ...data, status: 'REPORTED' } });
  }

  /** TRIR = (Recordable incidents × 200,000) / Hours worked */
  static calculateTRIR(recordableIncidents: number, hoursWorked: number): number {
    return (recordableIncidents * 200000) / hoursWorked;
  }

  static async getKPIs(tenantId: string, from: Date, to: Date) {
    const incidents = await prisma.safetyIncident.findMany({ where: { tenantId, occurredAt: { gte: from, lte: to } } });
    const recordable = incidents.filter(i => ['RECORDABLE','LOST_TIME','FATALITY'].includes(i.severity)).length;
    const lostTime   = incidents.filter(i => ['LOST_TIME','FATALITY'].includes(i.severity)).length;
    const nearMisses = incidents.filter(i => i.severity === 'NEAR_MISS').length;
    return { totalIncidents: incidents.length, recordable, lostTime, nearMisses };
  }
}
