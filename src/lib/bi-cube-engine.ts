/**
 * BI Cube Engine (Build #39)
 * ════════════════════════════
 * 
 * - OLAP-style aggregation cubes
 * - Multi-dimensional analysis (Time × Product × Customer × Region)
 * - Pre-aggregated KPI snapshots
 */

import type { PrismaClient } from '@prisma/client';

export type CubeDimension = 'TIME' | 'PRODUCT' | 'CUSTOMER' | 'CATEGORY' | 'WAREHOUSE' | 'SALESPERSON';
export type CubeMeasure = 'REVENUE' | 'QUANTITY' | 'MARGIN' | 'COUNT' | 'AVG_ORDER';

export type CubeCell = {
    dimensions: Record<string, string>;
    measures: Record<string, number>;
};

export class BICubeEngine {
    /**
     * Build a sales analysis cube
     */
    static async querySalesCube(
        prisma: PrismaClient,
        opts: {
            dimensions: CubeDimension[];
            measures: CubeMeasure[];
            from?: Date;
            to?: Date;
            filters?: Record<string, any>;
            limit?: number;
        }
    ): Promise<{ cells: CubeCell[]; totals: Record<string, number>; queryTime: number }> {
        const start = Date.now();
        const from = opts.from || new Date(Date.now() - 365 * 86400000);
        const to = opts.to || new Date();

        const invoices = await prisma.salesInvoice.findMany({
            where: {
                status: { not: 'CANCELLED' },
                invoiceDate: { gte: from.toISOString(), lte: to.toISOString() },
                ...(opts.filters?.customerId ? { customerId: opts.filters.customerId } : {}),
            },
            include: {
                lines: { include: { product: true } },
                customer: { select: { id: true, name: true } },
            },
            take: 5000,
        });

        // Build cube cells
        const cellMap: Record<string, CubeCell> = {};

        for (const inv of invoices) {
            for (const line of (inv.lines || [])) {
                const dimKey: Record<string, string> = {};

                for (const dim of opts.dimensions) {
                    switch (dim) {
                        case 'TIME':
                            const d = new Date(inv.invoiceDate);
                            dimKey['month'] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            break;
                        case 'PRODUCT':
                            dimKey['product'] = (line.product as any)?.name || `P-${line.productId}`;
                            break;
                        case 'CUSTOMER':
                            dimKey['customer'] = (inv.customer as any)?.name || `C-${inv.customerId}`;
                            break;
                        case 'CATEGORY':
                            dimKey['category'] = (line.product as any)?.category || 'غير مصنف';
                            break;
                    }
                }

                const key = JSON.stringify(dimKey);
                if (!cellMap[key]) {
                    cellMap[key] = { dimensions: dimKey, measures: { revenue: 0, quantity: 0, margin: 0, count: 0 } };
                }

                const cell = cellMap[key];
                const lineTotal = Number((line as any).total || Number(line.quantity) * Number(line.unitPrice));
                const cost = Number((line as any).costPrice || 0) * Number(line.quantity);

                cell.measures.revenue += lineTotal;
                cell.measures.quantity += Number(line.quantity);
                cell.measures.margin += lineTotal - cost;
                cell.measures.count += 1;
            }
        }

        const cells = Object.values(cellMap)
            .map(c => ({
                ...c,
                measures: {
                    ...c.measures,
                    revenue: Math.round(c.measures.revenue * 100) / 100,
                    margin: Math.round(c.measures.margin * 100) / 100,
                    avg_order: c.measures.count > 0 ? Math.round(c.measures.revenue / c.measures.count * 100) / 100 : 0,
                },
            }))
            .sort((a, b) => b.measures.revenue - a.measures.revenue)
            .slice(0, opts.limit || 100);

        const totals: Record<string, number> = {
            revenue: Math.round(cells.reduce((s, c) => s + c.measures.revenue, 0) * 100) / 100,
            quantity: cells.reduce((s, c) => s + c.measures.quantity, 0),
            margin: Math.round(cells.reduce((s, c) => s + c.measures.margin, 0) * 100) / 100,
            count: cells.reduce((s, c) => s + c.measures.count, 0),
        };

        return { cells, totals, queryTime: Date.now() - start };
    }

    /**
     * Executive KPI dashboard snapshot
     */
    static async kpiSnapshot(prisma: PrismaClient): Promise<Record<string, any>> {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [currentSales, prevSales, currentPurchases, customerCount, productCount] = await Promise.all([
            prisma.salesInvoice.aggregate({
                where: { status: { not: 'CANCELLED' }, invoiceDate: { gte: thisMonth.toISOString() } },
                _sum: { total: true }, _count: true,
            }),
            prisma.salesInvoice.aggregate({
                where: { status: { not: 'CANCELLED' }, invoiceDate: { gte: lastMonth.toISOString(), lte: lastMonthEnd.toISOString() } },
                _sum: { total: true }, _count: true,
            }),
            prisma.purchaseInvoice.aggregate({
                where: { status: { not: 'cancelled' }, invoiceDate: { gte: thisMonth.toISOString() } },
                _sum: { total: true },
            }),
            prisma.customer.count({ where: { isActive: true } }),
            prisma.product.count({ where: { isActive: true } }),
        ]);

        const curRev = Number(currentSales._sum?.total || 0);
        const prevRev = Number(prevSales._sum?.total || 0);
        const growth = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : 0;

        return {
            currentMonthRevenue: Math.round(curRev),
            previousMonthRevenue: Math.round(prevRev),
            growthPct: Math.round(growth * 10) / 10,
            currentMonthOrders: currentSales._count || 0,
            currentMonthPurchases: Math.round(Number(currentPurchases._sum?.total || 0)),
            grossMargin: curRev > 0 ? Math.round((curRev - Number(currentPurchases._sum?.total || 0)) / curRev * 10000) / 100 : 0,
            activeCustomers: customerCount,
            activeProducts: productCount,
            avgOrderValue: currentSales._count ? Math.round(curRev / currentSales._count) : 0,
        };
    }
}
