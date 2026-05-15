import { PrismaClient } from '@prisma/client';
import { InventoryService, TxClient } from './inventory.service';
import { runInventoryTx } from '../db/transaction';

export class TransferService {
  /**
   * Executes a warehouse-to-warehouse stock transfer.
   */
  static async executeTransfer(prisma: PrismaClient, payload: {
    tenantId: string;
    fromStockId: number;
    toStockId: number;
    items: { productId: number; quantity: number; batchId?: number }[];
    reference: string;
  }) {
    return await runInventoryTx(prisma, async (tx: TxClient) => {
      const movements = [];
      for (const item of payload.items) {
        // 1. Decrease source stock
        await InventoryService.adjustStock(tx, {
          tenantId: payload.tenantId,
          productId: item.productId,
          stockId: payload.fromStockId,
          quantityChange: -item.quantity,
          batchId: item.batchId,
          reason: 'Internal Transfer Out',
          reference: payload.reference,
          sourceType: 'TRANSFER_OUT'
        });

        // 2. Increase destination stock
        await InventoryService.adjustStock(tx, {
          tenantId: payload.tenantId,
          productId: item.productId,
          stockId: payload.toStockId,
          quantityChange: item.quantity,
          batchId: item.batchId,
          reason: 'Internal Transfer In',
          reference: payload.reference,
          sourceType: 'TRANSFER_IN'
        });

        // 3. Record the movement log
        const movement = await InventoryService.recordMovement(tx, {
          tenantId: payload.tenantId,
          productId: item.productId,
          stockId: payload.fromStockId, // primary stock ID for the log
          quantity: item.quantity,
          type: 'TRANSFER',
          notes: `Transfer to Stock ${payload.toStockId}`,
          referenceType: 'StockTransfer'
        });
        movements.push(movement);
      }
      return movements;
    }, `TRANSFER_${payload.reference}`);
  }
}
