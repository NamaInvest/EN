import { PrismaClient, Prisma } from '@prisma/client';

export type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface StockAdjustmentPayload {
  tenantId: string;
  productId: number;
  stockId: number;
  batchId?: number;
  quantityChange: number | Prisma.Decimal;
  reason?: string;
  reference?: string;
  sourceType?: string;
}

export interface StockMovementPayload {
  tenantId: string;
  productId: number;
  stockId: number;
  quantity: number | Prisma.Decimal;
  type: string;
  referenceId?: number;
  referenceType?: string;
  batchId?: number;
  notes?: string;
}

export class InventoryService {
  /**
   * Adjusts the stock for a given product/stock safely.
   * MUST be called inside a runInventoryTx wrapper.
   */
  static async adjustStock(tx: TxClient, payload: StockAdjustmentPayload) {
    if (!payload.tenantId) throw new Error('TENANT_ISOLATION_VIOLATION: Missing tenantId');

    const currentStock = await tx.productStock.findFirst({
      where: {
        productId: payload.productId,
        stockId: payload.stockId
      }
    });

    const currentQty = currentStock?.quantity ? Number(currentStock.quantity) : 0;
    const changeQty = Number(payload.quantityChange);
    const newQuantity = currentQty + changeQty;

    if (newQuantity < 0) {
       throw new Error(`Insufficient stock for Product ${payload.productId} in Stock ${payload.stockId}`);
    }

    const updatedStock = await tx.productStock.upsert({
      where: {
        productId_stockId: {
          productId: payload.productId,
          stockId: payload.stockId
        }
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        tenantId: payload.tenantId,
        productId: payload.productId,
        stockId: payload.stockId,
        quantity: newQuantity,
      }
    });

    return updatedStock;
  }

  /**
   * Records a stock movement for auditing and valuation tracking.
   * MUST be called inside a runInventoryTx wrapper.
   */
  static async recordMovement(tx: TxClient, payload: StockMovementPayload) {
    if (!payload.tenantId) throw new Error('TENANT_ISOLATION_VIOLATION: Missing tenantId');

    const movement = await tx.stockMovement.create({
      data: {
        tenantId: payload.tenantId,
        productId: payload.productId,
        stockId: payload.stockId,
        quantity: payload.quantity,
        type: payload.type,
        referenceId: payload.referenceId || null,
        referenceType: payload.referenceType || null,
        batchId: payload.batchId || null,
        notes: payload.notes || null,
        date: new Date(),
      }
    });

    return movement;
  }
}
