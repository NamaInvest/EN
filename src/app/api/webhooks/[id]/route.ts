/**
 * PATCH /DELETE /api/webhooks/[id]  — Webhook subscription management
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'webhooks.id' });

const UpdateWebhookSchema = z.object({
  url:       z.string().url().optional(),
  events:    z.array(z.string()).min(1).optional(),
  isActive:  z.boolean().optional(),
});

// ── PATCH /api/webhooks/[id] ────────────────────────────────────────────────
async function patchHandler(ctx: any) {
  const id     = Number(ctx.params?.id);
  const prisma = ctx.prisma as any;
  const tenantId = ctx.auth.tenantId;

  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body   = await ctx.req.json().catch(() => ({}));
  const parsed = UpdateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const model = prisma.webhookSubscription ?? prisma.WebhookSubscription;
  if (!model) return NextResponse.json({ error: 'Webhooks not configured' }, { status: 503 });

  const existing = await model.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await model.update({
    where: { id },
    data: {
      ...(parsed.data.url      !== undefined && { url: parsed.data.url }),
      ...(parsed.data.events   !== undefined && { events: parsed.data.events }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
  });

  return NextResponse.json({ id: updated.id, url: updated.url, isActive: updated.isActive });
}

// ── DELETE /api/webhooks/[id] ───────────────────────────────────────────────
async function deleteHandler(ctx: any) {
  const id     = Number(ctx.params?.id);
  const prisma = ctx.prisma as any;
  const tenantId = ctx.auth.tenantId;

  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const model = prisma.webhookSubscription ?? prisma.WebhookSubscription;
  if (!model) return NextResponse.json({ error: 'Webhooks not configured' }, { status: 503 });

  const existing = await model.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await model.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const PATCH  = withRoute(patchHandler,  { rateLimit: 'DEFAULT' });
export const DELETE = withRoute(deleteHandler, { rateLimit: 'DEFAULT' });
