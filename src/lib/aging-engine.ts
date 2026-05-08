/**
 * Aging Reports Engine (G-02)
 * ═════════════════════════════
 * 
 * - تقادم العملاء (AR) والموردين (AP)
 * - Buckets: حالي، 30، 60، 90، 120+
 * - Drill-down لتفاصيل الفواتير
 */

import type { PrismaClient } from '@prisma/client';

export type AgingRow = {
    partnerId: number;
    partnerName: string;
    current: number;
    d1_30: number;
    d31_60: number;
    d61_90: number;
    d91_120: number;
    d120_plus: number;
    total: number;
};

export type AgingDetail = {
    invoiceId: number;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    paid: number;
    balance: number;
    daysOverdue: number;
    bucket: string;
};

export class AgingEngine {
    /**
     * Calculate aging for AR or AP
     */
    static async calculate(
        prisma: PrismaClient,
        type: 'AR' | 'AP',
        asOfDate?: Date
    ): Promise<{ rows: AgingRow[]; totals: AgingRow }> {
        const asOf = asOfDate || new Date();
        const partnerMap: Record<number, AgingRow> = {};

        if (type === 'AR') {
            const invoices = await prisma.salesInvoice.findMany({
            take: 100,
                where: { status: { notIn: ['CANCELLED', 'cancelled'] } },
                include: { customer: { select: { id: true, name: true } } },
            });

            for (const inv of invoices) {
                const total = Number(inv.total);
                const paid = Number(inv.paid || 0);
                const balance = total - paid;
                if (balance <= 0.01) continue;

                const dueDate = new Date((inv as any).dueDate || inv.date);
                const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / 86400000);
                const pid = inv.customerId;
                if (!pid) continue;

                if (!partnerMap[pid]) {
                    partnerMap[pid] = {
                        partnerId: pid,
                        partnerName: inv.customer?.name || `عميل ${pid}`,
                        current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d91_120: 0, d120_plus: 0, total: 0,
                    };
                }

                const row = partnerMap[pid];
                row.total += balance;

                if (daysOverdue <= 0) row.current += balance;
                else if (daysOverdue <= 30) row.d1_30 += balance;
                else if (daysOverdue <= 60) row.d31_60 += balance;
                else if (daysOverdue <= 90) row.d61_90 += balance;
                else if (daysOverdue <= 120) row.d91_120 += balance;
                else row.d120_plus += balance;
            }
        } else {
            const invoices = await prisma.purchaseInvoice.findMany({
            take: 100,
                where: { status: { notIn: ['cancelled', 'CANCELLED'] } },
                include: { supplier: { select: { id: true, name: true } } },
            });

            for (const inv of invoices) {
                const total = Number(inv.total);
                const paid = Number((inv as any).paid || 0);
                const balance = total - paid;
                if (balance <= 0.01) continue;

                const dueDate = new Date((inv as any).dueDate || inv.date);
                const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / 86400000);
                const pid = inv.supplierId;
                if (!pid) continue;

                if (!partnerMap[pid]) {
                    partnerMap[pid] = {
                        partnerId: pid,
                        partnerName: inv.supplier?.name || `مورد ${pid}`,
                        current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d91_120: 0, d120_plus: 0, total: 0,
                    };
                }

                const row = partnerMap[pid];
                row.total += balance;

                if (daysOverdue <= 0) row.current += balance;
                else if (daysOverdue <= 30) row.d1_30 += balance;
                else if (daysOverdue <= 60) row.d31_60 += balance;
                else if (daysOverdue <= 90) row.d61_90 += balance;
                else if (daysOverdue <= 120) row.d91_120 += balance;
                else row.d120_plus += balance;
            }
        }

        const rows = Object.values(partnerMap)
            .map(r => ({
                ...r,
                current: Math.round(r.current * 100) / 100,
                d1_30: Math.round(r.d1_30 * 100) / 100,
                d31_60: Math.round(r.d31_60 * 100) / 100,
                d61_90: Math.round(r.d61_90 * 100) / 100,
                d91_120: Math.round(r.d91_120 * 100) / 100,
                d120_plus: Math.round(r.d120_plus * 100) / 100,
                total: Math.round(r.total * 100) / 100,
            }))
            .sort((a, b) => b.total - a.total);

        const totals: AgingRow = {
            partnerId: 0, partnerName: 'الإجمالي',
            current: rows.reduce((s: any, r: any) => s + r.current, 0),
            d1_30: rows.reduce((s: any, r: any) => s + r.d1_30, 0),
            d31_60: rows.reduce((s: any, r: any) => s + r.d31_60, 0),
            d61_90: rows.reduce((s: any, r: any) => s + r.d61_90, 0),
            d91_120: rows.reduce((s: any, r: any) => s + r.d91_120, 0),
            d120_plus: rows.reduce((s: any, r: any) => s + r.d120_plus, 0),
            total: rows.reduce((s: any, r: any) => s + r.total, 0),
        };

        return { rows, totals };
    }

    /**
     * Drill-down: get individual invoices for a partner bucket
     */
    static async drillDown(
        prisma: PrismaClient,
        type: 'AR' | 'AP',
        partnerId: number,
        bucket?: string
    ): Promise<AgingDetail[]> {
        const now = new Date();
        const results: AgingDetail[] = [];

        if (type === 'AR') {
            const invoices = await prisma.salesInvoice.findMany({
            take: 100,
                where: { customerId: partnerId, status: { notIn: ['CANCELLED'] } },
            });
            for (const inv of invoices) {
                const total = Number(inv.total);
                const paid = Number(inv.paid || 0);
                const balance = total - paid;
                if (balance <= 0.01) continue;
                const dueDate = new Date((inv as any).dueDate || inv.date);
                const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000));
                const bkt = daysOverdue <= 0 ? 'current' : daysOverdue <= 30 ? '1-30' : daysOverdue <= 60 ? '31-60' : daysOverdue <= 90 ? '61-90' : daysOverdue <= 120 ? '91-120' : '120+';
                if (bucket && bkt !== bucket) continue;
                results.push({
                    invoiceId: inv.id, invoiceNumber: `INV-${inv.invoiceNo}`,
                    invoiceDate: String(inv.date).slice(0, 10), dueDate: dueDate.toISOString().slice(0, 10),
                    amount: total, paid, balance: Math.round(balance * 100) / 100, daysOverdue, bucket: bkt,
                });
            }
        }

        return results.sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
}
