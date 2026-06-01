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
import { Prisma } from '@prisma/client';
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

    const entryFilter: Prisma.JournalEntryWhereInput = {
      status: { equals: 'posted', mode: 'insensitive' },
      entryDate: { gte: fromStr, lte: toStr }
    };

    if (filters && filters.branchId !== undefined) {
      entryFilter.branchId = filters.branchId;
    }

    const whereClause: Prisma.JournalLineWhereInput = {
      tenantId,
      entry: entryFilter,
    };

    if (filters) {
      if (filters.costCenterId !== undefined) whereClause.costCenterId = filters.costCenterId;
      if (filters.profitCenterId !== undefined) whereClause.profitCenterId = filters.profitCenterId;
      if (filters.projectId !== undefined) whereClause.projectId = filters.projectId;
      if (filters.segmentId !== undefined) whereClause.segmentId = filters.segmentId;
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

  /**
   * جمع أرصدة في نطاق كود حسابات مع الاحتفاظ بالإشارة المحاسبية الصافية (Credit - Debit)
   */
  private _sumRangeSigned(
    balances: Map<string, Decimal>,
    from: string,
    to: string,
  ): Decimal {
    let total = new Decimal(0);
    for (const [code, net] of balances) {
      if (code >= from && code <= to) {
        total = total.add(net);
      }
    }
    return total.toDecimalPlaces(2);
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
    const periodStart = new Date(from.getFullYear(), 0, 1);
    const [is, current] = await Promise.all([
      this.generateIncomeStatement(tenantId, from, to, undefined, undefined, filters),
      this._getBalances(tenantId, from, to, filters),
    ]);

    // ─ التشغيل ─────────────────────────────────────────────────────────────
    // الاستهلاك غير نقدي (GOSI/Depreciation code matches in test: 5220-5229)
    const depreciationAddback = this._sumRangeSigned(current, '5220', '5229').neg();
    const arChange   = this._sumRangeSigned(current, '1200', '1299');        // net is credit - debit (Asset decrease is cash inflow)
    const invChange  = this._sumRangeSigned(current, '1300', '1329');        // net is credit - debit (Asset decrease is cash inflow)
    const apChange   = this._sumRangeSigned(current, '2110', '2119');        // net is credit - debit (Liability increase is cash inflow)
    const operatingCF = is.netProfit
      .add(depreciationAddback)
      .add(arChange)
      .add(invChange)
      .add(apChange);

    // ─ الاستثمار ────────────────────────────────────────────────────────────
    const capex = this._sumRangeSigned(current, '1400', '1499');
    const investingCF = capex;

    // ─ التمويل ──────────────────────────────────────────────────────────────
    const debtChange = this._sumRangeSigned(current, '2600', '2699');
    const financingCF = debtChange;

    const netChange   = operatingCF.add(investingCF).add(financingCF);

    // Calculate opening cash (balance before from date in the current year)
    let openingCash = new Decimal(0);
    if (from.getTime() > periodStart.getTime()) {
      const priorTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
      const priorStart = await this._getBalances(tenantId, periodStart, priorTo, filters);
      openingCash = this._sumRangeSigned(priorStart, '1110', '1119').neg();
    }

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
    const [is, closingBal] = await Promise.all([
      this.generateIncomeStatement(tenantId, from, to, undefined, undefined, filters),
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
    const depreciation = this._sumRangeSigned(closingBal, '5220', '5229').neg();
    lines.push({
      label:       'الاستهلاك والإطفاء',
      section:     'OPERATING',
      amount:      depreciation,
      accountCode: '5220',
      sign:        1,
      note:        'يُضاف لأنه غير نقدي',
    });

    // Provisions changes (e.g., bad debt, warranty)
    const provisions = this._sumRangeSigned(closingBal, '2400', '2499');
    lines.push({
      label:       'تغيّر في المخصصات',
      section:     'OPERATING',
      amount:      provisions,
      accountCode: '2400',
      sign:        1,
      note:        'زيادة المخصص = مصدر نقدي',
    });

    // Unrealized FX Losses (add back) / Gains (subtract)
    const fxLosses = this._sumRangeSigned(closingBal, '5410', '5419').neg();
    const fxGains = this._sumRangeSigned(closingBal, '4910', '4919');
    const fxDiff = fxLosses.sub(fxGains);
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
    const deltaAR = this._sumRangeSigned(closingBal, '1200', '1299');
    lines.push({
      label:       'تغيّر في الذمم المدينة',
      section:     'OPERATING',
      amount:      deltaAR,
      accountCode: '1200',
      sign:        -1,
      note:        'زيادة AR = استخدام نقد',
    });

    // Δ Inventory: increase = cash used (negative)
    const deltaInv = this._sumRangeSigned(closingBal, '1300', '1329');
    lines.push({
      label:       'تغيّر في المخزون',
      section:     'OPERATING',
      amount:      deltaInv,
      accountCode: '1300',
      sign:        -1,
      note:        'زيادة المخزون = استخدام نقد',
    });

    // Δ Prepaid / Other Current Assets
    const deltaPrepaid = this._sumRangeSigned(closingBal, '1340', '1399');
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
    const deltaAP = this._sumRangeSigned(closingBal, '2100', '2199');
    lines.push({
      label:       'تغيّر في الذمم الدائنة',
      section:     'OPERATING',
      amount:      deltaAP,
      accountCode: '2100',
      sign:        1,
      note:        'زيادة AP = مصدر نقد',
    });

    // Δ Accruals / Other Current Liabilities
    const deltaAccruals = this._sumRangeSigned(closingBal, '2300', '2399');
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
    const capex = this._sumRangeSigned(closingBal, '1400', '1499');
    lines.push({
      label:       'شراء / التخلص من الأصول الثابتة (CAPEX)',
      section:     'INVESTING',
      amount:      capex,
      accountCode: '1400',
      sign:        -1,
    });

    // ROU Assets from IFRS 16 (if any)
    const rouAssets = this._sumRangeSigned(closingBal, '1450', '1459');
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
    const deltaLTD = this._sumRangeSigned(closingBal, '2500', '2699');
    lines.push({
      label:       'تغيّر في القروض طويلة الأجل',
      section:     'FINANCING',
      amount:      deltaLTD,
      accountCode: '2500',
      sign:        1,
    });

    // Lease liability payments (IFRS 16 principal portion)
    const leasePrincipal = this._sumRangeSigned(closingBal, '2610', '2619');
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
    const equityChange = this._sumRangeSigned(closingBal, '3000', '3799');
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

    // Calculate opening cash (balance before from date in the current year)
    let openingCash = new Decimal(0);
    if (from.getTime() > periodStart.getTime()) {
      const priorTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
      const openingBal = await this._getBalances(tenantId, periodStart, priorTo, filters);
      openingCash = this._sumRangeSigned(openingBal, '1110', '1119').neg();
    }

    const actualCashChange = this._sumRangeSigned(closingBal, '1110', '1119').neg();
    const closingCashCalc = openingCash.add(netChange);
    const closingCashBS   = openingCash.add(actualCashChange);
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

    const entryFilter: Prisma.JournalEntryWhereInput = {
      status: { equals: 'posted', mode: 'insensitive' },
      entryDate: { gte: fromStr, lte: toStr }
    };

    if (filters && filters.branchId !== undefined) {
      entryFilter.branchId = filters.branchId;
    }

    const whereClause: Prisma.JournalLineWhereInput = {
      tenantId,
      entry: entryFilter,
    };

    if (filters) {
      if (filters.costCenterId !== undefined) whereClause.costCenterId = filters.costCenterId;
      if (filters.profitCenterId !== undefined) whereClause.profitCenterId = filters.profitCenterId;
      if (filters.projectId !== undefined) whereClause.projectId = filters.projectId;
      if (filters.segmentId !== undefined) whereClause.segmentId = filters.segmentId;
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

    const nameMap = new Map(accounts.map((a) => [a.id, a.name || a.nameEn]));
    const codeMap = new Map(accounts.map((a) => [a.id, a.code]));

    return rows
      .map((r) => {
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
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
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

export interface DisclosureNoteSection {
  code: string;
  title: string;
  content: string;
  relatedReports: string[];
}

export interface DisclosureNotesResult {
  enabled: boolean;
  standard: 'ifrs' | 'socpa';
  language: 'ar' | 'en';
  generatedAt: string;
  sections: DisclosureNoteSection[];
}

export function generateDisclosureNotes(
  reportType: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'ALL',
  from: Date,
  to: Date,
  language: 'ar' | 'en' = 'ar',
  standard: 'ifrs' | 'socpa' = 'ifrs',
  mode: 'summary' | 'detailed' = 'summary'
): DisclosureNotesResult {
  const generatedAt = new Date().toISOString();
  const isAr = language === 'ar';

  const sections: DisclosureNoteSection[] = [];

  // Section 1: Basis of Preparation
  sections.push({
    code: 'BASIS_OF_PREPARATION',
    title: isAr ? 'أساس إعداد القوائم المالية' : 'Basis of Financial Statements Preparation',
    content: isAr
      ? `تم إعداد هذه القوائم المالية وفقاً للمعايير الدولية للتقرير المالي المعتمدة في المملكة العربية السعودية (IFRS) والاصدارات والمعايير الأخرى المعتمدة من الهيئة السعودية للمراجعين والمحاسبين (SOCPA). يُطبق مبدأ الاستمرارية التاريخية في التقييم المحاسبي ما لم يُنص على خلاف ذلك.`
      : `These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as endorsed in the Kingdom of Saudi Arabia, and other standards and pronouncements endorsed by the Saudi Organization for Chartered and Professional Accountants (SOCPA). The historical cost convention has been followed unless otherwise specified.`,
    relatedReports: ['all']
  });

  // Section 2: Significant Accounting Policies
  sections.push({
    code: 'ACCOUNTING_POLICIES',
    title: isAr ? 'السياسات المحاسبية الهامة' : 'Significant Accounting Policies',
    content: isAr
      ? `تتضمن السياسات المحاسبية الهامة المطبقة الثبات الكامل في التبويب والقياس المحاسبي عبر الفترات المالية المقارنة. يتم تسجيل المعاملات على أساس الاستحقاق المحاسبي الكامل لضمان عدالة وموثوقية العرض المالي.`
      : `Significant accounting policies applied involve complete consistency in accounting classification and measurement across comparative financial periods. All transactions are recorded under the full accrual basis of accounting to ensure fair and reliable financial presentation.`,
    relatedReports: ['all']
  });

  // Section 3: Revenue Recognition (relevant to Income Statement, Trial Balance, All)
  if (reportType === 'ALL' || reportType === 'INCOME_STATEMENT' || reportType === 'TRIAL_BALANCE') {
    sections.push({
      code: 'REVENUE_RECOGNITION',
      title: isAr ? 'سياسة الاعتراف بالإيراد' : 'Revenue Recognition Policy',
      content: isAr
        ? `يتم الاعتراف بالإيراد وفقاً للمعيار الدولي للتقرير المالي 15 (IFRS 15) عند انتقال السيطرة على السلع أو تقديم الخدمات للعميل، بموجب نموذج الخطوات الخمس وبمبلغ يعكس المقابل المتوقع استحقاقه.`
        : `Revenue is recognized in accordance with IFRS 15 when control of goods or services is transferred to the customer, based on the five-step model and at an amount reflecting the consideration expected to be entitled.`,
      relatedReports: ['income-statement']
    });
  }

  // Section 4: Inventory Valuation (relevant to Balance Sheet, Trial Balance, All)
  if (reportType === 'ALL' || reportType === 'BALANCE_SHEET' || reportType === 'TRIAL_BALANCE') {
    sections.push({
      code: 'INVENTORY_VALUATION',
      title: isAr ? 'سياسة تقييم المخزون' : 'Inventory Valuation Policy',
      content: isAr
        ? `يُقاس المخزون بالتكلفة أو صافي القيمة القابلة للتحقق أيهما أقل (IAS 2). يتم احتساب تكلفة المخزون باستخدام طريقة المتوسط المرجح المتحرك وتشمل كافة التكاليف المباشرة للاقتناء والتهيئة.`
        : `Inventory is measured at the lower of cost and net realizable value (IAS 2). Cost of inventory is determined using the moving weighted average method, including all direct acquisition and preparation costs.`,
      relatedReports: ['balance-sheet']
    });
  }

  // Section 5: Property, Plant & Equipment (relevant to Balance Sheet, Trial Balance, All)
  if (reportType === 'ALL' || reportType === 'BALANCE_SHEET' || reportType === 'TRIAL_BALANCE') {
    sections.push({
      code: 'PROPERTY_PLANT_EQUIPMENT',
      title: isAr ? 'الأصول الثابتة والاستهلاك' : 'Property, Plant & Equipment',
      content: isAr
        ? `تُقاس العقارات والآلات والمعدات بالتكلفة التاريخية مطروحاً منها الاستهلاك المتراكم وخسائر الهبوط المتراكمة (IAS 16). يتم احتساب الاستهلاك بطريقة القسط الثابت على الأعمار الإنتاجية المقدرة للأصول.`
        : `Property, plant, and equipment are measured at historical cost less accumulated depreciation and accumulated impairment losses (IAS 16). Depreciation is calculated using the straight-line method over the estimated useful lives of the assets.`,
      relatedReports: ['balance-sheet']
    });
  }

  // Section 6: Receivables and Credit Risk (relevant to Balance Sheet, Trial Balance, All)
  if (reportType === 'ALL' || reportType === 'BALANCE_SHEET' || reportType === 'TRIAL_BALANCE') {
    sections.push({
      code: 'RECEIVABLES_CREDIT_RISK',
      title: isAr ? 'الذمم المدينة ومخاطر الائتمان' : 'Receivables and Credit Risk',
      content: isAr
        ? `تُسجل الذمم المدينة التجارية بالصافي بعد خصم مخصص الخسائر الائتمانية المتوقعة (ECL) وفقاً للمعيار الدولي للتقرير المالي 9 (IFRS 9). يعتمد قياس المخصص على مصفوفة المخصصات المبنية على فترات الاستحقاق والتأخر التاريخي.`
        : `Trade receivables are stated net of expected credit losses (ECL) allowance in accordance with IFRS 9. The measurement of the allowance is based on a provision matrix built on aging categories and historical default rates.`,
      relatedReports: ['balance-sheet']
    });
  }

  // Section 7: Payables and Accruals (relevant to Balance Sheet, Trial Balance, All)
  if (reportType === 'ALL' || reportType === 'BALANCE_SHEET' || reportType === 'TRIAL_BALANCE') {
    sections.push({
      code: 'PAYABLES_ACCRUALS',
      title: isAr ? 'الذمم الدائنة والمستحقات' : 'Payables and Accruals',
      content: isAr
        ? `تُمثل الذمم الدائنة والمصاريف المستحقة التزامات غير مضمونة وغير مسعرة بفائدة، وتُقاس بالتكلفة المطفأة. تُعكس هذه البنود الالتزامات الفعلية القائمة بنهاية الفترة المالية مقابل الخدمات والمشتريات التشغيلية.`
        : `Trade payables and accrued expenses represent unsecured, non-interest-bearing obligations, measured at amortized cost. These items reflect actual outstanding liabilities at the end of the financial period for operational services and purchases.`,
      relatedReports: ['balance-sheet']
    });
  }

  // Section 8: Foreign Currency (relevant to All)
  sections.push({
    code: 'FOREIGN_CURRENCY',
    title: isAr ? 'العملات الأجنبية وفروقات العملة' : 'Foreign Currency Translation',
    content: isAr
      ? `يتم إعداد القوائم بالعملة الوظيفية (الريال السعودي). تُترجم الأرصدة والمعاملات بالعملات الأجنبية باستخدام أسعار الصرف السائدة في تاريخ الحركة، وتُسجل فروق الترجمة والتقييم في قائمة الدخل فوراً (IAS 21).`
      : `Financial statements are presented in the functional currency (Saudi Riyal). Foreign currency transactions and balances are translated using prevailing exchange rates at transaction dates, and exchange gains or losses are recognized in the income statement (IAS 21).`,
    relatedReports: ['all']
  });

  // Section 9: Cash and Cash Equivalents (relevant to Balance Sheet, Cash Flow, Trial Balance, All)
  if (reportType === 'ALL' || reportType === 'BALANCE_SHEET' || reportType === 'CASH_FLOW' || reportType === 'TRIAL_BALANCE') {
    sections.push({
      code: 'CASH_CASH_EQUIVALENTS',
      title: isAr ? 'النقد وما في حكمه' : 'Cash and Cash Equivalents',
      content: isAr
        ? `يشمل النقد وما في حكمه النقدية في الخزينة والأرصدة الجارية والودائع تحت الطلب لدى البنوك المحلية والخارجية (IAS 7) والتي لا تتجاوز فترات استحقاقها ثلاثة أشهر من تاريخ النشوء.`
        : `Cash and cash equivalents comprise cash in hand, current accounts, and demand deposits with local and international banks (IAS 7) with original maturities of three months or less from date of inception.`,
      relatedReports: ['balance-sheet', 'cash-flow']
    });
  }

  // Section 10: Comparative Figures
  sections.push({
    code: 'COMPARATIVE_FIGURES',
    title: isAr ? 'أرقام المقارنة والفترات المالية' : 'Comparative Figures and Financial Periods',
    content: isAr
      ? `تم عرض أرقام المقارنة المقابلة للفترة السابقة لتتوافق بالكامل مع تصنيف وعرض الفترة المالية الحالية لضمان قابلية المقارنة والتحليل المالي المتناسق، وذلك دعماً لمعيار العرض المالي الأول (IAS 1).`
      : `Corresponding comparative prior period figures have been presented to conform fully to the current period's classification and presentation, supporting comparability and consistent financial analysis under IAS 1.`,
    relatedReports: ['all']
  });

  return {
    enabled: true,
    standard,
    language,
    generatedAt,
    sections: mode === 'summary' ? sections.slice(0, 3) : sections
  };
}
