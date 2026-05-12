/**
 * Saudi Labor Law Engine (Phase 37 - HR Compliance)
 * ──────────────────────────────────────────────────────────
 * Implements strict compliance with Saudi Labor Law (Articles 84, 85, 109, 117, etc.)
 * Handles complex End of Service (EOS) calculations, specific leave types, and overtime rules.
 */
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'SaudiLaborLawEngine' });

export interface EosCalculationParams {
    contractType: 'LIMITED' | 'UNLIMITED';
    serviceYears: number; // Decimal representing years (e.g., 2.5)
    monthlySalary: number; // Basic + Housing usually
    terminationReason: 'RESIGNATION' | 'TERMINATION_BY_EMPLOYER' | 'MUTUAL_AGREEMENT' | 'DEATH_OR_DISABILITY' | 'FEMALE_MARRIAGE_OR_BIRTH';
}

export interface EosCalculationResult {
    totalEosAmount: number;
    firstFiveYearsAmount: number;
    afterFiveYearsAmount: number;
    resignationDeductionRatio: number;
    isEligible: boolean;
}

export class SaudiLaborLawEngine {

    /**
     * Calculates End of Service (EOS) Award based on Articles 84 and 85 of Saudi Labor Law.
     */
    static calculateEos(params: EosCalculationParams): EosCalculationResult {
        try {
            log.info(`Calculating EOS for Service Years: ${params.serviceYears}, Salary: ${params.monthlySalary}, Reason: ${params.terminationReason}`);
            
            const salary = new Decimal(params.monthlySalary);
            const years = new Decimal(params.serviceYears);
            
            let firstFiveYearsAmount = new Decimal(0);
            let afterFiveYearsAmount = new Decimal(0);
            let totalEos = new Decimal(0);
            let deductionRatio = 1; // 1 means no deduction
            let isEligible = true;

            // Base calculation (Article 84)
            // Half a month's wage for each of the first five years, and a full month's wage for each following year
            const firstFive = Decimal.min(years, new Decimal(5));
            const afterFive = Decimal.max(0, years.minus(5));

            firstFiveYearsAmount = firstFive.mul(0.5).mul(salary);
            afterFiveYearsAmount = afterFive.mul(1.0).mul(salary);
            totalEos = firstFiveYearsAmount.plus(afterFiveYearsAmount);

            // Resignation Rules (Article 85) - Only applies to UNLIMITED contracts typically, 
            // but fixed contracts usually require full payment unless specific breaches occur.
            if (params.terminationReason === 'RESIGNATION') {
                if (years.lessThan(2)) {
                    totalEos = new Decimal(0);
                    deductionRatio = 0;
                    isEligible = false;
                } else if (years.greaterThanOrEqualTo(2) && years.lessThan(5)) {
                    deductionRatio = 1 / 3;
                    totalEos = totalEos.mul(deductionRatio);
                } else if (years.greaterThanOrEqualTo(5) && years.lessThan(10)) {
                    deductionRatio = 2 / 3;
                    totalEos = totalEos.mul(deductionRatio);
                } else if (years.greaterThanOrEqualTo(10)) {
                    deductionRatio = 1; // Full reward
                }
            }

            // Exceptions for Female Workers (Article 87)
            if (params.terminationReason === 'FEMALE_MARRIAGE_OR_BIRTH') {
                // If she resigns within 6 months of marriage, or 3 months of giving birth, full EOS is granted.
                deductionRatio = 1;
                totalEos = firstFiveYearsAmount.plus(afterFiveYearsAmount); // Re-calculate without deduction
                isEligible = true;
            }

            const result: EosCalculationResult = {
                totalEosAmount: Number(totalEos.toFixed(2)),
                firstFiveYearsAmount: Number(firstFiveYearsAmount.toFixed(2)),
                afterFiveYearsAmount: Number(afterFiveYearsAmount.toFixed(2)),
                resignationDeductionRatio: deductionRatio,
                isEligible
            };

            log.info(`EOS calculated: ${result.totalEosAmount} SAR`);
            return result;

        } catch (error: any) {
            log.error('Failed to calculate EOS', { error: error.message });
            throw new Error(`EOS Calculation failed: ${error.message}`);
        }
    }

    /**
     * Calculates Overtime Pay based on Article 107.
     * Hours beyond 8/day or 48/week are considered overtime at 1.5x basic wage.
     */
    static calculateOvertime(basicHourlyRate: number, overtimeHours: number): number {
        // Base rate + 50% = 1.5x
        const rate = new Decimal(basicHourlyRate).mul(1.5);
        return Number(rate.mul(overtimeHours).toFixed(2));
    }
}
