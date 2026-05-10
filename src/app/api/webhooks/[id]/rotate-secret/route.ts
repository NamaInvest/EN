/**
 * POST /api/webhooks/[id]/rotate-secret
 * Generates a new HMAC signing key for the webhook subscription.
 * Returns the new raw secret ONCE — store securely.
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'webhooks.id.rotate-secret' });

async function handler(ctx: any) {
  const id       = Number(ctx.params?.id);
  const prisma   = ctx.prisma as any;
  const tenantId = ctx.auth.tenantId;

  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const model = prisma.webhookSubscription ?? prisma.WebhookSubscription;
  if (!model) return NextResponse.json({ error: 'Webhooks not configured' }, { status: 503 });

  const existing = await model.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Generate new 32-byte hex secret
  const newSecret     = crypto.randomBytes(32).toString('hex');
  const newSecretHash = crypto.createHash('sha256').update(newSecret).digest('hex');

  await model.update({
    where: { id },
    data: { signingKey: newSecretHash },
  });

  return NextResponse.json({
    id,
    signingKey: newSecret, // returned ONCE — store securely
    rotatedAt: new Date().toISOString(),
    message: 'Signing key rotated. Update your webhook receiver immediately.',
  });
}

export const POST = withRoute(handler, { rateLimit: 'DEFAULT' });
