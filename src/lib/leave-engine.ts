/**
 * Leave Accrual & Management Engine
 * وفقاً لنظام العمل السعودي (المواد 109-116)
 * 
 * - المادة 109: 21 يوم إجازة سنوية (أقل من 5 سنوات)، 30 يوم (أكثر من 5 سنوات)
 * - المادة 110: الإجازة بالاتفاق مع صاحب العمل
 * - المادة 111: لا يجوز التنازل عن الإجازة السنوية (أو بدلها نقداً) أثناء العمل
 * - المادة 112: يجوز ترحيل الإجازة للسنة التالية بموافقة صاحب العمل
 * - المادة 113: إجازة مرضية بعد 3 أشهر: 30 يوم كاملة، 60 يوم 75%، 30 يوم بدون راتب
 */

import { prisma } from './prisma';

// ===================== Types =====================
export type LeaveType = 
  | 'ANNUAL'           // إجازة سنوية
  | 'SICK'             // إجازة مرضية
  | 'MATERNITY'        // إجازة أمومة (10 أسابيع — 4 قبل، 6 بعد)
  | 'PATERNITY'        // إجازة أبوة (3 أيام)
  | 'MARRIAGE'         // إجازة زواج (5 أيام)
  | 'BEREAVEMENT'      // وفاة قريب (5 أيام)
  | 'HAJJ'             // إجازة حج (10-15 يوم — مرة واحدة)
  | 'UNPAID'           // إجازة بدون راتب
  | 'COMPENSATORY'     // إجازة تعويضية
  | 'EXAM'             // إجازة امتحانات
  | 'IDDAH';           // عدة وفاة الزوج (130 يوم)

export type AccrualFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

export interface LeaveBalance {
  employeeId: number;
  leaveType: LeaveType;
  totalEntitlement: number;  // الاستحقاق السنوي
  accrued: number;           // ما تم تجميعه حتى الآن
  taken: number;             // ما تم استهلاكه
  pending: number;           // طلبات معلقة
  available: number;         // المتاح
  carriedForward: number;    // مرحّل من السنة السابقة
  expiryDate: Date | null;   // تاريخ انتهاء الرصيد المرحّل
}

export interface AccrualResult {
  processed: number;
  skipped: number;
  errors: string[];
  details: Array<{
    employeeId: number;
    employeeName: string;
    accrued: number;
    newBalance: number;
  }>;
}

export interface LeaveRequestResult {
  allowed: boolean;
  reason?: string;
  availableBalance?: number;
  requestedDays?: number;
}

// ===================== Saudi Leave Policy Constants =====================
const SAUDI_LEAVE_POLICY = {
  // المادة 109
  ANNUAL_DAYS_UNDER_5_YEARS: 21,
  ANNUAL_DAYS_OVER_5_YEARS: 30,
  
  // المادة 113 - مرضية
  SICK_FULL_PAY_DAYS: 30,
  SICK_75_PCT_DAYS: 60,
  SICK_UNPAID_DAYS: 30,
  SICK_QUALIFYING_MONTHS: 3, // بعد 3 أشهر من الالتحاق
  
  // إجازات خاصة
  MATERNITY_WEEKS: 10,         // 10 أسابيع (4 قبل + 6 بعد)
  PATERNITY_DAYS: 3,
  MARRIAGE_DAYS: 5,
  BEREAVEMENT_DAYS: 5,
  HAJJ_DAYS_MIN: 10,
  HAJJ_DAYS_MAX: 15,
  HAJJ_SERVICE_YEARS: 2,       // 2 سنوات خدمة كحد أدنى
  EXAM_DAYS_PER_EXAM: 1,       // يوم لكل امتحان
  IDDAH_DAYS: 130,             // عدة وفاة الزوج
  
  // ترحيل
  MAX_CARRY_FORWARD_DAYS: 30,   // الحد الأقصى للترحيل
  CARRY_FORWARD_EXPIRY_MONTHS: 6, // ينتهي بعد 6 أشهر من السنة الجديدة
};

// ===================== Leave Engine =====================
export class LeaveEngine {
  
