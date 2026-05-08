import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const rules = await prisma.commissionRule.findMany({
            take: 100,
            where: { isActive: true },
            orderBy: { targetAmount: 'asc' }
        });
        return NextResponse.json(rules);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
