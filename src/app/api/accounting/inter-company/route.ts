import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { logger } from '@/lib/logger';
import { InterCompanyService, ICPayloadSchema } from '@/lib/services/inter-company.service';
import { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } from '@/lib/idempotency';
import { getUserFromRequest } from '@/lib/auth';
import { buildOverrideContextFromRequest } from '@/lib/governance/override-context';

const log = logger.child({ service: 'api.inter-company' });

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = requireTenantId(req as any);
  const view     = searchParams.get('view') ?? 'summary';
  const p        = getPrisma(req as any) as any;

  // Fetch IC netting cycles for this tenant
  const nettingCycles = await p.iCNettingCycle?.findMany?.({
    where: { OR: [{ tenantId }, { counterpartyTenantId: tenantId }] },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }).catch(() => []) ?? [];

  // Fetch IC netting lines
  const nettingLines = await p.iCNettingLine?.findMany?.({
    where: { OR: [{ debtorTenantId: tenantId }, { creditorTenantId: tenantId }] },
    orderBy: { createdAt: 'desc' },
    take: 500,
  }).catch(() => []) ?? [];

  // Aggregate by counterparty
  const balanceMap = new Map<string, { receivable: number; payable: number }>();
  for (const l of nettingLines) {
    const counterparty = l.debtorTenantId === tenantId ? l.creditorTenantId : l.debtorTenantId;
    const key          = String(counterparty);
    const entry        = balanceMap.get(key) ?? { receivable: 0, payable: 0 };
    if (l.debtorTenantId === tenantId)   entry.payable    += Number(l.amount ?? 0);
    else                                  entry.receivable += Number(l.amount ?? 0);
    balanceMap.set(key, entry);
  }

  const balances = Array.from(balanceMap.entries()).map(([counterparty, b]) => ({
    counterparty,
    receivable: Math.round(b.receivable * 100) / 100,
    payable:    Math.round(b.payable    * 100) / 100,
    net:        Math.round((b.receivable - b.payable) * 100) / 100,
    position:   b.receivable >= b.payable ? 'NET_RECEIVABLE' : 'NET_PAYABLE',
  }));

  const totalReceivable = balances.reduce((s, b) => s + b.receivable, 0);
  const totalPayable    = balances.reduce((s, b) => s + b.payable, 0);

  return NextResponse.json({
    tenantId, view,
    summary: {
      counterparties:   balances.length,
      totalReceivable:  Math.round(totalReceivable * 100) / 100,
      totalPayable:     Math.round(totalPayable    * 100) / 100,
      netBalance:       Math.round((totalReceivable - totalPayable) * 100) / 100,
      position:         totalReceivable >= totalPayable ? 'NET_RECEIVABLE' : 'NET_PAYABLE',
    },
    balances,
    ...(view === 'detail' ? { nettingCycles, nettingLines } : {}),
    generatedAt: new Date().toISOString(),
  });
}

async function _POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const body   = await req.json();
  const prisma = getPrisma(req as any);
  
  const auth = getUserFromRequest(req as any);
  const overrideContext = buildOverrideContextFromRequest(req as any, {
      tenantId: tenantId,
      actorId: String(auth?.userId || '0'),
      actorRole: auth?.role || 'USER'
  });

  if (body.action === 'preview') {
      const parsed = ICPayloadSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
      const { fromTenantId, toTenantId, amount = 0, currency, exchangeRate, description, type, icReceivableAccountId, icPayableAccountId } = parsed.data;
      const sarAmount = Math.round(amount * exchangeRate * 100) / 100;
      return NextResponse.json({
        action: 'preview',
        fromTenantId, toTenantId, type,
        amount, currency, exchangeRate, sarAmount,
        journals: [
          {
            tenantId: fromTenantId, description: `معاملة بينية إلى ${toTenantId}: ${description}`,
            lines: [
              { side: 'DEBIT',  account: icReceivableAccountId ?? 'IC Receivable (1xxx)', amount: sarAmount },
              { side: 'CREDIT', account: icPayableAccountId    ?? 'IC Revenue/Payable',   amount: sarAmount },
            ],
          },
          {
            tenantId: toTenantId, description: `معاملة بينية من ${fromTenantId}: ${description}`,
            lines: [
              { side: 'DEBIT',  account: 'IC Expense/Receivable', amount: sarAmount },
              { side: 'CREDIT', account: 'IC Payable (2xxx)',      amount: sarAmount },
            ],
          },
        ],
      });
  }

  const idempotencyKey = req.headers.get('x-idempotency-key');
  if (!idempotencyKey) {
      return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
  }

  const isUnique = await lockIdempotencyKey(tenantId, 'inter_company_post', idempotencyKey);
  if (!isUnique) {
      return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
  }

  try {
      const result = await InterCompanyService.processICAction(prisma, body, tenantId, overrideContext);
      await completeIdempotencyKey(tenantId, 'inter_company_post', idempotencyKey);
      return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
      await unlockIdempotencyKey(tenantId, 'inter_company_post', idempotencyKey);
      log.error('InterCompany post error', { error: error.message });
      return NextResponse.json({ error: error.message || 'فشل في تنفيذ المعاملة البينية' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','CFO'] });
