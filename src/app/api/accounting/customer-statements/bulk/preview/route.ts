import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.customer-statements.bulk.prev' });


const _POSTSchema = z.object({
  segment: z.any().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { segment, dateFrom, dateTo } = body;

        // Base where clause for active customers
        let customerWhere: any = { active: true };

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
                customerId: { in: (await prisma.customer.findMany({ take: 100, where: customerWhere, select: { id: true } })).map(c => c.id) },
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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
