/**
 * APS Scheduling API
 * GET /api/manufacturing/aps — Run finite capacity scheduling
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { APSScheduler } from '@/lib/aps-scheduler';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const horizon = parseInt(req.nextUrl.searchParams.get('days') || '14');
        const result = await APSScheduler.schedule(prisma, horizon);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
