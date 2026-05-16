import { PrismaClient, Prisma } from '@prisma/client';
import { assertTenant } from '../tenant/tenant-guard';

export type InventoryTxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface InventoryAllocationPayload {
  tenantId: string;
  productId: number;
  stockId: number;
  quantity: number | Prisma.Decimal;
  batchId?: number;
  referenceType: string;
  referenceId: number;
}

export class InventoryAllocationService {
  /**
   * Allocates or consumes inventory. MUST be called inside runInventoryTx.
   * Includes service-level tenant guard.
   */
  static async allocateStock(tx: InventoryTxClient, payload: InventoryAllocationPayload) {
    assertTenant(payload.tenantId);
    
    if (!payload.productId || !payload.stockId) {
      throw new Error('Missing product or stock ID');
    }

    const currentStock = await tx.productStock.findFirst({
      where: {
        tenantId: payload.tenantId, // Guard applied
        productId: payload.productId,
        stockId: payload.stockId,
      }
    });

    const currentQty = currentStock?.quantity ? Number(currentStock.quantity) : 0;
    const changeQty = Number(payload.quantity);
    const newQuantity = currentQty - changeQty;

    if (newQuantity < 0) {
       throw new Error(`Insufficient stock for Product ${payload.productId} in Stock ${payload.stockId}`);
    }

    return await tx.productStock.update({
      where: {
        productId_stockId: {
          productId: payload.productId,
          stockId: payload.stockId
        }
      },
      data: {
        quantity: newQuantity,
      }
    });
  }
}
