import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { ChatterEngine } from '@/lib/chatter-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const model = req.nextUrl.searchParams.get('model') || '';
    const recordId = parseInt(req.nextUrl.searchParams.get('recordId') || '0');
    try { return NextResponse.json(await ChatterEngine.getComments(prisma, model, recordId)); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const result = await ChatterEngine.addComment(prisma, { ...body, userId: user.id, tenantId: user.tenantId || '' });
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
