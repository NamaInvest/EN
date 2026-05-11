import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'help-desk-engine' });

export class HelpDeskEngine {
  static async assignSLA(ticketId: number, priority: string) {
    const policy = await prisma.slaPolicy.findFirst({ where: { name: { contains: priority } } });
    if (!policy) return null;
    const now = new Date();
    const responseDue = new Date(now.getTime() + policy.responseHours * 3600000);
    const resolutionDue = new Date(now.getTime() + policy.resolutionHours * 3600000);
    log.info(`SLA assigned to ticket ${ticketId}: response by ${responseDue.toISOString()}`);
    return { responseDue, resolutionDue, policyId: policy.id };
  }

  static async checkSLABreaches(tenantId: string) {
    const now = new Date();
    // In production: query SupportTicket.dueAt < now AND status != RESOLVED
    log.info(`Checking SLA breaches for tenant ${tenantId} at ${now.toISOString()}`);
    return { checked: true, asOf: now };
  }

  static async getMetrics(tenantId: string) {
    const policies = await prisma.slaPolicy.findMany({ where: { tenantId } });
    return { policies, count: policies.length };
  }
}
