import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const customerId = parseInt((await params).id);
        const { action } = await req.json(); // "HOLD" or "RELEASE"

        if (!['HOLD', 'RELEASE'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const newStatus = action === 'HOLD' ? 'ON_HOLD' : 'ACTIVE';

        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: { status: newStatus }
        });

        // Also log the state change in DocumentStateLog
        await prisma.documentStateLog.create({
            data: {
                entityType: 'CUSTOMER',
                entityId: customerId,
                fromState: action === 'HOLD' ? 'ACTIVE' : 'ON_HOLD',
                toState: newStatus,
                reason: `Customer ${action === 'HOLD' ? 'placed on hold' : 'released from hold'} manually`
            }
        });

        return NextResponse.json({ success: true, status: customer.status });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
