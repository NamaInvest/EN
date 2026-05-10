/**
 * Customer 360 Engine — aggregate all data for a single customer
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.customer360-' });
const p = (prisma: PrismaClient) => prisma as any;

export class Customer360Engine {
    static async get(prisma: PrismaClient, customerId: number) {
        const customer = await p(prisma).party?.findUnique?.({ where: { id: customerId } }) || null;
        if (!customer) return { error: 'Customer not found' };

        const [invoices, orders, payments, openBalance, comments, monthlyData] = await Promise.all([
            p(prisma).salesInvoice?.findMany?.({ where: { customerId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, invoiceNumber: true, total: true, paid: true, createdAt: true, status: true } }).catch(() => []) || [],
            p(prisma).salesOrder?.findMany?.({ where: { customerId, status: { not: 'COMPLETED' } }, orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => []) || [],
            p(prisma).payment?.findMany?.({ where: { partyId: customerId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, amount: true, method: true, createdAt: true } }).catch(() => []) || [],
            p(prisma).salesInvoice?.aggregate?.({ where: { customerId }, _sum: { total: true, paid: true } }).catch(() => ({ _sum: { total: 0, paid: 0 } })),
            p(prisma).comment?.findMany?.({ where: { model: 'Party', recordId: customerId }, orderBy: { createdAt: 'desc' }, take: 10 }).catch(() => []) || [],
            this.getMonthlyRevenue(prisma, customerId),
        ]);

        const totalSales = openBalance?._sum?.total || 0;
        const totalPaid = openBalance?._sum?.paid || 0;
        const balance = totalSales - totalPaid;

        return {
            customer,
            summary: { totalSales, totalPaid, balance, invoiceCount: invoices.length, orderCount: orders.length },
            invoices, orders, payments, comments, monthlyData,
            classification: totalSales > 100000 ? 'A' : totalSales > 30000 ? 'B' : 'C',
        };
    }

    static async getMonthlyRevenue(prisma: PrismaClient, customerId: number) {
        const months: { month: string; total: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const agg = await p(prisma).salesInvoice?.aggregate?.({ where: { customerId, createdAt: { gte: start, lte: end } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } }));
            months.push({ month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`, total: agg?._sum?.total || 0 });
        }
        return months;
    }
}
