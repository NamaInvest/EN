import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { KanbanEngine } from '@/lib/kanban-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    const preset = req.nextUrl.searchParams.get('preset');
    if (!preset) return NextResponse.json({ presets: KanbanEngine.getPresets() });
    try {
        const board = await KanbanEngine.loadBoard(prisma, preset);
        return NextResponse.json({ board });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const { preset, cardId, newStatus } = await req.json();
        const ok = await KanbanEngine.moveCard(prisma, preset, cardId, newStatus);
        return NextResponse.json({ success: ok });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
