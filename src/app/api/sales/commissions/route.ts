import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const { searchParams } = new URL(req.url);
    const periodMonth = searchParams.get('month');
    const periodYear = searchParams.get('year');

    try {
        const whereClause: any = {};
        if (periodMonth) whereClause.periodMonth = parseInt(periodMonth);
        if (periodYear) whereClause.periodYear = parseInt(periodYear);

        const commissions = await prisma.salesmanCommission.findMany({
            where: whereClause,
            include: {
                employee: { select: { id: true, name: true } },
                rule: { select: { name: true, targetAmount: true, rewardType: true, rewardValue: true } }
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(commissions);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
