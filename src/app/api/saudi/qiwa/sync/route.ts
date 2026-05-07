/**
 * Qiwa Sync API
 * POST /api/saudi/qiwa/sync — Sync workforce from Qiwa + take snapshot
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { syncWorkforce } from '@/lib/qiwa-engine';

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json().catch(() => ({}));
        const activityCode = body.activityCode || 'DEFAULT';
        const result = await syncWorkforce(prisma, activityCode);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
