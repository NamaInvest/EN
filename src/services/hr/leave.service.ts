/**
 * Leave Management Service
 * Full leave lifecycle: request, approve, balance, accrual
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'HAJJ' | 'BEREAVEMENT';

export class LeaveService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Submit a leave request
   */
  async requestLeave(tenantId: string, data: {
    employeeId: number;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    reason?: string;
    attachmentUrl?: string;
  }): Promise<{ requestId: number; days: number }> {
    const days = this.businessDays(data.startDate, data.endDate);

    // Check balance
    const balance = await this.getBalance(tenantId, data.employeeId, data.leaveType, new Date().getFullYear());
    if (balance.available < days && data.leaveType === 'ANNUAL') {
      throw new Error(`Insufficient leave balance. Available: ${balance.available}, Requested: ${days}`);
    }

    const req = await this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        days: new Decimal(days),
        reason: data.reason,
        attachmentUrl: data.attachmentUrl,
        status: 'PENDING',
      },
    });

    // Mark days as pending in balance
    await this.prisma.leaveBalance.updateMany({
      where: {
        tenantId,
        employeeId: data.employeeId,
        year: new Date().getFullYear(),
        leaveType: data.leaveType,
      },
      data: { pending: { increment: new Decimal(days) } },
    });

    return { requestId: req.id, days };
  }

  /**
   * Approve a leave request
   */
  async approve(tenantId: string, requestId: number, approvedById: number): Promise<void> {
    const req = await this.prisma.leaveRequest.findFirstOrThrow({
      where: { id: requestId, tenantId, status: 'PENDING' },
    });

    await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', approvedBy: approvedById, approvedAt: new Date() },
    });

    // Move from pending to used
    await this.prisma.leaveBalance.updateMany({
      where: { tenantId, employeeId: req.employeeId, year: new Date().getFullYear(), leaveType: req.leaveType },
      data: {
        pending: { decrement: req.days },
        used: { increment: req.days },
        balance: { decrement: req.days },
      },
    });
  }

  /**
   * Reject a leave request
   */
  async reject(tenantId: string, requestId: number, rejectedById: number, reason: string): Promise<void> {
    const req = await this.prisma.leaveRequest.findFirstOrThrow({
      where: { id: requestId, tenantId, status: 'PENDING' },
    });

    await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', rejectedBy: rejectedById, rejectedAt: new Date(), rejectionReason: reason },
    });

    // Release pending days
    await this.prisma.leaveBalance.updateMany({
      where: { tenantId, employeeId: req.employeeId, year: new Date().getFullYear(), leaveType: req.leaveType },
      data: { pending: { decrement: req.days } },
    });
  }

  /**
   * Get leave balance for employee
   */
  async getBalance(tenantId: string, employeeId: number, leaveType: string, year: number): Promise<{
    entitlement: number;
    accrued: number;
    used: number;
    pending: number;
    carryOver: number;
    available: number;
  }> {
    const bal = await this.prisma.leaveBalance.findFirst({
      where: { tenantId, employeeId, leaveType, year },
    });

    if (!bal) return { entitlement: 0, accrued: 0, used: 0, pending: 0, carryOver: 0, available: 0 };

    return {
      entitlement: Number(bal.entitlement),
      accrued: Number(bal.accrued),
      used: Number(bal.used),
      pending: Number(bal.pending),
      carryOver: Number(bal.carryOver),
      available: Number(bal.balance),
    };
  }

  /**
   * Run monthly accrual (called by cron job)
   * Saudi annual leave = 21 days for <5yr, 30 days for ≥5yr
   */
  async runMonthlyAccrual(tenantId: string, accrualDate: Date, runBy: string): Promise<{
    processed: number;
    totalDaysAccrued: number;
  }> {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, active: true, deletedAt: null },
      select: { id: true, startDate: true },
    });

    let totalDays = 0;
    const year = accrualDate.getFullYear();

    for (const emp of employees) {
      const hireDate = emp.startDate ? new Date(emp.startDate) : new Date();
      const yearsOfService = (accrualDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const annualEntitlement = yearsOfService >= 5 ? 30 : 21;
      const monthlyAccrual = annualEntitlement / 12;

      // Create accrual record
      await this.prisma.leaveAccrual.create({
        data: {
          tenantId,
          employeeId: emp.id,
          accrualDate,
          leaveType: 'ANNUAL',
          daysAccrued: new Decimal(monthlyAccrual),
          runBy,
        },
      });

      // Update balance
      await this.prisma.leaveBalance.upsert({
        where: { employeeId_year_leaveType: { employeeId: emp.id, year, leaveType: 'ANNUAL' } },
        create: {
          tenantId,
          employeeId: emp.id,
          year,
          leaveType: 'ANNUAL',
          entitlement: new Decimal(annualEntitlement),
          accrued: new Decimal(monthlyAccrual),
          balance: new Decimal(monthlyAccrual),
        },
        update: {
          accrued: { increment: new Decimal(monthlyAccrual) },
          balance: { increment: new Decimal(monthlyAccrual) },
        },
      });

      totalDays += monthlyAccrual;
    }

    return { processed: employees.length, totalDaysAccrued: Math.round(totalDays * 100) / 100 };
  }

  private businessDays(start: Date, end: Date): number {
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      const day = d.getDay();
      if (day !== 5 && day !== 6) count++; // Friday=5, Saturday=6 (Saudi weekend)
      d.setDate(d.getDate() + 1);
    }
    return count;
  }
}
