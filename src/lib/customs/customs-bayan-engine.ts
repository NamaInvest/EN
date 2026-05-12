/**
 * Customs Bayan Engine (Phase 39 - Saudi Customs Integration)
 * ──────────────────────────────────────────────────────────
 * Calculates customs duties, VAT on imports, and landed costs.
 * Prepares data for Fasah / Bayan customs declarations.
 */
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'CustomsBayanEngine' });

export interface ImportItem {
    hsCode: string;
    cifValueSar: number; // Cost, Insurance, Freight in SAR
    dutyRate: number; // 0.05 for 5%, 0 for GCC origin
    isExciseApplicable: boolean;
    exciseRate?: number; // 0.50 or 1.00
}

export interface CustomsCalculationResult {
    totalCifValue: number;
    totalCustomsDuty: number;
    totalExciseTax: number;
    vatOnImport: number; // 15% on (CIF + Duty + Excise)
    totalPayableToCustoms: number;
}

export class CustomsBayanEngine {

    /**
     * Calculates the required duties, excise, and VAT payable at customs for a shipment.
     */
    static calculateImportDuties(items: ImportItem[]): CustomsCalculationResult {
        try {
            log.info(`Calculating customs duties for ${items.length} items`);
            
            let totalCifValue = new Decimal(0);
            let totalCustomsDuty = new Decimal(0);
            let totalExciseTax = new Decimal(0);
            let totalBaseForVat = new Decimal(0);

            for (const item of items) {
                const cif = new Decimal(item.cifValueSar);
                totalCifValue = totalCifValue.plus(cif);

                // 1. Customs Duty
                const duty = cif.mul(item.dutyRate);
                totalCustomsDuty = totalCustomsDuty.plus(duty);

                // 2. Excise Tax (if applicable, calculated on CIF + Duty)
                let excise = new Decimal(0);
                if (item.isExciseApplicable && item.exciseRate) {
                    excise = cif.plus(duty).mul(item.exciseRate);
                    totalExciseTax = totalExciseTax.plus(excise);
                }

                // 3. Base for VAT = CIF + Duty + Excise
                const baseForVat = cif.plus(duty).plus(excise);
                totalBaseForVat = totalBaseForVat.plus(baseForVat);
            }

            // 4. VAT on Import (15%)
            const vatOnImport = totalBaseForVat.mul(0.15);

            // Total payable to Customs = Duty + Excise + VAT
            const totalPayableToCustoms = totalCustomsDuty.plus(totalExciseTax).plus(vatOnImport);

            const result: CustomsCalculationResult = {
                totalCifValue: Number(totalCifValue.toFixed(2)),
                totalCustomsDuty: Number(totalCustomsDuty.toFixed(2)),
                totalExciseTax: Number(totalExciseTax.toFixed(2)),
                vatOnImport: Number(vatOnImport.toFixed(2)),
                totalPayableToCustoms: Number(totalPayableToCustoms.toFixed(2))
            };

            log.info(`Customs calculation complete. Total Payable: ${result.totalPayableToCustoms} SAR`);
            return result;

        } catch (error: any) {
            log.error('Failed to calculate customs duties', { error: error.message });
            throw new Error(`Customs Calculation failed: ${error.message}`);
        }
    }
}
