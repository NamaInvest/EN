/**
 * Financial Statements API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/accounting/financial-statements
 *
 * يُولِّد القوائم المالية الثلاث من GL المُرحَّل:
 *   ?type=INCOME_STATEMENT   — قائمة الدخل (P&L)
 *   ?type=BALANCE_SHEET      — الميزانية العمومية
 *   ?type=CASH_FLOW          — التدفقات النقدية (IAS 7 غير مباشرة)
 *   ?type=TRIAL_BALANCE      — ميزان المراجعة
 *   ?type=ALL                — جميعها
 *
 * Query params:
 *   tenantId  — required
 *   from      — YYYY-MM-DD (default: first day of current month)
 *   to        — YYYY-MM-DD (default: today)
 *   compare   — true | false (include prior year comparison)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { FinancialStatementsEngine } from '@/lib/financial-statements-engine';
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.financial-statements' });

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const tenantId = searchParams.get('tenantId') ?? 'default';
  const type     = (searchParams.get('type') ?? 'ALL').toUpperCase() as
    'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'ALL';
  const compare  = searchParams.get('compare') !== 'false';

  // Parse date range
  const now       = new Date();
  const fromParam = searchParams.get('from');
  const toParam   = searchParams.get('to');

  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), 0, 1);   // default: year start

  const to = toParam
    ? new Date(toParam + 'T23:59:59')
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Prior period (same duration, 1 year earlier)
  const priorFrom = new Date(from); priorFrom.setFullYear(from.getFullYear() - 1);
  const priorTo   = new Date(to);   priorTo.setFullYear(to.getFullYear() - 1);

  const prismaClient = getPrisma(req as any);
  const prisma = prismaClient as unknown as PrismaClient;
  const engine = new FinancialStatementsEngine(prisma);

  const result: Record<string, any> = {
    tenantId,
    from:       from.toISOString().split('T')[0],
    to:         to.toISOString().split('T')[0],
    type,
    generatedAt: now.toISOString(),
  };

  // ── Income Statement ─────────────────────────────────────────────────────────
  if (type === 'ALL' || type === 'INCOME_STATEMENT') {
    try {
      result.incomeStatement = compare
        ? await engine.generateIncomeStatement(tenantId, from, to, priorFrom, priorTo)
        : await engine.generateIncomeStatement(tenantId, from, to);
    } catch (e: any) {
      log.warn('Income statement failed', { error: e.message });
      result.incomeStatement = { error: e.message };
    }
  }

  // ── Balance Sheet ────────────────────────────────────────────────────────────
  if (type === 'ALL' || type === 'BALANCE_SHEET') {
    try {
      // generateBalanceSheet(tenantId, from, to, priorFrom?, priorTo?)
      result.balanceSheet = compare
        ? await engine.generateBalanceSheet(tenantId, from, to, priorFrom, priorTo)
        : await engine.generateBalanceSheet(tenantId, from, to);
    } catch (e: any) {
      log.warn('Balance sheet failed', { error: e.message });
      result.balanceSheet = { error: e.message };
    }
  }

  // ── Cash Flow (IAS 7 Indirect) ───────────────────────────────────────────────
  if (type === 'ALL' || type === 'CASH_FLOW') {
    try {
      const cf = await engine.generateIndirectCashFlow(tenantId, from, to);
      result.cashFlow = cf;
    } catch (e: any) {
      log.warn('Cash flow failed', { error: e.message });
      result.cashFlow = { error: e.message };
    }
  }

  // ── Trial Balance ────────────────────────────────────────────────────────────
  if (type === 'ALL' || type === 'TRIAL_BALANCE') {
    try {
      const tb = await engine.generateTrialBalance(tenantId, from, to);
      result.trialBalance = tb;
    } catch (e: any) {
      log.warn('Trial balance failed', { error: e.message });
      result.trialBalance = { error: e.message };
    }
  }

  log.info('Financial statements generated', { tenantId, type, from: result.from, to: result.to });
  return NextResponse.json(result);
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
