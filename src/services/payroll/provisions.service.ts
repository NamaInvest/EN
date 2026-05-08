/**
 * ProvisionsService — مخصصات EOS + الإجازات الشهرية
 *
 * النماذج: Employee, LeaveBalance, JournalEntry
 *
 * يُشغَّل في نهاية كل شهر:
 *  1. حساب دلتا مخصص EOS لكل موظف (نهاية الخدمة المتراكمة)
 *  2. حساب دلتا مخصص الإجازة (أيام متبقية × معدل يومي)
 *  3. ترحيل قيد:
 *     DR 5130 مصروف EOS
 *     DR 5140 مصروف الإجازات
 *     CR 2410 مخصص EOS
 *     CR 2420 مخصص الإجازات
 *
 * معيار: IAS 19 — مزايا الموظفين
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

const WORKING_DAYS_PER_MONTH = 26; // يوم عمل فعلي شهرياً تقريباً

export interface ProvisionResult {
  period: string;           // YYYY-MM
  employees: number;
  totalEosDelta: Decimal;
  totalLeaveDelta: Decimal;
  journalEntryId?: number;
}

export class ProvisionsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * تشغيل المخصصات لشهر محدد
   */
  async runMonthlyProvisions(asOfDate: Date): Promise<ProvisionResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    const period   = `${asOfDate.getFullYear()}-${String(asOfDate.getMonth() + 1).padStart(2, '0')}`;

    // جلب كل الموظفين النشطين
    const employees = await prisma.employee.findMany({
      where: { tenantId, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      select: {
        id: true, basicSalary: true, hireDate: true, nationality: true,
        leaveBalances: {
          where: { year: asOfDate.getFullYear(), leaveType: 'ANNUAL' },
          select: { accrued: true, used: true },
        },
      },
    }).catch(() => []);

    let totalEosDelta   = new Decimal(0);
    let totalLeaveDelta = new Decimal(0);

    for (const emp of employees) {
      const eosDelta   = this._calcEosDelta(emp, asOfDate);
      const leaveDelta = this._calcLeaveDelta(emp, asOfDate);
      totalEosDelta   = totalEosDelta.add(eosDelta);
      totalLeaveDelta = totalLeaveDelta.add(leaveDelta);
    }

    if (totalEosDelta.isZero() && totalLeaveDelta.isZero()) {
      return { period, employees: employees.length, totalEosDelta, totalLeaveDelta };
    }

    // ترحيل القيد
    const je = await prisma.journalEntry.create({
      data: {
        tenantId,
        reference:   `PROV-${period}`,
        description: `مخصصات EOS والإجازات — ${period}`,
        date:        asOfDate,
        status:      'POSTED',
        sourceType:  'PROVISION',
        lines: {
          create: [
            { tenantId, accountCode: '5130', debit: totalEosDelta,   credit: new Decimal(0), description: 'مصروف مخصص نهاية الخدمة' },
            { tenantId, accountCode: '5140', debit: totalLeaveDelta, credit: new Decimal(0), description: 'مصروف مخصص الإجازات' },
            { tenantId, accountCode: '2410', debit: new Decimal(0), credit: totalEosDelta,   description: 'مخصص نهاية الخدمة المتراكم' },
            { tenantId, accountCode: '2420', debit: new Decimal(0), credit: totalLeaveDelta, description: 'مخصص الإجازات المتراكم' },
          ].filter((l) => l.debit.gt(0) || l.credit.gt(0)),
        },
      },
    }).catch(() => null);

    return { period, employees: employees.length, totalEosDelta, totalLeaveDelta, journalEntryId: je?.id };
  }

  /**
   * حساب دلتا مخصص EOS للموظف (المادة 84-85 عمل سعودي)
   * EOS = (الراتب الأساسي / 26) × 21 × سنوات الخدمة (لأول 5 سنوات)
   *      + (الراتب الأساسي / 26) × 30 × (سنوات الخدمة - 5) (بعد 5 سنوات)
   * دلتا شهرية = (إجمالي EOS / سنوات الخدمة الكلية) / 12
   */
  private _calcEosDelta(emp: any, asOfDate: Date): Decimal {
    if (!emp.basicSalary || !emp.hireDate) return new Decimal(0);

    const hireDate  = new Date(emp.hireDate);
    const monthsOfService = Math.floor((asOfDate.getTime() - hireDate.getTime()) / (30.44 * 86_400_000));
    if (monthsOfService < 1) return new Decimal(0);

    const yearsOfService = monthsOfService / 12;
    const dailyRate = new Decimal(emp.basicSalary).div(WORKING_DAYS_PER_MONTH);

    let totalEos = new Decimal(0);
    if (yearsOfService <= 5) {
      totalEos = dailyRate.mul(21).mul(Math.min(yearsOfService, 5));
    } else {
      totalEos = dailyRate.mul(21).mul(5)
        .add(dailyRate.mul(30).mul(yearsOfService - 5));
    }

    // الدلتا الشهرية = إجمالي EOS / أشهر الخدمة
    return totalEos.div(monthsOfService).toDecimalPlaces(2);
  }

  /**
   * حساب دلتا مخصص الإجازة الشهري
   * قيمة الإجازة = أيام الاستحقاق المتبقية × معدل اليوم
   * الدلتا = قيمة/12
   */
  private _calcLeaveDelta(emp: any, asOfDate: Date): Decimal {
    if (!emp.basicSalary) return new Decimal(0);

    const balance = emp.leaveBalances?.[0];
    const remaining = balance
      ? new Decimal(balance.accrued).sub(new Decimal(balance.used))
      : new Decimal(21).div(12); // افتراضي 21 يوم/سنة

    const dailyRate  = new Decimal(emp.basicSalary).div(WORKING_DAYS_PER_MONTH);
    const monthlyAccrual = remaining.mul(dailyRate);
    return monthlyAccrual.toDecimalPlaces(2);
  }
}
