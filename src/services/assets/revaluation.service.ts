/**
 * Asset Revaluation Service — IAS 16 Revaluation Model
 * Uses actual FixedAsset fields (acquisitionCost, accumulatedDepreciation, currentBookValue)
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface RevaluationInput {
  assetId: number;
  revaluationDate: Date;
  fairValue: number;
  valuationMethod: 'MARKET_APPROACH' | 'INCOME_APPROACH' | 'COST_APPROACH';
  valuerName: string;
  notes?: string;
  createdByUserId: string;
}

export interface RevaluationResult {
  assetId: number;
  previousCarryingAmount: number;
  newCarryingAmount: number;
  surplusOCI: number;
  deficitPL: number;
  accumulatedDepreciationEliminated: number;
  journalEntries: { account: string; debit: number; credit: number; description: string }[];
}

export class AssetRevaluationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Revalue asset to fair value (IAS 16 — proportional elimination method)
   */
  async revalueAsset(tenantId: string, input: RevaluationInput): Promise<RevaluationResult> {
    const asset = await this.prisma.fixedAsset.findFirstOrThrow({
      where: { id: input.assetId, tenantId },
      select: {
        acquisitionCost: true,
        accumulatedDepreciation: true,
        currentBookValue: true,
        impairmentRecords: { select: { impairmentLoss: true }, orderBy: { testDate: 'desc' }, take: 1 },
      },
    });

    const grossCost = Number(asset.acquisitionCost ?? 0);
    const accDepreciation = Number(asset.accumulatedDepreciation ?? 0);
    const carryingAmount = Number(asset.currentBookValue ?? grossCost - accDepreciation);
    const difference = input.fairValue - carryingAmount;

    const journalEntries: RevaluationResult['journalEntries'] = [];

    // Step 1: Eliminate accumulated depreciation
    if (accDepreciation > 0) {
      journalEntries.push(
        { account: 'Accumulated Depreciation', debit: accDepreciation, credit: 0, description: 'Eliminate accum. dep on revaluation' },
        { account: 'Fixed Asset (Gross)', debit: 0, credit: accDepreciation, description: 'Eliminate accum. dep on revaluation' },
      );
    }

    // Step 2: Book the difference
    if (difference > 0) {
      journalEntries.push(
        { account: 'Fixed Asset (Gross)', debit: difference, credit: 0, description: 'Revaluation surplus to OCI' },
        { account: 'Revaluation Surplus (OCI)', debit: 0, credit: difference, description: 'Revaluation surplus to OCI' },
      );
    } else if (difference < 0) {
      const deficit = Math.abs(difference);
      journalEntries.push(
        { account: 'Revaluation Deficit (P&L)', debit: deficit, credit: 0, description: 'Revaluation deficit to P&L' },
        { account: 'Fixed Asset (Gross)', debit: 0, credit: deficit, description: 'Revaluation deficit to P&L' },
      );
    }

    // Update asset: new cost = fairValue, accum dep = 0, currentBookValue = fairValue
    await this.prisma.fixedAsset.update({
      where: { id: input.assetId },
      data: {
        acquisitionCost: new Decimal(input.fairValue),
        accumulatedDepreciation: new Decimal(0),
        currentBookValue: new Decimal(input.fairValue),
      },
    });

    // Log revaluation as audit record
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'UPDATE',
        tableName: 'fixed_assets',
        recordId: String(input.assetId),
        details: JSON.stringify({
          event: 'REVALUATION',
          previousCarryingAmount: carryingAmount,
          newFairValue: input.fairValue,
          difference,
          valuationMethod: input.valuationMethod,
          valuerName: input.valuerName,
          revaluationDate: input.revaluationDate,
          notes: input.notes,
        }),
      },
    });

    return {
      assetId: input.assetId,
      previousCarryingAmount: carryingAmount,
      newCarryingAmount: input.fairValue,
      surplusOCI: difference > 0 ? difference : 0,
      deficitPL: difference < 0 ? Math.abs(difference) : 0,
      accumulatedDepreciationEliminated: accDepreciation,
      journalEntries,
    };
  }

  /**
   * Get revaluation history from AuditLog
   */
  async getHistory(tenantId: string, assetId: number): Promise<{
    date: string;
    previousValue: number;
    newFairValue: number;
    difference: number;
    valuationMethod: string;
    valuerName: string;
  }[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        tableName: 'fixed_assets',
        recordId: String(assetId),
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs
      .map((l) => {
        try {
          const d = JSON.parse(l.details ?? '{}');
          if (d.event !== 'REVALUATION') return null;
          return {
            date: l.createdAt.toISOString(),
            previousValue: d.previousCarryingAmount,
            newFairValue: d.newFairValue,
            difference: d.difference,
            valuationMethod: d.valuationMethod,
            valuerName: d.valuerName,
          };
        } catch { return null; }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }
}
