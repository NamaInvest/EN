/**
 * Landed Cost Engine (Phase 24.6 - Inventory)
 * ──────────────────────────────────────────────────────────
 * Calculates the true cost of inventory (COGS) by allocating additional expenses
 * (e.g., Freight, Customs, Insurance) to the received items based on standard methods
 * (Value, Quantity, Weight).
 */
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'LandedCostEngine' });

export type AllocationMethod = 'VALUE' | 'QUANTITY' | 'WEIGHT' | 'MANUAL';

export interface ReceiptItem {
  id: string | number;
  productId: string | number;
  quantity: number;
  unitPrice: number;
  weight?: number; // Total weight of this line
}

export interface AdditionalCost {
  id: string | number;
  description: string;
  amount: number;
  allocationMethod: AllocationMethod;
}

export interface AllocatedCostLine {
  receiptItemId: string | number;
  originalTotal: number;
  allocatedAdditionalCost: number;
  newLandedTotal: number;
  newLandedUnitCost: number;
}

export class LandedCostEngine {
  /**
   * Calculates Landed Cost allocations for a given set of receipt items and additional expenses.
   */
  static calculateLandedCost(items: ReceiptItem[], costs: AdditionalCost[]): AllocatedCostLine[] {
    try {
      if (!items || items.length === 0) throw new Error('No items provided for landed cost calculation.');

      // 1. Calculate Totals
      const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);

      // Initialize allocations map
      const allocations = new Map<string | number, number>();
      items.forEach(item => allocations.set(item.id, 0));

      // 2. Process each Additional Cost
      for (const cost of costs) {
        let remainingCost = new Decimal(cost.amount);

        items.forEach((item, index) => {
          let proportion = new Decimal(0);

          switch (cost.allocationMethod) {
            case 'VALUE':
              proportion = totalValue > 0 ? new Decimal(item.quantity * item.unitPrice).div(totalValue) : new Decimal(0);
              break;
            case 'QUANTITY':
              proportion = totalQty > 0 ? new Decimal(item.quantity).div(totalQty) : new Decimal(0);
              break;
            case 'WEIGHT':
              if (item.weight !== undefined && totalWeight > 0) {
                proportion = new Decimal(item.weight).div(totalWeight);
              } else {
                // Fallback to value if weight is missing
                proportion = totalValue > 0 ? new Decimal(item.quantity * item.unitPrice).div(totalValue) : new Decimal(0);
                log.warn(`Weight missing for item ${item.id}, falling back to VALUE allocation for cost ${cost.id}`);
              }
              break;
            case 'MANUAL':
              // Manual logic should be pre-calculated outside. Defaulting to 0 here.
              proportion = new Decimal(0);
              break;
            default:
              proportion = totalValue > 0 ? new Decimal(item.quantity * item.unitPrice).div(totalValue) : new Decimal(0);
          }

          // Calculate allocation amount
          let allocatedAmount = new Decimal(cost.amount).mul(proportion);

          // Handle rounding differences on the last item
          if (index === items.length - 1) {
            allocatedAmount = remainingCost;
          } else {
            remainingCost = remainingCost.minus(allocatedAmount);
          }

          const currentTotal = allocations.get(item.id) || 0;
          allocations.set(item.id, new Decimal(currentTotal).plus(allocatedAmount).toNumber());
        });
      }

      // 3. Build Result
      const result: AllocatedCostLine[] = items.map(item => {
        const originalTotal = new Decimal(item.quantity * item.unitPrice);
        const allocatedCost = new Decimal(allocations.get(item.id) || 0);
        const newTotal = originalTotal.plus(allocatedCost);
        const newUnitCost = newTotal.div(item.quantity || 1);

        return {
          receiptItemId: item.id,
          originalTotal: originalTotal.toDecimalPlaces(2).toNumber(),
          allocatedAdditionalCost: allocatedCost.toDecimalPlaces(2).toNumber(),
          newLandedTotal: newTotal.toDecimalPlaces(2).toNumber(),
          newLandedUnitCost: newUnitCost.toDecimalPlaces(2).toNumber()
        };
      });

      log.info('Landed cost calculated successfully', { itemCount: items.length, costCount: costs.length });
      return result;

    } catch (error: any) {
      log.error('Failed to calculate landed cost', { error: error.message });
      throw new Error(`Landed cost calculation failed: ${error.message}`);
    }
  }

  /**
   * Generates Journal Entries for the Landed Cost capitalizing the expenses into Inventory.
   * Dr. Inventory Account (Allocated Amount)
   * Cr. Clearing/Accrual Account (Allocated Amount)
   */
  static buildJournalEntries(allocations: AllocatedCostLine[], inventoryAccountId: number, clearingAccountId: number) {
    const totalAllocated = allocations.reduce((sum, line) => sum + line.allocatedAdditionalCost, 0);
    
    if (totalAllocated <= 0) return null;

    return {
      description: 'Capitalize Landed Costs to Inventory',
      lines: [
        { accountId: inventoryAccountId, debit: totalAllocated, credit: 0 },
        { accountId: clearingAccountId, debit: 0, credit: totalAllocated }
      ]
    };
  }
}
