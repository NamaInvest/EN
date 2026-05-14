import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { seedSocpaCoA } from '@/lib/seed-socpa-coa';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.coa.reset-to-socpa' });

async function _POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const prisma = getPrisma(request);
  const result = await seedSocpaCoA(tenantId, prisma);
  return NextResponse.json({ success: true, ...result });
}

async function _GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const prisma = getPrisma(request);

  const accounts = await (prisma as any).account.findMany({ take: 100,
    where: { tenantId },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true, nameEn: true, type: true, parentId: true },
  });

  return NextResponse.json({ accounts, total: accounts.length });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
