/**
 * FixedAssetDepreciationService — استهلاك الأصول الثابتة
 *
 * النماذج: FixedAsset, DepreciationRun, JournalEntry
 *
 * الطرق المدعومة:
 *  STRAIGHT_LINE       — القسط الثابت: (التكلفة - القيمة المتبقية) / العمر الإنتاجي
 *  DECLINING_BALANCE   — القسط المتناقص: رصيد دفتري × معدل
 *  DOUBLE_DECLINING    — القسط المتناقص المضاعف: رصيد دفتري × (2 / العمر)
 *  SUM_OF_YEARS_DIGITS — مجموع أرقام السنوات
 *
 * معيار: IAS 16 — الممتلكات والآلات والمعدات
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface DepreciationLine {
  assetId: number;
  assetName: string;
  assetNumber: string;
  depreciationMethod: string;
  acquisitionCost: Decimal;
  accumulatedDepreciation: Decimal;
  bookValue: Decimal;
  periodCharge: Decimal;
  closingBookValue: Decimal;
}

export interface DepreciationRunResult {
  runId?: number;
  fiscalPeriodId: number;
  runDate: Date;
  lines: DepreciationLine[];
  totalCharge: Decimal;
  journalEntryId?: number;
  assetsProcessed: number;
}

export class FixedAssetDepreciationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * حساب ومعالجة استهلاك شهر كامل
   */
  async runMonthlyDepreciation(
    fiscalPeriodId: number,
    periodDate: Date,
  ): Promise<DepreciationRunResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // جلب جميع الأصول النشطة
    const assets = await prisma.fixedAsset.findMany({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'IN_USE'] },
        depreciationMethod: { not: 'NO_DEPRECIATION' },
        acquisitionDate: { lte: periodDate },
      },
    });

    const lines: DepreciationLine[] = [];

    for (const asset of assets) {
      const charge = this._calculateMonthlyCharge(asset, periodDate);
      if (charge.isZero()) continue;

      const accumulated = new Decimal(asset.accumulatedDepreciation ?? 0);
      const bookValue = new Decimal(asset.acquisitionCost).sub(accumulated);
      const closingBookValue = bookValue.sub(charge);

      lines.push({
        assetId: asset.id,
        assetName: asset.name,
        assetNumber: asset.assetNumber,
        depreciationMethod: asset.depreciationMethod,
        acquisitionCost: new Decimal(asset.acquisitionCost),
        accumulatedDepreciation: accumulated,
        bookValue,
        periodCharge: charge,
        closingBookValue: Decimal.max(closingBookValue, new Decimal(asset.residualValue ?? 0)),
      });
    }

    const totalCharge = lines.reduce((s, l) => s.add(l.periodCharge), new Decimal(0));
    if (lines.length === 0) {
      return { fiscalPeriodId, runDate: periodDate, lines: [], totalCharge: new Decimal(0), assetsProcessed: 0 };
    }

    // ترحيل في transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // تحديث الأصول
      for (const line of lines) {
        await tx.fixedAsset.update({
          where: { id: line.assetId },
          data: {
            accumulatedDepreciation: line.accumulatedDepreciation.add(line.periodCharge),
            bookValue: line.closingBookValue,
          },
        });
      }

      // قيد الاستهلاك
      const je = await tx.journalEntry.create({
        data: {
          tenantId,
          reference: `DEP-${fiscalPeriodId}-${periodDate.toISOString().slice(0, 7)}`,
          description: `استهلاك الأصول الثابتة — ${periodDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`,
          date: periodDate,
          fiscalPeriodId,
          status: 'POSTED',
          lines: {
            create: lines.map((l) => ({
              tenantId,
              accountCode: 'DEP_EXPENSE',
              assetId: l.assetId,
              debit: l.periodCharge,
              credit: new Decimal(0),
              description: `استهلاك: ${l.assetName}`,
            })),
          },
        },
      });

      // سجل DepreciationRun
      const run = await tx.depreciationRun.create({
        data: {
          tenantId,
          fiscalPeriodId,
          runDate: periodDate,
          status: 'POSTED',
          totalDepreciation: totalCharge,
          assetCount: lines.length,
          journalEntryId: je.id,
          createdBy: this.ctx.user.id,
        },
      }).catch(() => null);

      return { je, run };
    });

    return {
      runId: result.run?.id,
      fiscalPeriodId,
      runDate: periodDate,
      lines,
      totalCharge,
      journalEntryId: result.je.id,
      assetsProcessed: lines.length,
    };
  }

  /**
   * حساب قسط الاستهلاك الشهري لأصل واحد
   */
  private _calculateMonthlyCharge(asset: any, periodDate: Date): Decimal {
    const cost = new Decimal(asset.acquisitionCost);
    const residual = new Decimal(asset.residualValue ?? 0);
    const depreciableAmount = cost.sub(residual);
    const usefulLifeMonths = (asset.usefulLifeYears ?? 0) * 12 + (asset.usefulLifeMonths ?? 0);
    const accumulated = new Decimal(asset.accumulatedDepreciation ?? 0);
    const bookValue = cost.sub(accumulated);

    if (usefulLifeMonths <= 0 || bookValue.lte(residual)) return new Decimal(0);

    switch (asset.depreciationMethod) {
      case 'STRAIGHT_LINE':
        return depreciableAmount.div(usefulLifeMonths).toDecimalPlaces(2);

      case 'DECLINING_BALANCE': {
        const annualRate = new Decimal(asset.depreciationRate ?? 0).div(100);
        return bookValue.mul(annualRate).div(12).toDecimalPlaces(2);
      }

      case 'DOUBLE_DECLINING': {
        if (usefulLifeMonths <= 0) return new Decimal(0);
        const annualRate = new Decimal(2).div(usefulLifeMonths / 12);
        const charge = bookValue.mul(annualRate).div(12).toDecimalPlaces(2);
        return Decimal.min(charge, bookValue.sub(residual));
      }

      case 'SUM_OF_YEARS_DIGITS': {
        const usefulLifeYears = Math.ceil(usefulLifeMonths / 12);
        const syd = (usefulLifeYears * (usefulLifeYears + 1)) / 2;
        const remainingYears = Math.ceil((usefulLifeMonths - Math.round(accumulated.div(depreciableAmount.div(usefulLifeMonths)).toNumber())) / 12);
        return depreciableAmount.mul(remainingYears).div(syd).div(12).toDecimalPlaces(2);
      }

      default:
        return new Decimal(0);
    }
  }
}
