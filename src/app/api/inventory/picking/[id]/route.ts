import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { allocateFEFO } from '@/lib/picking-fefo';
import { n } from '@/lib/decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'inventory.picking.id' });

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
        const order = await prisma.salesOrder.findUnique({
            where: { id },
            include: {
                details: {
                    include: { product: true }
                },
                customer: true
            }
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Simulate allocation logic for each line
        const lines = [];
        for (const detail of order.details) {
            let allocations: any[] = [];
            let error = null;
            try {
                // Fetch graceDays setting (hardcoded to 7 for simulation)
                const graceDays = 7;
                allocations = await allocateFEFO(prisma as any, detail.productId, n(detail.quantity), graceDays);
            } catch (e: any) {
                error = e.message;
            }

            lines.push({
                productId: detail.productId,
                productName: detail.product.name,
                requiredQty: detail.quantity,
                allocations,
                error
            });
        }

        return NextResponse.json({ data: { order, lines } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