  /**
   * Calculate annual leave entitlement based on Saudi Labor Law Article 109
   */
  static calculateAnnualEntitlement(yearsOfService: number): number {
    if (yearsOfService >= 5) {
      return SAUDI_LEAVE_POLICY.ANNUAL_DAYS_OVER_5_YEARS;
    }
    return SAUDI_LEAVE_POLICY.ANNUAL_DAYS_UNDER_5_YEARS;
  }

  /**
   * Calculate monthly accrual amount
   */
  static calculateMonthlyAccrual(annualEntitlement: number): number {
    return Number((annualEntitlement / 12).toFixed(4));
  }

  /**
   * Run monthly leave accrual for all active employees
   * Should be run via cron on the 1st of each month
   */
  static async runMonthlyAccrual(
    accrualDate: Date = new Date(),
    userId?: number
  ): Promise<AccrualResult> {
    const result: AccrualResult = {
      processed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };

    const employees = await prisma.employee.findMany({
      where: { active: true },
    });

    for (const emp of employees) {
      try {
        if (!emp.startDate) {
          result.skipped++;
          continue;
        }

        const joinDate = new Date(emp.startDate);
        const diffMs = accrualDate.getTime() - joinDate.getTime();
        const yearsOfService = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        
        // Skip if employee hasn't completed probation (typically 3 months)
        if (yearsOfService < 0.25) { // ~3 months
          result.skipped++;
          continue;
        }

        const annualEntitlement = this.calculateAnnualEntitlement(yearsOfService);
        const monthlyAccrual = this.calculateMonthlyAccrual(annualEntitlement);

        const year = accrualDate.getFullYear();
        const month = accrualDate.getMonth() + 1;

        // Check if already accrued for this month
        const existing = await prisma.leaveAccrual.findFirst({
          where: {
            employeeId: emp.id,
            year,
            month,
            leaveType: 'ANNUAL',
          },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        // Get or create leave balance record
        let balance = await prisma.leaveBalance.findFirst({
          where: {
            employeeId: emp.id,
            leaveType: 'ANNUAL',
            year,
          },
        });

        if (!balance) {
          // Check for carry-forward from previous year
          const prevBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: emp.id,
              leaveType: 'ANNUAL',
              year: year - 1,
            },
          });

          let carriedForward = 0;
          if (prevBalance) {
            const remaining = Number(prevBalance.accrued) + Number(prevBalance.carriedForward) - Number(prevBalance.taken);
            carriedForward = Math.min(
              Math.max(0, remaining),
              SAUDI_LEAVE_POLICY.MAX_CARRY_FORWARD_DAYS
            );
          }

          balance = await prisma.leaveBalance.create({
            data: {
              employeeId: emp.id,
              leaveType: 'ANNUAL',
              year,
              totalEntitlement: annualEntitlement,
              accrued: 0,
              taken: 0,
              pending: 0,
              carriedForward,
              expiryDate: carriedForward > 0
                ? new Date(year, SAUDI_LEAVE_POLICY.CARRY_FORWARD_EXPIRY_MONTHS - 1, 30)
                : null,
            },
          });
        }

        // Create accrual record
        await prisma.leaveAccrual.create({
          data: {
            employeeId: emp.id,
            leaveType: 'ANNUAL',
            year,
            month,
            accrualDays: monthlyAccrual,
            reason: `تجميع شهري — ${month}/${year}`,
          },
        });

        // Update balance
        const newAccrued = Number(balance.accrued) + monthlyAccrual;
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { accrued: newAccrued },
        });

