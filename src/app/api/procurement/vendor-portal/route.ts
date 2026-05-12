import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { acknowledgePO, submitASN } from '@/lib/gaps/vendor-portal-v2-engine';

const log = logger.child({ service: 'vendor-portal.api' });

async function _GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);

        // Fetch POs that need acknowledgment or shipping (Vendor View)
        // Note: For demo/admin purposes we fetch all, but normally we'd filter by vendorId
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: {
                status: { in: ['SENT', 'APPROVED', 'ACKNOWLEDGED'] }
            },
            include: {
                details: { include: { product: true } },
                supplier: true
            },
            orderBy: { date: 'desc' }
        });

        // Also fetch ASNs to display
        const asns = await prisma.advanceShipNotice.findMany({
            orderBy: { submittedAt: 'desc' }
        });

        return NextResponse.json({ success: true, purchaseOrders, asns });
    } catch (e: any) {
        log.error('Vendor Portal GET error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

async function _POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);
        
        const body = await req.json();
        
        if (body.action === 'ACKNOWLEDGE_PO') {
            const ctx = {
                vendorId: body.vendorId,
                tenantId: auth.tenantId || 'default',
                portalUserId: (auth as any).userId?.toString() || 'unknown'
            };
            const result = await acknowledgePO(prisma as any, {
                ctx,
                poId: body.poId,
                promisedDate: new Date(body.promisedDate),
                notes: body.notes
            });
            return NextResponse.json({ success: true, result });
        }

        if (body.action === 'SUBMIT_ASN') {
            const ctx = {
                vendorId: body.vendorId,
                tenantId: auth.tenantId || 'default',
                portalUserId: (auth as any).userId?.toString() || 'unknown'
            };
            const result = await submitASN(prisma as any, {
                ctx,
                poId: body.poId,
                packages: body.packages,
                trackingNumber: body.trackingNumber,
                carrier: body.carrier,
                etd: new Date(body.etd),
                eta: new Date(body.eta)
            });
            return NextResponse.json({ success: true, result });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        log.error('Vendor Portal POST error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
