import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiError } from '@/lib/api-error';

/**
 * Dimensional GL Report — aggregates JournalLine by any combination of dimensions.
 * Query params:
 *   dim: profitCenter | project | segment | costCenter | customer | vendor | employee
 *   from: YYYY-MM-DD
 *   to: YYYY-MM-DD
 *   accountId: (optional) filter by specific account
 */
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const { searchParams } = new URL(req.url);
    const dim = searchParams.get('dim') || 'profitCenter';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const accountId = searchParams.get('accountId');

    // Map dim param to JournalLine field + include relation
    const dimMap: Record<string, { field: string; include: string; nameField: string }> = {
        profitCenter: { field: 'profitCenterId', include: 'profitCenter', nameField: 'name' },
        segment: { field: 'segmentId', include: 'segment', nameField: 'name' },
        costCenter: { field: 'costCenterId', include: 'costCenter', nameField: 'name' },
    };

    const dimConfig = dimMap[dim];
    if (!dimConfig) {
        return NextResponse.json(
            { error: `البُعد غير مدعوم: ${dim}. الأبعاد المتاحة: ${Object.keys(dimMap).join(', ')}` },
            { status: 400 }
        );
    }

    try {
        // Build date filter on entry
        const entryDateFilter: Record<string, unknown> = {};
        if (from) entryDateFilter.gte = from;
        if (to) entryDateFilter.lte = to;

        // Build where clause
        const where: Record<string, unknown> = {
            [dimConfig.field]: { not: null },
        };
        if (Object.keys(entryDateFilter).length > 0) {
            where.entry = { entryDate: entryDateFilter };
        }
        if (accountId) {
            where.accountId = parseInt(accountId, 10);
        }

        // Fetch lines with dimension + account info
        const lines = await prisma.journalLine.findMany({
            take: 100,
            where,
            select: {
                [dimConfig.field]: true,
                accountId: true,
                debit: true,
                credit: true,
                account: { select: { code: true, name: true } },
                [dimConfig.include]: { select: { code: true, name: true } },
            },
        });

        // Aggregate by dimension value
        const aggregation: Record<number, {
            dimensionId: number;
            dimensionCode: string;
            dimensionName: string;
            totalDebit: number;
            totalCredit: number;
            balance: number;
        }> = {};

        for (const line of lines as any[]) {
            const dimId = line[dimConfig.field] as number;
            const dimObj = line[dimConfig.include];
            if (!dimId || !dimObj) continue;

            if (!aggregation[dimId]) {
                aggregation[dimId] = {
                    dimensionId: dimId,
                    dimensionCode: dimObj.code || '',
                    dimensionName: dimObj.name || '',
                    totalDebit: 0,
                    totalCredit: 0,
                    balance: 0,
                };
            }
            aggregation[dimId].totalDebit += line.debit || 0;
            aggregation[dimId].totalCredit += line.credit || 0;
        }

        // Compute balance and round
        const result = Object.values(aggregation).map(row => ({
            ...row,
            totalDebit: Math.round(row.totalDebit * 100) / 100,
            totalCredit: Math.round(row.totalCredit * 100) / 100,
            balance: Math.round((row.totalDebit - row.totalCredit) * 100) / 100,
        }));

        return NextResponse.json({
            dimension: dim,
            from: from || 'all',
            to: to || 'all',
            rows: result,
            total: {
                debit: Math.round(result.reduce((s, r) => s + r.totalDebit, 0) * 100) / 100,
                credit: Math.round(result.reduce((s, r) => s + r.totalCredit, 0) * 100) / 100,
            },
        });
    } catch (e) {
        return apiError(e, 'فشل تقرير الأستاذ البُعدي', { context: 'reports/dimensional-gl' });
    }
}
