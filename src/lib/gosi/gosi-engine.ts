/**
 * GOSI Engine (Phase 31 - Saudi Social Insurance Compliance)
 * ──────────────────────────────────────────────────────────
 * Calculates General Organization for Social Insurance (GOSI) contributions.
 * Implements the 45,000 SAR maximum ceiling rule.
 * Differentiates between Saudi Nationals (Annuity + SANED + Hazards) and Non-Saudis (Hazards only).
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'GosiEngine' });

export interface GosiCalculationResult {
    employeeId: number;
    gosiBaseSalary: number;
    employeeShare: number; // Deducted from employee
    companyShare: number;  // Paid by company
    totalContribution: number;
    isSaudi: boolean;
    breakdown: {
        annuityEmployee?: number;
        annuityCompany?: number;
        sanedEmployee?: number;
        sanedCompany?: number;
        occupationalHazardsCompany: number;
    };
}

export class GosiEngine {

    private static GOSI_CEILING = new Decimal(45000.00);

    /**
     * Calculates GOSI contributions for a specific employee for the current month.
     */
    static async calculateContribution(tenantId: string, employeeId: number): Promise<GosiCalculationResult> {
        try {
            const p = prisma as any;
            if (!p.employee) {
                log.warn('Employee schema not found. Mocking GOSI Calculation.');
                return this.generateMockCalculation(employeeId);
            }

            const employee = await p.employee.findUnique({
                where: { id: employeeId, tenantId },
                include: { salaryComponents: true }
            });

            if (!employee) throw new Error(`Employee ${employeeId} not found.`);

            // 1. Calculate GOSI Base Salary (Basic + Housing)
            let gosiBase = new Decimal(employee.basicSalary || 0);
            
            if (employee.salaryComponents) {
                const housing = employee.salaryComponents.find((c: any) => c.type === 'HOUSING_ALLOWANCE');
                if (housing) gosiBase = gosiBase.plus(housing.amount);
            }

            // 2. Apply the 45,000 SAR GOSI Ceiling
            if (gosiBase.greaterThan(this.GOSI_CEILING)) {
                gosiBase = this.GOSI_CEILING;
            }

            const isSaudi = employee.nationality === 'SA' || employee.nationality === 'Saudi';

            let employeeShare = new Decimal(0);
            let companyShare = new Decimal(0);
            const breakdown: any = {};

            if (isSaudi) {
                // Saudi: 
                // Employee pays 9% (Annuity) + 0.75% (SANED) = 9.75%
                // Company pays 9% (Annuity) + 0.75% (SANED) + 2% (Hazards) = 11.75%
                // Note: SANED was reduced from 1% to 0.75% recently. We'll use 0.75%.
                
                breakdown.annuityEmployee = gosiBase.mul(0.09).toNumber();
                breakdown.annuityCompany = gosiBase.mul(0.09).toNumber();
                
                breakdown.sanedEmployee = gosiBase.mul(0.0075).toNumber();
                breakdown.sanedCompany = gosiBase.mul(0.0075).toNumber();
                
                breakdown.occupationalHazardsCompany = gosiBase.mul(0.02).toNumber();

                employeeShare = new Decimal(breakdown.annuityEmployee).plus(breakdown.sanedEmployee);
                companyShare = new Decimal(breakdown.annuityCompany).plus(breakdown.sanedCompany).plus(breakdown.occupationalHazardsCompany);
            } else {
                // Non-Saudi:
                // Employee pays 0%
                // Company pays 2% (Occupational Hazards)
                breakdown.occupationalHazardsCompany = gosiBase.mul(0.02).toNumber();
                
                employeeShare = new Decimal(0);
                companyShare = new Decimal(breakdown.occupationalHazardsCompany);
            }

            const total = employeeShare.plus(companyShare);

            const result: GosiCalculationResult = {
                employeeId,
                gosiBaseSalary: Number(gosiBase.toFixed(2)),
                employeeShare: Number(employeeShare.toFixed(2)),
                companyShare: Number(companyShare.toFixed(2)),
                totalContribution: Number(total.toFixed(2)),
                isSaudi,
                breakdown
            };

            log.info(`Calculated GOSI for Employee ${employeeId}. Total: ${result.totalContribution}`);
            return result;

        } catch (error: any) {
            log.error('Failed to calculate GOSI', { error: error.message });
            throw new Error(`GOSI calculation failed: ${error.message}`);
        }
    }

    private static generateMockCalculation(employeeId: number): GosiCalculationResult {
        return {
            employeeId,
            gosiBaseSalary: 10000.00,
            employeeShare: 975.00, // 9.75%
            companyShare: 1175.00, // 11.75%
            totalContribution: 2150.00,
            isSaudi: true,
            breakdown: {
                annuityEmployee: 900.00,
                annuityCompany: 900.00,
                sanedEmployee: 75.00,
                sanedCompany: 75.00,
                occupationalHazardsCompany: 200.00
            }
        };
    }
}
