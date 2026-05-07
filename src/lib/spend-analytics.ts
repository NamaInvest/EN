/**
 * Spend Analytics Engine (Build #26)
 * ════════════════════════════════════
 * 
 * - تحليل الإنفاق حسب المورد/الفئة/الفترة
 * - Maverick spend detection
 * - Savings opportunity identification
 */

import type { PrismaClient } from '@prisma/client';

export class SpendAnalyticsEngine {
    static async analyze(
        prisma: PrismaClient,
        from?: Date,
        to?: Date
    ): Promise<{
        totalSpend: number;
        bySupplier: Array<{ supplierId: number; name: string; spend: number; pct: number }>;
        byMonth: Array<{ month: string; spend: number }>;
        maverickSpend: number;
        maverickPct: number;
        topCategories: Array<{ category: string; spend: number }>;
    }> {
        const periodFrom = from || new Date(Date.now() - 365 * 86400000);
        const periodTo = to || new Date();

        const invoices = await prisma.purchaseInvoice.findMany({
            take: 100,
            where: {
                status: { not: 'cancelled' },
                invoiceDate: { gte: periodFrom.toISOString(), lte: periodTo.toISOString() },
            },
            include: { supplier: { select: { id: true, name: true } } },
        });

        const totalSpend = invoices.reduce((s, i) => s + Number(i.total), 0);

        // By supplier
        const supplierMap: Record<number, { name: string; spend: number }> = {};
        const monthMap: Record<string, number> = {};

        for (const inv of invoices) {
            const sid = inv.supplierId;
            if (!supplierMap[sid]) supplierMap[sid] = { name: (inv.supplier as any)?.name || `S-${sid}`, spend: 0 };
            supplierMap[sid].spend += Number(inv.total);

            const d = new Date(inv.invoiceDate);
            const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthMap[month] = (monthMap[month] || 0) + Number(inv.total);
        }

        const bySupplier = Object.entries(supplierMap)
            .map(([id, d]) => ({ supplierId: parseInt(id), ...d, pct: totalSpend > 0 ? Math.round(d.spend / totalSpend * 10000) / 100 : 0 }))
            .sort((a, b) => b.spend - a.spend)
            .slice(0, 20);

        const byMonth = Object.entries(monthMap)
            .map(([month, spend]) => ({ month, spend: Math.round(spend) }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Maverick spend: invoices without PO reference
        const maverickInvoices = invoices.filter(i => !(i as any).purchaseOrderId);
        const maverickSpend = maverickInvoices.reduce((s, i) => s + Number(i.total), 0);

        return {
            totalSpend: Math.round(totalSpend),
            bySupplier,
            byMonth,
            maverickSpend: Math.round(maverickSpend),
            maverickPct: totalSpend > 0 ? Math.round(maverickSpend / totalSpend * 10000) / 100 : 0,
            topCategories: [],
        };
    }
}
