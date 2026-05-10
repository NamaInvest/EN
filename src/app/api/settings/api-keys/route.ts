/**
 * API Keys Management — POST /api/settings/api-keys
 * Create a new API key for the tenant
 * Returns raw key ONCE (never stored plaintext)
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { generateApiKey } from '@/lib/api/api-key-auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.api-keys' });

const CreateApiKeySchema = z.object({
  name:   z.string().min(3).max(100),
  scopes: z.array(z.string()).default(['*']),
  expiresInDays: z.number().int().min(1).max(3650).optional(), // max 10 years
});

async function handler(ctx: any) {
  const body = await ctx.req.json().catch(() => ({}));
  const parsed = CreateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, scopes, expiresInDays } = parsed.data;
  const { rawKey, keyHash } = generateApiKey();

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const prisma = ctx.prisma as any;
  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId: ctx.auth.tenantId,
      name,
      keyHash,
      scopes: JSON.stringify(scopes),
      expiresAt,
      isActive: true,
    },
    select: { id: true, name: true, scopes: true, expiresAt: true, isActive: true },
  });

  return NextResponse.json({
    ...apiKey,
    // Raw key shown ONCE — store it securely
    key: rawKey,
    warning: 'هذا المفتاح لن يظهر مرة أخرى. احفظه الآن.',
  }, { status: 201 });
}

export const POST = withRoute(handler, { rateLimit: 'DEFAULT' });
