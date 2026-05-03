/**
 * Leave Engine Tests
 * Tests for Saudi Labor Law compliance (Articles 109-116)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        employee: { findMany: vi.fn(), findUnique: vi.fn() },
        leaveBalance: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
        leaveAccrual: { findFirst: vi.fn(), create: vi.fn() },
        leaveRequest: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
        $transaction: vi.fn((cb: any) => cb({
            leaveRequest: { update: vi.fn() },
            leaveBalance: { updateMany: vi.fn() },
        })),
    },
}));

import { LeaveEngine, SAUDI_LEAVE_POLICY } from '../src/lib/leave-engine';

describe('LeaveEngine', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('calculateAnnualEntitlement', () => {
        it('should return 21 days for <5 years of service', () => {
            expect(LeaveEngine.calculateAnnualEntitlement(0)).toBe(21);
            expect(LeaveEngine.calculateAnnualEntitlement(1)).toBe(21);
            expect(LeaveEngine.calculateAnnualEntitlement(4.9)).toBe(21);
        });

        it('should return 30 days for >=5 years of service', () => {
            expect(LeaveEngine.calculateAnnualEntitlement(5)).toBe(30);
            expect(LeaveEngine.calculateAnnualEntitlement(10)).toBe(30);
            expect(LeaveEngine.calculateAnnualEntitlement(20)).toBe(30);
        });
    });

    describe('calculateMonthlyAccrual', () => {
        it('should correctly calculate monthly accrual for 21-day entitlement', () => {
            const accrual = LeaveEngine.calculateMonthlyAccrual(21);
            expect(accrual).toBe(1.75); // 21/12 = 1.75
        });

        it('should correctly calculate monthly accrual for 30-day entitlement', () => {
            const accrual = LeaveEngine.calculateMonthlyAccrual(30);
            expect(accrual).toBe(2.5); // 30/12 = 2.5
        });
    });

    describe('calculateWorkingDays', () => {
        it('should exclude Friday and Saturday (Saudi weekend)', () => {
            // Monday to Sunday = 5 working days (Mon-Thu + Sun)
            const mon = new Date(2026, 4, 4);  // Monday
            const sun = new Date(2026, 4, 10); // Sunday
            const days = LeaveEngine.calculateWorkingDays(mon, sun);
            expect(days).toBe(5);
        });

        it('should return 1 for a single working day', () => {
            const sun = new Date(2026, 4, 3); // Sunday
            const days = LeaveEngine.calculateWorkingDays(sun, sun);
            expect(days).toBe(1);
        });

        it('should return 0 for a Friday-only range', () => {
            const fri = new Date(2026, 4, 8); // Friday
            const days = LeaveEngine.calculateWorkingDays(fri, fri);
            expect(days).toBe(0);
        });

        it('should handle full work week correctly', () => {
            // Sunday to Thursday = 5 working days
            const sun = new Date(2026, 4, 3);  // Sunday
            const thu = new Date(2026, 4, 7);  // Thursday
            const days = LeaveEngine.calculateWorkingDays(sun, thu);
            expect(days).toBe(5);
        });
    });

    describe('calculateSickPayRate', () => {
        it('should return 100% for first 30 days', () => {
            expect(LeaveEngine.calculateSickPayRate(0)).toBe(1.0);
            expect(LeaveEngine.calculateSickPayRate(15)).toBe(1.0);
            expect(LeaveEngine.calculateSickPayRate(30)).toBe(1.0);
        });

        it('should return 75% for days 31-90', () => {
            expect(LeaveEngine.calculateSickPayRate(31)).toBe(0.75);
            expect(LeaveEngine.calculateSickPayRate(60)).toBe(0.75);
            expect(LeaveEngine.calculateSickPayRate(90)).toBe(0.75);
        });

        it('should return 0% (unpaid) after 90 days', () => {
            expect(LeaveEngine.calculateSickPayRate(91)).toBe(0);
            expect(LeaveEngine.calculateSickPayRate(120)).toBe(0);
        });
    });

    describe('SAUDI_LEAVE_POLICY constants', () => {
        it('should have correct Article 109 values', () => {
            expect(SAUDI_LEAVE_POLICY.ANNUAL_DAYS_UNDER_5_YEARS).toBe(21);
            expect(SAUDI_LEAVE_POLICY.ANNUAL_DAYS_OVER_5_YEARS).toBe(30);
        });

        it('should have correct maternity leave', () => {
            expect(SAUDI_LEAVE_POLICY.MATERNITY_WEEKS).toBe(10);
        });

        it('should have correct Hajj requirements', () => {
            expect(SAUDI_LEAVE_POLICY.HAJJ_DAYS_MAX).toBe(15);
            expect(SAUDI_LEAVE_POLICY.HAJJ_SERVICE_YEARS).toBe(2);
        });

        it('should have correct carry forward limits', () => {
            expect(SAUDI_LEAVE_POLICY.MAX_CARRY_FORWARD_DAYS).toBe(30);
        });
    });
});
