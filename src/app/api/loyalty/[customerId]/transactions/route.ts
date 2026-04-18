import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { customerId } = await params;
        const transactions = await prisma.loyaltyTransaction.findMany({
            where: { customerId: parseInt(customerId) },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching loyalty transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
