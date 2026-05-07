/**
 * NLQ — Natural Language Query (Build #40)
 * ══════════════════════════════════════════
 * 
 * - تحويل أسئلة عربية/إنجليزية إلى استعلامات بيانات
 * - Pattern matching لأسئلة شائعة
 * - إرجاع بيانات مهيكلة
 */

import type { PrismaClient } from '@prisma/client';

type NLQResult = {
    question: string;
    intent: string;
    data: any;
    chartType?: 'bar' | 'line' | 'pie' | 'number';
    summary: string;
};

export class NLQEngine {
    private static patterns: Array<{ regex: RegExp; intent: string; handler: (prisma: PrismaClient, match: RegExpMatchArray) => Promise<any> }> = [
        {
            regex: /(?:كم|how many|عدد)\s*(?:ال)?(?:مبيعات|sales|فواتير|invoices)/i,
            intent: 'sales_count',
            handler: async (prisma) => {
                const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                const count = await prisma.salesInvoice.count({
                    where: { invoiceDate: { gte: thisMonth.toISOString() } },
                });
                const agg = await prisma.salesInvoice.aggregate({
                    where: { invoiceDate: { gte: thisMonth.toISOString() }, status: { not: 'CANCELLED' } },
                    _sum: { total: true },
                });
                return { count, total: Math.round(Number(agg._sum?.total || 0)), period: 'هذا الشهر', chartType: 'number' };
            },
        },
        {
            regex: /(?:أعلى|top|أكبر|best)\s*(?:\d+)?\s*(?:عملاء|customers|زبائن)/i,
            intent: 'top_customers',
            handler: async (prisma) => {
                const invoices = await prisma.salesInvoice.findMany({
                    where: { status: { not: 'CANCELLED' } },
                    include: { customer: { select: { id: true, name: true } } },
                });
                const map: Record<number, { name: string; total: number }> = {};
                for (const inv of invoices) {
                    const cid = inv.customerId;
                    if (!map[cid]) map[cid] = { name: (inv.customer as any)?.name || '', total: 0 };
                    map[cid].total += Number(inv.total);
                }
                const sorted = Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
                return { customers: sorted, chartType: 'bar' };
            },
        },
        {
            regex: /(?:المخزون|stock|inventory|رصيد)\s*(?:المنخفض|low|قليل)/i,
            intent: 'low_stock',
            handler: async (prisma) => {
                const products = await prisma.product.findMany({
                    where: { isActive: true },
                    select: { id: true, name: true, stockQuantity: true, minStock: true },
                });
                const low = products.filter(p => Number(p.stockQuantity) <= Number((p as any).minStock || 5));
                return { count: low.length, products: low.slice(0, 20), chartType: 'bar' };
            },
        },
        {
            regex: /(?:الأرباح|profit|ربح|margin|هامش)/i,
            intent: 'profit_margin',
            handler: async (prisma) => {
                const sales = await prisma.salesInvoice.aggregate({
                    where: { status: { not: 'CANCELLED' } },
                    _sum: { total: true },
                });
                const purchases = await prisma.purchaseInvoice.aggregate({
                    where: { status: { not: 'cancelled' } },
                    _sum: { total: true },
                });
                const rev = Number(sales._sum?.total || 0);
                const cost = Number(purchases._sum?.total || 0);
                return { revenue: Math.round(rev), cost: Math.round(cost), profit: Math.round(rev - cost), marginPct: rev > 0 ? Math.round((rev - cost) / rev * 10000) / 100 : 0, chartType: 'number' };
            },
        },
    ];

    static async query(prisma: PrismaClient, question: string): Promise<NLQResult> {
        for (const pattern of this.patterns) {
            const match = question.match(pattern.regex);
            if (match) {
                const data = await pattern.handler(prisma, match);
                return {
                    question,
                    intent: pattern.intent,
                    data,
                    chartType: data.chartType,
                    summary: `تم تنفيذ استعلام "${pattern.intent}" بنجاح`,
                };
            }
        }

        return {
            question,
            intent: 'unknown',
            data: null,
            summary: 'لم أفهم السؤال. جرّب: "كم المبيعات؟" أو "أعلى عملاء" أو "المخزون المنخفض"',
        };
    }
}
