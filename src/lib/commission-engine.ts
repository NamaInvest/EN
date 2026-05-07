/**
 * Commission Engine (G-04)
 * ══════════════════════════
 */
import type { PrismaClient } from '@prisma/client';
const db = (p: any) => p as any;

export class CommissionEngine {
    static async calculateFromInvoice(prisma: PrismaClient, invoiceId: number): Promise<any> {
        const inv = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });
        if (!inv) return null;
        const total = Number(inv.total);
        const salespersonId = (inv as any).salespersonId || (inv as any).userId;
        if (!salespersonId) return null;
        // Default 5% commission
        const rate = 0.05;
        return { invoiceId, salespersonId, amount: Math.round(total * rate * 100) / 100, rate: rate * 100, status: 'PENDING' };
    }

    static async monthlySummary(prisma: PrismaClient, month: string): Promise<any[]> {
        const [year, m] = month.split('-').map(Number);
        const from = new Date(year, m - 1, 1);
        const to = new Date(year, m, 0);
        const invoices = await prisma.salesInvoice.findMany({
            where: { status: { not: 'CANCELLED' }, date: { gte: from, lte: to } },
        });
        const map: Record<string, { total: number; commission: number; count: number }> = {};
        for (const inv of invoices) {
            const sp = String((inv as any).salespersonId || (inv as any).userId || 'unassigned');
            if (!map[sp]) map[sp] = { total: 0, commission: 0, count: 0 };
            map[sp].total += Number(inv.total);
            map[sp].commission += Number(inv.total) * 0.05;
            map[sp].count++;
        }
        return Object.entries(map).map(([sp, d]) => ({ salesperson: sp, ...d, commission: Math.round(d.commission * 100) / 100 }));
    }
}
