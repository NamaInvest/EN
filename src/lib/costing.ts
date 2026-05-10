import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.costing.ts' });

/**
 * Inventory Costing Methods — طرق تسعير المخزون
 * يدعم: المتوسط المرجح (Weighted Average) | FIFO | LIFO
 */

export interface CostBatch {
  id: number;
  quantity: number;
  unitCost: number;
  date: Date | string;
}

export type CostingMethod = 'average' | 'fifo' | 'lifo';

/**
 * حساب تكلفة الوحدة بالمتوسط المرجح
 */
export function averageCost(batches: CostBatch[]): number {
  const totalQty = batches.reduce((sum: any, b: any) => sum + b.quantity, 0);
  if (totalQty === 0) return 0;
  const totalCost = batches.reduce((sum: any, b: any) => sum + b.quantity * b.unitCost, 0);
  return totalCost / totalQty;
}

/**
 * حساب تكلفة البيع بطريقة FIFO (الأول دخولاً أول خروجاً)
 * يرجع: تكلفة البيع الإجمالية + الدفعات المتبقية بعد البيع
 */
export function fifoCost(batches: CostBatch[], sellQuantity: number): {
  totalCost: number;
  unitCost: number;
  remainingBatches: CostBatch[];
  consumedBatches: { batchId: number; quantity: number; cost: number }[];
} {
  // ترتيب حسب التاريخ (الأقدم أولاً)
  const sorted = [...batches].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let remaining = sellQuantity;
  let totalCost = 0;
  const consumed: { batchId: number; quantity: number; cost: number }[] = [];
  const leftover: CostBatch[] = [];

  for (const batch of sorted) {
    if (remaining <= 0) {
      leftover.push({ ...batch });
      continue;
    }

    const take = Math.min(batch.quantity, remaining);
    totalCost += take * batch.unitCost;
    remaining -= take;

    consumed.push({
      batchId: batch.id,
      quantity: take,
      cost: take * batch.unitCost,
    });

    if (batch.quantity > take) {
      leftover.push({
        ...batch,
        quantity: batch.quantity - take,
      });
    }
  }

  return {
    totalCost,
    unitCost: sellQuantity > 0 ? totalCost / sellQuantity : 0,
    remainingBatches: leftover,
    consumedBatches: consumed,
  };
}

/**
 * حساب تكلفة البيع بطريقة LIFO (الأخير دخولاً أول خروجاً)
 */
export function lifoCost(batches: CostBatch[], sellQuantity: number): {
  totalCost: number;
  unitCost: number;
  remainingBatches: CostBatch[];
  consumedBatches: { batchId: number; quantity: number; cost: number }[];
} {
  // ترتيب حسب التاريخ (الأحدث أولاً)
  const sorted = [...batches].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let remaining = sellQuantity;
  let totalCost = 0;
  const consumed: { batchId: number; quantity: number; cost: number }[] = [];
  const leftover: CostBatch[] = [];

  for (const batch of sorted) {
    if (remaining <= 0) {
      leftover.push({ ...batch });
      continue;
    }

    const take = Math.min(batch.quantity, remaining);
    totalCost += take * batch.unitCost;
    remaining -= take;

    consumed.push({
      batchId: batch.id,
      quantity: take,
      cost: take * batch.unitCost,
    });

    if (batch.quantity > take) {
      leftover.push({
        ...batch,
        quantity: batch.quantity - take,
      });
    }
  }

  return {
    totalCost,
    unitCost: sellQuantity > 0 ? totalCost / sellQuantity : 0,
    remainingBatches: leftover,
    consumedBatches: consumed,
  };
}

/**
 * حساب التكلفة بالطريقة المحددة
 */
export function calculateCost(
  method: CostingMethod,
  batches: CostBatch[],
  sellQuantity: number
): { totalCost: number; unitCost: number } {
  switch (method) {
    case 'fifo': {
      const result = fifoCost(batches, sellQuantity);
      return { totalCost: result.totalCost, unitCost: result.unitCost };
    }
    case 'lifo': {
      const result = lifoCost(batches, sellQuantity);
      return { totalCost: result.totalCost, unitCost: result.unitCost };
    }
    case 'average':
    default: {
      const avg = averageCost(batches);
      return { totalCost: avg * sellQuantity, unitCost: avg };
    }
  }
}
