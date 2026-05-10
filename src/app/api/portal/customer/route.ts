import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'portal.customer' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        let customerId = searchParams.get('customerId');
        
        // If no customer ID is provided, use the first customer as a dummy login for the portal
        if (!customerId) {
            const firstCust = await prisma.customer.findFirst();
            if (!firstCust) {
                return NextResponse.json({ error: 'No customers found in database.' }, { status: 404 });
            }
            customerId = firstCust.id.toString();
        }

        const customer = await prisma.customer.findUnique({
            where: { id: Number(customerId) }
        });

        // Recent Orders
        const orders = await prisma.salesOrder.findMany({
            where: { customerId: Number(customerId) },
            orderBy: { date: 'desc' },
            take: 5
        });

        // Outstanding Invoices
        const invoices = await prisma.salesInvoice.findMany({ take: 100,
            where: { 
                customerId: Number(customerId),
                status: { not: 'paid' }
            },
            orderBy: { date: 'desc' }
        });

        // Basic metrics
        const totalOutstanding = invoices.reduce((sum: number, inv: any) => sum + (inv.total - (inv.paidAmount || 0)), 0);

        return NextResponse.json({ 
            success: true, 
            data: { 
                customer,
                metrics: { totalOutstanding, ordersCount: orders.length },
                orders,
                invoices
            } 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
