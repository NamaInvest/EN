/**
 * Asset Impairment Service — IAS 36
 * Uses actual AssetImpairmentRecord model
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ImpairmentTestInput {
  assetId: number;
  testDate: Date;
  fairValueLessCostOfSale: number;
  discountRate: number;
  projectedCashFlows: { year: number; amount: number }[];
  testedByUserId: string;
}

export interface ImpairmentTestResult {
  assetId: number;
  carryingAmount: number;
  fairValueLessCostOfSale: number;
  valueInUse: number;
  recoverableAmount: number;
  impairmentLoss: number;
  isImpaired: boolean;
  journalEntries: { account: string; debit: number; credit: number }[];
}

export class AssetImpairmentService {
  constructor(private prisma: PrismaClient) {}

  async testImpairment(tenantId: string, input: ImpairmentTestInput): Promise<ImpairmentTestResult> {
    const asset = await this.prisma.fixedAsset.findFirstOrThrow({
      where: { id: input.assetId, tenantId },
    });

    const carryingAmount = Number(asset.currentBookValue ?? 0);
    const valueInUse = this.calculateValueInUse(input.projectedCashFlows, input.discountRate);
    const recoverableAmount = Math.max(input.fairValueLessCostOfSale, valueInUse);
    const impairmentLoss = Math.max(0, carryingAmount - recoverableAmount);
    const isImpaired = impairmentLoss > 0;

    const journalEntries: ImpairmentTestResult['journalEntries'] = [];
    if (isImpaired) {
      journalEntries.push(
        { account: 'Impairment Loss Expense', debit: impairmentLoss, credit: 0 },
        { account: 'Accumulated Impairment', debit: 0, credit: impairmentLoss },
      );
    }

    // Use placeholder journalEntryId (real implementation would create journal entry first)
    const journalEntryId = 0;

    // Save to AssetImpairmentRecord
    await this.prisma.assetImpairmentRecord.create({
      data: {
        tenantId,
        assetId: input.assetId,
        testDate: input.testDate,
        carryingAmount: new Decimal(carryingAmount),
        fairValueLessCosts: new Decimal(input.fairValueLessCostOfSale),
        valueInUse: new Decimal(valueInUse),
        recoverableAmount: new Decimal(recoverableAmount),
        impairmentLoss: new Decimal(impairmentLoss),
        reversal: false,
        calculationMethod: 'DCF',
        journalEntryId,
        testedByUserId: input.testedByUserId,
      },
    });

    // Update asset accumulated impairment
    await this.prisma.fixedAsset.update({
      where: { id: input.assetId },
      data: {
        accumulatedImpairment: {
          increment: new Decimal(impairmentLoss),
        },
      },
    });

    return {
      assetId: input.assetId,
      carryingAmount,
      fairValueLessCostOfSale: input.fairValueLessCostOfSale,
      valueInUse,
      recoverableAmount,
      impairmentLoss,
      isImpaired,
      journalEntries,
    };
  }

  async testCGU(tenantId: string, cguId: number): Promise<{
    cguId: number;
    totalCarryingAmount: number;
    assets: { assetId: number; carryingAmount: number }[];
  }> {
    const assets = await this.prisma.fixedAsset.findMany({
      where: { tenantId, cguId },
      select: { id: true, currentBookValue: true },
    });
    const totalCarryingAmount = assets.reduce((s, a) => s + Number(a.currentBookValue ?? 0), 0);
    return {
      cguId,
      totalCarryingAmount,
      assets: assets.map((a) => ({ assetId: a.id, carryingAmount: Number(a.currentBookValue ?? 0) })),
    };
  }

  private calculateValueInUse(cashFlows: { year: number; amount: number }[], discountRate: number): number {
    const r = discountRate / 100;
    return cashFlows.reduce((pv, cf) => pv + cf.amount / Math.pow(1 + r, cf.year), 0);
  }
}
