/**
 * API Keys List/Revoke — GET/DELETE /api/settings/api-keys/[id]
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { invalidateApiKeyCache } from '@/lib/api/api-key-auth';

async function getHandler(ctx: any, { params }: any) {
  const { id } = await params;
  const prisma = ctx.prisma as any;

  const keys = await prisma.apiKey.findMany({
    where: { tenantId: ctx.auth.tenantId },
    select: { id: true, name: true, scopes: true, expiresAt: true, lastUsedAt: true, isActive: true },
    orderBy: { id: 'desc' },
  });

  return NextResponse.json(keys);
}

async function deleteHandler(ctx: any, { params }: any) {
  const { id } = await params;
  const keyId = parseInt(id);
  if (isNaN(keyId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const prisma = ctx.prisma as any;

  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, tenantId: ctx.auth.tenantId },
  });
  if (!key) return NextResponse.json({ error: 'API key not found' }, { status: 404 });

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });

  // Invalidate all cached entries (safe: will refetch from DB)
  invalidateApiKeyCache();

  return NextResponse.json({ success: true, message: 'API key revoked successfully' });
}

export const GET    = withRoute(getHandler,    { rateLimit: 'DEFAULT' });
export const DELETE = withRoute(deleteHandler, { rateLimit: 'DEFAULT' });
