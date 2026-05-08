/**
 * FXRevaluationService — إعادة تقييم العملات الأجنبية
 *
 * النماذج: ExchangeRate, FxRevaluationRun, JournalEntry, JournalLine
 *
 * العملية:
 *  1. جلب أرصدة الحسابات بالعملات الأجنبية من GL
 *  2. مقارنتها بسعر الصرف الحالي
 *  3. حساب الفروقات غير المحققة (Unrealized Gain/Loss)
 *  4. إنشاء قيد محاسبي تلقائي
 *
 * SOCPA / IFRS: IAS 21 — The Effects of Changes in Foreign Exchange Rates
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface FXRevaluationLine {
  accountId: string;
  currency: string;
  fcyBalance: Decimal;          // رصيد بالعملة الأجنبية
  bookRate: Decimal;            // سعر الصرف الدفتري
  currentRate: Decimal;         // سعر الصرف الحالي
  bookValueSAR: Decimal;        // القيمة الدفترية بالريال
  revaluedSAR: Decimal;         // القيمة بعد إعادة التقييم بالريال
  gainLoss: Decimal;            // الربح/الخسارة (موجب = ربح، سالب = خسارة)
}

export interface FXRevaluationResult {
  runId: number;
  journalEntryId?: number;
  lines: FXRevaluationLine[];
  totalGain: Decimal;
  totalLoss: Decimal;
  netGainLoss: Decimal;
}

// أكواد الحسابات — يمكن تهيئتها من الإعدادات
const UNREALIZED_GAIN_ACCOUNT = 'FOREX_GAIN';
const UNREALIZED_LOSS_ACCOUNT = 'FOREX_LOSS';

export class FXRevaluationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * تنفيذ إعادة التقييم للفترة المحددة
   */
  async revalue(
    fiscalPeriodId: number,
    runDate: Date = new Date(),
  ): Promise<FXRevaluationResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // 1. جلب أحدث أسعار الصرف
    const rates = await prisma.exchangeRate.findMany({
      where: { tenantId, date: { lte: runDate } },
      orderBy: { date: 'desc' },
      distinct: ['currencyId'],
      include: { currency: true },
    });

    const rateMap = new Map<string, Decimal>(
      rates.map((r: any) => [r.currency.code, new Decimal(r.rate)]),
    );

    // 2. جلب الحسابات بعملات أجنبية من JournalLine
    const fcyBalances = await prisma.journalLine.groupBy({
      by: ['accountId', 'currencyCode'],
      where: {
        tenantId,
        journalEntry: { fiscalPeriodId, status: 'POSTED' },
        currencyCode: { not: 'SAR', notIn: [null, ''] },
      },
      _sum: { fcyDebit: true, fcyCredit: true, rate: true },
    }).catch(() => []);

    const lines: FXRevaluationLine[] = [];

    for (const row of fcyBalances) {
      const currency = row.currencyCode;
      const currentRate = rateMap.get(currency);
      if (!currentRate) continue;

      const fcyBalance = new Decimal(row._sum.fcyDebit ?? 0).sub(
        new Decimal(row._sum.fcyCredit ?? 0),
      );
      if (fcyBalance.isZero()) continue;

      // متوسط سعر الترحيل الدفتري
      const bookRate = new Decimal(row._sum.rate ?? currentRate);
      const bookValueSAR = fcyBalance.mul(bookRate).toDecimalPlaces(2);
      const revaluedSAR = fcyBalance.mul(currentRate).toDecimalPlaces(2);
      const gainLoss = revaluedSAR.sub(bookValueSAR);

      lines.push({
        accountId: String(row.accountId),
        currency,
        fcyBalance,
        bookRate,
        currentRate,
        bookValueSAR,
        revaluedSAR,
        gainLoss,
      });
    }

    const totalGain = lines
      .filter((l) => l.gainLoss.gt(0))
      .reduce((s, l) => s.add(l.gainLoss), new Decimal(0));

    const totalLoss = lines
      .filter((l) => l.gainLoss.lt(0))
      .reduce((s, l) => s.add(l.gainLoss.abs()), new Decimal(0));

    const netGainLoss = totalGain.sub(totalLoss);

    // 3. إنشاء FxRevaluationRun + JournalEntry
    const result = await prisma.$transaction(async (tx: any) => {
      let journalEntryId: number | undefined;

      if (!netGainLoss.isZero()) {
        // قيد: مدين/دائن لكل حساب عملة + المقابل في حساب فروق الأسعار
        const je = await tx.journalEntry.create({
          data: {
            tenantId,
            reference: `FX-REVAL-${fiscalPeriodId}-${runDate.toISOString().slice(0, 10)}`,
            description: `إعادة تقييم العملات الأجنبية — ${runDate.toLocaleDateString('ar-SA')}`,
            date: runDate,
            fiscalPeriodId,
            status: 'POSTED',
            lines: {
              create: [
                // سطور تعديل الأرصدة لكل حساب
                ...lines.map((l) => ({
                  accountId: l.accountId,
                  debit: l.gainLoss.gt(0) ? l.gainLoss : new Decimal(0),
                  credit: l.gainLoss.lt(0) ? l.gainLoss.abs() : new Decimal(0),
                  tenantId,
                  description: `إعادة تقييم ${l.currency}`,
                })),
                // السطر المقابل (Gain/Loss account)
                {
                  accountCode: netGainLoss.gt(0)
                    ? UNREALIZED_GAIN_ACCOUNT
                    : UNREALIZED_LOSS_ACCOUNT,
                  debit: netGainLoss.lt(0) ? netGainLoss.abs() : new Decimal(0),
                  credit: netGainLoss.gt(0) ? netGainLoss : new Decimal(0),
                  tenantId,
                  description: 'فروقات إعادة تقييم العملات الأجنبية',
                },
              ],
            },
          },
        });
        journalEntryId = je.id;
      }

      const run = await tx.fxRevaluationRun.create({
        data: {
          tenantId,
          fiscalPeriodId,
          runDate,
          exchangeRateUsed: lines[0]?.currentRate ?? new Decimal(1),
          totalGain,
          totalLoss,
          journalEntryId,
          status: 'POSTED',
          createdBy: this.ctx.user.id,
        },
      });

      return { run, journalEntryId };
    });

    return {
      runId: result.run.id,
      journalEntryId: result.journalEntryId,
      lines,
      totalGain,
      totalLoss,
      netGainLoss,
    };
  }
}
