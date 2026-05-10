/**
 * Webhook Subscription Management — /api/webhooks/[id]
 * GET    → get subscription details
 * PATCH  → toggle active / rotate secret
 * DELETE → delete subscription
 * POST   → send test / get logs
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { WebhookEngine } from '@/lib/webhook-engine';

async function getHandler(ctx: any, { params }: any) {
  const { id } = await params;
  const subs = await WebhookEngine.list(ctx.prisma, ctx.auth.tenantId);
  const sub = subs.find(s => s.id === Number(id));
  if (!sub) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  return NextResponse.json(sub);
}

async function patchHandler(ctx: any, { params }: any) {
  const { id } = await params;
  const body = await ctx.req.json().catch(() => ({}));

  if (body.action === 'toggle') {
    const result = await WebhookEngine.toggle(ctx.prisma, Number(id), ctx.auth.tenantId);
    return NextResponse.json(result);
  }

  if (body.action === 'rotate_secret') {
    const result = await WebhookEngine.rotateSecret(ctx.prisma, Number(id), ctx.auth.tenantId);
    return NextResponse.json({ ...result, warning: 'احفظ المفتاح الجديد الآن — لن يُعرض مرة أخرى.' });
  }

  return NextResponse.json({ error: 'action غير صالح' }, { status: 400 });
}

async function deleteHandler(ctx: any, { params }: any) {
  const { id } = await params;
  await WebhookEngine.unsubscribe(ctx.prisma, Number(id), ctx.auth.tenantId);
  return NextResponse.json({ success: true });
}

async function postHandler(ctx: any, { params }: any) {
  const { id } = await params;
  const body = await ctx.req.json().catch(() => ({}));

  if (body.action === 'test') {
    const result = await WebhookEngine.sendTest(ctx.prisma, Number(id), ctx.auth.tenantId);
    return NextResponse.json(result);
  }

  if (body.action === 'logs') {
    const logs = await WebhookEngine.getLogs(ctx.prisma, Number(id), ctx.auth.tenantId, body.limit ?? 50);
    return NextResponse.json(logs);
  }

  return NextResponse.json({ error: 'action غير صالح' }, { status: 400 });
}

export const GET    = withRoute(getHandler,    { rateLimit: 'DEFAULT' });
export const PATCH  = withRoute(patchHandler,  { rateLimit: 'DEFAULT' });
export const DELETE = withRoute(deleteHandler, { rateLimit: 'DEFAULT' });
export const POST   = withRoute(postHandler,   { rateLimit: 'DEFAULT' });
