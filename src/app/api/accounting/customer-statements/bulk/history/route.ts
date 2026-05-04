import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const batches = await prisma.statementBatch.findMany({
            orderBy: { startedAt: 'desc' },
            take: 20
        });

        return NextResponse.json(batches);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
