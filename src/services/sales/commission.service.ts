/**
 * CommissionService — عمولات المبيعات (Tiered + Hierarchy + Payout GL)
 *
 * النماذج: SalesInvoice, Employee (Salesperson), CommissionRule
 *
 * المعالجة:
 *   1. تحديد معدل العمولة بحسب طبقة المبيعات (Tiered):
 *      - حتى 100K    → 2%
 *      - 100K–250K   → 3%
 *      - 250K–500K   → 4%
 *      - فوق 500K    → 5%
 *   2. حساب العمولة المستحقة لكل مندوب
 *   3. احتساب العمولة الهرمية (المدير يحصل على 10% مما تحت قيادته)
 *   4. ترحيل قيد الدفع:
 *      DR 5300 مصروف العمولة
 *      CR 2330 مستحق الدفع (يُدفع مع الراتب)
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

interface CommissionTier {
  upTo: number;    // حد الطبقة
  rate: number;    // المعدل كنسبة مئوية
}

const DEFAULT_TIERS: CommissionTier[] = [
  { upTo: 100_000,  rate: 0.02 },
  { upTo: 250_000,  rate: 0.03 },
  { upTo: 500_000,  rate: 0.04 },
  { upTo: Infinity, rate: 0.05 },
];

const MANAGER_OVERRIDE_RATE = 0.10; // المدير يحصل 10% من عمولة مرؤوسيه

export interface CommissionSummary {
  salespersonId: number | string;
  name: string;
  totalSales: Decimal;
  commissionRate: number;
  commissionAmount: Decimal;
  managerOverride: Decimal;
  totalPayout: Decimal;
}

export interface CommissionRunResult {
  period: string;
  summaries: CommissionSummary[];
  totalPayout: Decimal;
  journalEntryId?: number;
}

export class CommissionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * حساب عمولات فترة محددة وترحيلها إلى GL
   */
  async calculateAndPostCommissions(
    from: Date,
    to: Date,
    tiers: CommissionTier[] = DEFAULT_TIERS,
  ): Promise<CommissionRunResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    const period   = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;

    // جلب الفواتير المُرحَّلة للفترة
    const invoices = await prisma.salesInvoice?.findMany?.({
      where: {
        tenantId,
        status:      { in: ['POSTED', 'PAID'] },
        invoiceDate: { gte: from, lte: to },
        salespersonId: { not: null },
      },
      select: { id: true, salespersonId: true, totalAmount: true },
    }).catch(() => []) ?? [];

    // تجميع المبيعات لكل مندوب
    const salesMap = new Map<string, Decimal>();
    for (const inv of invoices) {
      const key = String(inv.salespersonId);
      salesMap.set(key, (salesMap.get(key) ?? new Decimal(0)).add(new Decimal(inv.totalAmount ?? 0)));
    }

    // جلب بيانات المندوبين وهيكل الإدارة
    const salespeople = await prisma.employee?.findMany?.({
      where: {
        tenantId,
        id: { in: [...salesMap.keys()].map(Number).filter(Boolean) },
      },
      select: { id: true, fullName: true, managerId: true },
    }).catch(() => []) ?? [];

    // حساب العمولة الفردية
    const summaryMap = new Map<string, CommissionSummary>();

    for (const [spId, totalSales] of salesMap) {
      const sp = salespeople.find((e: any) => String(e.id) === spId);
      const rate = this._getTieredRate(totalSales.toNumber(), tiers);
      const commissionAmount = totalSales.mul(rate).toDecimalPlaces(2);

      summaryMap.set(spId, {
        salespersonId: spId,
        name: sp?.fullName ?? `مندوب ${spId}`,
        totalSales,
        commissionRate: rate,
        commissionAmount,
        managerOverride: new Decimal(0),
        totalPayout: commissionAmount,
      });
    }

    // إضافة العمولة الهرمية للمديرين
    for (const [spId, summary] of summaryMap) {
      const sp = salespeople.find((e: any) => String(e.id) === spId);
      if (!sp?.managerId) continue;

      const managerKey = String(sp.managerId);
      const override = summary.commissionAmount.mul(MANAGER_OVERRIDE_RATE).toDecimalPlaces(2);

      if (!summaryMap.has(managerKey)) {
        const mgr = salespeople.find((e: any) => String(e.id) === managerKey);
        summaryMap.set(managerKey, {
          salespersonId: managerKey,
          name: mgr?.fullName ?? `مدير ${managerKey}`,
          totalSales: new Decimal(0),
          commissionRate: 0,
          commissionAmount: new Decimal(0),
          managerOverride: override,
          totalPayout: override,
        });
      } else {
        const mgrSummary = summaryMap.get(managerKey)!;
        mgrSummary.managerOverride = mgrSummary.managerOverride.add(override);
        mgrSummary.totalPayout = mgrSummary.totalPayout.add(override);
      }
    }

    const summaries = [...summaryMap.values()];
    const totalPayout = summaries.reduce((s, r) => s.add(r.totalPayout), new Decimal(0));

    if (totalPayout.isZero()) {
      return { period, summaries, totalPayout };
    }

    // ترحيل القيد
    const je = await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `COMM-${period}`,
        description: `عمولات المبيعات — ${period}`,
        date:        to,
        status:      'POSTED',
        sourceType:  'COMMISSION',
        lines: {
          create: [
            { tenantId, accountCode: '5300', debit: totalPayout,        credit: new Decimal(0), description: 'مصروف عمولات المبيعات' },
            { tenantId, accountCode: '2330', debit: new Decimal(0), credit: totalPayout,        description: 'عمولات مستحقة الدفع (مع الراتب)' },
          ],
        },
      },
    }).catch(() => null);

    return { period, summaries, totalPayout, journalEntryId: je?.id };
  }

  /**
   * تحديد معدل العمولة بحسب الطبقة
   */
  private _getTieredRate(totalSales: number, tiers: CommissionTier[]): number {
    for (const tier of tiers) {
      if (totalSales <= tier.upTo) return tier.rate;
    }
    return tiers[tiers.length - 1]?.rate ?? 0.02;
  }
}
