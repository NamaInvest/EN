import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { NotificationEngine } from '@/lib/notification-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const [notifications, unreadCount] = await Promise.all([
            NotificationEngine.getForUser(prisma, user.id),
            NotificationEngine.getUnreadCount(prisma, user.id)
        ]);
        return NextResponse.json({ notifications, unreadCount });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'mark_read') return NextResponse.json(await NotificationEngine.markRead(prisma, body.id));
        if (body.action === 'mark_all_read') return NextResponse.json(await NotificationEngine.markAllRead(prisma, user.id));
        return NextResponse.json({ error: 'action required' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
