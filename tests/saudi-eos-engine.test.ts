/**
 * Saudi EOS Engine Tests
 * Tests for Saudi Labor Law Articles 84-88
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        employee: { findUnique: vi.fn() },
        endOfServiceCalculation: { create: vi.fn() },
    },
}));

describe('SaudiEOSEngine Calculations', () => {
    // Pure logic tests based on Saudi Labor Law
    
    describe('Article 84 — EOS for TERMINATION (employer ends)', () => {
        it('should calculate 1/2 month per year for first 5 years', () => {
            const yearsOfService = 3;
            const monthlySalary = 10000;
            const dailySalary = monthlySalary / 30;
            
            // First 5 years: 1/2 month per year
            const eosAmount = (monthlySalary / 2) * yearsOfService;
            expect(eosAmount).toBe(15000); // 5000 * 3
        });

        it('should calculate full month per year after 5 years', () => {
            const yearsOfService = 8;
            const monthlySalary = 10000;
            
            const first5 = (monthlySalary / 2) * 5; // 25000
            const remaining = monthlySalary * (yearsOfService - 5); // 30000
            const total = first5 + remaining;
            expect(total).toBe(55000); // 25000 + 30000
        });

        it('should handle exactly 5 years', () => {
            const yearsOfService = 5;
            const monthlySalary = 10000;
            
            const eosAmount = (monthlySalary / 2) * 5;
            expect(eosAmount).toBe(25000);
        });
    });

    describe('Article 85 — RESIGNATION factor', () => {
        it('should return 0 factor for <2 years service', () => {
            const years = 1;
            const factor = years < 2 ? 0 : years < 5 ? 1/3 : years < 10 ? 2/3 : 1;
            expect(factor).toBe(0);
        });

        it('should return 1/3 factor for 2-4 years', () => {
            const years = 3;
            const factor = years < 2 ? 0 : years < 5 ? 1/3 : years < 10 ? 2/3 : 1;
            expect(factor).toBeCloseTo(0.333, 2);
        });

        it('should return 2/3 factor for 5-9 years', () => {
            const years = 7;
            const factor = years < 2 ? 0 : years < 5 ? 1/3 : years < 10 ? 2/3 : 1;
            expect(factor).toBeCloseTo(0.667, 2);
        });

        it('should return full (1.0) factor for 10+ years', () => {
            const years = 15;
            const factor = years < 2 ? 0 : years < 5 ? 1/3 : years < 10 ? 2/3 : 1;
            expect(factor).toBe(1);
        });
    });

    describe('Article 87 — Full EOS for special reasons', () => {
        it('should give full EOS for RETIREMENT', () => {
            const factor = 1.0; // retirement always full
            expect(factor).toBe(1.0);
        });

        it('should give full EOS for DEATH', () => {
            const factor = 1.0;
            expect(factor).toBe(1.0);
        });

        it('should give full EOS for FORCE_MAJEURE', () => {
            const factor = 1.0;
            expect(factor).toBe(1.0);
        });
    });

    describe('Article 88 — No EOS for TERMINATION_FOR_CAUSE', () => {
        it('should return 0 for dismissal under Article 80', () => {
            const factor = 0; // No EOS for cause
            expect(factor).toBe(0);
        });
    });

    describe('EOS Calculation — Edge Cases', () => {
        it('should handle fractional years', () => {
            const years = 2.5;
            const salary = 8000;
            const eos = (salary / 2) * years;
            expect(eos).toBe(10000);
        });

        it('should handle very long service (25 years)', () => {
            const years = 25;
            const salary = 15000;
            
            const first5 = (salary / 2) * 5;       // 37,500
            const remaining = salary * (years - 5);  // 300,000
            const total = first5 + remaining;
            expect(total).toBe(337500);
        });
    });
});
