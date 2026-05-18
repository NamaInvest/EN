import { NextRequest, NextResponse } from 'next/server';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

async function _GET(req: NextRequest) {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const tenantId = requireTenantId(req as any);

    const zones = await prisma.restaurantZone.findMany({
        where: { tenantId },
        include: {
            tables: {
                include: {
                    waiterCalls: {
                        where: { status: 'PENDING' }
                    }
                }
            }
        }
    });

    return NextResponse.json({ success: true, zones });
}

async function _POST(req: NextRequest) {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const tenantId = requireTenantId(req as any);
    const body = await req.json();

    if (body.action === 'CREATE_ZONE') {
        const zone = await prisma.restaurantZone.create({
            data: {
                tenantId,
                name: body.name
            }
        });
        return NextResponse.json({ success: true, zone });
    }

    if (body.action === 'CREATE_TABLE') {
        const table = await prisma.restaurantTable.create({
            data: {
                tenantId,
                zoneId: body.zoneId,
                name: body.name,
                capacity: body.capacity || 4,
                status: 'Available',
                qrToken: crypto.randomBytes(8).toString('hex')
            }
        });
        return NextResponse.json({ success: true, table });
    }

    if (body.action === 'RESOLVE_CALL') {
        await prisma.waiterCall.updateMany({
            where: { id: body.callId, tenantId },
            data: { status: 'RESPONDED', resolvedAt: new Date() }
        });
        return NextResponse.json({ success: true });
    }

    if (body.action === 'DELETE_TABLE') {
        await prisma.restaurantTable.deleteMany({ where: { id: body.tableId, tenantId } });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
