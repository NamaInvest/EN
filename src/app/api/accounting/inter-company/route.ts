/**
 * Inter-Company Transactions API
 * GET  /api/accounting/inter-company?tenantId=X&view=summary|detail
 * POST /api/accounting/inter-company  { action: 'post' | 'net' | 'preview' }
 *
 * يُعالج المعاملات البينية بين كيانات المجموعة:
 *   - نقل خدمات / بضائع بين شركتين
 *   - قيود متطابقة: Dr IC Receivable / Cr IC Payable في الكيانين
 *   - حلقة صافي (Netting): مقاصة الأرصدة البينية دورياً
 *   - تقرير الأرصدة البينية (IC Balances) للتدقيق
 *
 * مُصمَّم للشركات التي تعمل بـ Multi-Entity (Group Consolidation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.inter-company' });

const PostSchema = z.object({
  action:        z.enum(['post', 'preview', 'net']),
  fromTenantId:  z.string(),
  toTenantId:    z.string(),
  amount:        z.number().positive().optional(),
  currency:      z.string().default('SAR'),
  exchangeRate:  z.number().positive().default(1),
  description:   z.string().optional().default('معاملة بينية'),
  type:          z.enum(['LOAN', 'SERVICE', 'GOODS', 'DIVIDEND', 'CAPITAL', 'NETTING']).optional().default('SERVICE'),
  fiscalYearId:  z.number().int().positive().optional().default(1),
  icReceivableAccountId: z.number().int().positive().optional(),
  icPayableAccountId:    z.number().int().positive().optional(),
  userId:        z.number().int().positive().or(z.string()).transform(Number).optional().default(0),
  period:        z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
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
  const body   = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const {
    action, fromTenantId, toTenantId, amount = 0, currency, exchangeRate,
    description, type, fiscalYearId, icReceivableAccountId, icPayableAccountId, userId, period,
  } = parsed.data;

  if (fromTenantId === toTenantId) {
    return NextResponse.json({ error: 'fromTenantId and toTenantId must be different' }, { status: 400 });
  }

  const p   = getPrisma(req as any) as any;
  const now = new Date();
  const sarAmount = Math.round(amount * exchangeRate * 100) / 100;
  const postDate  = period ? new Date(`${period}-28`) : now;
  const ref       = `IC-${fromTenantId}-${toTenantId}-${now.toISOString().split('T')[0].replace(/-/g,'')}`;

  if (action === 'preview') {
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

  if (action === 'net') {
    // Netting: find all outstanding lines and zero them out
    const lines = await p.iCNettingLine?.findMany?.({
      where: {
        status: 'OPEN',
        OR: [
          { debtorTenantId: fromTenantId, creditorTenantId: toTenantId },
          { debtorTenantId: toTenantId,   creditorTenantId: fromTenantId },
        ],
      },
    }).catch(() => []) ?? [];

    const totalDebtor   = lines.filter((l: any) => l.debtorTenantId   === fromTenantId).reduce((s: number, l: any) => s + Number(l.amount ?? 0), 0);
    const totalCreditor = lines.filter((l: any) => l.creditorTenantId === fromTenantId).reduce((s: number, l: any) => s + Number(l.amount ?? 0), 0);
    const net           = Math.round((totalDebtor - totalCreditor) * 100) / 100;

    // Mark lines as netted
    for (const l of lines) {
      await p.iCNettingLine?.update?.({ where: { id: l.id }, data: { status: 'NETTED', nettedAt: now } }).catch(() => null);
    }

    log.info('IC Netting completed', { fromTenantId, toTenantId, net, lines: lines.length });

    return NextResponse.json({
      action: 'net', fromTenantId, toTenantId, ref,
      linesNetted: lines.length, netBalance: net,
      message: `✅ تمت المقاصة البينية — صافي: ${net.toLocaleString('ar-SA')} ر.س`,
    });
  }

  // action === 'post' — create mirrored journals in both entities
  const fromJournal = await p.journalEntry?.create?.({
    data: {
      tenantId: fromTenantId, fiscalYearId, date: postDate,
      description: `معاملة بينية إلى ${toTenantId}: ${description}`,
      reference: `${ref}-FROM`, status: 'POSTED',
      totalDebit: sarAmount, totalCredit: sarAmount,
      createdBy: String(userId),
      lines: {
        create: [
          { tenantId: fromTenantId, accountId: icReceivableAccountId ?? 1, side: 'DEBIT',  amount: sarAmount, description },
          { tenantId: fromTenantId, accountId: icPayableAccountId    ?? 2, side: 'CREDIT', amount: sarAmount, description },
        ],
      },
    },
    select: { id: true },
  }).catch(() => null);

  const toJournal = await p.journalEntry?.create?.({
    data: {
      tenantId: toTenantId, fiscalYearId, date: postDate,
      description: `معاملة بينية من ${fromTenantId}: ${description}`,
      reference: `${ref}-TO`, status: 'POSTED',
      totalDebit: sarAmount, totalCredit: sarAmount,
      createdBy: String(userId),
      lines: {
        create: [
          { tenantId: toTenantId, accountId: 3, side: 'DEBIT',  amount: sarAmount, description },
          { tenantId: toTenantId, accountId: 4, side: 'CREDIT', amount: sarAmount, description },
        ],
      },
    },
    select: { id: true },
  }).catch(() => null);

  // Log to ICNettingLine for future netting
  await p.iCNettingLine?.create?.({
    data: {
      debtorTenantId:    fromTenantId,
      creditorTenantId:  toTenantId,
      amount:            sarAmount,
      currency,
      type,
      description,
      reference:         ref,
      status:            'OPEN',
      fromJournalId:     fromJournal?.id,
      toJournalId:       toJournal?.id,
    },
  }).catch(() => null);

  log.info('IC transaction posted', { fromTenantId, toTenantId, sarAmount, type });

  return NextResponse.json({
    action: 'post', ref, fromTenantId, toTenantId, type, sarAmount, currency,
    fromJournalId: fromJournal?.id, toJournalId: toJournal?.id,
    message: `✅ تم ترحيل المعاملة البينية — ${sarAmount.toLocaleString('ar-SA')} ر.س`,
  }, { status: 201 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','CFO'] });
