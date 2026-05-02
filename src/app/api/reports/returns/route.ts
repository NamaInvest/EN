import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        const where: any = {};
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to + 'T23:59:59');
        }

        const returns = await prisma.salesReturn.findMany({
            where,
            include: {
                details: {
                    include: { product: { select: { name: true, barcode: true } } }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Also fetch stocks to map destinationStockId to stock name
        const stocks = await prisma.stock.findMany({ select: { id: true, name: true } });
        const stockMap = Object.fromEntries(stocks.map(s => [s.id, s.name]));

        const formattedReturns = returns.map(r => ({
            ...r,
            destinationStockName: r.destinationStockId ? (stockMap[r.destinationStockId] || 'مستودع مجهول') : 'المستودع الرئيسي'
        }));

        return NextResponse.json(formattedReturns);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
