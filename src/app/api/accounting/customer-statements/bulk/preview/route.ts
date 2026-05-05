import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { segment, dateFrom, dateTo } = body;

        // Base where clause for active customers
        let customerWhere: any = { isActive: true };

        // Handle segmentation
        if (segment === 'OVERDUE') {
            customerWhere = {
                ...customerWhere,
                salesInvoices: {
                    some: { remaining: { gt: 0 }, date: { lt: new Date() } } // simplified overdue logic
                }
            };
        } else if (segment === 'VIP') {
            customerWhere = { ...customerWhere, customerType: 'VIP' };
        }

        const count = await prisma.customer.count({
            where: customerWhere
        });

        // Calculate some basic stats for preview
        const aggregated = await prisma.salesInvoice.aggregate({
            where: {
                customerId: { in: (await prisma.customer.findMany({ where: customerWhere, select: { id: true } })).map(c => c.id) },
                remaining: { gt: 0 }
            },
            _sum: { remaining: true }
        });

        return NextResponse.json({ 
            success: true, 
            customerCount: count,
            estimatedOverdueDebt: aggregated._sum.remaining || 0
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