        result.processed++;
        result.details.push({
          employeeId: emp.id,
          employeeName: emp.name || emp.fullName || `Employee #${emp.id}`,
          accrued: monthlyAccrual,
          newBalance: newAccrued + Number(balance.carriedForward) - Number(balance.taken),
        });

      } catch (error) {
        result.errors.push(`Employee ${emp.id}: ${String(error)}`);
      }
    }

    return result;
  }

  /**
   * Get leave balance for an employee
   */
  static async getBalance(
    employeeId: number,
    leaveType: LeaveType = 'ANNUAL',
    year: number = new Date().getFullYear()
  ): Promise<LeaveBalance | null> {
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveType, year },
    });

    if (!balance) return null;

    // Check carry-forward expiry
    let availableCarryForward = Number(balance.carriedForward);
    if (balance.expiryDate && new Date() > new Date(balance.expiryDate)) {
      availableCarryForward = 0; // Expired
    }

    const available = Number(balance.accrued) + availableCarryForward 
                      - Number(balance.taken) - Number(balance.pending);

    return {
      employeeId,
      leaveType: leaveType as LeaveType,
      totalEntitlement: Number(balance.totalEntitlement),
      accrued: Number(balance.accrued),
      taken: Number(balance.taken),
      pending: Number(balance.pending),
      available: Math.max(0, available),
      carriedForward: availableCarryForward,
      expiryDate: balance.expiryDate,
    };
  }

  /**
   * Validate a leave request before submission
   */
  static async validateLeaveRequest(
    employeeId: number,
    leaveType: LeaveType,
    startDate: Date,
    endDate: Date
  ): Promise<LeaveRequestResult> {
    const requestedDays = this.calculateWorkingDays(startDate, endDate);

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      return { allowed: false, reason: 'الموظف غير موجود' };
    }

    // For ANNUAL leave, check balance
    if (leaveType === 'ANNUAL') {
      const balance = await this.getBalance(employeeId, 'ANNUAL');
      if (!balance) {
        return { allowed: false, reason: 'لا يوجد رصيد إجازات سنوية' };
      }
      if (requestedDays > balance.available) {
        return {
          allowed: false,
          reason: `الرصيد المتاح (${balance.available} يوم) أقل من المطلوب (${requestedDays} يوم)`,
          availableBalance: balance.available,
          requestedDays,
        };
      }
      return { allowed: true, availableBalance: balance.available, requestedDays };
    }

    // For HAJJ, check eligibility (2+ years service, once only)
    if (leaveType === 'HAJJ') {
      if (!employee.startDate) {
        return { allowed: false, reason: 'لا يوجد تاريخ التحاق للموظف' };
      }
      const years = (new Date().getTime() - new Date(employee.startDate).getTime()) 
                     / (1000 * 60 * 60 * 24 * 365.25);
      if (years < SAUDI_LEAVE_POLICY.HAJJ_SERVICE_YEARS) {
        return { allowed: false, reason: 'يجب إتمام سنتين خدمة للحصول على إجازة الحج' };
      }
      // Check if already taken
      const hajjTaken = await prisma.leaveRequest.findFirst({
        where: { employeeId, leaveType: 'HAJJ', status: 'APPROVED' },
      });
      if (hajjTaken) {
        return { allowed: false, reason: 'إجازة الحج تُمنح مرة واحدة فقط أثناء الخدمة' };
      }
      if (requestedDays > SAUDI_LEAVE_POLICY.HAJJ_DAYS_MAX) {
        return { allowed: false, reason: `الحد الأقصى لإجازة الحج ${SAUDI_LEAVE_POLICY.HAJJ_DAYS_MAX} يوم` };
      }
      return { allowed: true, requestedDays };
    }

    // For MATERNITY
    if (leaveType === 'MATERNITY') {
      if (requestedDays > SAUDI_LEAVE_POLICY.MATERNITY_WEEKS * 7) {
        return { allowed: false, reason: `الحد الأقصى لإجازة الأمومة ${SAUDI_LEAVE_POLICY.MATERNITY_WEEKS} أسابيع` };
      }
      return { allowed: true, requestedDays };
    }

    // For SICK
    if (leaveType === 'SICK') {
      if (!employee.startDate) {
        return { allowed: false, reason: 'لا يوجد تاريخ التحاق' };
      }
      const monthsService = (new Date().getTime() - new Date(employee.startDate).getTime()) 
                              / (1000 * 60 * 60 * 24 * 30.44);
      if (monthsService < SAUDI_LEAVE_POLICY.SICK_QUALIFYING_MONTHS) {
        return { allowed: false, reason: 'يجب إتمام 3 أشهر خدمة للحصول على إجازة مرضية' };
      }
      return { allowed: true, requestedDays };
    }

    // For other types (MARRIAGE, BEREAVEMENT, PATERNITY, etc.)
    const maxDaysMap: Record<string, number> = {
      MARRIAGE: SAUDI_LEAVE_POLICY.MARRIAGE_DAYS,
      BEREAVEMENT: SAUDI_LEAVE_POLICY.BEREAVEMENT_DAYS,
      PATERNITY: SAUDI_LEAVE_POLICY.PATERNITY_DAYS,
      IDDAH: SAUDI_LEAVE_POLICY.IDDAH_DAYS,
    };

    const maxDays = maxDaysMap[leaveType];
    if (maxDays && requestedDays > maxDays) {
      return { allowed: false, reason: `الحد الأقصى لهذا النوع ${maxDays} يوم` };
    }

    return { allowed: true, requestedDays };
  }

  /**
   * Submit a leave request
   */
  static async submitLeaveRequest(params: {
    employeeId: number;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    reason?: string;
    attachmentUrl?: string;
  }): Promise<{ id: number; status: string }> {
    // Validate first
    const validation = await this.validateLeaveRequest(
      params.employeeId,
      params.leaveType,
      params.startDate,
      params.endDate
    );

    if (!validation.allowed) {
      throw new Error(validation.reason || 'طلب الإجازة غير مسموح');
    }

    const days = validation.requestedDays || this.calculateWorkingDays(params.startDate, params.endDate);

    // Create request
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: params.employeeId,
        leaveType: params.leaveType,
        startDate: params.startDate,
        endDate: params.endDate,
        days,
        reason: params.reason,
        attachmentUrl: params.attachmentUrl,
        status: 'PENDING',
      },
    });

    // Update pending balance for ANNUAL leave
    if (params.leaveType === 'ANNUAL') {
      const year = params.startDate.getFullYear();
      await prisma.leaveBalance.updateMany({
        where: { employeeId: params.employeeId, leaveType: 'ANNUAL', year },
        data: { pending: { increment: days } },
      });
    }

    return { id: request.id, status: 'PENDING' };
  }

  /**
   * Approve a leave request
   */
  static async approveLeaveRequest(
    requestId: number,
    approverId: number
  ): Promise<void> {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new Error('طلب الإجازة غير موجود');
    if (request.status !== 'PENDING') throw new Error('الطلب ليس في حالة انتظار');

    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedBy: approverId,
          approvedAt: new Date(),
        },
      });

      // Update balance
      const year = new Date(request.startDate).getFullYear();
      const days = Number(request.days);

      if (request.leaveType === 'ANNUAL') {
        await tx.leaveBalance.updateMany({
          where: { employeeId: request.employeeId, leaveType: 'ANNUAL', year },
          data: {
            taken: { increment: days },
            pending: { decrement: days },
          },
        });
      }
    });
  }

  /**
   * Reject a leave request
   */
  static async rejectLeaveRequest(
    requestId: number,
    rejectedBy: number,
    rejectionReason: string
  ): Promise<void> {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new Error('طلب الإجازة غير موجود');
    if (request.status !== 'PENDING') throw new Error('الطلب ليس في حالة انتظار');

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectionReason,
        },
      });

      // Release pending from balance
      if (request.leaveType === 'ANNUAL') {
        const year = new Date(request.startDate).getFullYear();
        await tx.leaveBalance.updateMany({
          where: { employeeId: request.employeeId, leaveType: 'ANNUAL', year },
          data: { pending: { decrement: Number(request.days) } },
        });
      }
    });
  }

  /**
   * Calculate sick leave salary (Article 113)
   */
  static calculateSickPayRate(sickDaysSoFar: number): number {
    if (sickDaysSoFar <= SAUDI_LEAVE_POLICY.SICK_FULL_PAY_DAYS) {
      return 1.0; // 100%
    }
    if (sickDaysSoFar <= SAUDI_LEAVE_POLICY.SICK_FULL_PAY_DAYS + SAUDI_LEAVE_POLICY.SICK_75_PCT_DAYS) {
      return 0.75; // 75%
    }
    return 0; // Unpaid
  }

  /**
   * Calculate vacation payout for EOS (unused annual leave)
   */
  static async calculateVacationPayout(
    employeeId: number,
    dailySalary: number
  ): Promise<{ unusedDays: number; payoutAmount: number }> {
    const currentYear = new Date().getFullYear();
    const balance = await this.getBalance(employeeId, 'ANNUAL', currentYear);
    
    if (!balance) {
      return { unusedDays: 0, payoutAmount: 0 };
    }

    const unusedDays = balance.available;
    const payoutAmount = unusedDays * dailySalary;

    return { unusedDays, payoutAmount };
  }

  /**
   * Get leave summary for employee dashboard
   */
  static async getEmployeeLeaveSummary(
    employeeId: number,
    year: number = new Date().getFullYear()
  ): Promise<{
    annual: LeaveBalance | null;
    sickDaysTaken: number;
    specialLeaves: Array<{ type: string; taken: number }>;
    upcomingLeaves: any[];
  }> {
    const annual = await this.getBalance(employeeId, 'ANNUAL', year);

    // Count sick days
    const sickRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        leaveType: 'SICK',
        status: 'APPROVED',
        startDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    });
    const sickDaysTaken = sickRequests.reduce((sum, r) => sum + Number(r.days), 0);

    // Special leaves
    const specialTypes: LeaveType[] = ['MARRIAGE', 'BEREAVEMENT', 'HAJJ', 'MATERNITY', 'PATERNITY'];
    const specialLeaves = [];
    for (const type of specialTypes) {
      const reqs = await prisma.leaveRequest.findMany({
        where: {
          employeeId,
          leaveType: type,
          status: 'APPROVED',
          startDate: { gte: new Date(year, 0, 1) },
        },
      });
      const taken = reqs.reduce((sum, r) => sum + Number(r.days), 0);
      if (taken > 0) {
        specialLeaves.push({ type, taken });
      }
    }

    // Upcoming approved leaves
    const upcomingLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    return { annual, sickDaysTaken, specialLeaves, upcomingLeaves };
  }

  /**
   * Year-end carry forward process
   */
  static async processYearEndCarryForward(
    year: number,
    userId?: number
  ): Promise<{ processed: number; details: Array<{ employeeId: number; carried: number }> }> {
    const balances = await prisma.leaveBalance.findMany({
      where: { leaveType: 'ANNUAL', year },
    });

    const details: Array<{ employeeId: number; carried: number }> = [];

    for (const bal of balances) {
      const remaining = Number(bal.accrued) + Number(bal.carriedForward) - Number(bal.taken);
      const toCarry = Math.min(
        Math.max(0, remaining),
        SAUDI_LEAVE_POLICY.MAX_CARRY_FORWARD_DAYS
      );

      if (toCarry > 0) {
        // Create next year balance with carry-forward
        const existingNextYear = await prisma.leaveBalance.findFirst({
          where: { employeeId: bal.employeeId, leaveType: 'ANNUAL', year: year + 1 },
        });

        if (existingNextYear) {
          await prisma.leaveBalance.update({
            where: { id: existingNextYear.id },
            data: {
              carriedForward: toCarry,
              expiryDate: new Date(year + 1, SAUDI_LEAVE_POLICY.CARRY_FORWARD_EXPIRY_MONTHS - 1, 30),
            },
          });
        } else {
          await prisma.leaveBalance.create({
            data: {
              employeeId: bal.employeeId,
              leaveType: 'ANNUAL',
              year: year + 1,
              totalEntitlement: Number(bal.totalEntitlement),
              accrued: 0,
              taken: 0,
              pending: 0,
              carriedForward: toCarry,
              expiryDate: new Date(year + 1, SAUDI_LEAVE_POLICY.CARRY_FORWARD_EXPIRY_MONTHS - 1, 30),
            },
          });
        }

        details.push({ employeeId: bal.employeeId, carried: toCarry });
      }
    }

    return { processed: details.length, details };
  }

  // ===================== Utilities =====================

  /**
   * Calculate working days between two dates (excluding Fri/Sat for Saudi Arabia)
   */
  static calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const day = current.getDay();
      // Saudi weekend: Friday (5) and Saturday (6)
      if (day !== 5 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}

export { SAUDI_LEAVE_POLICY };
