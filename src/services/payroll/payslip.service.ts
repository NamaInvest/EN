/**
 * PayslipService — توليد قسيمة الراتب (Payslip)
 *
 * يُنشئ:
 * 1. تفصيل مكونات الراتب (الأساسي + البدلات + المكافآت)
 * 2. الخصومات (GOSI + ساند + WHT + سلف + تأمين)
 * 3. صافي الراتب
 * 4. المقارنة مع الشهر السابق
 * 5. ملخص JSON جاهز للـ PDF
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface PayslipData {
  employeeId: string;
  employeeName: string;
  period: string;
  earnings: { label: string; amount: Decimal }[];
  deductions: { label: string; amount: Decimal }[];
  grossSalary: Decimal;
  totalDeductions: Decimal;
  netSalary: Decimal;
  bankAccount?: string;
  previousNetSalary?: Decimal;
  changeAmount?: Decimal;
  changePct?: number;
  generatedAt: Date;
}

export class PayslipService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  async generatePayslip(employeeId: string, periodId: string): Promise<PayslipData> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    // جلب بيانات الدورة
    const run = await prisma.payrollRun?.findFirst?.({
      where: { tenantId, id: periodId },
      include: {
        items: {
          where: { employeeId },
          include: { employee: { select: { fullName: true, bankAccountNumber: true } } },
        },
      },
    }).catch(() => null);

    const item     = run?.items?.[0];
    const empName  = item?.employee?.fullName ?? `موظف ${employeeId}`;
    const period   = run?.period ?? periodId;

    // المكونات من الدورة الحالية
    const basic    = new Decimal(item?.basicSalary   ?? 0);
    const housing  = new Decimal(item?.housingAllowance ?? 0);
    const transport = new Decimal(item?.transportAllowance ?? 0);
    const variable  = new Decimal(item?.variablePay   ?? 0);
    const gosiEmp  = new Decimal(item?.gosiEmployee   ?? 0);
    const sandEmp  = new Decimal(item?.sandEmployee   ?? 0);
    const wht      = new Decimal(item?.withholdingTax ?? 0);
    const advance  = new Decimal(item?.advanceDeduction ?? 0);
    const other    = new Decimal(item?.otherDeductions  ?? 0);

    const earnings: PayslipData['earnings'] = [
      { label: 'الراتب الأساسي',     amount: basic },
      { label: 'بدل السكن',           amount: housing },
      { label: 'بدل المواصلات',       amount: transport },
      { label: 'مكافأة متغيرة',       amount: variable },
    ].filter(e => e.amount.gt(0));

    const deductions: PayslipData['deductions'] = [
      { label: 'التأمينات الاجتماعية (الموظف)', amount: gosiEmp },
      { label: 'ساند',                           amount: sandEmp },
      { label: 'استقطاع ضريبة (WHT)',            amount: wht },
      { label: 'استقطاع سلفة',                   amount: advance },
      { label: 'خصومات أخرى',                    amount: other },
    ].filter(d => d.amount.gt(0));

    const grossSalary     = earnings.reduce((s, e) => s.add(e.amount), new Decimal(0));
    const totalDeductions = deductions.reduce((s, d) => s.add(d.amount), new Decimal(0));
    const netSalary       = grossSalary.sub(totalDeductions);

    // مقارنة مع الشهر السابق
    let previousNetSalary: Decimal | undefined;
    let changeAmount: Decimal | undefined;
    let changePct: number | undefined;

    const prevRun = await prisma.payrollRun?.findFirst?.({
      where: { tenantId, period: { lt: period }, status: 'POSTED' },
      orderBy: { period: 'desc' },
      include: { items: { where: { employeeId }, select: { netSalary: true } } },
    }).catch(() => null);

    if (prevRun?.items?.[0]) {
      previousNetSalary = new Decimal(prevRun.items[0].netSalary ?? 0);
      changeAmount      = netSalary.sub(previousNetSalary);
      changePct         = previousNetSalary.isZero() ? 0 : changeAmount.div(previousNetSalary).mul(100).toDecimalPlaces(1).toNumber();
    }

    return {
      employeeId, employeeName: empName, period,
      earnings, deductions, grossSalary, totalDeductions, netSalary,
      bankAccount: item?.employee?.bankAccountNumber,
      previousNetSalary, changeAmount, changePct,
      generatedAt: new Date(),
    };
  }

  /** قسائم دورة كاملة */
  async generateBatchPayslips(periodId: string): Promise<PayslipData[]> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const items = await prisma.payrollRun?.findFirst?.({
      where: { tenantId, id: periodId },
      include: { items: { select: { employeeId: true } } },
    }).catch(() => null);

    const employeeIds = (items?.items ?? []).map((i: any) => String(i.employeeId));
    return Promise.all(employeeIds.map((id: string) => this.generatePayslip(id, periodId)));
  }
}
