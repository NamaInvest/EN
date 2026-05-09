import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { FinancialStatementsEngine } from '@/lib/financial-statements-engine';

/**
 * GET /api/accounting/trial-balance
 * Query: ?from=2025-01-01&to=2025-12-31
 */
async function _GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const prisma   = getPrisma(request);
  const params   = request.nextUrl.searchParams;
  const from     = params.get('from');
  const to       = params.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'يجب تحديد from و to' }, { status: 400 });
  }

  const engine = new FinancialStatementsEngine(prisma);
  const rows   = await engine.generateTrialBalance(tenantId, new Date(from), new Date(to));

  const totalDebits  = rows.reduce((s, r) => s + r.debits.toNumber(), 0);
  const totalCredits = rows.reduce((s, r) => s + r.credits.toNumber(), 0);
  const isBalanced   = Math.abs(totalDebits - totalCredits) < 1;

  return NextResponse.json({
    success: true,
    from, to,
    totalDebits, totalCredits, isBalanced,
    rows,
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
