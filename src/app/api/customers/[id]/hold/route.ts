import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customers.id.hold' });

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const auth = require('@/lib/auth').getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner', 'sales_manager', 'purchasing_manager'].includes(auth.role)) {
          return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
        }
        
        const customerId = parseInt(id);
        const { action } = await req.json(); // "HOLD" or "RELEASE"

        if (!['HOLD', 'RELEASE'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const newStatus = action === 'HOLD' ? 'ON_HOLD' : 'ACTIVE';

        const existing = await prisma.customer.findFirst({ where: { id: customerId, tenantId: auth.tenantId } });
        if (!existing) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: { status: newStatus }
        });

        // Also log the state change in DocumentStateLog
        await prisma.documentStateLog.create({
            data: {
                tenantId: auth.tenantId,
                entityType: 'CUSTOMER',
                entityId: customerId,
                userId: auth.userId,
                fromState: action === 'HOLD' ? 'ACTIVE' : 'ON_HOLD',
                toState: newStatus,
                reason: `Customer ${action === 'HOLD' ? 'placed on hold' : 'released from hold'} manually`
            }
        });

        return NextResponse.json({ success: true, status: customer.status });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
