import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [inAgg, outAgg] = await Promise.all([
            prisma.treasury.aggregate({ where: { type: 'in' }, _sum: { amount: true } }),
            prisma.treasury.aggregate({ where: { type: 'out' }, _sum: { amount: true } }),
        ]);
        const balance = (inAgg._sum.amount || 0) - (outAgg._sum.amount || 0);
        return NextResponse.json({ balance });
    } catch (error) { console.error(error); return NextResponse.json({ balance: 0 }, { status: 500 }); }
}
