import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ess-engine' });

/**
 * H-09: ESS Mobile-Ready Engine
 * Actual schema: employeeNo, position, department String, leaveType String
 * No payrollEmployee model — use PayrollRun for payroll info
 * Employee has no status field — filter by active
 */
export class ESSEngine {
  static async getDashboard(employeeId: number, _tenantId: string) {
    const [employee, leaveBalance, openRequests] = await Promise.all([
      prisma.employee.findUniqueOrThrow({
        where: { id: employeeId },
        select: { id: true, name: true, employeeNo: true, position: true, department: true },
      }),
      prisma.leaveBalance.findMany({ where: { employeeId } }),
      prisma.leaveRequest.findMany({
        where: { employeeId, status: 'PENDING' },
        orderBy: { startDate: 'desc' },
        take: 5,
      }),
    ]);
    return { employee, leaveBalance, openRequests };
  }

  static async requestLeave(employeeId: number, leaveType: string, startDate: Date, endDate: Date, reason: string) {
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
    log.info(`Leave request: employee ${employeeId}, type=${leaveType}, ${days} days`);
    return prisma.leaveRequest.create({
      data: { tenantId: 'default', employeeId, leaveType, startDate, endDate, days, reason, status: 'PENDING' },
    });
  }

  static async getPayrollInfo(employeeId: number) {
    // Return recent payroll runs for reference — individual employee lines via PayrollInvoice
    const payrollInvoices = await prisma.payrollInvoice.findMany({
      where: { employeeId },
      orderBy: { id: 'desc' },
      take: 3,
      select: { id: true, invoiceNo: true, period: true, total: true },
    });
    return payrollInvoices;
  }

  static async updateContactInfo(employeeId: number, data: { phone?: string; address?: string }) {
    return prisma.employee.update({ where: { id: employeeId }, data });
  }

  static async getTeamDirectory(department: string) {
    return prisma.employee.findMany({
      where: { department },
      select: { id: true, name: true, position: true, phone: true },
      orderBy: { name: 'asc' },
    });
  }
}
