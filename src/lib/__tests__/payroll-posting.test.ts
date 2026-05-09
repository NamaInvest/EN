/**
 * Unit Tests — Payroll GL Posting
 * تغطي: توازن القيد، حسابات GOSI، WHT للأجانب، دورة معتمدة فقط
 *
 * معادلة التوازن:
 *   DR: grossSalary + gosiCompany + sanedCompany
 *   CR: (gosiEmployee + gosiCompany) + sanedCompany + withholdingTax + otherDeductions + netSalary
 *   → يجب أن: grossSalary = netSalary + gosiEmployee + withholdingTax + otherDeductions
 */
import { Decimal } from '@prisma/client/runtime/library';
import { PayrollPostingService } from '../../services/payroll/payroll-posting.service';

const mockCtx = { tenant: { id: 'test' }, user: { id: 'u1' } } as any;

const makeRun = (lines: any[], status = 'APPROVED') => ({
  id: 1, tenantId: 'test', status, month: 1, year: 2025, lines,
});

/**
 * Helper: builds a balanced payroll line.
 * DR = grossSalary + gosiCompany + sanedCompany
 * CR = (gosiEmployee+gosiCompany) + sanedCompany + withholdingTax + otherDeductions + netSalary
 * For DR=CR: grossSalary must equal netSalary + gosiEmployee + withholdingTax + otherDeductions
 */
const makeLine = (overrides: Record<string, any> = {}) => {
  // Defaults produce a balanced entry for a Saudi employee:
  // gross=10000, gosiEmp=450, gosiCo=975, saned=100, wht=0, other=0
  // net = gross - gosiEmp - wht - other = 10000 - 450 - 0 - 0 = 9550
  const base = {
    grossSalary:      10000,
    gosiEmployee:     450,
    gosiCompany:      975,
    sanedCompany:     100,
    withholdingTax:   0,
    otherDeductions:  0,
    netSalary:        9550,  // = gross - gosiEmp - wht - other
  };
  return { ...base, ...overrides };
};

describe('PayrollPostingService.previewJE', () => {
  it('القيد متوازن لموظف سعودي واحد', async () => {
    const run = makeRun([makeLine()]);
    const prisma = { payrollRun: { findFirst: jest.fn().mockResolvedValue(run) } } as any;
    const svc = new PayrollPostingService(prisma, mockCtx);

    const preview = await svc.previewJE(1);
    // DR: 10000 + 975 + 100 = 11075
    // CR: (450+975) + 100 + 0 + 0 + 9550 = 11075 ✓
    expect(preview.isBalanced).toBe(true);
  });

  it('يتضمن WHT للموظف الأجنبي', async () => {
    // gross=10000, gosiEmp=0 (أجنبي), wht=500, net=9500
    const run = makeRun([makeLine({ gosiEmployee: 0, gosiCompany: 0, sanedCompany: 0, withholdingTax: 500, netSalary: 9500 })]);
    const prisma = { payrollRun: { findFirst: jest.fn().mockResolvedValue(run) } } as any;
    const svc = new PayrollPostingService(prisma, mockCtx);

    const preview = await svc.previewJE(1);
    expect(preview.totalWHT.toNumber()).toBe(500);
    expect(preview.isBalanced).toBe(true);
  });

  it('3 موظفين — القيد لا يزال متوازناً', async () => {
    const run = makeRun([
      makeLine(),                                                           // سعودي: gross=10000 net=9550
      makeLine({ withholdingTax: 300, netSalary: 9250 }),                  // أجنبي WHT: net=gross-gosiEmp-wht = 10000-450-300=9250
      makeLine({ grossSalary: 15000, gosiEmployee: 0, gosiCompany: 0,     // خبير أجنبي
                 sanedCompany: 0, withholdingTax: 750, netSalary: 14250 }),// net=15000-750=14250
    ]);
    const prisma = { payrollRun: { findFirst: jest.fn().mockResolvedValue(run) } } as any;
    const svc = new PayrollPostingService(prisma, mockCtx);

    const preview = await svc.previewJE(1);
    expect(preview.isBalanced).toBe(true);
    const totalDebit  = preview.lines.reduce((s, l) => s + l.debit.toNumber(),  0);
    const totalCredit = preview.lines.reduce((s, l) => s + l.credit.toNumber(), 0);
    expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(0.01);
  });

  it('يرفض الترحيل إذا لم تكن الدورة معتمدة', async () => {
    const run = makeRun([makeLine()], 'DRAFT');
    const prisma = {
      payrollRun:   { findFirst: jest.fn().mockResolvedValue(run) },
      $transaction: jest.fn(),
    } as any;
    const svc = new PayrollPostingService(prisma, mockCtx);
    await expect(svc.postPayrollRun(1)).rejects.toThrow('يجب أن تكون موافقاً عليها');
  });
});
