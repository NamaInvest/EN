import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const queue = await prisma.invoiceMatchResult.findMany({
            take: 100,
            where: {
                status: {
                    in: ['HOLD_PRICE', 'HOLD_QTY', 'HOLD_TOTAL', 'MANUAL_REVIEW']
                }
            },
            include: {
                // we would normally include invoice details here, simplified for now
            }
        });
        return NextResponse.json(queue);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
