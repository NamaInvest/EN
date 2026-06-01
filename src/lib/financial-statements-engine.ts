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

const log = logger.child({ service: 'financial-statements-engine' });

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

export interface IndirectCFLine {
  label:       string;
  section:     'OPERATING' | 'INVESTING' | 'FINANCING';
  amount:      Decimal;
  accountCode?: string;   // for drill-down
  sign:        1 | -1;
  note?:       string;
}

export interface IndirectCashFlowResult {
  /** صافي الدخل (نقطة البداية) */
  netIncome:          Decimal;
  /** تعديلات البنود غير النقدية */
  nonCashAdjustments: Decimal;
  /** تغيّرات رأس المال العامل */
  workingCapital:     Decimal;
  /** إجمالي التدفق التشغيلي */
  operatingCF:        Decimal;
  /** التدفق الاستثماري */
  investingCF:        Decimal;
  /** التدفق التمويلي */
  financingCF:        Decimal;
  /** صافي التغيير في النقدية */
  netChange:          Decimal;
  /** النقدية الافتتاحية */
  openingCash:        Decimal;
  /** النقدية الختامية */
  closingCash:        Decimal;
  /** فرق التحقق (يجب أن يكون < 0.01) */
  reconciliationDiff: Decimal;
  /** هل يتوافق مع الميزانية؟ */
  isReconciled:       boolean;
  /** تفصيل السطور */
  lines:              IndirectCFLine[];
  generatedAt:        Date;
}

export interface DimensionalFilters {
  costCenterId?: number;
  profitCenterId?: number;
  projectId?: number;
  segmentId?: number;
  branchId?: number;
}

