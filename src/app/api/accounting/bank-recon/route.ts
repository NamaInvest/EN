/**
 * Bank Reconciliation Export API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/accounting/bank-recon?tenantId=X&bankAccountId=Y&from=&to=&format=csv|json
 *
 * يُصدِّر تقرير المقارنة بين:
 *   - رصيد دفتر الأستاذ (GL)
 *   - رصيد كشف الحساب البنكي
 *
 * يعرض:
 *   - المعاملات المطابقة     (Matched)
 *   - في الدفتر لكن ليست في البنك  (In GL, Not in Bank)
 *   - في البنك لكن ليست في الدفتر (In Bank, Not in GL)
 *   - الفارق النهائي
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.bank-recon' });

interface ReconLine {
  date:        string;
  description: string;
  reference:   string;
  glAmount:    number | null;
  bankAmount:  number | null;
  status:      'MATCHED' | 'GL_ONLY' | 'BANK_ONLY' | 'DIFFERENCE';
  difference:  number;
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId      = searchParams.get('tenantId') ?? 'default';
  const bankAccountId = parseInt(searchParams.get('bankAccountId') ?? '0');
  const fromStr       = searchParams.get('from');
  const toStr         = searchParams.get('to');
  const format        = (searchParams.get('format') ?? 'json').toLowerCase() as 'csv' | 'json';
  const now           = new Date();
  const from          = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to            = toStr   ? new Date(toStr + 'T23:59:59') : now;

  if (!bankAccountId) {
    return NextResponse.json({ error: 'bankAccountId مطلوب' }, { status: 400 });
  }

  const p = getPrisma(req as any) as any;

  // ── GL transactions for the bank account ─────────────────────────────────
  const glLines = await p.journalEntryLine?.findMany?.({
    where: {
      tenantId,
      accountId:     bankAccountId,
      journalEntry: { date: { gte: from, lte: to }, status: 'POSTED' },
    },
    include: {
      journalEntry: { select: { date: true, reference: true, description: true } },
    },
    orderBy: { journalEntry: { date: 'asc' } },
  }).catch(() => []) ?? [];

  // ── Bank statement transactions ────────────────────────────────────────────
  const bankTxns = await p.bankTransaction?.findMany?.({
    where: { tenantId, bankAccountId, date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  }).catch(() => []) ?? [];

  // ── Build GL balance ────────────────────────────────────────────────────
  let glBalance = 0;
  const glMap = new Map<string, { amount: number; date: string; description: string }>();

  for (const line of glLines) {
    const amount = line.side === 'DEBIT' ? Number(line.amount ?? 0) : -Number(line.amount ?? 0);
    glBalance += amount;
    const key = line.journalEntry?.reference ?? `GL-${line.id}`;
    const existing = glMap.get(key);
    glMap.set(key, {
      amount:      (existing?.amount ?? 0) + amount,
      date:        line.journalEntry?.date?.toISOString?.()?.split?.('T')?.[0] ?? '',
      description: line.journalEntry?.description ?? '',
    });
  }

  // ── Build bank balance ─────────────────────────────────────────────────
  let bankBalance = 0;
  const bankMap = new Map<string, { amount: number; date: string; description: string }>();

  for (const txn of bankTxns) {
    const amount = Number(txn.credit ?? 0) - Number(txn.debit ?? 0);
    bankBalance += amount;
    const key = txn.reference ?? `BANK-${txn.id}`;
    bankMap.set(key, {
      amount,
      date:        txn.date?.toISOString?.()?.split?.('T')?.[0] ?? '',
      description: txn.description ?? txn.narration ?? '',
    });
  }

  // ── Reconcile ─────────────────────────────────────────────────────────────
  const reconLines: ReconLine[] = [];
  const allKeys = new Set([...glMap.keys(), ...bankMap.keys()]);

  for (const key of allKeys) {
    const gl   = glMap.get(key);
    const bank = bankMap.get(key);
    const diff = Math.round(((gl?.amount ?? 0) - (bank?.amount ?? 0)) * 100) / 100;
    const date = gl?.date ?? bank?.date ?? '';

    let status: ReconLine['status'];
    if (gl && bank && Math.abs(diff) < 0.01) {
      status = 'MATCHED';
    } else if (gl && !bank) {
      status = 'GL_ONLY';
    } else if (!gl && bank) {
      status = 'BANK_ONLY';
    } else {
      status = 'DIFFERENCE';
    }

    reconLines.push({
      date,
      description: gl?.description ?? bank?.description ?? '',
      reference:   key,
      glAmount:    gl   ? Math.round((gl.amount   ?? 0) * 100) / 100 : null,
      bankAmount:  bank ? Math.round((bank.amount ?? 0) * 100) / 100 : null,
      status,
      difference:  diff,
    });
  }

  reconLines.sort((a, b) => a.date.localeCompare(b.date));

  const summary = {
    glBalance:         Math.round(glBalance   * 100) / 100,
    bankBalance:       Math.round(bankBalance * 100) / 100,
    netDifference:     Math.round((glBalance - bankBalance) * 100) / 100,
    isReconciled:      Math.abs(glBalance - bankBalance) < 0.01,
    matchedCount:      reconLines.filter(r => r.status === 'MATCHED').length,
    glOnlyCount:       reconLines.filter(r => r.status === 'GL_ONLY').length,
    bankOnlyCount:     reconLines.filter(r => r.status === 'BANK_ONLY').length,
    differenceCount:   reconLines.filter(r => r.status === 'DIFFERENCE').length,
  };

  log.info('Bank recon generated', { tenantId, bankAccountId, ...summary });

  if (format === 'csv') {
    const header = 'date,reference,description,glAmount,bankAmount,status,difference\n';
    const rows   = reconLines.map(r =>
      `"${r.date}","${r.reference}","${r.description.replace(/"/g, '""')}","${r.glAmount ?? ''}","${r.bankAmount ?? ''}","${r.status}","${r.difference}"`
    ).join('\n');
    return new NextResponse(header + rows, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bank_recon_${bankAccountId}_${from.toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    tenantId,
    bankAccountId,
    period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
    summary,
    reconLines,
    generatedAt: new Date().toISOString(),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', roles: ['admin','accountant','CFO'] });
