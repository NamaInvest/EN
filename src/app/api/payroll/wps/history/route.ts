import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request as any);

    try {
        const batches = await prisma.wPSBatch.findMany({
            orderBy: {
                id: 'desc',
            },
            take: 50,
        });

        return NextResponse.json(batches);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
