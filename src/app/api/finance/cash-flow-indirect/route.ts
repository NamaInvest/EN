import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { FinancialStatementsEngine } from '@/lib/financial-statements-engine';
import prisma from '@/lib/prisma';

/**
 * GET /api/finance/cash-flow-indirect?tenantId=x&from=2026-01-01&to=2026-03-31
 *
 * Returns the Cash Flow Statement using the Indirect Method (IAS 7.18b).
 * Required by banks and auditors alongside the direct method.
 */
async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const from     = searchParams.get('from') ?? `${new Date().getFullYear()}-01-01`;
  const to       = searchParams.get('to')   ?? new Date().toISOString().split('T')[0];

  const engine = new FinancialStatementsEngine(prisma as any);
  const result = await engine.generateIndirectCashFlow(
    tenantId,
    new Date(from),
    new Date(to),
  );

  // Serialize Decimal values for JSON
  const serialize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj?.toNumber === 'function') return obj.toNumber();
    if (Array.isArray(obj)) return obj.map(serialize);
    if (typeof obj === 'object') {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
    }
    return obj;
  };

  return NextResponse.json({
    method:  'INDIRECT',
    period:  { from, to },
    tenantId,
    ...serialize(result),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