export class FinancialStatementsEngine {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * جلب أرصدة حسابات الفترة من GL
   */
  private async _getBalances(
    tenantId: string,
    from: Date,
    to: Date,
    filters?: DimensionalFilters,
  ): Promise<Map<string, Decimal>> {
    const prisma = this.prisma;
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const whereClause: any = {
      tenantId,
      entry: {
        status: { equals: 'posted', mode: 'insensitive' },
        entryDate: { gte: fromStr, lte: toStr }
      }
    };

    if (filters) {
      if (filters.costCenterId !== undefined) whereClause.costCenterId = filters.costCenterId;
      if (filters.profitCenterId !== undefined) whereClause.profitCenterId = filters.profitCenterId;
      if (filters.projectId !== undefined) whereClause.projectId = filters.projectId;
      if (filters.segmentId !== undefined) whereClause.segmentId = filters.segmentId;
      if (filters.branchId !== undefined) whereClause.entry.branchId = filters.branchId;
    }

    const rows = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: whereClause,
      _sum: { debit: true, credit: true },
    }).catch((err) => {
      log.error('Failed to query journalLine group by accountId', { error: err.message, tenantId });
      return [];
    });

    const map = new Map<string, Decimal>();
    if (rows.length === 0) return map;

    const accountIds = rows.map(r => r.accountId);
    const accounts = await prisma.account.findMany({
      where: { tenantId, id: { in: accountIds } },
      select: { id: true, code: true },
    }).catch(() => []);

    const accountCodeMap = new Map<number, string>(accounts.map(a => [a.id, a.code]));

    for (const row of rows) {
      const code = accountCodeMap.get(row.accountId);
      if (!code) continue;
      
      const debitVal = new Decimal(row._sum.debit ?? 0);
      const creditVal = new Decimal(row._sum.credit ?? 0);
      const net = creditVal.sub(debitVal); // Standard accounting net: credit - debit

      const existing = map.get(code) || new Decimal(0);
      map.set(code, existing.add(net));
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
    filters?: DimensionalFilters,
  ): Promise<BalanceSheetResult> {
    const [current, prior] = await Promise.all([
      this._getBalances(tenantId, from, to, filters),
      priorFrom && priorTo ? this._getBalances(tenantId, priorFrom, priorTo, filters) : Promise.resolve(new Map<string, Decimal>()),
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
    filters?: DimensionalFilters,
  ): Promise<IncomeStatementResult> {
    const [current, prior] = await Promise.all([
      this._getBalances(tenantId, from, to, filters),
      priorFrom && priorTo ? this._getBalances(tenantId, priorFrom, priorTo, filters) : Promise.resolve(new Map<string, Decimal>()),
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
    filters?: DimensionalFilters,
  ): Promise<CashFlowResult> {
    const [is, priorStart] = await Promise.all([
      this.generateIncomeStatement(tenantId, from, to, undefined, undefined, filters),
      this._getBalances(tenantId, new Date(from.getFullYear(), 0, 1), from, filters),
    ]);

    const current = await this._getBalances(tenantId, from, to, filters);

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
  // التدفقات النقدية — الطريقة غير المباشرة (Indirect Method) — G1
  // IAS 7.18(b): Start from net profit, adjust for non-cash & working capital
  // ──────────────────────────────────────────────────────────────────────────

  async generateIndirectCashFlow(
    tenantId: string,
    from: Date,
    to: Date,
    filters?: DimensionalFilters,
  ): Promise<IndirectCashFlowResult> {
    // ── Fetch income statement & balance data ─────────────────────────────
    const periodStart = new Date(from.getFullYear(), 0, 1);  // beginning of year
    const [is, openingBal, closingBal] = await Promise.all([
      this.generateIncomeStatement(tenantId, from, to, undefined, undefined, filters),
      this._getBalances(tenantId, periodStart, from, filters),
      this._getBalances(tenantId, from, to, filters),
    ]);

    const netIncome = is.netProfit;
    const lines: IndirectCFLine[] = [];

    // ── Step 1: Net Income ───────────────────────────────────────────────
    lines.push({
      label:       'صافي الدخل / الربح',
      section:     'OPERATING',
      amount:      netIncome,
      sign:        1,
      accountCode: '3900',
    });

    // ── Step 2: Non-cash adjustments ─────────────────────────────────────
    // Depreciation & Amortization
    const depreciation = this._sumRange(closingBal, '5220', '5229', 1);
    lines.push({
      label:       'الاستهلاك والإطفاء',
      section:     'OPERATING',
      amount:      depreciation,
      accountCode: '5220',
      sign:        1,
      note:        'يُضاف لأنه غير نقدي',
    });

    // Provisions changes (e.g., bad debt, warranty)
    const provisions = this._sumRange(closingBal, '2400', '2499', 1)
      .sub(this._sumRange(openingBal, '2400', '2499', 1));
    lines.push({
      label:       'تغيّر في المخصصات',
      section:     'OPERATING',
      amount:      provisions,
      accountCode: '2400',
      sign:        1,
      note:        'زيادة المخصص = مصدر نقدي',
    });

    // Unrealized FX Losses (add back) / Gains (subtract)
    const fxDiff = this._sumRange(closingBal, '5410', '5419', 1)
      .sub(this._sumRange(closingBal, '4910', '4919', 1));
    if (!fxDiff.isZero()) {
      lines.push({
        label:   'فروق العملة غير المحققة (صافي)',
        section: 'OPERATING',
        amount:  fxDiff,
        sign:    1,
        note:    'الخسائر تُضاف / الأرباح تُطرح',
      });
    }

    const nonCashTotal = depreciation.add(provisions).add(fxDiff);

    // ── Step 3: Working Capital Changes ──────────────────────────────────
    // Δ Receivables: increase = cash used (negative)
    const deltaAR = this._sumRange(closingBal, '1200', '1299', 1)
      .sub(this._sumRange(openingBal, '1200', '1299', 1)).neg();
    lines.push({
      label:       'تغيّر في الذمم المدينة',
      section:     'OPERATING',
      amount:      deltaAR,
      accountCode: '1200',
      sign:        -1,
      note:        'زيادة AR = استخدام نقد',
    });

    // Δ Inventory: increase = cash used (negative)
    const deltaInv = this._sumRange(closingBal, '1300', '1329', 1)
      .sub(this._sumRange(openingBal, '1300', '1329', 1)).neg();
    lines.push({
      label:       'تغيّر في المخزون',
      section:     'OPERATING',
      amount:      deltaInv,
      accountCode: '1300',
      sign:        -1,
      note:        'زيادة المخزون = استخدام نقد',
    });

    // Δ Prepaid / Other Current Assets
    const deltaPrepaid = this._sumRange(closingBal, '1340', '1399', 1)
      .sub(this._sumRange(openingBal, '1340', '1399', 1)).neg();
    if (!deltaPrepaid.isZero()) {
      lines.push({
        label:       'تغيّر في المدفوعات المقدمة وأصول أخرى',
        section:     'OPERATING',
        amount:      deltaPrepaid,
        accountCode: '1340',
        sign:        -1,
      });
    }

    // Δ Payables (AP): increase = cash source (positive)
    const deltaAP = this._sumRange(closingBal, '2100', '2199', 1)
      .sub(this._sumRange(openingBal, '2100', '2199', 1));
    lines.push({
      label:       'تغيّر في الذمم الدائنة',
      section:     'OPERATING',
      amount:      deltaAP,
      accountCode: '2100',
      sign:        1,
      note:        'زيادة AP = مصدر نقد',
    });

    // Δ Accruals / Other Current Liabilities
    const deltaAccruals = this._sumRange(closingBal, '2300', '2399', 1)
      .sub(this._sumRange(openingBal, '2300', '2399', 1));
    if (!deltaAccruals.isZero()) {
      lines.push({
        label:       'تغيّر في المستحقات الأخرى',
        section:     'OPERATING',
        amount:      deltaAccruals,
        accountCode: '2300',
        sign:        1,
      });
    }

    const workingCapitalTotal = deltaAR.add(deltaInv).add(deltaPrepaid).add(deltaAP).add(deltaAccruals);
    const operatingCF = netIncome.add(nonCashTotal).add(workingCapitalTotal);

    // ── Step 4: Investing Activities ──────────────────────────────────────
    // Asset acquisitions (CAPEX)
    const capex = this._sumRange(closingBal, '1400', '1499', 1)
      .sub(this._sumRange(openingBal, '1400', '1499', 1)).neg();
    lines.push({
      label:       'شراء / التخلص من الأصول الثابتة (CAPEX)',
      section:     'INVESTING',
      amount:      capex,
      accountCode: '1400',
      sign:        -1,
    });

    // ROU Assets from IFRS 16 (if any)
    const rouAssets = this._sumRange(closingBal, '1450', '1459', 1)
      .sub(this._sumRange(openingBal, '1450', '1459', 1)).neg();
    if (!rouAssets.isZero()) {
      lines.push({
        label:       'أصول حق الاستخدام (IFRS 16)',
        section:     'INVESTING',
        amount:      rouAssets,
        accountCode: '1450',
        sign:        -1,
      });
    }

    const investingCF = capex.add(rouAssets);

    // ── Step 5: Financing Activities ─────────────────────────────────────
    // Long-term debt changes
    const deltaLTD = this._sumRange(closingBal, '2500', '2699', 1)
      .sub(this._sumRange(openingBal, '2500', '2699', 1));
    lines.push({
      label:       'تغيّر في القروض طويلة الأجل',
      section:     'FINANCING',
      amount:      deltaLTD,
      accountCode: '2500',
      sign:        1,
    });

    // Lease liability payments (IFRS 16 principal portion)
    const leasePrincipal = this._sumRange(closingBal, '2610', '2619', 1)
      .sub(this._sumRange(openingBal, '2610', '2619', 1)).neg();
    if (!leasePrincipal.isZero()) {
      lines.push({
        label:       'سداد أصل التزامات الإيجار (IFRS 16)',
        section:     'FINANCING',
        amount:      leasePrincipal,
        accountCode: '2610',
        sign:        -1,
      });
    }

    // Equity injections / Dividends
    const equityChange = this._sumRange(closingBal, '3000', '3799', 1)
      .sub(this._sumRange(openingBal, '3000', '3799', 1));
    if (!equityChange.isZero()) {
      lines.push({
        label:       'تغيّر في حقوق الملكية (رأس مال / أرباح موزعة)',
        section:     'FINANCING',
        amount:      equityChange,
        accountCode: '3000',
        sign:        1,
      });
    }

    const financingCF = deltaLTD.add(leasePrincipal).add(equityChange);

    // ── Step 6: Reconciliation ────────────────────────────────────────────
    const netChange  = operatingCF.add(investingCF).add(financingCF);
    const openingCash = this._sumRange(openingBal, '1110', '1119', 1);
    const closingCashCalc = openingCash.add(netChange);
    const closingCashBS   = this._sumRange(closingBal, '1110', '1119', 1);
    const reconciliationDiff = closingCashCalc.sub(closingCashBS).abs();
    const isReconciled = reconciliationDiff.lte(new Decimal('0.01'));

    if (!isReconciled) {
      log.warn('Indirect CF reconciliation mismatch — check account mappings', { tenantId, diff: reconciliationDiff.toNumber() });
    }

    return {
      netIncome,
      nonCashAdjustments: nonCashTotal,
      workingCapital:     workingCapitalTotal,
      operatingCF,
      investingCF,
      financingCF,
      netChange,
      openingCash,
      closingCash:        closingCashCalc,
      reconciliationDiff,
      isReconciled,
      lines,
      generatedAt:        new Date(),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ميزان المراجعة (Trial Balance)
  // ──────────────────────────────────────────────────────────────────────────

  async generateTrialBalance(
    tenantId: string,
    from: Date,
    to: Date,
    filters?: DimensionalFilters,
  ): Promise<{ accountCode: string; accountName: string; debits: Decimal; credits: Decimal; net: Decimal }[]> {
    const prisma = this.prisma;
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const whereClause: any = {
      tenantId,
      entry: {
        status: { equals: 'posted', mode: 'insensitive' },
        entryDate: { gte: fromStr, lte: toStr }
      }
    };

    if (filters) {
      if (filters.costCenterId !== undefined) whereClause.costCenterId = filters.costCenterId;
      if (filters.profitCenterId !== undefined) whereClause.profitCenterId = filters.profitCenterId;
      if (filters.projectId !== undefined) whereClause.projectId = filters.projectId;
      if (filters.segmentId !== undefined) whereClause.segmentId = filters.segmentId;
      if (filters.branchId !== undefined) whereClause.entry.branchId = filters.branchId;
    }

    const rows = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: whereClause,
      _sum: { debit: true, credit: true },
    }).catch(() => []);

    if (rows.length === 0) return [];

    const accountIds = rows.map(r => r.accountId);
    const accounts = await prisma.account.findMany({
      where: { tenantId, id: { in: accountIds } },
      select: { id: true, code: true, nameEn: true, name: true },
    }).catch(() => []);

    const nameMap = new Map(accounts.map((a: any) => [a.id, a.name || a.nameEn]));
    const codeMap = new Map(accounts.map((a: any) => [a.id, a.code]));

    return rows
      .map((r: any) => {
        const debits  = new Decimal(r._sum.debit  ?? 0);
        const credits = new Decimal(r._sum.credit ?? 0);
        const code = codeMap.get(r.accountId) ?? '';
        return {
          accountCode: code,
          accountName: nameMap.get(r.accountId) ?? code,
          debits, credits, net: debits.sub(credits),
        };
      })
      .filter(r => r.accountCode !== '')
      .sort((a: any, b: any) => a.accountCode.localeCompare(b.accountCode));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // فحوصات الحوكمة والتدقيق والامتثال (Compliance & Audit Invariants)
  // ──────────────────────────────────────────────────────────────────────────

  async validateComplianceInvariants(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<{
    isTrialBalanceBalanced: boolean;
    trialBalanceDifference: Decimal;
    isCashFlowReconciled: boolean;
    cashFlowDifference: Decimal;
    areTemporaryAccountsClosed: boolean;
    controlAccountsAuditPassed: boolean;
    auditFindings: string[];
  }> {
    const findings: string[] = [];

    // 1. فحص توازن ميزان المراجعة الإجمالي
    const tb = await this.generateTrialBalance(tenantId, from, to);
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);
    for (const r of tb) {
      totalDebits = totalDebits.add(r.debits);
      totalCredits = totalCredits.add(r.credits);
    }
    const tbDiff = totalDebits.sub(totalCredits).abs();
    const isTbBalanced = tbDiff.lte(new Decimal('0.01'));
    if (!isTbBalanced) {
      findings.push(`عدم توازن ميزان المراجعة الإجمالي بفرق قدره ${tbDiff.toFixed(2)} ريال.`);
    }

    // 2. فحص تطابق النقدية بين الميزانية والتدفقات النقدية
    const bs = await this.generateBalanceSheet(tenantId, from, to);
    const cf = await this.generateIndirectCashFlow(tenantId, from, to);

    const cashInBS = bs.lines
      .filter(l => l.section === 'CURRENT_ASSETS' && l.label.includes('النقدية'))
      .reduce((s, l) => s.add(l.currentPeriod), new Decimal(0));

    const cashInCF = cf.closingCash;
    const cfDiff = cashInBS.sub(cashInCF).abs();
    const isCfReconciled = cfDiff.lte(new Decimal('0.01'));
    if (!isCfReconciled) {
      findings.push(`عدم تطابق رصيد النقدية: الميزانية العمومية (${cashInBS.toFixed(2)}) ≠ التدفقات النقدية (${cashInCF.toFixed(2)}). الفرق: ${cfDiff.toFixed(2)} ريال.`);
    }

    // 3. التحقق من إقفال الحسابات المؤقتة بنهاية العام
    const isYearEnd = to.getMonth() === 11 && to.getDate() === 31; // Dec 31
    let areTempClosed = true;
    if (isYearEnd) {
      const tempBalances = await this._getBalances(tenantId, from, to);
      let openTempAmount = new Decimal(0);
      for (const [code, net] of tempBalances) {
        if (code >= '4000' && code <= '5999') {
          if (!net.isZero()) {
            openTempAmount = openTempAmount.add(net.abs());
          }
        }
      }
      if (!openTempAmount.isZero()) {
        areTempClosed = false;
        findings.push(`وجود أرصدة غير مقفلة في حسابات الإيرادات والمصروفات المؤقتة بنهاية العام بإجمالي ${openTempAmount.toFixed(2)} ريال.`);
      }
    }

    // 4. تتبع وفحص حركات الحسابات الرقابية
    const manualEntriesOnControl = await this.prisma.journalLine.findMany({
      where: {
        tenantId,
        entry: {
          status: { equals: 'posted', mode: 'insensitive' },
          entryDate: { gte: from.toISOString().split('T')[0], lte: to.toISOString().split('T')[0] },
          reference: { startsWith: 'MANUAL-' }
        },
        account: {
          code: {
            in: ['1200', '1210', '1300', '2100', '2110']
          }
        }
      },
      include: {
        entry: true,
        account: true
      }
    }).catch(() => []);

    const controlAccountsAuditPassed = manualEntriesOnControl.length === 0;
    if (!controlAccountsAuditPassed) {
      findings.push(`رصد عدد ${manualEntriesOnControl.length} قيد يدوي مباشر غير مصرح به على الحسابات الرقابية.`);
    }

    return {
      isTrialBalanceBalanced: isTbBalanced,
      trialBalanceDifference: tbDiff,
      isCashFlowReconciled: isCfReconciled,
      cashFlowDifference: cfDiff,
      areTemporaryAccountsClosed: areTempClosed,
      controlAccountsAuditPassed,
      auditFindings: findings,
    };
  }
}

