import { prisma } from './prisma';
import { logger } from '@/lib/logger';
import { Decimal } from '@prisma/client/runtime/library';

const log = logger.child({ service: 'deferred-tax-engine' });

export interface TempDiffCalculation {
  itemCode: string;
  description: string;
  accountingBase: number;
  taxBase: number;
  temporaryDiff: number;
  diffType: 'TAXABLE_TEMP_DIFF' | 'DEDUCTIBLE_TEMP_DIFF' | 'NONE';
  classification: 'DTL' | 'DTA' | 'NONE';
  taxRate: number;
  deferredTaxAmount: number;
  recoverability?: 'PROBABLE' | 'UNCERTAIN';
}

export class DeferredTaxEngine {
  /**
   * IAS 12.5: Temp diff = Carrying Amount - Tax Base
   * Calculate all temporary differences across the system for a given date.
   */
  static async calculateForPeriod(tenantId: string, asOfDate: Date, taxRate: number = 0.20): Promise<TempDiffCalculation[]> {
    const results: TempDiffCalculation[] = [];
    
    // 1. Fixed Assets (Book vs Tax Depreciation)
    try {
      const fixedAssets = await prisma.fixedAsset.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, assetNumber: true, name: true, acquisitionCost: true, accumulatedDepreciation: true }
      });
      
      let totalBookNBV = 0;
      let totalTaxNBV = 0; // Simplified: Assuming tax NBV is tracked or calculated differently, using a mock 20% difference for illustration
      
      for (const asset of fixedAssets) {
        const bookNbv = Number(asset.acquisitionCost || 0) - Number(asset.accumulatedDepreciation || 0);
        const taxNbv = Number(asset.acquisitionCost || 0) * 0.8; // Example: Accelerated tax depreciation
        totalBookNBV += bookNbv;
        totalTaxNBV += taxNbv;
      }

      const faDiff = totalBookNBV - totalTaxNBV;
      if (Math.abs(faDiff) > 0) {
        const type = faDiff > 0 ? 'TAXABLE_TEMP_DIFF' : 'DEDUCTIBLE_TEMP_DIFF';
        results.push({
          itemCode: 'FIXED_ASSET_DEPR',
          description: 'Fixed Assets Book vs Tax Depreciation',
          accountingBase: totalBookNBV,
          taxBase: totalTaxNBV,
          temporaryDiff: Math.abs(faDiff),
          diffType: type,
          classification: type === 'TAXABLE_TEMP_DIFF' ? 'DTL' : 'DTA',
          taxRate,
          deferredTaxAmount: Math.abs(faDiff) * taxRate,
          recoverability: type === 'DEDUCTIBLE_TEMP_DIFF' ? 'PROBABLE' : undefined,
        });
      }
    } catch (e) {
      log.warn('Error calculating Fixed Asset temp diffs', e);
    }

    // 2. ECL / Loan Loss Provision (Deductible temp diff)
    // Often tax only allows write-offs, not provisions
    try {
      // Get all provisions from journal lines (Account 1290 or similar allowance)
      const eclAmount = 50000; // Placeholder for actual ECL engine integration
      results.push({
        itemCode: 'LOAN_LOSS',
        description: 'ECL / Allowance for Doubtful Accounts',
        accountingBase: eclAmount,
        taxBase: 0, // Tax base is 0 because provision is not deductible until realized
        temporaryDiff: eclAmount,
        diffType: 'DEDUCTIBLE_TEMP_DIFF',
        classification: 'DTA',
        taxRate,
        deferredTaxAmount: eclAmount * taxRate,
        recoverability: 'PROBABLE',
      });
    } catch (e) {
      log.warn('Error calculating ECL temp diffs', e);
    }

    return results;
  }

  /**
   * Generates journal entries for recognized deferred tax assets and liabilities
   */
  static async recognizeJournalEntry(tenantId: string, deferredTaxIds: number[]): Promise<any> {
    const records = await prisma.deferredTax.findMany({
      where: { id: { in: deferredTaxIds }, tenantId, status: 'DRAFT' }
    });

    if (records.length === 0) throw new Error('No draft deferred tax records found');

    let totalDTA = 0;
    let totalDTL = 0;

    for (const rec of records) {
      if (rec.classification === 'DTA' && rec.recoverability === 'PROBABLE') {
        totalDTA += Number(rec.deferredTaxAmount);
      } else if (rec.classification === 'DTL') {
        totalDTL += Number(rec.deferredTaxAmount);
      }
    }

    const netTaxExpense = totalDTL - totalDTA; // Positive = Expense, Negative = Benefit

    // This would ideally integrate with AutoJournal or Multi-Book engine
    const journalData = {
      tenantId,
      date: new Date(),
      reference: 'DEFERRED-TAX-RECOGNITION',
      status: 'DRAFT',
      lines: [
        { accountCode: '1290', debit: totalDTA, credit: 0, description: 'Deferred Tax Asset' },
        { accountCode: '2290', debit: 0, credit: totalDTL, description: 'Deferred Tax Liability' },
      ]
    };
    
    if (netTaxExpense > 0) {
      journalData.lines.push({ accountCode: '5910', debit: netTaxExpense, credit: 0, description: 'Deferred Tax Expense' });
    } else if (netTaxExpense < 0) {
      journalData.lines.push({ accountCode: '5910', debit: 0, credit: Math.abs(netTaxExpense), description: 'Deferred Tax Benefit' });
    }

    // Mark as recognized
    await prisma.deferredTax.updateMany({
      where: { id: { in: deferredTaxIds } },
      data: { status: 'RECOGNIZED', updatedAt: new Date() }
    });

    return journalData;
  }

  /**
   * Rollforward for Note 18 disclosures
   */
  static async generateRollforward(tenantId: string, fiscalYear: number): Promise<any[]> {
    return prisma.deferredTaxRollforward.findMany({
      where: { tenantId, fiscalYear }
    });
  }
}
