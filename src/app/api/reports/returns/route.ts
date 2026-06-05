import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'reports.returns' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        // Dynamic Pagination Parameters
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const defaultLimit = 100;
        const maxLimit = 1000;
        const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit), 10)));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to + 'T23:59:59');
        }

        const returns = await prisma.salesReturn.findMany({
            take: limit,
            skip: skip,
            where,
            include: {
                details: {
                    include: { product: { select: { name: true, barcode: true } } }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Also fetch stocks to map destinationStockId to stock name
        const stocks = await prisma.stock.findMany({ take: 1000, select: { id: true, name: true } });
        const stockMap = Object.fromEntries(stocks.map(s => [s.id, s.name]));

        const formattedReturns = returns.map((r: any) => ({
            ...r,
            destinationStockName: r.destinationStockId ? (stockMap[r.destinationStockId] || 'مستودع مجهول') : 'المستودع الرئيسي'
        }));

        return NextResponse.json(formattedReturns);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
