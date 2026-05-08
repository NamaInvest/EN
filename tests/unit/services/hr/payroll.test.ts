/**
 * Unit Tests — Payroll Service (HR 27)
 * Tests GOSI calculation, salary component building, and WPS file format.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/shared/event-bus.service', () => ({
  eventBus: { afterCommit: vi.fn() },
}));

import { PayrollService } from '@/services/hr/payroll.service';

const mockCtx = {
  tenant: { id: 'tenant-001' },
  user:   { id: 'user-001' },
  requirePermission: vi.fn(),
  fiscal: { isClosed: false },
} as any;

const buildPrisma = (overrides: any = {}) => ({
  employee: {
    findFirst: vi.fn().mockResolvedValue({
      id: 'emp-001',
      name: 'أحمد محمد',
      nationality: 'SA',
      basicSalary: 10000,
      housingAllowance: 2500,
      transportAllowance: 500,
      iban: 'SA1234567890123456789012',
      bankCode: 'RAJHI',
      salaryComponents: [],
      ...overrides.employee,
    }),
    findMany: vi.fn().mockResolvedValue(overrides.employees ?? []),
  },
  employeeLoan: {
    create: vi.fn().mockResolvedValue({ id: 'loan-001' }),
  },
  employeeLoanSchedule: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  salaryAdvance: {
    aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
  },
  attendance: {
    aggregate: vi.fn().mockResolvedValue({ _count: { id: 0 } }),
  },
  $transaction: vi.fn(),
  ...overrides.prisma,
});

describe('PayrollService — calculatePayslip', () => {
  it('calculates correct GOSI for Saudi employee', async () => {
    const prisma = buildPrisma();
    const svc = new PayrollService(prisma as any, mockCtx);

    const slip = await svc.calculatePayslip('emp-001', '2026-05');

    // Basic 10000 + Housing 2500 + Transport 500 = 13000 gross
    expect(slip.gross).toBe(13000);
    // GOSI base = basic only (housing and transport not GOSI base by default)
    // GOSI rate for Saudi = 9.25%
    expect(slip.deductions.gosi).toBe(Math.round(10000 * 0.0925 * 100) / 100);
    expect(slip.netPay).toBe(13000 - slip.deductions.gosi);
  });

  it('calculates zero GOSI for expat employee', async () => {
    const prisma = buildPrisma({ employee: { nationality: 'EG', basicSalary: 8000 } });
    const svc = new PayrollService(prisma as any, mockCtx);

    const slip = await svc.calculatePayslip('emp-001', '2026-05');

    expect(slip.deductions.gosi).toBe(0);
  });

  it('deducts loan installments from salary', async () => {
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const prisma = buildPrisma({
      prisma: {
        employeeLoanSchedule: {
          findMany: vi.fn().mockResolvedValue([
            { totalAmount: 500, dueDate: periodStart, status: 'pending' },
          ]),
        },
      },
    });
    const svc = new PayrollService(prisma as any, mockCtx);

    const slip = await svc.calculatePayslip('emp-001', today.toISOString().slice(0, 7));

    expect(slip.deductions.loanDeduction).toBe(500);
  });
});

describe('PayrollService — createLoan', () => {
  it('generates correct amortization schedule', async () => {
    const prisma = buildPrisma();
    const svc = new PayrollService(prisma as any, mockCtx);

    const { schedule } = await svc.createLoan({
      employeeId:   'emp-001',
      principal:    12000,
      interestRate: 0,       // interest-free
      termMonths:   12,
      startDate:    new Date('2026-01-01'),
      approvedBy:   'manager-001',
    });

    expect(schedule).toHaveLength(12);
    expect(schedule[0].principalAmount).toBeCloseTo(1000, 1);
    expect(schedule[0].interestAmount).toBe(0);
    expect(schedule[11].remaining).toBeCloseTo(0, 1);
  });

  it('applies interest correctly', async () => {
    const prisma = buildPrisma();
    const svc = new PayrollService(prisma as any, mockCtx);

    const { schedule } = await svc.createLoan({
      employeeId:   'emp-001',
      principal:    12000,
      interestRate: 12, // 12% annual = 1% monthly
      termMonths:   12,
      startDate:    new Date('2026-01-01'),
      approvedBy:   'manager-001',
    });

    expect(schedule[0].interestAmount).toBeCloseTo(120, 0); // 1% of 12000
    expect(schedule[11].remaining).toBeCloseTo(0, 0);
  });
});

describe('PayrollService — generateWPSFile', () => {
  it('produces valid WPS format with header and trailer', () => {
    const prisma = buildPrisma();
    const svc = new PayrollService(prisma as any, mockCtx);

    const payslips = [{
      employeeId: 'E001',
      employeeName: 'أحمد',
      period: '2026-05',
      components: [],
      deductions: { gosi: 0, loanDeduction: 0, advanceDeduction: 0, absence: 0, other: 0 },
      gross: 10000,
      totalDeductions: 925,
      netPay: 9075,
      iban: 'SA1234567890123456789012',
      bankCode: 'RAJHI',
    }];

    const file = svc.generateWPSFile(payslips, 'SA9876543210987654321098');

    expect(file).toContain('H|');                      // header
    expect(file).toContain('D|E001');                  // detail row
    expect(file).toContain('9075.00');                 // net pay
    expect(file).toContain('T|1|9075.00');             // trailer
  });
});
