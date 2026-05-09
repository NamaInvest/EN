/**
 * Quality Inspection Service (Inventory)
 * Uses actual QualityInspection + NonConformanceReport models
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type InspectionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'REWORK';

export class QualityInspectionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a quality inspection for a receipt / production
   */
  async createInspection(tenantId: string, data: {
    referenceNumber: string;
    inspectorId: number;
    productId?: number;
    inspectedQty?: number;
    results?: Record<string, unknown>;
    notes?: string;
  }): Promise<number> {
    const inspection = await this.prisma.qualityInspection.create({
      data: {
        tenantId,
        referenceNumber: data.referenceNumber,
        inspectorId: data.inspectorId,
        productId: data.productId,
        inspectedQty: data.inspectedQty ? new Decimal(data.inspectedQty) : undefined,
        results: data.results ? JSON.stringify(data.results) : undefined,
        notes: data.notes,
        status: 'PENDING',
      },
    });
    return inspection.id;
  }

  /**
   * Record inspection result
   */
  async recordResult(tenantId: string, inspectionId: number, status: InspectionStatus, results?: Record<string, unknown>): Promise<void> {
    await this.prisma.qualityInspection.update({
      where: { id: inspectionId },
      data: {
        status,
        results: results ? JSON.stringify(results) : undefined,
      },
    });
  }

  /**
   * Get inspection summary for a product
   */
  async getProductInspectionSummary(tenantId: string, productId: number): Promise<{
    total: number;
    passed: number;
    failed: number;
    rework: number;
    passRate: number;
  }> {
    const inspections = await this.prisma.qualityInspection.findMany({
      where: { tenantId, productId },
      select: { status: true },
    });

    const total = inspections.length;
    const passed = inspections.filter((i) => i.status === 'PASSED').length;
    const failed = inspections.filter((i) => i.status === 'FAILED').length;
    const rework = inspections.filter((i) => i.status === 'REWORK').length;

    return {
      total,
      passed,
      failed,
      rework,
      passRate: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
    };
  }

  /**
   * Get pending inspections
   */
  async getPending(tenantId: string): Promise<{
    id: number;
    referenceNumber: string;
    productId: number | null;
    productName: string | null;
    inspectionDate: Date;
  }[]> {
    const inspections = await this.prisma.qualityInspection.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return inspections.map((i) => ({
      id: i.id,
      referenceNumber: i.referenceNumber,
      productId: i.productId,
      productName: i.product?.name ?? null,
      inspectionDate: i.inspectionDate,
    }));
  }
}
