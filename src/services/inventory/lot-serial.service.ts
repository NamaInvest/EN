/**
 * Lot & Serial Number Tracking Service
 * Uses actual ProductBatch model for lot/batch tracking
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class LotSerialService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new lot/batch
   */
  async createBatch(tenantId: string, data: {
    productId: number;
    batchNumber: string;
    initialQuantity: number;
    unitCost: number;
    productionDate?: Date;
    expiryDate?: Date;
    supplierBatchNumber?: string;
  }): Promise<number> {
    const batch = await this.prisma.productBatch.create({
      data: {
        tenantId,
        productId: data.productId,
        batchNumber: data.batchNumber,
        initialQuantity: new Decimal(data.initialQuantity),
        currentQuantity: new Decimal(data.initialQuantity),
        unitCost: new Decimal(data.unitCost),
        productionDate: data.productionDate,
        expiryDate: data.expiryDate,
        supplierBatchNumber: data.supplierBatchNumber,
        status: 'AVAILABLE',
      },
    });
    return batch.id;
  }

  /**
   * Get batches for a product, ordered by FEFO (First Expired First Out)
   */
  async getBatchesFEFO(tenantId: string, productId: number): Promise<{
    id: number;
    batchNumber: string;
    currentQuantity: number;
    unitCost: number;
    expiryDate: Date | null;
    daysToExpiry: number | null;
    status: string;
  }[]> {
    const batches = await this.prisma.productBatch.findMany({
      where: { tenantId, productId, status: 'AVAILABLE', currentQuantity: { gt: 0 } },
      orderBy: [{ expiryDate: 'asc' }, { productionDate: 'asc' }],
    });

    const today = new Date();
    return batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      currentQuantity: Number(b.currentQuantity),
      unitCost: Number(b.unitCost),
      expiryDate: b.expiryDate,
      daysToExpiry: b.expiryDate
        ? Math.ceil((b.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null,
      status: b.status,
    }));
  }

  /**
   * Quarantine a batch
   */
  async quarantine(tenantId: string, batchId: number, reason: string): Promise<void> {
    await this.prisma.productBatch.update({
      where: { id: batchId },
      data: { status: 'QUARANTINED', quarantineReason: reason },
    });
  }

  /**
   * Get expiring batches (next N days)
   */
  async getExpiringBatches(tenantId: string, withinDays: number = 30): Promise<{
    id: number;
    productId: number;
    productName: string;
    batchNumber: string;
    currentQuantity: number;
    expiryDate: Date;
    daysToExpiry: number;
  }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);

    const batches = await this.prisma.productBatch.findMany({
      where: {
        tenantId,
        status: 'AVAILABLE',
        expiryDate: { lte: cutoff },
        currentQuantity: { gt: 0 },
      },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { expiryDate: 'asc' },
    });

    const today = new Date();
    return batches.map((b) => ({
      id: b.id,
      productId: b.product.id,
      productName: b.product.name,
      batchNumber: b.batchNumber,
      currentQuantity: Number(b.currentQuantity),
      expiryDate: b.expiryDate!,
      daysToExpiry: Math.ceil((b.expiryDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }
}
