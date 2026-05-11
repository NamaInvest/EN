import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customer-portal-engine' });

/**
 * C-06: Customer Self-Service Portal
 * Actual schema: salesInvoice, ticketNo, deliveryNotes (date/status/noteNo only)
 */
export class CustomerPortalEngine {
  static async getDashboard(customerId: number) {
    const [openInvoices, recentOrders, openTickets] = await Promise.all([
      prisma.salesInvoice.findMany({
        where: { customerId, status: { in: ['pending', 'partial'] } },
        orderBy: { date: 'asc' }, take: 10,
        select: { id: true, invoiceNo: true, total: true, paid: true, date: true },
      }),
      prisma.salesOrder.findMany({
        where: { customerId },
        orderBy: { date: 'desc' }, take: 5,
        select: { id: true, orderNo: true, total: true, status: true, date: true },
      }),
      prisma.supportTicket.findMany({
        where: { customerId, status: { not: 'CLOSED' } }, take: 5,
        select: { id: true, ticketNo: true, subject: true, priority: true, status: true },
      }),
    ]);
    return { openInvoices, recentOrders, openTickets };
  }

  static async getInvoiceInfo(invoiceId: number, customerId: number) {
    return prisma.salesInvoice.findFirstOrThrow({
      where: { id: invoiceId, customerId },
      select: { id: true, invoiceNo: true, total: true, paid: true, date: true },
    });
  }

  static async makePayment(invoiceId: number, customerId: number, amount: number, method: string) {
    const invoice = await prisma.salesInvoice.findFirstOrThrow({ where: { id: invoiceId, customerId } });
    log.info(`Customer ${customerId} initiating payment for invoice ${invoiceId}: ${amount}`);
    return { invoiceId: invoice.id, amount, method, status: 'INITIATED', reference: `PAY-${Date.now()}` };
  }

  static async raiseTicket(customerId: number, subject: string, description: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') {
    return prisma.supportTicket.create({
      data: {
        tenantId: 'default',
        customerId,
        subject,
        description,
        priority,
        status: 'OPEN',
        ticketNo: `TKT-${Date.now()}`,
      },
    });
  }

  static async trackOrder(salesOrderId: number, customerId: number) {
    return prisma.salesOrder.findFirstOrThrow({
      where: { id: salesOrderId, customerId },
      include: {
        deliveryNotes: {
          select: { id: true, noteNo: true, status: true, date: true },
        },
      },
    });
  }
}
