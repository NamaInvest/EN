import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { LeaseAccountingService } from '@/services/accounting/lease-accounting.service';

// POST /api/assets/leases/post-monthly
// Body: { targetMonth: '2025-01-01' }
async function _POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const ctx = { tenant: { id: tenantId }, user: { id: String(user.userId) } } as any;

  const { targetMonth } = await request.json().catch(() => ({}));
  const targetDate = targetMonth ? new Date(targetMonth) : new Date();

  const svc = new LeaseAccountingService(getPrisma(request), ctx);
  const result = await svc.postMonthlyEntries(targetDate);
  return NextResponse.json({ success: true, ...result });
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
