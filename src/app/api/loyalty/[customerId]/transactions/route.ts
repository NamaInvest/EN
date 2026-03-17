import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
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
