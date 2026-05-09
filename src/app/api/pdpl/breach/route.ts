import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * PDPL Breach Incident API
 * GET  /api/pdpl/breach — Get active breaches
 * POST /api/pdpl/breach — Record new breach
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { recordBreach, getActiveBreaches } from '@/lib/pdpl-engine';

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const breaches = await getActiveBreaches(prisma);
        return NextResponse.json(breaches);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (!body.category || !body.severity || body.affectedRecords === undefined) {
            return NextResponse.json({ error: 'مطلوب: category, severity, affectedRecords' }, { status: 400 });
        }
        const breach = await recordBreach(prisma, {
            ...body,
            ownerUserId: (user as any).id,
        });
        return NextResponse.json(breach, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
