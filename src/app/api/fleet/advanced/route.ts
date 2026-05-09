import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { FleetAdvancedEngine } from '@/lib/fleet-advanced-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'dashboard') return NextResponse.json(await FleetAdvancedEngine.dashboard(prisma));
        if (view === 'expiring') return NextResponse.json(await FleetAdvancedEngine.getExpiringDocs(prisma, parseInt(req.nextUrl.searchParams.get('days') || '30')));
        const vehicleId = parseInt(req.nextUrl.searchParams.get('vehicleId') || '0');
        if (vehicleId) return NextResponse.json(await FleetAdvancedEngine.getCostPerKm(prisma, vehicleId));
        return NextResponse.json(await FleetAdvancedEngine.dashboard(prisma));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'log_fuel') return NextResponse.json(await FleetAdvancedEngine.logFuel(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'schedule_maintenance') return NextResponse.json(await FleetAdvancedEngine.scheduleMaintenance(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        return NextResponse.json({ error: 'action: log_fuel | schedule_maintenance' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
