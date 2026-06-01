import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { FinancialStatementsEngine } from '@/lib/financial-statements-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.trial-balance' });

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
  const validate = params.get('validate') === 'true';

  if (!from || !to) {
    return NextResponse.json({ error: 'يجب تحديد from و to' }, { status: 400 });
  }

  // Parse dimensional filters
  const filters: any = {};
  const costCenterId = params.get('costCenterId');
  const profitCenterId = params.get('profitCenterId');
  const projectId = params.get('projectId');
  const segmentId = params.get('segmentId');
  const branchId = params.get('branchId');

  if (costCenterId) filters.costCenterId = Number(costCenterId);
  if (profitCenterId) filters.profitCenterId = Number(profitCenterId);
  if (projectId) filters.projectId = Number(projectId);
  if (segmentId) filters.segmentId = Number(segmentId);
  if (branchId) filters.branchId = Number(branchId);

  const engine = new FinancialStatementsEngine(prisma);
  const rows   = await engine.generateTrialBalance(tenantId, new Date(from), new Date(to), filters);

  // Fetch all active accounts of this tenant for client-side tree rollup
  const accounts = await prisma.account.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: 'asc' }
  }).catch(() => []);

  // Map transactional sums to accounts
  const txMap = new Map(rows.map(r => [r.accountCode, r]));
  const processedAccounts = accounts.map((acc: any) => {
    const tx = txMap.get(acc.code);
    const periodDebit = tx ? tx.debits.toNumber() : 0;
    const periodCredit = tx ? tx.credits.toNumber() : 0;
    
    let netBalance = 0;
    const typeLower = (acc.type || '').toLowerCase();
    if (typeLower === 'asset' || typeLower === 'expense') {
      netBalance = periodDebit - periodCredit;
    } else {
      netBalance = periodCredit - periodDebit;
    }

    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      nameEn: acc.nameEn,
      type: acc.type,
      parentId: acc.parentId,
      periodDebit,
      periodCredit,
      netBalance,
    };
  });

  const totalDebits  = rows.reduce((s, r) => s + r.debits.toNumber(), 0);
  const totalCredits = rows.reduce((s, r) => s + r.credits.toNumber(), 0);
  const isBalanced   = Math.abs(totalDebits - totalCredits) < 1;

  const result: any = {
    success: true,
    from, to,
    totalDebits, totalCredits, isBalanced,
    rows,
    accounts: processedAccounts,
  };

  if (validate) {
    const compliance = await engine.validateComplianceInvariants(tenantId, new Date(from), new Date(to));
    result.compliance = compliance;
  }

  return NextResponse.json(result);
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
