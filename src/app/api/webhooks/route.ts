/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Webhooks Management API — `/api/webhooks`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة Webhook subscriptions:
 *   GET  /api/webhooks                  → قائمة الـ subscriptions
 *   POST /api/webhooks { type:'dispatch',...} → dispatch event (engine)
 *   POST /api/webhooks { url, events[], secret?, description? } → إنشاء جديد
 *
 *  Security:
 *   - GET/POST/PATCH: admin / owner / integration_manager فقط
 *   - secret يُخفى في GET responses (يُعرض فقط عند الإنشاء)
 *
 *  @see src/app/api/webhooks/[id]/route.ts — PATCH/DELETE
 *  @see src/app/api/webhooks/[id]/rotate-secret/route.ts
 *  @see src/lib/webhook-engine.ts — WebhookEngine.dispatch + HMAC signing
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { WebhookEngine } from '@/lib/webhook-engine';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'webhooks' });

const ALLOWED_ROLES = ['admin', 'owner', 'integration_manager'] as const;

/** أحداث Webhook المعتمدة */
const KNOWN_EVENTS = [
  'invoice.created', 'invoice.posted', 'invoice.cancelled',
  'payment.received', 'payment.failed',
  'journal.posted', 'journal.reversed',
  'inventory.low_stock', 'inventory.adjusted',
  'customer.created', 'customer.updated',
  'order.created', 'order.shipped',
  'employee.created', 'employee.terminated',
  'zatca.cleared', 'zatca.rejected',
  'pdpl.breach', 'pdpl.dsr_received',
] as const;

/** Schema لإنشاء webhook */
const CreateSchema = z.object({
  url: z.string().url('URL غير صالح'),
  events: z.array(z.string()).min(1, 'حدث واحد على الأقل'),
  description: z.string().max(500).optional().default(''),
});

/** Schema لـ dispatch */
const DispatchSchema = z.object({
  type: z.literal('dispatch'),
  subscriptionId: z.coerce.number().int().positive(),
  event: z.string(),
  payload: z.any().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET — قائمة webhooks
// ═══════════════════════════════════════════════════════════════════════════

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, auth, requestId } = ctx;

  try {
    const items = await (prisma as any).webhookSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, url: true, events: true, description: true,
        isActive: true, failCount: true, lastDeliveredAt: true, createdAt: true,
        // ⚠️ secret intentionally excluded — security
      },
    });

    log.info('Webhooks listed', { requestId, userId: auth.userId, count: items.length });

    return NextResponse.json({
      items,
      total: items.length,
      knownEvents: KNOWN_EVENTS,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Webhooks list failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب الـ webhooks', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — إنشاء webhook جديد + dispatch (نوعان حسب body.type)
// ═══════════════════════════════════════════════════════════════════════════

async function handlePost(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  // مسار dispatch
  if (body?.type === 'dispatch') {
    const parsed = DispatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات dispatch غير صحيحة', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    try {
      await WebhookEngine.dispatch(parsed.data.subscriptionId, parsed.data.event, parsed.data.payload ?? {});
      log.info('Webhook dispatched', { requestId, userId: auth.userId, subscriptionId: parsed.data.subscriptionId, event: parsed.data.event });
      return NextResponse.json({ dispatched: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل';
      log.error('Dispatch failed', { requestId, error: msg });
      return NextResponse.json({ error: 'فشل dispatch', detail: msg }, { status: 500 });
    }
  }

  // مسار create
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات الـ webhook غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // توليد secret قوي (64 chars hex)
  const secret = crypto.randomBytes(32).toString('hex');

  try {
    const subscription = await (prisma as any).webhookSubscription.create({
      data: {
        url: parsed.data.url,
        events: JSON.stringify(parsed.data.events),
        secret,
        description: parsed.data.description ?? '',
        isActive: true,
      },
    });

    await logAuditAction({
      userId: auth.userId,
      action: 'CREATE_WEBHOOK_SUBSCRIPTION',
      tableName: 'webhook_subscriptions',
      recordId: subscription.id,
      details: JSON.stringify({
        url: parsed.data.url,
        eventsCount: parsed.data.events.length,
        events: parsed.data.events,
      }),
    });

    log.info('Webhook created', { requestId, userId: auth.userId, subscriptionId: subscription.id });

    // نُرجع الـ secret مرة واحدة فقط
    return NextResponse.json({
      ...subscription,
      secret, // ⚠️ يُعرض مرة واحدة — لن يظهر مرة أخرى
      _warning: 'احفظ هذا الـ secret الآن — لن يظهر مرة أخرى',
    }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Webhook create failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل الإنشاء', detail: msg }, { status: 500 });
  }
}

export const GET = withRoute(handleGet, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});

export const POST = withRoute(handlePost, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
