import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { PivotEngine } from '@/lib/pivot-engine';

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const result = await PivotEngine.generate(prisma, body);
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
