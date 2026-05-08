import { getUserFromRequest } from '@/lib/auth';
/**
 * Webhook Subscriptions API
 * GET  /api/webhooks — List subscriptions
 * POST /api/webhooks — Create subscription or trigger test
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { WebhookEngine, WEBHOOK_EVENTS } from '@/lib/webhook-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'events') {
            return NextResponse.json(WEBHOOK_EVENTS);
        }

        const subs = await WebhookEngine.list(prisma);
        return NextResponse.json(subs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        // Test trigger
        if (body.action === 'test') {
            const result = await WebhookEngine.trigger(prisma, 'invoice.created', {
                test: true,
                message: 'هذا اختبار webhook',
                timestamp: new Date().toISOString(),
            });
            return NextResponse.json(result);
        }

        // Toggle subscription
        if (body.action === 'toggle' && body.id) {
            const sub = await WebhookEngine.toggle(prisma, body.id);
            return NextResponse.json(sub);
        }

        // Delete subscription
        if (body.action === 'delete' && body.id) {
            await WebhookEngine.unsubscribe(prisma, body.id);
            return NextResponse.json({ ok: true });
        }

        // Create subscription
        if (!body.url || !body.events?.length) {
            return NextResponse.json({ error: 'مطلوب: url, events[]' }, { status: 400 });
        }

        const sub = await WebhookEngine.subscribe(prisma, body);
        return NextResponse.json(sub, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
