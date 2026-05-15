import { PrismaClient } from '@prisma/client';
import { InventoryService, StockMovementPayload, StockAdjustmentPayload, TxClient } from './inventory.service';
import { runInventoryTx, runFinancialTx } from '../db/transaction';

export class ManufacturingService {
  /**
   * Posts manufacturing consumption (Raw Materials).
   * Ensures stock decrements are properly wrapped in an inventory transaction.
   */
  static async postConsumption(prisma: PrismaClient, payload: {
    tenantId: string;
    manufacturingOrderId: number;
    components: { productId: number; stockId: number; quantity: number }[];
  }) {
    return await runInventoryTx(prisma, async (tx: TxClient) => {
      const results = [];
      for (const comp of payload.components) {
        // Adjust stock downwards
        await InventoryService.adjustStock(tx, {
          tenantId: payload.tenantId,
          productId: comp.productId,
          stockId: comp.stockId,
          quantityChange: -comp.quantity,
          reason: 'Manufacturing Consumption',
          reference: `MO-${payload.manufacturingOrderId}`,
          sourceType: 'MANUFACTURING_CONSUMPTION'
        });

        // Record movement
        const movement = await InventoryService.recordMovement(tx, {
          tenantId: payload.tenantId,
          productId: comp.productId,
          stockId: comp.stockId,
          quantity: -comp.quantity,
          type: 'MANUFACTURING_CONSUMPTION',
          referenceId: payload.manufacturingOrderId,
          referenceType: 'ManufacturingOrder'
        });
        results.push(movement);
      }
      return results;
    }, `MFG_CONSUME_${payload.manufacturingOrderId}`);
  }

  /**
   * Posts manufacturing production (Finished Goods).
   * Ensures stock increments are properly wrapped in an inventory transaction.
   */
  static async postProduction(prisma: PrismaClient, payload: {
    tenantId: string;
    manufacturingOrderId: number;
    finishedGoods: { productId: number; stockId: number; quantity: number }[];
  }) {
    return await runInventoryTx(prisma, async (tx: TxClient) => {
      const results = [];
      for (const fg of payload.finishedGoods) {
        await InventoryService.adjustStock(tx, {
          tenantId: payload.tenantId,
          productId: fg.productId,
          stockId: fg.stockId,
          quantityChange: fg.quantity,
          reason: 'Manufacturing Production',
          reference: `MO-${payload.manufacturingOrderId}`,
          sourceType: 'MANUFACTURING_PRODUCTION'
        });

        const movement = await InventoryService.recordMovement(tx, {
          tenantId: payload.tenantId,
          productId: fg.productId,
          stockId: fg.stockId,
          quantity: fg.quantity,
          type: 'MANUFACTURING_PRODUCTION',
          referenceId: payload.manufacturingOrderId,
          referenceType: 'ManufacturingOrder'
        });
        results.push(movement);
      }
      return results;
    }, `MFG_PRODUCE_${payload.manufacturingOrderId}`);
  }

  /**
   * Records manufacturing scrap.
   */
  static async postScrap(prisma: PrismaClient, payload: {
    tenantId: string;
    workOrderId: number;
    scrapItems: { productId: number; stockId: number; quantity: number }[];
  }) {
    return await runInventoryTx(prisma, async (tx: TxClient) => {
      const results = [];
      for (const item of payload.scrapItems) {
        await InventoryService.adjustStock(tx, {
          tenantId: payload.tenantId,
          productId: item.productId,
          stockId: item.stockId,
          quantityChange: -item.quantity,
          reason: 'Manufacturing Scrap',
          reference: `WO-${payload.workOrderId}`,
          sourceType: 'MANUFACTURING_SCRAP'
        });

        const movement = await InventoryService.recordMovement(tx, {
          tenantId: payload.tenantId,
          productId: item.productId,
          stockId: item.stockId,
          quantity: -item.quantity,
          type: 'OUT',
          notes: 'Scrap',
          referenceId: payload.workOrderId,
          referenceType: 'WorkOrder'
        });
        results.push(movement);
      }
      return results;
    }, `MFG_SCRAP_${payload.workOrderId}`);
  }
}
