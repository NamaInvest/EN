import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'dunning-engine' });

export class DunningEngine {

  /**
   * Run daily Dunning Cron to identify overdue invoices and send reminders
   */
  static async executeDailyRun(asOfDate: Date) {
    const overdueInvoices = await prisma.salesInvoice.findMany({
      take: 100,
      where: {
        status: 'posted',
        remaining: { gt: 0 },
        date: { lt: asOfDate },
      },
      include: { customer: true },
    });

    const customerGroups: Record<number, any[]> = {};
    for (const inv of overdueInvoices) {
      if (!inv.customerId) continue;
      customerGroups[inv.customerId] = customerGroups[inv.customerId] || [];
      customerGroups[inv.customerId].push(inv);
    }

    const levels = await prisma.dunningLevel.findMany({
      take: 100,
      where: { active: true },
      orderBy: { daysOverdue: 'desc' },
    });

    for (const [customerIdStr, invoices] of Object.entries(customerGroups)) {
      const customerId = parseInt(customerIdStr, 10);
      const customer = invoices[0].customer;

      if (customer.dunningPaused || (customer.dunningSnoozeUntil && new Date(customer.dunningSnoozeUntil) > asOfDate)) {
        continue;
      }

      const activePromise = await prisma.promiseToPay.findFirst({
        where: { customerId, status: 'ACTIVE' },
      });

      if (activePromise && activePromise.promisedDate >= asOfDate) {
        continue;
      }

      let maxDaysOverdue = 0;
      let totalAmountDue = 0;
      let oldestDueDate = asOfDate;

      for (const inv of invoices) {
        const dueDate = new Date(inv.date);
        const diffDays = Math.ceil((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
        if (dueDate < oldestDueDate) oldestDueDate = dueDate;
        const remainingAmount = typeof inv.remaining === 'number' ? inv.remaining : Number(inv.remaining.toString());
        totalAmountDue += remainingAmount;
      }

      const targetLevel = levels.find(l => maxDaysOverdue >= l.daysOverdue);
      if (!targetLevel) continue;

      const currentLevel = customer.dunningCurrentLevel || 0;
      if (targetLevel.levelNumber <= currentLevel) continue;

      let campaign = await prisma.dunningCampaign.findFirst({
        where: { customerId, status: 'ACTIVE' },
      });

      if (!campaign) {
        campaign = await prisma.dunningCampaign.create({
          data: {
            campaignNumber: `DUN-${customerId}-${Date.now()}`,
            customerId,
            totalAmountAtStart: totalAmountDue,
            triggeredBy: 'CRON',
          },
        });
      }

      const letter = await prisma.dunningLetter.create({
        data: {
          letterNumber: `LTR-${campaign.id}-${targetLevel.levelNumber}`,
          campaignId: campaign.id,
          customerId,
          levelId: targetLevel.id,
          invoiceIds: invoices.map(i => i.id),
          totalAmountDue,
          oldestDueDate,
          daysOverdue: maxDaysOverdue,
          status: 'GENERATED',
        },
      });

      if (targetLevel.blockCustomer && !customer.creditHold) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { creditHold: true, creditHoldReason: `DUNNING_LEVEL_${targetLevel.levelNumber}` },
        });
      }

      await prisma.customer.update({
        where: { id: customerId },
        data: { dunningCurrentLevel: targetLevel.levelNumber, dunningLastRunAt: new Date() },
      });

      if (targetLevel.sendEmail) {
        await prisma.dunningCommunication.create({
          data: {
            letterId: letter.id,
            channel: 'EMAIL',
            recipientAddress: customer.email || 'finance@customer.com',
            status: 'SENT',
            direction: 'OUTBOUND',
          },
        });
      }

      // Log execution in new DunningExecution audit table
      await prisma.dunningExecution.create({
        data: {
          tenantId: String(customer.tenantId ?? customerId),
          customerId,
          invoiceId: invoices[0].id,
          level: targetLevel.levelNumber,
          channel: targetLevel.sendEmail ? 'EMAIL' : 'MANUAL',
          status: 'SENT',
        },
      });

      log.info(`Dunned customer ${customerId} at level ${targetLevel.levelNumber} — total due: ${totalAmountDue}`);
    }
  }

  /** Quick helper: get executions for audit trail */
  static async getExecutionLog(tenantId: string, customerId?: number) {
    return prisma.dunningExecution.findMany({
      where: { tenantId, ...(customerId ? { customerId } : {}) },
      orderBy: { executedAt: 'desc' },
    });
  }
}
