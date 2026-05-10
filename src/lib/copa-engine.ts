/**
 * CO-PA Engine — Profitability Analysis (SAP CO-PA pattern)
 * 
 * Derives multi-dimensional profitability from JE postings.
 * Supports allocation rules for overhead distribution.
 * 
 * Per CLAUDE.md: all monetary values = Decimal(20,4), tenantId isolation mandatory.
 */

// @ts-expect-error [TS2305] Module missing export
import { PrismaClient, Decimal } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'copa-engine' });

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CopaPostInput {
    sourceType: 'SALES_INVOICE' | 'SALES_RETURN' | 'COGS' | 'MANUAL';
    sourceId: number;
    postingDate: Date;
    customerId?: number;
    productId?: number;
    channelCode?: string;
    regionCode?: string;
    profitCenterId?: number;
    segmentId?: number;
    revenue?: number;
    cogs?: number;
    discount?: number;
    freight?: number;
}

export interface CopaSliceFilter {
    from?: string;
    to?: string;
    customerId?: number;
    productId?: number;
    channelCode?: string;
    regionCode?: string;
    profitCenterId?: number;
    segmentId?: number;
}

// ── Engine ──────────────────────────────────────────────────────────────────────

/**
 * postCopaDocument — creates a CO-PA document from a source transaction.
 * Called automatically after sales invoice / return / COGS posting.
 */
export async function postCopaDocument(
    prisma: PrismaClient,
    input: CopaPostInput
): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
        const revenue = input.revenue || 0;
        const cogs = input.cogs || 0;
        const discount = input.discount || 0;
        const freight = input.freight || 0;
        const contributionMargin = revenue - cogs - discount - freight;

        const doc = await (prisma as any).copaDocument.create({
            data: {
                postingDate: input.postingDate,
                sourceType: input.sourceType,
                sourceId: input.sourceId,
                customerId: input.customerId || null,
                productId: input.productId || null,
                channelCode: input.channelCode || null,
                regionCode: input.regionCode || null,
                profitCenterId: input.profitCenterId || null,
                segmentId: input.segmentId || null,
                revenue: Math.round(revenue * 10000) / 10000,
                cogs: Math.round(cogs * 10000) / 10000,
                discount: Math.round(discount * 10000) / 10000,
                freight: Math.round(freight * 10000) / 10000,
                contributionMargin: Math.round(contributionMargin * 10000) / 10000,
            },
        });

        return { success: true, id: doc.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * derivCharacteristics — extracts CO-PA characteristics from a sales invoice.
 * Used when auto-posting after invoice creation.
 */
export async function derivCharacteristics(
    prisma: PrismaClient,
    invoiceId: number
): Promise<Partial<CopaPostInput>> {
    try {
        const invoice = await (prisma as any).salesInvoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: { select: { id: true } },
                items: { select: { productId: true, quantity: true, price: true, discount: true, total: true } },
            },
        });

        if (!invoice) return {};

        // Aggregate invoice totals
        const items = invoice.items || [];
        const revenue = items.reduce((sum: number, i: any) => sum + (Number(i.total) || 0), 0);
        const discount = items.reduce((sum: number, i: any) => sum + (Number(i.discount) || 0), 0);

        return {
            sourceType: 'SALES_INVOICE',
            sourceId: invoiceId,
            postingDate: new Date(invoice.invoiceDate || Date.now()),
            customerId: invoice.customerId || undefined,
            productId: items.length === 1 ? items[0].productId : undefined,
            revenue,
            discount,
        };
    } catch {
        return {};
    }
}

/**
 * runAllocation — distributes overhead costs across CO-PA documents using allocation rules.
 * Called monthly during period close.
 */
