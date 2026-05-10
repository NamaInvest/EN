/**
 * Webhook Subscriptions API — P2.9
 * GET  /api/webhooks           → list subscriptions
 * POST /api/webhooks           → create subscription
 * GET  /api/webhooks?view=events → list supported events
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { WebhookEngine, WEBHOOK_EVENTS } from '@/lib/webhook-engine';
import { z } from 'zod';

const CreateWebhookSchema = z.object({
  url:         z.string().url('عنوان URL غير صالح'),
  events:      z.array(z.string()).min(1, 'يجب تحديد حدث واحد على الأقل'),
  description: z.string().max(200).optional(),
});

async function getHandler(ctx: any) {
  const view = ctx.req.nextUrl.searchParams.get('view');

  if (view === 'events') {
    return NextResponse.json(WEBHOOK_EVENTS);
  }

  const subs = await WebhookEngine.list(ctx.prisma, ctx.auth.tenantId);
  return NextResponse.json(subs);
}

async function postHandler(ctx: any) {
  const body = await ctx.req.json().catch(() => ({}));

  // Test action
  if (body.action === 'test' && body.id) {
    const result = await WebhookEngine.sendTest(ctx.prisma, Number(body.id), ctx.auth.tenantId);
    return NextResponse.json(result);
  }

  // Validate create
  const parsed = CreateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const sub = await WebhookEngine.subscribe(ctx.prisma, {
    ...parsed.data,
    tenantId: ctx.auth.tenantId,
  });

  return NextResponse.json(sub, { status: 201 });
}

export const GET  = withRoute(getHandler,  { rateLimit: 'DEFAULT' });
export const POST = withRoute(postHandler, { rateLimit: 'DEFAULT' });
