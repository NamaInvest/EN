import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const variances = await prisma.varianceTransaction.findMany({
            include: {
                product: true,
                mo: true
            },
            orderBy: { postedAt: 'desc' }
        });
        return NextResponse.json(variances);
    } catch (error) {
        console.error("Variance GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch variances' }, { status: 500 });
    }
}
