import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { FinancialStatementsEngine } from '@/lib/financial-statements-engine';
import { z } from 'zod';

/**
 * POST /api/reports/financial-statements/generate
 * Body: { type: 'BS'|'IS'|'CF'|'TB', from, to, priorFrom?, priorTo? }
 */

const _POSTSchema = z.object({
  type: z.any().optional(),
  from: z.any().optional(),
  to: z.any().optional(),
  priorFrom: z.any().optional(),
  priorTo: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId ?? 'default';
  const prisma   = getPrisma(request);

  const body = await request.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
  const { type = 'BS', from, to, priorFrom, priorTo } = body;

  if (!from || !to) {
    return NextResponse.json({ error: 'من فضلك حدد from و to' }, { status: 400 });
  }

  const engine = new FinancialStatementsEngine(prisma);
  const fromDate     = new Date(from);
  const toDate       = new Date(to);
  const priorFromDt  = priorFrom ? new Date(priorFrom) : undefined;
  const priorToDt    = priorTo   ? new Date(priorTo)   : undefined;

  try {
    let result: any;
    switch (type) {
      case 'BS':
        result = await engine.generateBalanceSheet(tenantId, fromDate, toDate, priorFromDt, priorToDt);
        break;
      case 'IS':
        result = await engine.generateIncomeStatement(tenantId, fromDate, toDate, priorFromDt, priorToDt);
        break;
      case 'CF':
        result = await engine.generateCashFlow(tenantId, fromDate, toDate);
        break;
      case 'TB':
        result = await engine.generateTrialBalance(tenantId, fromDate, toDate);
        break;
      default:
        return NextResponse.json({ error: `نوع غير معروف: ${type}. استخدم BS | IS | CF | TB` }, { status: 400 });
    }

    return NextResponse.json({ success: true, type, from, to, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/reports/financial-statements/generate
 * Query: ?type=TB&from=2025-01-01&to=2025-12-31
 */
async function _GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId  = user.tenantId ?? 'default';
  const prisma    = getPrisma(request);
  const params    = request.nextUrl.searchParams;
  const type      = params.get('type') ?? 'TB';
  const from      = params.get('from');
  const to        = params.get('to');

  if (!from || !to) return NextResponse.json({ error: 'من فضلك حدد from و to' }, { status: 400 });

  const engine = new FinancialStatementsEngine(prisma);
  const result = type === 'TB'
    ? await engine.generateTrialBalance(tenantId, new Date(from), new Date(to))
    : await engine.generateBalanceSheet(tenantId, new Date(from), new Date(to));

  return NextResponse.json({ success: true, type, data: result });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
