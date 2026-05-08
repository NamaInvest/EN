import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { SpendAnalyticsEngine } from '@/lib/spend-analytics';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const from = req.nextUrl.searchParams.get('from');
        const to = req.nextUrl.searchParams.get('to');
        const result = await SpendAnalyticsEngine.analyze(prisma, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
