/**
 * Landed Cost Service
 * Uses actual LandedCost model (purchaseOrderId, allocationMethod, amount)
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type AllocationMethod = 'value' | 'quantity' | 'weight';

export interface LandedCostAllocation {
  productId: number;
  productName: string;
  qty: number;
  value: number;
  allocatedCost: number;
  newUnitCost: number;
}

export class LandedCostService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Add landed cost to a purchase order
   */
  async addLandedCost(tenantId: string, data: {
    purchaseOrderId?: number;
    letterOfCreditId?: number;
    expenseAccountId: number;
    description: string;
    amount: number;
    currencyId?: number;
    exchangeRate?: number;
    allocationMethod: AllocationMethod;
  }): Promise<number> {
    const lc = await this.prisma.landedCost.create({
      data: {
        tenantId,
        purchaseOrderId: data.purchaseOrderId,
        letterOfCreditId: data.letterOfCreditId,
        expenseAccountId: data.expenseAccountId,
        description: data.description,
        amount: new Decimal(data.amount),
        currencyId: data.currencyId,
        exchangeRate: data.exchangeRate ? new Decimal(data.exchangeRate) : new Decimal(1),
        allocationMethod: data.allocationMethod,
        isAllocated: false,
      },
    });
    return lc.id;
  }

  /**
   * Allocate landed costs to PO items
   */
  async allocate(tenantId: string, landedCostId: number): Promise<LandedCostAllocation[]> {
    const lc = await this.prisma.landedCost.findFirstOrThrow({ where: { id: landedCostId, tenantId } });
    if (!lc.purchaseOrderId) throw new Error('Landed cost must be linked to a PO');

    const details = await this.prisma.purchaseInvoiceDetail.findMany({
      where: { tenantId, invoice: { purchaseOrderId: lc.purchaseOrderId } },
      include: { product: { select: { id: true, name: true } } },
    });

    const totalAmount = Number(lc.amount) * Number(lc.exchangeRate);

    // Calculate allocation base
    const base = details.map((d) => ({
      productId: d.productId,
      productName: d.productName ?? d.product.name,
      qty: Number(d.quantity),
      value: Number(d.total),
    }));

    const totalBase = lc.allocationMethod === 'quantity'
      ? base.reduce((s, b) => s + b.qty, 0)
      : base.reduce((s, b) => s + b.value, 0);

    const allocations: LandedCostAllocation[] = base.map((b) => {
      const allocationKey = lc.allocationMethod === 'quantity' ? b.qty : b.value;
      const allocatedCost = totalBase > 0 ? (allocationKey / totalBase) * totalAmount : 0;
      const unitCost = b.qty > 0 ? Number((Number(b.value) / b.qty)) + (allocatedCost / b.qty) : 0;

      return {
        productId: b.productId,
        productName: b.productName,
        qty: b.qty,
        value: b.value,
        allocatedCost: Math.round(allocatedCost * 100) / 100,
        newUnitCost: Math.round(unitCost * 100) / 100,
      };
    });

    // Mark as allocated
    await this.prisma.landedCost.update({ where: { id: landedCostId }, data: { isAllocated: true } });

    return allocations;
  }

  /**
   * Get unallocated landed costs
   */
  async getUnallocated(tenantId: string): Promise<{
    id: number;
    description: string;
    amount: number;
    allocationMethod: string;
    createdAt: Date;
  }[]> {
    const costs = await this.prisma.landedCost.findMany({
      where: { tenantId, isAllocated: false },
      select: { id: true, description: true, amount: true, allocationMethod: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return costs.map((c) => ({ ...c, amount: Number(c.amount) }));
  }
}
