/**
 * PATCH /DELETE /api/settings/api-keys/[id]
 * Manage existing API keys (revoke or update name/scopes).
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';

const UpdateApiKeySchema = z.object({
  name:     z.string().min(3).max(100).optional(),
  scopes:   z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// ── PATCH /api/settings/api-keys/[id] ────────────────────────────────────────
async function patchHandler(ctx: any) {
  const id       = Number(ctx.params?.id);
  const prisma   = ctx.prisma as any;
  const tenantId = ctx.auth.tenantId;

  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body   = await ctx.req.json().catch(() => ({}));
  const parsed = UpdateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.apiKey?.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.apiKey.update({
    where: { id },
    data: {
      ...(parsed.data.name     !== undefined && { name: parsed.data.name }),
      ...(parsed.data.scopes   !== undefined && { scopes: JSON.stringify(parsed.data.scopes) }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    select: { id: true, name: true, isActive: true, createdAt: true, expiresAt: true },
  });

  return NextResponse.json(updated);
}

// ── DELETE /api/settings/api-keys/[id] ───────────────────────────────────────
async function deleteHandler(ctx: any) {
  const id       = Number(ctx.params?.id);
  const prisma   = ctx.prisma as any;
  const tenantId = ctx.auth.tenantId;

  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.apiKey?.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Soft-revoke: set isActive=false (preserve audit trail)
  await prisma.apiKey.update({
    where: { id },
    data: { isActive: false, revokedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: 'API key revoked' });
}

export const PATCH  = withRoute(patchHandler,  { rateLimit: 'DEFAULT' });
export const DELETE = withRoute(deleteHandler, { rateLimit: 'DEFAULT' });
