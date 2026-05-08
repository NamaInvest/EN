import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { seedSocpaCoA } from '@/lib/seed-socpa-coa';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const prisma = getPrisma(request);
  const result = await seedSocpaCoA(tenantId, prisma);
  return NextResponse.json({ success: true, ...result });
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const prisma = getPrisma(request);

  const accounts = await (prisma as any).account.findMany({
    where: { tenantId },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, nameAr: true, name: true, type: true, parentId: true, isControl: true, controlType: true },
  });

  return NextResponse.json({ accounts, total: accounts.length });
}
