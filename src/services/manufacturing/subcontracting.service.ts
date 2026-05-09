/**
 * Subcontracting Service
 * Uses actual SubcontractingPO + SubcontractMovement models
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class SubcontractingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a subcontracting PO — send materials to supplier, receive finished goods
   */
  async createPO(tenantId: string, data: {
    supplierId: number;
    productToReceive: number;
    productsToSend: { productId: number; qty: number }[];
    expectedDate: Date;
  }): Promise<number> {
    const po = await this.prisma.subcontractingPO.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        productToReceive: data.productToReceive,
        productsToSend: JSON.stringify(data.productsToSend),
        expectedDate: data.expectedDate,
        status: 'DRAFT',
      },
    });
    return po.id;
  }

  /**
   * Issue materials to subcontractor
   */
  async issueMaterials(tenantId: string, poId: number, items: { productId: number; qty: number }[]): Promise<void> {
    await this.prisma.subcontractingPO.update({ where: { id: poId }, data: { status: 'ISSUED' } });

    await this.prisma.subcontractMovement.createMany({
      data: items.map((item) => ({
        tenantId,
        scPoId: poId,
        type: 'ISSUE',
        productId: item.productId,
        qty: new Decimal(item.qty),
      })),
    });
  }

  /**
   * Receive finished goods from subcontractor
   */
  async receiveFinishedGoods(tenantId: string, poId: number, productId: number, qty: number): Promise<void> {
    await this.prisma.subcontractMovement.create({
      data: {
        tenantId,
        scPoId: poId,
        type: 'RECEIVE_FINISHED',
        productId,
        qty: new Decimal(qty),
      },
    });

    const po = await this.prisma.subcontractingPO.findUniqueOrThrow({ where: { id: poId } });
    // Check if fully received
    const received = await this.prisma.subcontractMovement.aggregate({
      where: { tenantId, scPoId: poId, type: 'RECEIVE_FINISHED', productId: po.productToReceive },
      _sum: { qty: true },
    });

    // Could mark as COMPLETED if fully received
    await this.prisma.subcontractingPO.update({
      where: { id: poId },
      data: { status: 'PARTIAL_RECEIPT' },
    });
  }

  /**
   * Get active subcontracting POs
   */
  async getActivePOs(tenantId: string): Promise<{
    id: number;
    supplierName: string;
    finishedProduct: string;
    expectedDate: Date;
    status: string;
    isOverdue: boolean;
  }[]> {
    const pos = await this.prisma.subcontractingPO.findMany({
      where: { tenantId, status: { in: ['DRAFT', 'ISSUED', 'PARTIAL_RECEIPT'] } },
      include: {
        supplier: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { expectedDate: 'asc' },
    });

    const today = new Date();
    return pos.map((po) => ({
      id: po.id,
      supplierName: po.supplier.name,
      finishedProduct: po.product.name,
      expectedDate: po.expectedDate,
      status: po.status,
      isOverdue: po.expectedDate < today,
    }));
  }
}