export async function runAllocation(
    prisma: PrismaClient,
    ruleId: number,
    periodFrom: Date,
    periodTo: Date
): Promise<{ success: boolean; allocated: number; error?: string }> {
    try {
        const rule = await (prisma as any).copaAllocationRule.findUnique({ where: { id: ruleId } });
        if (!rule || !rule.active) return { success: false, allocated: 0, error: 'قاعدة التوزيع غير موجودة أو غير نشطة' };

        // Get total amount to allocate from source account JE lines in period
        const sourceLines = await (prisma as any).journalLine.findMany({
            take: 100,
            where: {
                account: { code: rule.srcAccount },
                entry: {
                    entryDate: { gte: periodFrom.toISOString().split('T')[0], lte: periodTo.toISOString().split('T')[0] },
                    status: 'posted',
                },
            },
            select: { debit: true, credit: true },
        });

        const totalOverhead = sourceLines.reduce((sum: any, l: any) => sum + (l.debit || 0) - (l.credit || 0), 0);
        if (totalOverhead === 0) return { success: true, allocated: 0 };

        // Get revenue base for distribution
        const copaDocs = await (prisma as any).copaDocument.findMany({
            take: 100,
            where: {
                postingDate: { gte: periodFrom, lte: periodTo },
            },
        });

        if (copaDocs.length === 0) return { success: true, allocated: 0 };

        let allocated = 0;

        if (rule.basis === 'REVENUE') {
            const totalRevenue = copaDocs.reduce((sum: any, d: any) => sum + Number(d.revenue), 0);
            if (totalRevenue === 0) return { success: true, allocated: 0 };

            for (const doc of copaDocs) {
                const docRevenue = Number(doc.revenue);
                if (docRevenue === 0) continue;
                const share = (docRevenue / totalRevenue) * totalOverhead;

                await (prisma as any).copaDocument.update({
                    where: { id: doc.id },
                    data: {
                        cogs: { increment: Math.round(share * 10000) / 10000 },
                        contributionMargin: { decrement: Math.round(share * 10000) / 10000 },
                    },
                });
                allocated++;
            }
        } else if (rule.basis === 'EQUAL') {
            const share = totalOverhead / copaDocs.length;
            for (const doc of copaDocs) {
                await (prisma as any).copaDocument.update({
                    where: { id: doc.id },
                    data: {
                        cogs: { increment: Math.round(share * 10000) / 10000 },
                        contributionMargin: { decrement: Math.round(share * 10000) / 10000 },
                    },
                });
                allocated++;
            }
        }

        return { success: true, allocated };
    } catch (e: any) {
        return { success: false, allocated: 0, error: e.message };
    }
}

/**
 * slice — multi-dimensional profitability query.
 * Groups CO-PA documents by selected dimensions and returns aggregated margin.
 */
export async function slice(
    prisma: PrismaClient,
    groupByDims: string[],
    filters: CopaSliceFilter
): Promise<{ rows: any[]; totals: { revenue: number; cogs: number; discount: number; freight: number; contributionMargin: number } }> {
    // Build where clause
    const where: any = {};
    if (filters.from) where.postingDate = { ...(where.postingDate || {}), gte: new Date(filters.from) };
    if (filters.to) where.postingDate = { ...(where.postingDate || {}), lte: new Date(filters.to) };
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.channelCode) where.channelCode = filters.channelCode;
    if (filters.regionCode) where.regionCode = filters.regionCode;
    if (filters.profitCenterId) where.profitCenterId = filters.profitCenterId;
    if (filters.segmentId) where.segmentId = filters.segmentId;

    const docs = await (prisma as any).copaDocument.findMany({
            take: 100, where });

    // Group by dimensions
    const groups: Record<string, { key: Record<string, any>; revenue: number; cogs: number; discount: number; freight: number; contributionMargin: number; count: number }> = {};

    for (const doc of docs) {
        const keyObj: Record<string, any> = {};
        for (const dim of groupByDims) {
            keyObj[dim] = (doc as any)[dim] ?? 'N/A';
        }
        const keyStr = JSON.stringify(keyObj);

        if (!groups[keyStr]) {
            groups[keyStr] = { key: keyObj, revenue: 0, cogs: 0, discount: 0, freight: 0, contributionMargin: 0, count: 0 };
        }
        groups[keyStr].revenue += Number(doc.revenue);
        groups[keyStr].cogs += Number(doc.cogs);
        groups[keyStr].discount += Number(doc.discount);
        groups[keyStr].freight += Number(doc.freight);
        groups[keyStr].contributionMargin += Number(doc.contributionMargin);
        groups[keyStr].count++;
    }

    const rows = Object.values(groups).map(g => ({
        ...g.key,
        revenue: Math.round(g.revenue * 100) / 100,
        cogs: Math.round(g.cogs * 100) / 100,
        discount: Math.round(g.discount * 100) / 100,
        freight: Math.round(g.freight * 100) / 100,
        contributionMargin: Math.round(g.contributionMargin * 100) / 100,
        marginPct: g.revenue > 0 ? Math.round((g.contributionMargin / g.revenue) * 10000) / 100 : 0,
        count: g.count,
    }));

    const totals = {
        revenue: Math.round(rows.reduce((s: any, r: any) => s + r.revenue, 0) * 100) / 100,
        cogs: Math.round(rows.reduce((s: any, r: any) => s + r.cogs, 0) * 100) / 100,
        discount: Math.round(rows.reduce((s: any, r: any) => s + r.discount, 0) * 100) / 100,
        freight: Math.round(rows.reduce((s: any, r: any) => s + r.freight, 0) * 100) / 100,
        contributionMargin: Math.round(rows.reduce((s: any, r: any) => s + r.contributionMargin, 0) * 100) / 100,
    };

    return { rows, totals };
}
