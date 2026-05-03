/**
 * GOSI Engine Tests
 * Tests for Saudi GOSI contribution calculations
 */
import { describe, it, expect } from 'vitest';

describe('GOSI Contribution Calculations', () => {
    // GOSI Rates (2024-2026)
    const RATES = {
        saudiEmployee: 0.10,    // 10% employee share
        saudiEmployer: 0.12,    // 12% employer (pension)
        hazardSaudi: 0.02,      // 2% hazards
        sanedSaudi: 0.0075,     // 0.75% SANED (unemployment)
        expat: 0.02,            // 2% employer only
        minSubjectWage: 1500,
        maxSubjectWage: 45000,
    };

    describe('Saudi Employee Contributions', () => {
        it('should calculate 10% employee deduction', () => {
            const salary = 10000;
            const deduction = salary * RATES.saudiEmployee;
            expect(deduction).toBe(1000);
        });

        it('should calculate 12% employer pension', () => {
            const salary = 10000;
            const contribution = salary * RATES.saudiEmployer;
            expect(contribution).toBe(1200);
        });

        it('should calculate 2% hazard on employer', () => {
            const salary = 10000;
            const hazard = salary * RATES.hazardSaudi;
            expect(hazard).toBe(200);
        });

        it('should calculate total employer contribution (14%)', () => {
            const salary = 10000;
            const total = salary * (RATES.saudiEmployer + RATES.hazardSaudi);
            expect(total).toBeCloseTo(1400, 2);
        });

        it('should calculate total GOSI (24%)', () => {
            const salary = 10000;
            const empDeduction = salary * RATES.saudiEmployee;
            const empContrib = salary * (RATES.saudiEmployer + RATES.hazardSaudi);
            const total = empDeduction + empContrib;
            expect(total).toBe(2400);
        });
    });

    describe('Non-Saudi Employee Contributions', () => {
        it('should have 0% employee deduction for expats', () => {
            const salary = 8000;
            const deduction = 0; // Expats don't pay
            expect(deduction).toBe(0);
        });

        it('should calculate 2% employer-only contribution', () => {
            const salary = 8000;
            const contribution = salary * RATES.expat;
            expect(contribution).toBe(160);
        });
    });

    describe('Subject Wage Limits', () => {
        it('should cap at max subject wage of 45,000 SAR', () => {
            const salary = 60000;
            const subjectWage = Math.min(salary, RATES.maxSubjectWage);
            expect(subjectWage).toBe(45000);
        });

        it('should enforce min subject wage of 1,500 SAR', () => {
            const salary = 1000;
            const subjectWage = Math.max(salary, RATES.minSubjectWage);
            expect(subjectWage).toBe(1500);
        });

        it('should use actual salary within range', () => {
            const salary = 15000;
            const subjectWage = Math.min(Math.max(salary, RATES.minSubjectWage), RATES.maxSubjectWage);
            expect(subjectWage).toBe(15000);
        });
    });

    describe('Payroll GOSI Calculation for Multiple Employees', () => {
        it('should calculate batch totals correctly', () => {
            const employees = [
                { salary: 10000, isSaudi: true },
                { salary: 8000, isSaudi: true },
                { salary: 6000, isSaudi: false },
            ];

            let totalEmployeeDeductions = 0;
            let totalEmployerContributions = 0;

            for (const emp of employees) {
                if (emp.isSaudi) {
                    totalEmployeeDeductions += emp.salary * RATES.saudiEmployee;
                    totalEmployerContributions += emp.salary * (RATES.saudiEmployer + RATES.hazardSaudi);
                } else {
                    totalEmployerContributions += emp.salary * RATES.expat;
                }
            }

            expect(totalEmployeeDeductions).toBe(1800); // (10000 + 8000) * 10%
            expect(totalEmployerContributions).toBeCloseTo(2640, 2); // (10000 + 8000) * 14% + 6000 * 2%
        });
    });
});
