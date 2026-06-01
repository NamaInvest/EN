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
 *   format    — json | xlsx | pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { logAuditEvent } from '@/lib/audit-trail';
import { FinancialStatementsEngine } from '@/lib/financial-statements-engine';
import type { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '@/lib/logger';
import { ExcelService, ExcelColumn } from '@/lib/excel-service';
import { PDFService } from '@/lib/pdf-service';

const log = logger.child({ service: 'api.financial-statements' });

interface DimensionalFilters {
  costCenterId?: number;
  profitCenterId?: number;
  projectId?: number;
  segmentId?: number;
  branchId?: number;
}

interface StatementLine {
  label: string;
  section: string;
  currentPeriod: unknown;
  priorPeriod?: unknown;
}

async function _GET(req: NextRequest, ctx: RouteContext) {
  const { searchParams } = new URL(req.url);

  const tenantId = ctx.tenant;
  const type     = (searchParams.get('type') ?? 'ALL').toUpperCase() as
    'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'ALL';
  const compareParam = searchParams.get('compare');
  const compare = compareParam === 'true';

  const compareFromParam = searchParams.get('compareFrom');
  const compareToParam = searchParams.get('compareTo');

  const format   = (searchParams.get('format') ?? 'json').toLowerCase() as 'json' | 'xlsx' | 'pdf' | 'csv';

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

  // Prior period (same duration, 1 year earlier or explicitly requested)
  const priorFrom = compareFromParam
    ? new Date(compareFromParam)
    : (() => {
        const d = new Date(from);
        d.setFullYear(from.getFullYear() - 1);
        return d;
      })();

  const priorTo = compareToParam
    ? new Date(compareToParam + 'T23:59:59')
    : (() => {
        const d = new Date(to);
        d.setFullYear(to.getFullYear() - 1);
        return d;
      })();

  // Parse dimensional filters
  const filters: DimensionalFilters = {};
  const costCenterId = searchParams.get('costCenterId');
  const profitCenterId = searchParams.get('profitCenterId');
  const projectId = searchParams.get('projectId');
  const segmentId = searchParams.get('segmentId');
  const branchId = searchParams.get('branchId');

  if (costCenterId) filters.costCenterId = Number(costCenterId);
  if (profitCenterId) filters.profitCenterId = Number(profitCenterId);
  if (projectId) filters.projectId = Number(projectId);
  if (segmentId) filters.segmentId = Number(segmentId);
  if (branchId) filters.branchId = Number(branchId);

  const prisma = ctx.prisma as unknown as PrismaClient;
  const engine = new FinancialStatementsEngine(prisma);

  const result: Record<string, unknown> = {
    tenantId,
    from:       from.toISOString().split('T')[0],
    to:         to.toISOString().split('T')[0],
    type,
    generatedAt: now.toISOString(),
  };

  if (compare) {
    result.comparison = {
      enabled: true,
      mode: 'previous-period',
      period: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
      comparativePeriod: {
        from: priorFrom.toISOString().split('T')[0],
        to: priorTo.toISOString().split('T')[0],
      }
    };
  }

  // ── Trial Balance ────────────────────────────────────────────────────────────
  if (type === 'ALL' || type === 'TRIAL_BALANCE') {
    try {
      if (compare) {
        const [currentTB, priorTB] = await Promise.all([
          engine.generateTrialBalance(tenantId, from, to, filters),
          engine.generateTrialBalance(tenantId, priorFrom, priorTo, filters)
        ]);

        const priorMap = new Map(priorTB.map(r => [r.accountCode, r]));
        const allCodes = Array.from(new Set([
          ...currentTB.map(r => r.accountCode),
          ...priorTB.map(r => r.accountCode)
        ])).sort((a, b) => a.localeCompare(b));

        const mergedTB = allCodes.map(code => {
          const cur = currentTB.find(r => r.accountCode === code);
          const pri = priorMap.get(code);

          const accountName = cur?.accountName ?? pri?.accountName ?? '';
          const debits = cur?.debits ?? new Decimal(0);
          const credits = cur?.credits ?? new Decimal(0);
          const net = cur?.net ?? new Decimal(0);

          const priorDebits = pri?.debits ?? new Decimal(0);
          const priorCredits = pri?.credits ?? new Decimal(0);
          const priorNet = pri?.net ?? new Decimal(0);

          const varianceAmount = net.sub(priorNet);
          const variancePercent = priorNet.isZero()
            ? (net.isZero() ? new Decimal(0) : null)
            : varianceAmount.div(priorNet.abs()).mul(100).toDecimalPlaces(1);

          return {
            accountCode: code,
            accountName,
            debits,
            credits,
            net,
            priorDebits,
            priorCredits,
            priorNet,
            varianceAmount,
            variancePercent
          };
        });

        result.trialBalance = mergedTB;
      } else {
        const tb = await engine.generateTrialBalance(tenantId, from, to, filters);
        result.trialBalance = tb;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Trial balance failed', { error: msg });
      result.trialBalance = { error: msg };
    }
  }

  // ── Income Statement ─────────────────────────────────────────────────────────
  if (type === 'ALL' || type === 'INCOME_STATEMENT') {
    try {
      result.incomeStatement = compare
        ? await engine.generateIncomeStatement(tenantId, from, to, priorFrom, priorTo, filters)
        : await engine.generateIncomeStatement(tenantId, from, to, undefined, undefined, filters);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Income statement failed', { error: msg });
      result.incomeStatement = { error: msg };
    }
  }

  // ── Balance Sheet ────────────────────────────────────────────────────────────
  if (type === 'ALL' || type === 'BALANCE_SHEET') {
    try {
      result.balanceSheet = compare
        ? await engine.generateBalanceSheet(tenantId, from, to, priorFrom, priorTo, filters)
        : await engine.generateBalanceSheet(tenantId, from, to, undefined, undefined, filters);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Balance sheet failed', { error: msg });
      result.balanceSheet = { error: msg };
    }
  }

  // ── Cash Flow (IAS 7 Indirect) ───────────────────────────────────────────────
  if (type === 'ALL' || type === 'CASH_FLOW') {
    try {
      const cf = await engine.generateIndirectCashFlow(tenantId, from, to, filters);
      result.cashFlow = cf;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Cash flow failed', { error: msg });
      result.cashFlow = { error: msg };
    }
  }

  const generatedFrom = result.from as string;
  const generatedTo = result.to as string;
  log.info('Financial statements generated', { tenantId, type, from: generatedFrom, to: generatedTo });

  let response: Response;

  // ── EXPORT Excel (XLSX) ──────────────────────────────────────────────────────
  if (format === 'xlsx') {
    let sheetData: unknown[] = [];
    let columns: ExcelColumn[] = [];
    let sheetName = 'Report';

    const getVal = (val: unknown): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as { toNumber: unknown }).toNumber === 'function') {
        return (val as { toNumber: () => number }).toNumber();
      }
      return Number(val);
    };

    if (type === 'TRIAL_BALANCE' && Array.isArray(result.trialBalance)) {
      sheetName = 'Trial Balance';
      columns = [
        { header: 'كود الحساب', key: 'code', width: 15 },
        { header: 'اسم الحساب', key: 'name', width: 30 },
        { header: 'حركات مدين', key: 'debits', width: 20 },
        { header: 'حركات دائن', key: 'credits', width: 20 },
        { header: 'صافي الرصيد', key: 'balance', width: 20 }
      ];
      sheetData = result.trialBalance.map((r: { accountCode: string; accountName: string; debits: unknown; credits: unknown; balance: unknown }) => ({
        code: r.accountCode,
        name: r.accountName,
        debits: getVal(r.debits),
        credits: getVal(r.credits),
        balance: getVal(r.balance)
      }));
    } else if (type === 'INCOME_STATEMENT' && result.incomeStatement && typeof result.incomeStatement === 'object' && 'lines' in result.incomeStatement && Array.isArray((result.incomeStatement as { lines: unknown }).lines)) {
      sheetName = 'Income Statement';
      columns = [
        { header: 'الحساب الفئة', key: 'name', width: 35 },
        { header: 'نوع القائمة', key: 'section', width: 20 },
        { header: 'الرصيد الحالي', key: 'amount', width: 20 },
        { header: 'الفترة السابقة', key: 'compare', width: 20 }
      ];
      sheetData = ((result.incomeStatement as { lines: StatementLine[] }).lines).map((l: StatementLine) => ({
        name: l.label,
        section: l.section,
        amount: getVal(l.currentPeriod),
        compare: l.priorPeriod !== undefined && l.priorPeriod !== null ? getVal(l.priorPeriod) : null
      }));
    } else if (type === 'BALANCE_SHEET' && result.balanceSheet && typeof result.balanceSheet === 'object' && 'lines' in result.balanceSheet && Array.isArray((result.balanceSheet as { lines: unknown }).lines)) {
      sheetName = 'Balance Sheet';
      columns = [
        { header: 'الحساب الفئة', key: 'name', width: 35 },
        { header: 'نوع المركز المالي', key: 'section', width: 20 },
        { header: 'الرصيد الحالي', key: 'balance', width: 20 },
        { header: 'الفترة السابقة', key: 'compare', width: 20 }
      ];
      sheetData = ((result.balanceSheet as { lines: StatementLine[] }).lines).map((l: StatementLine) => ({
        name: l.label,
        section: l.section,
        balance: getVal(l.currentPeriod),
        compare: l.priorPeriod !== undefined && l.priorPeriod !== null ? getVal(l.priorPeriod) : null
      }));
    }

    const excelBuffer = await ExcelService.export(sheetData, {
      sheetName,
      rtl: true,
      columns
    });

    response = new Response(new Uint8Array(excelBuffer) as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type.toLowerCase()}_${generatedTo}.xlsx"`,
      }
    });
  }
  // ── EXPORT PDF (Puppeteer HTML-to-PDF) ───────────────────────────────────────
  else if (format === 'pdf') {
    const fmt = (n: unknown) => {
      const val = typeof n === 'object' && n !== null && 'toNumber' in n && typeof (n as { toNumber: unknown }).toNumber === 'function'
        ? (n as { toNumber: () => number }).toNumber()
        : Number(n || 0);
      return `${val.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`;
    };

    let tableRowsHtml = '';
    let reportTitle = '';
    let summaryCardsHtml = '';

    if (type === 'TRIAL_BALANCE' && Array.isArray(result.trialBalance)) {
      reportTitle = '⚖️ ميزان المراجعة (Trial Balance)';
      tableRowsHtml = result.trialBalance.map((r: { accountCode: string; accountName: string; debits: unknown; credits: unknown; balance: unknown }) => `
        <tr>
          <td style="font-family: monospace; color: #64748b;">${r.accountCode}</td>
          <td style="font-weight: 600;">${r.accountName}</td>
          <td class="text-left font-mono">${fmt(r.debits)}</td>
          <td class="text-left font-mono">${fmt(r.credits)}</td>
          <td class="text-left font-mono" style="font-weight: bold; color: ${Number(r.balance || 0) >= 0 ? '#10b981' : '#f43f5e'};">${fmt(r.balance)}</td>
        </tr>
      `).join('');
    } else if (type === 'INCOME_STATEMENT' && result.incomeStatement && typeof result.incomeStatement === 'object' && 'lines' in result.incomeStatement && Array.isArray((result.incomeStatement as { lines: unknown }).lines)) {
      const statement = result.incomeStatement as { lines: StatementLine[]; grossProfit: unknown; operatingProfit: unknown; netProfit: unknown };
      reportTitle = '📈 قائمة الدخل (Income Statement)';
      tableRowsHtml = statement.lines.map((l: StatementLine) => `
        <tr>
          <td style="font-weight: bold; color: #475569;">${l.section}</td>
          <td style="font-weight: 600;">${l.label}</td>
          <td class="text-left font-mono" style="font-weight: bold;">${fmt(l.currentPeriod)}</td>
          <td class="text-left font-mono" style="color: #64748b;">${l.priorPeriod !== undefined && l.priorPeriod !== null ? fmt(l.priorPeriod) : '-'}</td>
        </tr>
      `).join('');

      summaryCardsHtml = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
          <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: #3b82f6; font-weight: bold; text-transform: uppercase;">مجمل الربح</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px; font-family: monospace;">${fmt(statement.grossProfit)}</div>
          </div>
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: #d97706; font-weight: bold; text-transform: uppercase;">Operating EBIT</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px; font-family: monospace;">${fmt(statement.operatingProfit)}</div>
          </div>
          <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: #10b981; font-weight: bold; text-transform: uppercase;">صافي الربح</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px; font-family: monospace;">${fmt(statement.netProfit)}</div>
          </div>
        </div>
      `;
    } else if (type === 'BALANCE_SHEET' && result.balanceSheet && typeof result.balanceSheet === 'object' && 'lines' in result.balanceSheet && Array.isArray((result.balanceSheet as { lines: unknown }).lines)) {
      const sheet = result.balanceSheet as { lines: StatementLine[]; totalAssets: unknown; totalLiabilities: unknown; totalEquity: unknown };
      reportTitle = '⚖️ الميزانية العمومية (Balance Sheet)';
      tableRowsHtml = sheet.lines.map((l: StatementLine) => `
        <tr>
          <td style="font-weight: bold; color: #475569;">${l.section}</td>
          <td style="font-weight: 600;">${l.label}</td>
          <td class="text-left font-mono" style="font-weight: bold;">${fmt(l.currentPeriod)}</td>
          <td class="text-left font-mono" style="color: #64748b;">${l.priorPeriod !== undefined && l.priorPeriod !== null ? fmt(l.priorPeriod) : '-'}</td>
        </tr>
      `).join('');

      summaryCardsHtml = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
          <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: #3b82f6; font-weight: bold; text-transform: uppercase;">إجمالي الأصول</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px; font-family: monospace;">${fmt(sheet.totalAssets)}</div>
          </div>
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: #ef4444; font-weight: bold; text-transform: uppercase;">إجمالي الخصوم</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px; font-family: monospace;">${fmt(sheet.totalLiabilities)}</div>
          </div>
          <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: #10b981; font-weight: bold; text-transform: uppercase;">حقوق الملكية</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px; font-family: monospace;">${fmt(sheet.totalEquity)}</div>
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 25px; color: #1e293b; background-color: #ffffff; line-height: 1.5; }
          .header { border-bottom: 3px solid #4f46e5; padding-bottom: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: bold; color: #1e1b4b; }
          .meta { font-size: 11px; color: #64748b; text-align: left; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: bold; padding: 8px 10px; text-align: right; }
          td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; }
          .text-left { text-align: left; }
          .font-mono { font-family: monospace; }
          .footer { margin-top: 45px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${reportTitle}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">شركة نماء للاستثمار - Tenant: ${tenantId}</div>
          </div>
          <div class="meta">
            <div>تاريخ التوليد: ${new Date().toLocaleDateString('ar-SA')}</div>
            <div>الفترة: من ${generatedFrom} إلى ${generatedTo}</div>
          </div>
        </div>

        ${summaryCardsHtml}

        <table>
          <thead>
            <tr>
              ${type === 'TRIAL_BALANCE' ? `
                <th style="width: 15%;">كود الحساب</th>
                <th>اسم الحساب</th>
                <th class="text-left" style="width: 20%;">مدين</th>
                <th class="text-left" style="width: 20%;">دائن</th>
                <th class="text-left" style="width: 20%;">صافي الرصيد</th>
              ` : `
                <th style="width: 20%;">القسم المحاسبي</th>
                <th>الحساب الفئة</th>
                <th class="text-left" style="width: 25%;">الرصيد الحالي</th>
                <th class="text-left" style="width: 25%;">الفترة السابقة</th>
              `}
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>هذا التقرير مُولَّد آلياً من نظام Nama Invest ERP الموحد وهو متوافق بالكامل مع معايير SOCPA و IFRS للمملكة العربية السعودية.</div>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await PDFService.generate(htmlContent, { format: 'A4' });

    response = new Response(new Uint8Array(pdfBuffer) as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${type.toLowerCase()}_${generatedTo}.pdf"`,
      }
    });
  }
  // Standard JSON response
  else {
    response = NextResponse.json(result);
  }

  // ── Audit Trail Logging ──────────────────────────────────────────────────────
  try {
    const filtersSummary = {
      branchId: filters.branchId,
      costCenterId: filters.costCenterId,
      projectId: filters.projectId,
      segmentId: filters.segmentId,
    };

    await logAuditEvent(prisma, {
      tenantId: ctx.tenant,
      userId: ctx.auth.userId || null,
      action: 'EXECUTE',
      entityType: 'FINANCIAL_REPORT',
      entityId: type,
      route: '/api/accounting/financial-statements',
      metadata: {
        reportType: type,
        format,
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
        compare,
        filters: filtersSummary,
        generatedAt: now.toISOString(),
        hasExport: format !== 'json',
        source: 'financial-statements-route',
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.warn('Financial report audit trail failed', {
      tenantId: ctx.tenant,
      reportType: type,
      format,
      error: errorMsg,
    });
  }

  return response;
}

export const GET = withRoute(async (ctx) => _GET(ctx.req as unknown as NextRequest, ctx), { rateLimit: 'DEFAULT' });
