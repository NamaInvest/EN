import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { Customer360Engine } from '@/lib/customer360-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const id = parseInt(req.nextUrl.searchParams.get('id') || '0');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    try { return NextResponse.json(await Customer360Engine.get(prisma, id)); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
