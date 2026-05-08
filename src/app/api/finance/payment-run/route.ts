import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const runs = await prisma.paymentRun.findMany({
            take: 100,
            orderBy: { id: 'desc' }
        });
        return NextResponse.json({ data: runs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
