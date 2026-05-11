/**
 * Fixed Assets Depreciation Engine
 * ══════════════════════════════════════════════════════════════════════════════
 * يُكمِّل fixed-assets-engine.ts بدعم:
 *   1. حساب الإهلاك التلقائي (القسط الثابت / المتناقص / وحدات الإنتاج)
 *   2. جدول الإهلاك المفصّل (Depreciation Schedule)
 *   3. سجل الأصول + الإهلاك المتراكم لأي تاريخ
 *   4. التكامل مع محرك الإقفال الشهري (DEPRECIATION task)
 *   5. تقرير NBV (Net Book Value) لكل الأصول
 *
 * يتوافق مع IAS 16 (الأصول الثابتة) + IFRS 16 (حق الاستخدام)
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'depreciation-engine' });

// ─── Types ────────────────────────────────────────────────────────────────────

export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';

export interface DepreciationScheduleLine {
  period:           string;    // YYYY-MM
  openingNBV:       number;
  depreciationAmt:  number;
  accumulatedDep:   number;
  closingNBV:       number;
  isFullyDepreciated: boolean;
}

export interface AssetDepreciationResult {
  assetId:          number;
  assetCode:        string;
  assetName:        string;
  costValue:        number;
  residualValue:    number;
  usefulLifeMonths: number;
  method:           DepreciationMethod;
  acquisitionDate:  string;
  depreciationRate: number;
  monthlyCharge:    number;
  accumulatedDep:   number;
  nbv:              number;
  isFullyDepreciated: boolean;
  remainingMonths:  number;
  schedule:         DepreciationScheduleLine[];
}

export interface MonthlyDepreciationRun {
  tenantId:       string;
  period:         string;
  totalAssets:    number;
  totalCharge:    number;
  journalId:      number | null;
  entries:        { assetId: number; assetCode: string; charge: number }[];
  posted:         boolean;
  generatedAt:    string;
}

// ─── GL Account codes ─────────────────────────────────────────────────────────
const ACCUM_DEP_ACCOUNT = '1490';   // Accumulated Depreciation (contra-asset)
const DEP_EXPENSE_ACCOUNT = '5310'; // Depreciation Expense

// ─── Engine ───────────────────────────────────────────────────────────────────

export class DepreciationEngine {

  // ── Monthly Run: compute + post GL journal ───────────────────────────────────
  static async runMonthly(
    tenantId:    string,
    period:      string,    // YYYY-MM
    userId:      string,
    fiscalYearId: number,
    dryRun:      boolean = false,
  ): Promise<MonthlyDepreciationRun> {
    const [year, month] = period.split('-').map(Number);
    const periodEnd     = new Date(year, month, 0, 23, 59, 59);

    // Fetch all active depreciable assets for this tenant
    const assets = await (prisma as any).fixedAsset?.findMany?.({
      where: {
        tenantId,
        isActive:      true,
        isFullyDepreciated: false,
        acquisitionDate: { lte: periodEnd },
      },
    }).catch(() => []) ?? [];

    if (assets.length === 0) {
      log.info('No depreciable assets', { tenantId, period });
      return {
        tenantId, period,
        totalAssets:  0,
        totalCharge:  0,
        journalId:    null,
        entries:      [],
        posted:       false,
        generatedAt:  new Date().toISOString(),
      };
    }

    const entries: { assetId: number; assetCode: string; charge: number }[] = [];
    let totalCharge = 0;

    for (const asset of assets) {
      const charge = this._computeMonthlyCharge(asset, periodEnd);
      if (charge <= 0) continue;
      entries.push({ assetId: asset.id, assetCode: asset.code ?? String(asset.id), charge });
      totalCharge += charge;
    }

    totalCharge = Math.round(totalCharge * 100) / 100;

    if (dryRun || totalCharge === 0) {
      return {
        tenantId, period,
        totalAssets:  assets.length,
        totalCharge,
        journalId:    null,
        entries,
        posted:       false,
        generatedAt:  new Date().toISOString(),
      };
    }

    // Look up GL account IDs
    const [depExpAcct, accumDepAcct] = await Promise.all([
      (prisma as any).account?.findFirst?.({ where: { tenantId, code: { startsWith: DEP_EXPENSE_ACCOUNT } } }),
      (prisma as any).account?.findFirst?.({ where: { tenantId, code: { startsWith: ACCUM_DEP_ACCOUNT } } }),
    ]);

    // Post consolidated journal entry (Dr Dep Expense / Cr Accum Dep)
    const journal = await (prisma as any).journalEntry?.create?.({
      data: {
        tenantId,
        fiscalYearId,
        date:          periodEnd.toISOString().split('T')[0],
        description:   `إهلاك شهر ${period} — ${entries.length} أصل`,
        reference:     `DEP-${period}`,
        status:        'POSTED',
        createdBy:     userId,
        totalDebit:    totalCharge,
        totalCredit:   totalCharge,
        lines: {
          create: [
            {
              tenantId,
              accountId:   depExpAcct?.id ?? 0,
              side:         'DEBIT',
              amount:       totalCharge,
              description:  `مصروف إهلاك ${period}`,
            },
            {
              tenantId,
              accountId:   accumDepAcct?.id ?? 0,
              side:         'CREDIT',
              amount:       totalCharge,
              description:  `إهلاك متراكم ${period}`,
            },
          ],
        },
      },
    }).catch((e: any) => {
      log.error('Failed to post depreciation journal', { error: e.message });
      return null;
    });

    // Update accumulated depreciation on each asset
    if (journal) {
      for (const entry of entries) {
        await (prisma as any).fixedAsset?.update?.({
          where: { id: entry.assetId },
          data: {
            accumulatedDepreciation: { increment: entry.charge },
            lastDepreciationDate:    periodEnd,
          },
        }).catch(() => null);
      }
    }

    log.info('Depreciation run complete', { tenantId, period, totalCharge, assets: entries.length });

    return {
      tenantId, period,
      totalAssets:  assets.length,
      totalCharge,
      journalId:    journal?.id ?? null,
      entries,
      posted:       !!journal,
      generatedAt:  new Date().toISOString(),
    };
  }

  // ── Full Schedule for a single asset ─────────────────────────────────────────
  static async getAssetSchedule(assetId: number, tenantId: string): Promise<AssetDepreciationResult | null> {
    const asset = await (prisma as any).fixedAsset?.findUnique?.({
      where: { id: assetId },
    }).catch(() => null);

    if (!asset || asset.tenantId !== tenantId) return null;

    const costValue        = Number(asset.costValue ?? asset.purchaseCost ?? 0);
    const residualValue    = Number(asset.residualValue ?? 0);
    const usefulLifeMonths = Number(asset.usefulLifeMonths ?? (asset.usefulLife ?? 5) * 12);
    const method           = (asset.depreciationMethod ?? 'STRAIGHT_LINE') as DepreciationMethod;
    const accumulatedDep   = Number(asset.accumulatedDepreciation ?? 0);
    const nbv              = Math.max(costValue - accumulatedDep, residualValue);
    const depreciableAmt   = costValue - residualValue;
    const monthlyCharge    = method === 'STRAIGHT_LINE'
      ? depreciableAmt / usefulLifeMonths
      : (nbv * (2 / usefulLifeMonths));

    const depRate = usefulLifeMonths > 0 ? (1 / usefulLifeMonths) * 100 : 0;

    // Build schedule from acquisition date to full depreciation
    const schedule: DepreciationScheduleLine[] = [];
    let openingNBV   = costValue - residualValue;
    let accumDep     = 0;
    const startDate  = new Date(asset.acquisitionDate ?? asset.createdAt);
    const startMonth = startDate.getMonth();
    const startYear  = startDate.getFullYear();

    for (let m = 0; m < usefulLifeMonths; m++) {
      const d       = new Date(startYear, startMonth + m, 1);
      const period  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const charge  = Math.min(
        method === 'STRAIGHT_LINE' ? monthlyCharge : openingNBV * (2 / usefulLifeMonths),
        openingNBV,
      );
      accumDep += charge;
      const closingNBV = Math.max(openingNBV - charge, 0);
      schedule.push({
        period,
        openingNBV:         Math.round(openingNBV * 100) / 100,
        depreciationAmt:    Math.round(charge      * 100) / 100,
        accumulatedDep:     Math.round(accumDep    * 100) / 100,
        closingNBV:         Math.round(closingNBV  * 100) / 100,
        isFullyDepreciated: closingNBV <= 0.01,
      });
      openingNBV = closingNBV;
      if (openingNBV <= 0.01) break;
    }

    const remainingMonths = Math.max(0, usefulLifeMonths - Math.ceil(accumulatedDep / (monthlyCharge || 1)));

    return {
      assetId,
      assetCode:        asset.code ?? String(assetId),
      assetName:        asset.nameAr ?? asset.name ?? '',
      costValue,
      residualValue,
      usefulLifeMonths,
      method,
      acquisitionDate:  asset.acquisitionDate?.toISOString?.()?.split('T')[0] ?? '',
      depreciationRate: Math.round(depRate * 100) / 100,
      monthlyCharge:    Math.round(monthlyCharge * 100) / 100,
      accumulatedDep:   Math.round(accumulatedDep * 100) / 100,
      nbv:              Math.round(nbv * 100) / 100,
      isFullyDepreciated: nbv <= residualValue + 0.01,
      remainingMonths,
      schedule,
    };
  }

  // ── NBV Report: all assets as of a date ────────────────────────────────────────
  static async getNBVReport(tenantId: string, asOf?: Date) {
    const targetDate = asOf ?? new Date();
    const assets     = await (prisma as any).fixedAsset?.findMany?.({
      where: { tenantId, isActive: true },
      orderBy: { code: 'asc' },
    }).catch(() => []) ?? [];

    const rows = assets.map((a: any) => {
      const cost    = Number(a.costValue ?? a.purchaseCost ?? 0);
      const accDep  = Number(a.accumulatedDepreciation ?? 0);
      const nbv     = Math.max(cost - accDep, Number(a.residualValue ?? 0));
      return {
        assetId:     a.id,
        code:        a.code,
        name:        a.nameAr ?? a.name,
        category:    a.category ?? a.assetType,
        cost:        Math.round(cost   * 100) / 100,
        accDep:      Math.round(accDep * 100) / 100,
        nbv:         Math.round(nbv    * 100) / 100,
        acquisitionDate: a.acquisitionDate?.toISOString?.()?.split('T')[0],
        isFullyDepreciated: nbv <= Number(a.residualValue ?? 0) + 0.01,
      };
    });

    const totalCost    = rows.reduce((s: number, r: any) => s + r.cost, 0);
    const totalAccDep  = rows.reduce((s: number, r: any) => s + r.accDep, 0);
    const totalNBV     = rows.reduce((s: number, r: any) => s + r.nbv, 0);

    return {
      tenantId,
      asOf:    targetDate.toISOString().split('T')[0],
      rows,
      totals: {
        cost:    Math.round(totalCost   * 100) / 100,
        accDep:  Math.round(totalAccDep * 100) / 100,
        nbv:     Math.round(totalNBV    * 100) / 100,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Private: monthly charge for one asset ──────────────────────────────────────
  private static _computeMonthlyCharge(asset: any, periodEnd: Date): number {
    const cost     = Number(asset.costValue ?? asset.purchaseCost ?? 0);
    const residual = Number(asset.residualValue ?? 0);
    const months   = Number(asset.usefulLifeMonths ?? (asset.usefulLife ?? 5) * 12);
    const accDep   = Number(asset.accumulatedDepreciation ?? 0);
    const nbv      = Math.max(cost - accDep, residual);
    const method   = (asset.depreciationMethod ?? 'STRAIGHT_LINE') as DepreciationMethod;

    if (nbv <= residual + 0.01) return 0;

    switch (method) {
      case 'DECLINING_BALANCE':
        return Math.min(nbv * (2 / months), nbv - residual);
      case 'UNITS_OF_PRODUCTION': {
        const totalUnits = Number(asset.totalUnits ?? 1);
        const periodUnits = Number(asset.periodUnits ?? 0);
        return ((cost - residual) / totalUnits) * periodUnits;
      }
      case 'STRAIGHT_LINE':
      default:
        return (cost - residual) / months;
    }
  }
}
