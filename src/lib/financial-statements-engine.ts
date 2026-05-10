/**
 * FinancialStatementsEngine — مولّد القوائم المالية
 *
 * يُنتج من JournalLine المُرحَّل:
 *   1. الميزانية العمومية (Balance Sheet) — IAS 1
 *   2. قائمة الدخل (Income Statement)
 *   3. التدفقات النقدية (Cash Flow) — IAS 7 / الطريقة غير المباشرة
 *
 * الخريطة: كود الحساب → سطر القائمة المالية (مُعرَّف في ACCOUNT_MAPPING)
 * المعيار: SOCPA + IFRS
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.financial-st' });

// ─── خريطة الحسابات إلى سطور القوائم المالية ─────────────────────────────────
// كل إدخال: { from, to } رقمي → FS section
const BS_MAPPING: { from: string; to: string; section: string; label: string; sign: 1 | -1 }[] = [
  // Assets
  { from: '1110', to: '1119', section: 'CURRENT_ASSETS',     label: 'النقدية وما في حكمها',             sign: 1 },
  { from: '1200', to: '1299', section: 'CURRENT_ASSETS',     label: 'الذمم المدينة (صافي)',               sign: 1 },
  { from: '1300', to: '1329', section: 'CURRENT_ASSETS',     label: 'المخزون',                            sign: 1 },
  { from: '1330', to: '1339', section: 'CURRENT_ASSETS',     label: 'ضريبة القيمة المضافة المدخلة',       sign: 1 },
  { from: '1340', to: '1399', section: 'CURRENT_ASSETS',     label: 'أصول متداولة أخرى',                  sign: 1 },
  { from: '1400', to: '1499', section: 'NON_CURRENT_ASSETS', label: 'الأصول غير المتداولة',               sign: 1 },
  // Liabilities
  { from: '2100', to: '2199', section: 'CURRENT_LIAB',       label: 'الخصوم المتداولة',                   sign: 1 },
  { from: '2200', to: '2299', section: 'CURRENT_LIAB',       label: 'ديون قصيرة الأجل',                   sign: 1 },
  { from: '2300', to: '2399', section: 'CURRENT_LIAB',       label: 'مستحقات تشغيلية',                    sign: 1 },
  { from: '2400', to: '2499', section: 'CURRENT_LIAB',       label: 'مخصصات',                             sign: 1 },
  { from: '2500', to: '2699', section: 'NON_CURRENT_LIAB',   label: 'الخصوم غير المتداولة',               sign: 1 },
  // Equity
  { from: '3000', to: '3999', section: 'EQUITY',             label: 'حقوق الملكية',                       sign: 1 },
];

const IS_MAPPING: { from: string; to: string; section: string; label: string; sign: 1 | -1 }[] = [
  { from: '4100', to: '4199', section: 'REVENUE',      label: 'إيرادات المبيعات',                         sign:  1 },
  { from: '4200', to: '4299', section: 'REVENUE',      label: 'مردودات المبيعات',                         sign: -1 },
  { from: '5100', to: '5109', section: 'COGS',         label: 'تكلفة البضاعة المباعة',                    sign: -1 },
  { from: '5110', to: '5149', section: 'PAYROLL_EXP',  label: 'مصروفات الرواتب والمزايا',                 sign: -1 },
  { from: '5200', to: '5299', section: 'OPEX',         label: 'مصروفات التشغيل',                          sign: -1 },
  { from: '5300', to: '5399', section: 'GENERAL_ADMIN','label': 'مصروفات عمومية وإدارية',                 sign: -1 },
  { from: '4900', to: '4999', section: 'OTHER_INCOME', label: 'إيرادات أخرى',                             sign:  1 },
  { from: '5400', to: '5499', section: 'FINANCE_COSTS','label': 'مصروفات مالية',                          sign: -1 },
  { from: '5500', to: '5599', section: 'ZAKAT_TAX',    label: 'الزكاة والضرائب',                          sign: -1 },
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FsLine {
  code?: string;
  label: string;
  section: string;
  currentPeriod: Decimal;
  priorPeriod: Decimal;
  change: Decimal;
  changePct: Decimal;
}

export interface BalanceSheetResult {
  totalCurrentAssets: Decimal;
  totalNonCurrentAssets: Decimal;
  totalAssets: Decimal;
  totalCurrentLiab: Decimal;
  totalNonCurrentLiab: Decimal;
  totalLiabilities: Decimal;
  totalEquity: Decimal;
  isBalanced: boolean;
  lines: FsLine[];
  generatedAt: Date;
}

export interface IncomeStatementResult {
  grossProfit: Decimal;
  operatingProfit: Decimal;
  netProfit: Decimal;
  lines: FsLine[];
  generatedAt: Date;
}

export interface CashFlowResult {
  operatingCF: Decimal;
  investingCF: Decimal;
  financingCF: Decimal;
  netChange: Decimal;
  openingCash: Decimal;
  closingCash: Decimal;
  lines: { label: string; amount: Decimal; section: 'OPERATING' | 'INVESTING' | 'FINANCING' }[];
  generatedAt: Date;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class FinancialStatementsEngine {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * جلب أرصدة حسابات الفترة من GL
   */
  private async _getBalances(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<Map<string, Decimal>> {
    const prisma = this.prisma as any;
    const rows = await prisma.journalLine.groupBy({
      by: ['accountCode'],
      where: {
        tenantId,
        journalEntry: { status: 'POSTED', date: { gte: from, lte: to } },
      },
      _sum: { debit: true, credit: true },
    }).catch(() => []);

    const map = new Map<string, Decimal>();
    for (const row of rows) {
      if (!row.accountCode) continue;
      const net = new Decimal(row._sum.credit ?? 0).sub(new Decimal(row._sum.debit ?? 0));
      map.set(row.accountCode, net);
    }
    return map;
  }

  /**
   * جمع أرصدة في نطاق كود حسابات
   */
  private _sumRange(
    balances: Map<string, Decimal>,
    from: string,
    to: string,
    sign: 1 | -1,
  ): Decimal {
    let total = new Decimal(0);
    for (const [code, net] of balances) {
      if (code >= from && code <= to) {
        total = total.add(net.mul(sign));
      }
    }
    return total.abs().toDecimalPlaces(2);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // الميزانية العمومية
  // ──────────────────────────────────────────────────────────────────────────

  async generateBalanceSheet(
    tenantId: string,
    from: Date,
    to: Date,
    priorFrom?: Date,
    priorTo?: Date,
  ): Promise<BalanceSheetResult> {
    const [current, prior] = await Promise.all([
      this._getBalances(tenantId, from, to),
      priorFrom && priorTo ? this._getBalances(tenantId, priorFrom, priorTo) : Promise.resolve(new Map<string, Decimal>()),
    ]);

    const lines: FsLine[] = BS_MAPPING.map((m) => {
      const cur = this._sumRange(current, m.from, m.to, m.sign);
      const prev = this._sumRange(prior, m.from, m.to, m.sign);
      const change = cur.sub(prev);
      return {
        label: m.label, section: m.section,
        currentPeriod: cur, priorPeriod: prev,
        change, changePct: prev.isZero() ? new Decimal(0) : change.div(prev).mul(100).toDecimalPlaces(1),
      };
    });

    const sum = (section: string) => lines.filter(l => l.section === section).reduce((s, l) => s.add(l.currentPeriod), new Decimal(0));

    const totalCurrentAssets    = sum('CURRENT_ASSETS');
    const totalNonCurrentAssets = sum('NON_CURRENT_ASSETS');
    const totalAssets           = totalCurrentAssets.add(totalNonCurrentAssets);
    const totalCurrentLiab      = sum('CURRENT_LIAB');
    const totalNonCurrentLiab   = sum('NON_CURRENT_LIAB');
    const totalLiabilities      = totalCurrentLiab.add(totalNonCurrentLiab);
    const totalEquity           = sum('EQUITY');
    const isBalanced            = totalAssets.sub(totalLiabilities.add(totalEquity)).abs().lte(new Decimal(1));

    return { totalCurrentAssets, totalNonCurrentAssets, totalAssets, totalCurrentLiab, totalNonCurrentLiab, totalLiabilities, totalEquity, isBalanced, lines, generatedAt: new Date() };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // قائمة الدخل
  // ──────────────────────────────────────────────────────────────────────────

  async generateIncomeStatement(
    tenantId: string,
    from: Date,
    to: Date,
    priorFrom?: Date,
    priorTo?: Date,
  ): Promise<IncomeStatementResult> {
    const [current, prior] = await Promise.all([
      this._getBalances(tenantId, from, to),
      priorFrom && priorTo ? this._getBalances(tenantId, priorFrom, priorTo) : Promise.resolve(new Map<string, Decimal>()),
    ]);

    const lines: FsLine[] = IS_MAPPING.map((m) => {
      const cur  = this._sumRange(current, m.from, m.to, m.sign);
      const prev = this._sumRange(prior, m.from, m.to, m.sign);
      const change = cur.sub(prev);
      return {
        label: m.label, section: m.section,
        currentPeriod: cur, priorPeriod: prev,
        change, changePct: prev.isZero() ? new Decimal(0) : change.div(prev).mul(100).toDecimalPlaces(1),
      };
    });

    const net = (section: string) => lines.filter(l => l.section === section).reduce((s, l) => s.add(l.currentPeriod), new Decimal(0));

    const revenue        = net('REVENUE');
    const cogs           = net('COGS');
    const grossProfit    = revenue.sub(cogs);
    const opex           = net('PAYROLL_EXP').add(net('OPEX')).add(net('GENERAL_ADMIN'));
    const operatingProfit = grossProfit.sub(opex);
    const otherIncome    = net('OTHER_INCOME');
    const finCosts       = net('FINANCE_COSTS');
    const zakatTax       = net('ZAKAT_TAX');
    const netProfit      = operatingProfit.add(otherIncome).sub(finCosts).sub(zakatTax);

    return { grossProfit, operatingProfit, netProfit, lines, generatedAt: new Date() };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // التدفقات النقدية — الطريقة غير المباشرة (IAS 7)
  // ──────────────────────────────────────────────────────────────────────────

  async generateCashFlow(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<CashFlowResult> {
    const [is, priorStart] = await Promise.all([
      this.generateIncomeStatement(tenantId, from, to),
      this._getBalances(tenantId, new Date(from.getFullYear(), 0, 1), from),
    ]);

    const current = await this._getBalances(tenantId, from, to);

    // ─ التشغيل ─────────────────────────────────────────────────────────────
    const depreciationAddback = this._sumRange(current, '5220', '5229', 1);
    const arChange   = this._sumRange(current, '1200', '1299', 1).neg();  // زيادة AR = استخدام نقد
    const invChange  = this._sumRange(current, '1300', '1329', 1).neg();  // زيادة مخزون = استخدام نقد
    const apChange   = this._sumRange(current, '2110', '2119', 1);        // زيادة AP = مصدر نقد
    const operatingCF = is.netProfit
      .add(depreciationAddback)
      .add(arChange)
      .add(invChange)
      .add(apChange);

    // ─ الاستثمار ────────────────────────────────────────────────────────────
    const capex = this._sumRange(current, '1400', '1499', 1).neg();
    const investingCF = capex;

    // ─ التمويل ──────────────────────────────────────────────────────────────
    const debtChange = this._sumRange(current, '2600', '2699', 1).sub(this._sumRange(priorStart, '2600', '2699', 1));
    const financingCF = debtChange;

    const netChange   = operatingCF.add(investingCF).add(financingCF);
    const openingCash = this._sumRange(priorStart, '1110', '1119', 1);
    const closingCash = openingCash.add(netChange);

    const lines = [
      { label: 'صافي الربح', amount: is.netProfit,          section: 'OPERATING' as const },
      { label: 'الاستهلاك',  amount: depreciationAddback,   section: 'OPERATING' as const },
      { label: 'تغير في الذمم المدينة', amount: arChange,   section: 'OPERATING' as const },
      { label: 'تغير في المخزون',       amount: invChange,  section: 'OPERATING' as const },
      { label: 'تغير في الذمم الدائنة', amount: apChange,   section: 'OPERATING' as const },
      { label: 'شراء أصول ثابتة (CAPEX)', amount: capex,   section: 'INVESTING' as const },
      { label: 'تغير في القروض',         amount: debtChange,section: 'FINANCING' as const },
    ];

    return { operatingCF, investingCF, financingCF, netChange, openingCash, closingCash, lines, generatedAt: new Date() };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ميزان المراجعة (Trial Balance)
  // ──────────────────────────────────────────────────────────────────────────

  async generateTrialBalance(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<{ accountCode: string; accountName: string; debits: Decimal; credits: Decimal; net: Decimal }[]> {
    const prisma = this.prisma as any;

    const rows = await prisma.journalLine.groupBy({
      by: ['accountCode'],
      where: { tenantId, journalEntry: { status: 'POSTED', date: { gte: from, lte: to } } },
      _sum: { debit: true, credit: true },
    }).catch(() => []);

    const accounts = await prisma.account.findMany({
      where: { tenantId },
      select: { code: true, nameAr: true, name: true },
    }).catch(() => []);

    const nameMap = new Map(accounts.map((a: any) => [a.code, a.nameAr || a.name]));

    return rows
      .map((r: any) => {
        const debits  = new Decimal(r._sum.debit  ?? 0);
        const credits = new Decimal(r._sum.credit ?? 0);
        return {
          accountCode: r.accountCode ?? '',
          accountName: nameMap.get(r.accountCode) ?? r.accountCode,
          debits, credits, net: debits.sub(credits),
        };
      })
      .sort((a: any, b: any) => a.accountCode.localeCompare(b.accountCode));
  }
}
