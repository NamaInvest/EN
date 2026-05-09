/**
 * Resource Allocation Service
 * Uses actual ProjectResource schema (allocation %, hourlyRate)
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ResourceUtilization {
  employeeId: number;
  employeeName: string;
  allocatedPercent: number;
  actualHours: number;
  billableHours: number;
  billableRate: number;
}

export class ResourceAllocationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Assign employees to a project
   */
  async assignTeam(tenantId: string, projectId: number, assignments: {
    employeeId: number;
    role?: string;
    allocationPercent: number;
    hourlyRate?: number;
    startDate?: Date;
    endDate?: Date;
  }[]): Promise<{ assigned: number }> {
    let assigned = 0;
    for (const a of assignments) {
      // Check if assignment already exists
      const existing = await this.prisma.projectResource.findFirst({
        where: { tenantId, projectId, employeeId: a.employeeId },
      });

      if (existing) {
        await this.prisma.projectResource.update({
          where: { id: existing.id },
          data: {
            role: a.role ?? existing.role,
            allocation: new Decimal(a.allocationPercent),
            hourlyRate: a.hourlyRate ? new Decimal(a.hourlyRate) : undefined,
            startDate: a.startDate,
            endDate: a.endDate,
          },
        });
      } else {
        await this.prisma.projectResource.create({
          data: {
            tenantId,
            projectId,
            employeeId: a.employeeId,
            role: a.role ?? 'MEMBER',
            allocation: new Decimal(a.allocationPercent),
            hourlyRate: a.hourlyRate ? new Decimal(a.hourlyRate) : new Decimal(0),
            startDate: a.startDate,
            endDate: a.endDate,
          },
        });
      }
      assigned++;
    }
    return { assigned };
  }

  /**
   * Utilization using ProjectTimeEntry
   */
  async getUtilizationReport(tenantId: string, projectId: number, fromDate: Date, toDate: Date): Promise<ResourceUtilization[]> {
    const resources = await this.prisma.projectResource.findMany({
      where: { tenantId, projectId },
      include: {
        employee: { select: { id: true, name: true } },
      },
    });

    const result: ResourceUtilization[] = [];

    for (const r of resources) {
      if (!r.employeeId || !r.employee) continue;

      const entries = await this.prisma.projectTimeEntry.findMany({
        where: {
          tenantId,
          projectId,
          employeeId: r.employeeId,
          date: { gte: fromDate, lte: toDate },
        },
      });

      const actualHours = entries.reduce((s, e) => s + Number(e.hours ?? 0), 0);
      const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + Number(e.hours ?? 0), 0);

      result.push({
        employeeId: r.employeeId,
        employeeName: r.employee.name,
        allocatedPercent: Number(r.allocation ?? 0),
        actualHours,
        billableHours,
        billableRate: actualHours > 0 ? Math.round((billableHours / actualHours) * 10000) / 100 : 0,
      });
    }

    return result;
  }

  /**
   * Find employees not yet assigned to this project
   */
  async findAvailableEmployees(tenantId: string, projectId: number): Promise<{
    employeeId: number;
    name: string;
    position: string | null;
  }[]> {
    const assigned = await this.prisma.projectResource.findMany({
      where: { tenantId, projectId },
      select: { employeeId: true },
    });
    const assignedIds = assigned.map((r) => r.employeeId).filter((id): id is number => id !== null);

    const available = await this.prisma.employee.findMany({
      where: {
        tenantId,
        active: true,
        deletedAt: null,
        id: assignedIds.length > 0 ? { notIn: assignedIds } : undefined,
      },
      select: { id: true, name: true, position: true },
      take: 50,
    });

    return available.map((e) => ({ employeeId: e.id, name: e.name, position: e.position }));
  }
}
