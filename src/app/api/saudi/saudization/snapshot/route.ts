/**
 * Saudization Snapshot API
 * GET  /api/saudi/saudization/snapshot — Get latest + history
 * POST /api/saudi/saudization/recompute — Force new snapshot
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getLatestSnapshot, getSnapshotHistory, takeSaudizationSnapshot } from '@/lib/qiwa-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const latest = await getLatestSnapshot(prisma);
        const history = await getSnapshotHistory(prisma, 12);
        return NextResponse.json({ latest, history });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json().catch(() => ({}));
        const activityCode = body.activityCode || 'DEFAULT';
        const snapshot = await takeSaudizationSnapshot(prisma, activityCode);
        return NextResponse.json(snapshot);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
