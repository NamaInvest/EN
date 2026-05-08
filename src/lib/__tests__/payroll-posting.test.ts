/**
 * Unit Tests — Payroll GL Posting
 * تغطي: توازن القيد، حسابات GOSI، WHT للأجانب، دورة معتمدة فقط
 */
import { Decimal } from '@prisma/client/runtime/library';
import { PayrollPostingService } from '../../services/payroll/payroll-posting.service';

const mockCtx = { tenant: { id: 'test' }, user: { id: 'u1' } } as any;

const makeRun = (lines: any[], status = 'APPROVED') => ({
  id: 1, tenantId: 'test', status, month: 1, year: 2025,
  lines,
});

const makeLine = (overrides: Record<string, any>) => ({
  grossSalary: 10000, gosiEmployee: 450, gosiCompany: 975,
  sanedCompany: 100, withholdingTax: 0, otherDeductions: 0,
  netSalary: 8575,
  ...overrides,
});

describe('PayrollPostingService.previewJE', () => {
  it('القيد متوازن لموظف سعودي واحد', async () => {
    const run = makeRun([makeLine({})]);
    const prisma = { payrollRun: { findFirst: jest.fn().mockResolvedValue(run) } } as any;
    const svc = new PayrollPostingService(prisma, mockCtx);

    const preview = await svc.previewJE(1);
    expect(preview.isBalanced).toBe(true);
  });

  it('يتضمن WHT للموظف الأجنبي', async () => {
    const run = makeRun([makeLine({ withholdingTax: 500, netSalary: 8075 })]);
    const prisma = { payrollRun: { findFirst: jest.fn().mockResolvedValue(run) } } as any;
    const svc = new PayrollPostingService(prisma, mockCtx);

    const preview = await svc.previewJE(1);
    expect(preview.totalWHT.toNumber()).toBe(500);
    expect(preview.isBalanced).toBe(true);
  });

  it('3 موظفين — القيد لا يزال متوازناً', async () => {
    const run = makeRun([
      makeLine({}),                                                         // سعودي
      makeLine({ withholdingTax: 300, netSalary: 8275 }),                   // مصري
      makeLine({ grossSalary: 15000, gosiEmployee: 0, gosiCompany: 0,      // خبير أجنبي
                 sanedCompany: 0, withholdingTax: 750, netSalary: 14250 }),
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
    const run = makeRun([makeLine({})], 'DRAFT');
    const prisma = {
      payrollRun: { findFirst: jest.fn().mockResolvedValue(run) },
      $transaction: jest.fn(),
    } as any;
    const svc = new PayrollPostingService(prisma, mockCtx);
    await expect(svc.postPayrollRun(1)).rejects.toThrow('يجب أن تكون موافقاً عليها');
  });
});
