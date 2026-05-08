import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { CommissionEngine } from '@/lib/commission-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const month = req.nextUrl.searchParams.get('month') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const summary = await CommissionEngine.monthlySummary(prisma, month);
        return NextResponse.json({ month, summary });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
