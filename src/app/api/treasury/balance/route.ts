import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/api-handler';

export async function GET() {
    try {
        const [inAgg, outAgg] = await Promise.all([
            prisma.treasury.aggregate({ where: { type: 'in' }, _sum: { amount: true } }),
            prisma.treasury.aggregate({ where: { type: 'out' }, _sum: { amount: true } }),
        ]);
        const balance = (inAgg._sum.amount || 0) - (outAgg._sum.amount || 0);
        return NextResponse.json({ balance });
    } catch (error) { return handleApiError(error); }
}
