/**
 * Asset Maintenance Service
 * Uses actual AssetMaintenanceRecord model
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'OVERHAUL';

export interface ScheduleMaintenanceInput {
  assetId: number;
  type: MaintenanceType;
  description: string;
  scheduledDate: Date;
  estimatedCost?: number;
  performedByVendorId?: number;
  performedByEmployeeId?: number;
  nextDueDate?: Date;
}

export class AssetMaintenanceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Schedule a maintenance order
   */
  async scheduleMaintenance(tenantId: string, input: ScheduleMaintenanceInput): Promise<number> {
    const record = await this.prisma.assetMaintenanceRecord.create({
      data: {
        tenantId,
        assetId: input.assetId,
        type: input.type,
        description: input.description,
        scheduledDate: input.scheduledDate,
        cost: input.estimatedCost ? new Decimal(input.estimatedCost) : undefined,
        performedByVendorId: input.performedByVendorId,
        performedByEmployeeId: input.performedByEmployeeId,
        nextDueDate: input.nextDueDate,
        capitalize: false,
      },
    });

    // Update asset's next maintenance date
    if (input.scheduledDate) {
      await this.prisma.fixedAsset.update({
        where: { id: input.assetId },
        data: { nextMaintenanceDate: input.scheduledDate },
      });
    }

    return record.id;
  }

  /**
   * Record maintenance completion
   */
  async completeMaintenance(tenantId: string, recordId: number, data: {
    performedDate: Date;
    actualCost: number;
    hoursWorked?: number;
    partsReplaced?: object;
    nextDueDate?: Date;
    capitalize?: boolean;
    capitalizationReason?: string;
  }): Promise<void> {
    await this.prisma.assetMaintenanceRecord.update({
      where: { id: recordId },
      data: {
        performedDate: data.performedDate,
        cost: new Decimal(data.actualCost),
        hoursWorked: data.hoursWorked ? new Decimal(data.hoursWorked) : undefined,
        partsReplaced: data.partsReplaced as any,
        nextDueDate: data.nextDueDate,
        capitalize: data.capitalize ?? false,
        capitalizationReason: data.capitalizationReason,
      },
    });

    // Update asset next maintenance date
    const record = await this.prisma.assetMaintenanceRecord.findUnique({ where: { id: recordId } });
    if (record?.nextDueDate) {
      await this.prisma.fixedAsset.update({
        where: { id: record.assetId },
        data: { nextMaintenanceDate: record.nextDueDate },
      });
    }
  }

  /**
   * Get upcoming / overdue maintenance
   */
  async getScheduled(tenantId: string): Promise<{
    id: number;
    assetId: number;
    type: string;
    scheduledDate: Date | null;
    isOverdue: boolean;
    estimatedCost: number;
  }[]> {
    const records = await this.prisma.assetMaintenanceRecord.findMany({
      where: { tenantId, performedDate: null },
      orderBy: { scheduledDate: 'asc' },
      include: { asset: { select: { name: true } } },
    });

    const today = new Date();
    return records.map((r) => ({
      id: r.id,
      assetId: r.assetId,
      assetName: r.asset.name,
      type: r.type,
      scheduledDate: r.scheduledDate,
      isOverdue: r.scheduledDate !== null && r.scheduledDate < today,
      estimatedCost: Number(r.cost ?? 0),
    }));
  }

  /**
   * Cost analysis for a period
   */
  async getCostAnalysis(tenantId: string, fromDate: Date, toDate: Date): Promise<{
    totalCost: number;
    recordCount: number;
    capitalize: number;
    expense: number;
    byType: Record<string, number>;
  }> {
    const records = await this.prisma.assetMaintenanceRecord.findMany({
      where: {
        tenantId,
        performedDate: { gte: fromDate, lte: toDate },
      },
    });

    const totalCost = records.reduce((s, r) => s + Number(r.cost ?? 0), 0);
    const capitalize = records.filter((r) => r.capitalize).reduce((s, r) => s + Number(r.cost ?? 0), 0);
    const byType = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + Number(r.cost ?? 0);
      return acc;
    }, {});

    return { totalCost, recordCount: records.length, capitalize, expense: totalCost - capitalize, byType };
  }
}
