/**
 * Fixed Asset Service (FA 2A)
 * Handles asset capitalization, depreciation engine (Straight-line, Declining balance),
 * impairment, and disposal according to IFRS standards.
 */

import { BaseService } from '../shared/base.service';
import { BusinessContext } from '../shared/event-bus.service';
import { PrismaClient, Prisma } from '@prisma/client';
import { eventBus } from '../shared/event-bus.service';
import { Decimal } from 'decimal.js';

export interface DepreciationPreview {
  assetId: number;
  periodStart: Date;
  periodEnd: Date;
  openingBookValue: number;
  depreciationExpense: number;
  closingBookValue: number;
  method: string;
}

export class FixedAssetService extends BaseService {
  constructor(prisma: PrismaClient, ctx: BusinessContext) {
    super(prisma, ctx);
  }

  /**
   * Capitalizes a CWIP (Construction Work In Progress) asset into an active, depreciable asset.
   */
  async capitalizeAsset(
    assetId: number,
    inServiceDate: Date,
    salvageValue: number = 0,
    usefulLifeYears: number
  ) {
    this.requirePermission('fa:asset:capitalize');

    return await this.prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.findFirstOrThrow({
        where: { id: assetId, tenantId: this.ctx.tenant.id },
      });

      if (asset.status !== 'CWIP') {
        throw new Error('Can only capitalize assets in CWIP status.');
      }

      const updated = await tx.fixedAsset.update({
        where: { id: asset.id },
        data: {
          status: 'ACTIVE',
          depreciationStartDate: inServiceDate,
          salvageValue: new Prisma.Decimal(salvageValue),
          usefulLifeYears,
          statusChangedAt: new Date(),
        },
      });

      await eventBus.afterCommit('FA_ASSET_CAPITALIZED', {
        assetId: updated.id,
        tenantId: this.ctx.tenant.id,
        user: this.ctx.user.id,
        cost: updated.acquisitionCost,
      });

      return updated;
    });
  }

  /**
   * Calculates the depreciation expense for a given period based on the asset's selected method.
   * Internal pure calculation method.
   */
  calculateDepreciationExpense(asset: any, periodStart: Date, periodEnd: Date): number {
    const cost = Number(asset.acquisitionCost);
    const accumDep = Number(asset.accumulatedDepreciation) + Number(asset.accumulatedImpairment);
    const bookValue = cost - accumDep;
    const salvage = Number(asset.salvageValue);
    
    // Safety check: Cannot depreciate below salvage value
    if (bookValue <= salvage) return 0;

    const daysInPeriod = Math.max(0, (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    let annualExpense = 0;

    switch (asset.depreciationMethod) {
      case 'STRAIGHT_LINE':
        if (!asset.usefulLifeYears || asset.usefulLifeYears <= 0) return 0;
        annualExpense = (cost - salvage) / asset.usefulLifeYears;
        break;

      case 'DECLINING_BALANCE':
        if (!asset.usefulLifeYears || asset.usefulLifeYears <= 0) return 0;
        // e.g. DDB is 2 / usefulLife, 150% is 1.5 / usefulLife
        const rate = Number(asset.declineRate) || (2 / asset.usefulLifeYears);
        annualExpense = bookValue * rate;
        break;

      case 'UNITS_OF_PRODUCTION':
        if (!asset.totalEstimatedUnits || asset.totalEstimatedUnits <= 0) return 0;
        // Note: For units of production, pass unitsThisPeriod separately, this simple signature assumes time-based.
        // For time-based preview, we return 0 here and handle actual production separately.
        return 0;

      case 'NO_DEPRECIATION':
      case 'CWIP':
        return 0;

      default:
        return 0; // Unsupported method fallback
    }

    // Pro-rate the annual expense based on the number of days in the period
    let periodExpense = annualExpense * (daysInPeriod / 365.25);
    
    // Cap depreciation so it does not reduce book value below salvage value
    if (bookValue - periodExpense < salvage) {
      periodExpense = bookValue - salvage;
    }

    return Math.max(0, Number(periodExpense.toFixed(4)));
  }

  /**
   * Generates a preview of the depreciation run for the given period.
   */
  async previewDepreciationRun(periodEnd: Date): Promise<DepreciationPreview[]> {
    this.requirePermission('fa:depreciation:run');

    const assets = await this.prisma.fixedAsset.findMany({
      where: {
        tenantId: this.ctx.tenant.id,
        status: 'ACTIVE',
        depreciationStartDate: { lte: periodEnd },
        currentBookValue: { gt: 0 },
      },
    });

    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1); // Simplistic monthly start

    return assets.map(asset => {
      // Determine the effective start date for this asset (don't depreciate before it started)
      const effectiveStart = asset.depreciationStartDate > periodStart ? asset.depreciationStartDate : periodStart;
      
      const expense = this.calculateDepreciationExpense(asset, effectiveStart, periodEnd);
      const openingBookValue = Number(asset.currentBookValue);
      const closingBookValue = openingBookValue - expense;

      return {
        assetId: asset.id,
        periodStart: effectiveStart,
        periodEnd,
        openingBookValue,
        depreciationExpense: expense,
        closingBookValue,
        method: asset.depreciationMethod,
      };
    });
  }

  /**
   * Executes a depreciation run, updates asset book values, and generates Journal Entries.
   */
  async executeDepreciationRun(periodEnd: Date) {
    this.requirePermission('fa:depreciation:run');

    return await this.prisma.$transaction(async (tx) => {
      const previews = await this.previewDepreciationRun(periodEnd);
      
      // Filter out zero expense assets
      const toDepreciate = previews.filter(p => p.depreciationExpense > 0);
      if (toDepreciate.length === 0) return { count: 0, totalExpense: 0 };

      // Generate a single Journal Entry for the entire run
      const totalExpense = toDepreciate.reduce((sum, p) => sum + p.depreciationExpense, 0);
      
      const journalEntry = await tx.journalEntry.create({
        data: {
          tenantId: this.ctx.tenant.id,
          entryNumber: `FA-DEP-${Date.now()}`,
          entryDate: periodEnd.toISOString().split('T')[0],
          description: `إهلاك الأصول الثابتة للفترة المنتهية في ${periodEnd.toISOString().split('T')[0]}`,
          status: 'POSTED',
          totalDebit: new Prisma.Decimal(totalExpense),
          totalCredit: new Prisma.Decimal(totalExpense),
          lines: {
            create: await Promise.all(toDepreciate.map(async (preview) => {
              // Note: In real life, we should look up the category id from the asset
              const asset = await tx.fixedAsset.findUnique({ where: { id: preview.assetId } });
              
              const accountDetService = new (require('../gl/account-determination.service').AccountDeterminationService)(this.prisma, this.ctx);
              const depExpenseAccountId = await accountDetService.resolveAccount('ASSET_DEP_EXPENSE', { categoryId: asset?.categoryId || undefined });
              const accumDepAccountId = await accountDetService.resolveAccount('ASSET_ACCUM_DEP', { categoryId: asset?.categoryId || undefined });

              return [
                { accountId: depExpenseAccountId, debit: new Prisma.Decimal(preview.depreciationExpense), credit: 0, description: `مصروف الإهلاك - أصل ${preview.assetId}` },
                { accountId: accumDepAccountId, debit: 0, credit: new Prisma.Decimal(preview.depreciationExpense), description: `مجمع الإهلاك - أصل ${preview.assetId}` }
              ];
            })).then(lines => lines.flat())
          }
        }
      });

      // Log depreciation and update asset book values
      for (const preview of toDepreciate) {
        // 1. Create log
        await tx.assetDepreciationLog.create({
          data: {
            tenantId: this.ctx.tenant.id,
            assetId: preview.assetId,
            periodStart: preview.periodStart,
            periodEnd: preview.periodEnd,
            openingNbv: new Prisma.Decimal(preview.openingBookValue),
            depreciationAmount: new Prisma.Decimal(preview.depreciationExpense),
            closingNbv: new Prisma.Decimal(preview.closingBookValue),
            method: preview.method,
            journalEntryId: journalEntry.id,
          }
        });

        // 2. Update asset accum dep and book value
        await tx.fixedAsset.update({
          where: { id: preview.assetId },
          data: {
            accumulatedDepreciation: { increment: new Prisma.Decimal(preview.depreciationExpense) },
            currentBookValue: new Prisma.Decimal(preview.closingBookValue),
          }
        });
      }

      await eventBus.afterCommit('FA_DEPRECIATION_RUN_COMPLETED', {
        tenantId: this.ctx.tenant.id,
        user: this.ctx.user.id,
        assetsCount: toDepreciate.length,
        totalExpense,
        journalEntryId: journalEntry.id,
      });

      return {
        count: toDepreciate.length,
        totalExpense,
        journalEntryId: journalEntry.id,
      };
    });
  }
}
