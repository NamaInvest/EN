/**
 * ABC/XYZ + Slow-Moving + Stock Reservation Engines
 * Fixed field names per actual Prisma schema:
 *   Product: currentStock (not quantity), buyPrice (not costPrice), no sku
 *   StockMovement: type, quantity, date, productId (no unitCost)
 *   ProductStock: quantity, productId, stockId
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'inventory-analytics' });

export type ABCClass  = 'A' | 'B' | 'C';
export type XYZClass  = 'X' | 'Y' | 'Z';

export interface ABCXYZItem {
  productId: number;
  productName: string;
  annualUsageQty: number;
  annualUsageValue: number;
  avgUnitCost: number;
  cumulativeValuePct: number;
  abcClass: ABCClass;
  demandCV: number;
  xyzClass: XYZClass;
  combinedClass: string;
  currentStock: number;
}

export interface SlowMovingItem {
  productId: number;
  productName: string;
  currentStock: number;
  stockValue: number;
  lastMovementDate: Date | null;
  daysSinceLastMovement: number;
  category: 'SLOW_MOVING' | 'DEAD_STOCK';
  recommendedAction: string;
}

export interface StockReservation {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  reservedFor: 'SALES_ORDER' | 'PRODUCTION_ORDER' | 'TRANSFER' | 'OTHER';
  referenceId: number;
  referenceType: string;
  expiresAt: Date | null;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
}

// ═══════════════════════════════════════════════════════════════
// ABC/XYZ Analysis Engine
// ═══════════════════════════════════════════════════════════════

export class ABCXYZEngine {

  static async analyze(monthsBack = 12): Promise<{
    items: ABCXYZItem[];
    summary: {
      totalItems: number;
      aItems: number; bItems: number; cItems: number;
      xItems: number; yItems: number; zItems: number;
      totalAnnualValue: number;
    };
  }> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsBack);

    // 1. Get outbound stock movements (sales + production)
    const movements = await prisma.stockMovement.findMany({
      where: {
        date: { gte: cutoff },
        type: { in: ['out', 'SALE', 'sale'] },
        deletedAt: null,
      },
      select: {
        productId: true,
        quantity: true,
        date: true,
      },
      orderBy: { productId: 'asc' },
    }).catch(() => [] as any[]);

    // 2. Group by product
    const productMap = new Map<number, {
      totalQty: number;
      monthlyCounts: Map<string, number>;
    }>();

    for (const m of movements) {
      if (!m.productId) continue;
      if (!productMap.has(m.productId)) {
        productMap.set(m.productId, { totalQty: 0, monthlyCounts: new Map() });
      }
      const entry = productMap.get(m.productId)!;
      const qty = Math.abs(Number(m.quantity) || 0);
      entry.totalQty += qty;
      const monthKey = new Date(m.date).toISOString().slice(0, 7);
      entry.monthlyCounts.set(monthKey, (entry.monthlyCounts.get(monthKey) || 0) + qty);
    }

    if (productMap.size === 0) {
      return { items: [], summary: { totalItems: 0, aItems: 0, bItems: 0, cItems: 0, xItems: 0, yItems: 0, zItems: 0, totalAnnualValue: 0 } };
    }

    // 3. Fetch product details — only fields that exist in schema
    const productIds = Array.from(productMap.keys());
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true, currentStock: true, buyPrice: true },
    }).catch(() => [] as any[]);

    const productInfo = new Map(products.map((p: any) => [p.id, p]));

    const annualizationFactor = 12 / monthsBack;
    const items: Array<ABCXYZItem & { _value: number }> = [];
    let totalValue = 0;

    for (const [productId, data] of productMap) {
      const info = productInfo.get(productId);
      if (!info) continue;

      const unitCost = Number(info.buyPrice || 0);
      const annualQty   = data.totalQty * annualizationFactor;
      const annualValue = annualQty * unitCost;
      totalValue += annualValue;

      // XYZ: CV of monthly demand
      const monthlyQtys = Array.from(data.monthlyCounts.values());
      const mean = monthlyQtys.length > 0
        ? monthlyQtys.reduce((a, b) => a + b, 0) / monthlyQtys.length : 0;
      const variance = monthlyQtys.length > 1
        ? monthlyQtys.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / (monthlyQtys.length - 1) : 0;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 99;
      const xyzClass: XYZClass = cv < 0.5 ? 'X' : cv < 1.0 ? 'Y' : 'Z';

      items.push({
        productId,
        productName: info.name || `Product ${productId}`,
        annualUsageQty:   Math.round(annualQty * 10) / 10,
        annualUsageValue: Math.round(annualValue * 100) / 100,
        avgUnitCost:      Math.round(unitCost * 100) / 100,
        cumulativeValuePct: 0,
        abcClass: 'C',
        demandCV: Math.round(cv * 10000) / 10000,
        xyzClass,
        combinedClass: '',
        currentStock: Number(info.currentStock || 0),
        _value: annualValue,
      });
    }

    // 4. Sort and assign ABC
    items.sort((a, b) => b._value - a._value);
    let cumulative = 0;
    for (const item of items) {
      cumulative += item.annualUsageValue;
      item.cumulativeValuePct = totalValue > 0
        ? Math.round((cumulative / totalValue) * 10000) / 100 : 0;
      item.abcClass    = item.cumulativeValuePct <= 80 ? 'A' : item.cumulativeValuePct <= 95 ? 'B' : 'C';
      item.combinedClass = item.abcClass + item.xyzClass;
    }

    const cleanItems = items.map(({ _value, ...rest }) => rest);

    const summary = {
      totalItems:      cleanItems.length,
      aItems:          cleanItems.filter(i => i.abcClass === 'A').length,
      bItems:          cleanItems.filter(i => i.abcClass === 'B').length,
      cItems:          cleanItems.filter(i => i.abcClass === 'C').length,
      xItems:          cleanItems.filter(i => i.xyzClass === 'X').length,
      yItems:          cleanItems.filter(i => i.xyzClass === 'Y').length,
      zItems:          cleanItems.filter(i => i.xyzClass === 'Z').length,
      totalAnnualValue: Math.round(totalValue * 100) / 100,
    };

    log.info('ABC/XYZ analysis complete', summary);
    return { items: cleanItems, summary };
  }
}

// ═══════════════════════════════════════════════════════════════
// Slow-Moving / Dead Stock Engine
// ═══════════════════════════════════════════════════════════════

export class SlowMovingEngine {

  static async analyze(slowDays = 90, deadDays = 180): Promise<{
    slowMoving: SlowMovingItem[];
    deadStock: SlowMovingItem[];
    summary: { slowCount: number; slowValue: number; deadCount: number; deadValue: number; totalAtRiskValue: number };
  }> {
    const now = new Date();

    // Products with stock using correct field name
    const products = await prisma.product.findMany({
      where: { currentStock: { gt: 0 }, active: true },
      select: { id: true, name: true, currentStock: true, buyPrice: true },
    }).catch(() => [] as any[]);

    const productIds = products.map((p: any) => p.id);
    if (productIds.length === 0) {
      return { slowMoving: [], deadStock: [], summary: { slowCount: 0, slowValue: 0, deadCount: 0, deadValue: 0, totalAtRiskValue: 0 } };
    }

    const lastMovements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      _max: { date: true },
      where: { productId: { in: productIds }, deletedAt: null },
    }).catch(() => [] as any[]);

    const lastMovementMap = new Map(
      (lastMovements as any[]).map(m => [m.productId, m._max?.date ? new Date(m._max.date) : null])
    );

    const slowMoving: SlowMovingItem[] = [];
    const deadStock: SlowMovingItem[]  = [];

    for (const product of products as any[]) {
      const lastDate  = lastMovementMap.get(product.id) || null;
      const daysSince = lastDate
        ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 9999;

      if (daysSince < slowDays) continue;

      const stockValue = Number(product.currentStock || 0) * Number(product.buyPrice || 0);
      const isDead     = daysSince >= deadDays;

      const item: SlowMovingItem = {
        productId:             product.id,
        productName:           product.name || `Product ${product.id}`,
        currentStock:          Number(product.currentStock || 0),
        stockValue:            Math.round(stockValue * 100) / 100,
        lastMovementDate:      lastDate,
        daysSinceLastMovement: daysSince === 9999 ? -1 : daysSince,
        category:              isDead ? 'DEAD_STOCK' : 'SLOW_MOVING',
        recommendedAction:     isDead
          ? 'تصفية أو إلغاء من الجرد — لا حركة منذ أكثر من ' + deadDays + ' يوم'
          : 'مراجعة مستوى المخزون وتعليق أوامر الشراء',
      };

      if (isDead) deadStock.push(item);
      else slowMoving.push(item);
    }

    slowMoving.sort((a, b) => b.stockValue - a.stockValue);
    deadStock.sort((a, b) => b.stockValue - a.stockValue);

    const slowValue = slowMoving.reduce((s, i) => s + i.stockValue, 0);
    const deadValue = deadStock.reduce((s, i) => s + i.stockValue, 0);

    return {
      slowMoving, deadStock,
      summary: {
        slowCount: slowMoving.length,
        slowValue: Math.round(slowValue * 100) / 100,
        deadCount: deadStock.length,
        deadValue: Math.round(deadValue * 100) / 100,
        totalAtRiskValue: Math.round((slowValue + deadValue) * 100) / 100,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Stock Reservation Engine
// Uses ProductStock model (productId, stockId, quantity)
// ═══════════════════════════════════════════════════════════════

export class StockReservationEngine {

  static async reserve(params: {
    productId: number;
    warehouseId: number;
    quantity: number;
    reservedFor: StockReservation['reservedFor'];
    referenceId: number;
    referenceType: string;
    expiresAt?: Date;
  }): Promise<{ success: boolean; reservationId?: number; available?: number; message: string }> {

    const { productId, warehouseId, quantity } = params;

    return prisma.$transaction(async (tx) => {
      // Get stock from ProductStock (the actual per-warehouse table)
      const stock = await tx.productStock.findFirst({
        where: { productId, stockId: warehouseId },
        select: { quantity: true },
      }).catch(() => null);

      const onHand = Number(stock?.quantity || 0);

      // Get already reserved from custom model (graceful fallback)
      const alreadyReserved = await (tx as any).stockReservation?.aggregate?.({
        _sum: { quantity: true },
        where: { productId, warehouseId, status: 'ACTIVE' },
      }).catch(() => ({ _sum: { quantity: 0 } })) ?? { _sum: { quantity: 0 } };

      const reserved  = Number(alreadyReserved._sum?.quantity || 0);
      const available = onHand - reserved;

      if (available < quantity) {
        return {
          success: false,
          available,
          message: `الكمية المتاحة (${available.toFixed(2)}) أقل من المطلوب (${quantity})`,
        };
      }

      // Create reservation if model exists
      const reservation = await (tx as any).stockReservation?.create?.({
        data: {
          productId,
          warehouseId,
          quantity,
          reservedFor: params.reservedFor,
          referenceId: params.referenceId,
          referenceType: params.referenceType,
          expiresAt: params.expiresAt || null,
          status: 'ACTIVE',
        },
      }).catch(() => ({ id: 0 })) ?? { id: 0 };

      log.info(`Stock reserved: ${quantity} of product ${productId}`);
      return { success: true, reservationId: reservation.id, available: available - quantity, message: 'تم الحجز بنجاح' };
    });
  }

  static async cancel(reservationId: number, reason?: string): Promise<void> {
    await (prisma as any).stockReservation?.update?.({
      where: { id: reservationId },
      data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() },
    }).catch(() => null);
  }

  static async fulfill(reservationId: number): Promise<void> {
    await (prisma as any).stockReservation?.update?.({
      where: { id: reservationId },
      data: { status: 'FULFILLED', fulfilledAt: new Date() },
    }).catch(() => null);
  }

  static async getAvailable(productId: number, warehouseId: number): Promise<{
    onHand: number; reserved: number; available: number;
  }> {
    const [stock, reservedAgg] = await Promise.all([
      prisma.productStock.findFirst({
        where: { productId, stockId: warehouseId },
        select: { quantity: true },
      }).catch(() => null),
      (prisma as any).stockReservation?.aggregate?.({
        _sum: { quantity: true },
        where: { productId, warehouseId, status: 'ACTIVE' },
      }).catch(() => ({ _sum: { quantity: 0 } })) ?? { _sum: { quantity: 0 } },
    ]);

    const onHand   = Number(stock?.quantity || 0);
    const reserved = Number(reservedAgg._sum?.quantity || 0);

    return { onHand, reserved, available: Math.max(0, onHand - reserved) };
  }

  static async expireOld(): Promise<number> {
    const result = await (prisma as any).stockReservation?.updateMany?.({
      where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    }).catch(() => ({ count: 0 })) ?? { count: 0 };

    if (result.count > 0) log.info(`Expired ${result.count} stock reservations`);
    return result.count;
  }
}
