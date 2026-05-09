import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { ProvisionsService } from '@/services/payroll/provisions.service';

// POST /api/payroll/provisions/run
// Body: { period: '2025-01' }  →  يُشغَّل آخر يوم من الشهر
async function _POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const ctx = { tenant: { id: tenantId }, user: { id: String(user.userId) } } as any;

  const { period } = await request.json().catch(() => ({}));

  let asOfDate: Date;
  if (period) {
    const [year, month] = period.split('-').map(Number);
    asOfDate = new Date(year, month, 0); // آخر يوم في الشهر
  } else {
    asOfDate = new Date();
  }

  const svc = new ProvisionsService(getPrisma(request), ctx);
  const result = await svc.runMonthlyProvisions(asOfDate);
  return NextResponse.json({ success: true, ...result });
}

// GET /api/payroll/provisions/run?period=2025-01
async function _GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ info: 'استخدم POST مع { period: "YYYY-MM" } لتشغيل مخصصات الشهر' });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
