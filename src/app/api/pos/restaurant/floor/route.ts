import { NextRequest, NextResponse } from 'next/server';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const log = logger.child({ service: 'pos.restaurant.floor' });

async function _GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const prisma = getPrisma(req);
        const tenantId = requireTenantId(req as any);

        const zones = await prisma.restaurantZone.findMany({
            where: { tenantId },
            include: { 
                tables: { 
                    include: { 
                        sessions: { where: { status: 'Active' } },
                        waiterCalls: { where: { status: 'PENDING' } }
                    } 
                } 
            }
        });

        return NextResponse.json({ success: true, zones });
    } catch (e: any) {
        log.error('Floor GET error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

async function _POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const prisma = getPrisma(req);
        const tenantId = requireTenantId(req as any);
        const { action, payload } = await req.json();

        if (action === 'create_zone') {
            const zone = await prisma.restaurantZone.create({ 
                data: { 
                    tenantId,
                    name: payload.name 
                } 
            });
            return NextResponse.json({ success: true, zone });
        }
        
        if (action === 'create_table') {
            const table = await prisma.restaurantTable.create({
                data: { 
                    tenantId,
                    name: payload.name, 
                    capacity: payload.capacity, 
                    zoneId: payload.zoneId,
                    qrToken: crypto.randomBytes(8).toString('hex')
                }
            });
            return NextResponse.json({ success: true, table });
        }
        
        if (action === 'update_table_status') {
            const table = await prisma.restaurantTable.updateMany({
                where: { id: payload.tableId, tenantId },
                data: { status: payload.status }
            });
            return NextResponse.json({ success: true, table });
        }

        if (action === 'open_session') {
            await prisma.restaurantTable.updateMany({
                where: { id: payload.tableId, tenantId },
                data: { status: 'Occupied' }
            });
            const session = await prisma.restaurantSession.create({
                data: { 
                    tenantId,
                    tableId: payload.tableId, 
                    status: 'Active' 
                }
            });
            return NextResponse.json({ success: true, session });
        }

        if (action === 'close_session') {
            await prisma.restaurantTable.updateMany({
                where: { id: payload.tableId, tenantId },
                data: { status: 'Available' }
            });
            await prisma.restaurantSession.updateMany({
                where: { tableId: payload.tableId, status: 'Active', tenantId },
                data: { status: 'Closed', endedAt: new Date() }
            });
            return NextResponse.json({ success: true });
        }

        if (action === 'delete_zone') {
            const tables = await prisma.restaurantTable.findMany({ where: { zoneId: payload.zoneId, tenantId } });
            for (const table of tables) {
                await prisma.restaurantSession.deleteMany({ where: { tableId: table.id, tenantId } });
                await prisma.waiterCall.deleteMany({ where: { tableId: table.id, tenantId } });
            }
            await prisma.restaurantTable.deleteMany({ where: { zoneId: payload.zoneId, tenantId } });
            await prisma.restaurantZone.deleteMany({ where: { id: payload.zoneId, tenantId } });
            return NextResponse.json({ success: true });
        }

        if (action === 'delete_table') {
            await prisma.restaurantSession.deleteMany({ where: { tableId: payload.tableId, tenantId } });
            await prisma.waiterCall.deleteMany({ where: { tableId: payload.tableId, tenantId } });
            await prisma.restaurantTable.deleteMany({ where: { id: payload.tableId, tenantId } });
            return NextResponse.json({ success: true });
        }
        
        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (e: any) {
        log.error('Floor POST error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
