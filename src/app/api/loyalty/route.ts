import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
    const prisma = getPrisma(request);
    try {
        const loyalties = await prisma.loyaltyPoint.findMany({
            include: { customer: { select: { name: true, phone: true } } },
            orderBy: { points: 'desc' }
        });
        return NextResponse.json(loyalties);
    } catch (error) {
        console.error('Error fetching loyalty points:', error);
        return NextResponse.json({ error: 'Failed to fetch loyalty points' }, { status: 500 });
    }
}
