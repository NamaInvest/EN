import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { CommissionService } from '@/services/sales/commission.service';

// POST /api/sales/commissions/run
// Body: { from: '2025-01-01', to: '2025-01-31' }
async function _POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const ctx = { tenant: { id: tenantId }, user: { id: String(user.userId) } } as any;

  const { from, to } = await request.json().catch(() => ({}));
  if (!from || !to) return NextResponse.json({ error: 'يجب تحديد from و to' }, { status: 400 });

  const svc = new CommissionService(getPrisma(request), ctx);
  const result = await svc.calculateAndPostCommissions(new Date(from), new Date(to));
  return NextResponse.json({ success: true, ...result });
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
