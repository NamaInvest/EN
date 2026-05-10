/**
 * ABC/XYZ Inventory Analysis Engine (D.15)
 * Slow-Moving & Dead Stock Engine (D.16)
 * Stock Reservation Engine (D.17)
 * ══════════════════════════════════════════
 *
 * ABC: تصنيف المواد حسب قيمة الاستهلاك السنوي
 *   A = 80% من القيمة (10-20% من الأصناف) — رقابة مكثفة
 *   B = 15% من القيمة (30% من الأصناف)  — رقابة متوسطة
 *   C = 5% من القيمة (50-70% من الأصناف) — رقابة بسيطة
 *
 * XYZ: تصنيف المواد حسب انتظام الطلب (CV = معامل الاختلاف)
 *   X = CV < 0.5  — طلب منتظم — يمكن التنبؤ
 *   Y = 0.5 ≤ CV < 1.0 — طلب متذبذب نسبياً
 *   Z = CV ≥ 1.0 — طلب غير منتظم — صعب التنبؤ
 *
 * Slow/Dead: حركة أقل من threshold معين خلال آخر N يوم
 *
 * Reservation: حجز الكميات لأوامر البيع/الإنتاج قبل الشحن
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'inventory-analytics' });

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type ABCClass = 'A' | 'B' | 'C';
export type XYZClass = 'X' | 'Y' | 'Z';

export interface ABCXYZItem {
  productId: number;
  productName: string;
  sku: string;
  annualUsageValue: number;
  annualUsageQty: number;
  avgUnitCost: number;
  cumulativeValuePct: number;
  abcClass: ABCClass;
  demandCV: number;         // Coefficient of Variation
  xyzClass: XYZClass;
  combinedClass: string;    // e.g., 'AX', 'BZ', 'CY'
  currentStock: number;
  reorderPoint: number;
}

export interface SlowMovingItem {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  stockValue: number;
  lastMovementDate: Date | null;
  daysSinceLastMovement: number;
  category: 'SLOW_MOVING' | 'DEAD_STOCK' | 'OBSOLETE';
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
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// ABC/XYZ Analysis Engine
// ═══════════════════════════════════════════════════════════════

export class ABCXYZEngine {

  /**
   * Full ABC/XYZ analysis for all active products
   * @param monthsBack — كم شهراً للتحليل (default: 12)
   */
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

    // 1. Get all movements (sales + production issues)
    const movements = await prisma.stockMovement.findMany({
      where: {
        date: { gte: cutoff },
        type: { in: ['SALE', 'PRODUCTION_ISSUE', 'TRANSFER_OUT'] },
      },
      select: {
        productId: true,
        quantity: true,
        unitCost: true,
        date: true,
      },
      orderBy: { productId: 'asc' },
    }).catch(() => [] as any[]);

    // 2. Group by product and calculate annual usage value
    const productMap = new Map<number, {
      totalValue: number;
      totalQty: number;
      monthlyCounts: Map<string, number>; // month → qty
    }>();

    for (const m of movements) {
      if (!m.productId) continue;
      if (!productMap.has(m.productId)) {
        productMap.set(m.productId, {
          totalValue: 0, totalQty: 0,
          monthlyCounts: new Map(),
        });
      }
      const entry = productMap.get(m.productId)!;
      const qty = Math.abs(Number(m.quantity) || 0);
      const val = qty * Number(m.unitCost || 0);
      entry.totalValue += val;
      entry.totalQty += qty;

      const monthKey = new Date(m.date).toISOString().slice(0, 7);
      entry.monthlyCounts.set(monthKey, (entry.monthlyCounts.get(monthKey) || 0) + qty);
    }

    // 3. Fetch product details
    const productIds = Array.from(productMap.keys());
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true, sku: true, quantity: true, costPrice: true },
    }).catch(() => [] as any[]);

    const productInfo = new Map(products.map((p: any) => [p.id, p]));

    // 4. Calculate annual usage (annualize if < 12 months of data)
    const annualizationFactor = 12 / monthsBack;

    const items: Array<ABCXYZItem & { _value: number }> = [];
    let totalValue = 0;

    for (const [productId, data] of productMap) {
      const info = productInfo.get(productId);
      if (!info) continue;

      const annualValue = data.totalValue * annualizationFactor;
      const annualQty   = data.totalQty   * annualizationFactor;
      totalValue += annualValue;

      // XYZ: Calculate coefficient of variation of monthly demand
      const monthlyQtys = Array.from(data.monthlyCounts.values());
      const mean = monthlyQtys.length > 0
        ? monthlyQtys.reduce((a, b) => a + b, 0) / monthlyQtys.length
        : 0;
      const variance = monthlyQtys.length > 1
        ? monthlyQtys.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / (monthlyQtys.length - 1)
        : 0;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 99;

      const xyzClass: XYZClass = cv < 0.5 ? 'X' : cv < 1.0 ? 'Y' : 'Z';

      items.push({
        productId,
        productName: info.name || `Product ${productId}`,
        sku: info.sku || '',
        annualUsageValue: Math.round(annualValue * 100) / 100,
        annualUsageQty: Math.round(annualQty * 10) / 10,
        avgUnitCost: annualQty > 0 ? Math.round((annualValue / annualQty) * 100) / 100 : Number(info.costPrice || 0),
        cumulativeValuePct: 0, // calculated below
        abcClass: 'C', // calculated below
        demandCV: Math.round(cv * 10000) / 10000,
        xyzClass,
        combinedClass: '',
        currentStock: Number(info.quantity || 0),
        reorderPoint: 0,
        _value: annualValue,
      });
    }

    // 5. Sort by annual value descending and assign ABC classes
    items.sort((a, b) => b._value - a._value);

    let cumulative = 0;
    for (const item of items) {
      cumulative += item.annualUsageValue;
      item.cumulativeValuePct = totalValue > 0
        ? Math.round((cumulative / totalValue) * 10000) / 100
        : 0;
      item.abcClass = item.cumulativeValuePct <= 80 ? 'A'
                    : item.cumulativeValuePct <= 95 ? 'B' : 'C';
      item.combinedClass = item.abcClass + item.xyzClass;
    }

    // 6. Summary
    const summary = {
      totalItems: items.length,
      aItems: items.filter(i => i.abcClass === 'A').length,
      bItems: items.filter(i => i.abcClass === 'B').length,
      cItems: items.filter(i => i.abcClass === 'C').length,
      xItems: items.filter(i => i.xyzClass === 'X').length,
      yItems: items.filter(i => i.xyzClass === 'Y').length,
      zItems: items.filter(i => i.xyzClass === 'Z').length,
      totalAnnualValue: Math.round(totalValue * 100) / 100,
    };

    // Strip internal _value field
    const cleanItems = items.map(({ _value, ...rest }) => rest);

    log.info('ABC/XYZ analysis complete', summary);
    return { items: cleanItems, summary };
  }
}

// ═══════════════════════════════════════════════════════════════
// Slow-Moving / Dead Stock Engine
// ═══════════════════════════════════════════════════════════════

export class SlowMovingEngine {

  /**
   * تحديد الأصناف الراكدة والميتة
   * @param slowDays  — أكثر من X يوم بدون حركة → راكد (default: 90)
   * @param deadDays  — أكثر من X يوم بدون حركة → ميت (default: 180)
   */
  static async analyze(slowDays = 90, deadDays = 180): Promise<{
    slowMoving: SlowMovingItem[];
    deadStock: SlowMovingItem[];
    summary: {
      slowCount: number; slowValue: number;
      deadCount: number; deadValue: number;
      totalAtRiskValue: number;
    };
  }> {
    const now = new Date();

    // Get all products with stock > 0
    const products = await prisma.product.findMany({
      where: { quantity: { gt: 0 }, active: true },
      select: { id: true, name: true, sku: true, quantity: true, costPrice: true },
    }).catch(() => [] as any[]);

    const productIds = products.map((p: any) => p.id);

    // Get last movement date per product
    const lastMovements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      _max: { date: true },
      where: { productId: { in: productIds } },
    }).catch(() => [] as any[]);

    const lastMovementMap = new Map(
      lastMovements.map((m: any) => [m.productId, m._max?.date ? new Date(m._max.date) : null])
    );

    const slowMoving: SlowMovingItem[] = [];
    const deadStock: SlowMovingItem[] = [];

    for (const product of products as any[]) {
      const lastDate = lastMovementMap.get(product.id) || null;
      const daysSince = lastDate
        ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 9999;

      if (daysSince < slowDays) continue; // Active product

      const stockValue = Number(product.quantity || 0) * Number(product.costPrice || 0);
      const isDead = daysSince >= deadDays;

      const item: SlowMovingItem = {
        productId: product.id,
        productName: product.name || `Product ${product.id}`,
        sku: product.sku || '',
        currentStock: Number(product.quantity || 0),
        stockValue: Math.round(stockValue * 100) / 100,
        lastMovementDate: lastDate,
        daysSinceLastMovement: daysSince === 9999 ? -1 : daysSince,
        category: isDead ? 'DEAD_STOCK' : 'SLOW_MOVING',
        recommendedAction: isDead
          ? 'مراجعة للإلغاء من الجرد أو البيع بسعر مخفض'
          : daysSince > deadDays * 1.5
          ? 'تصفية فورية — احتمال تلف أو انتهاء الصلاحية'
          : 'مراجعة مستوى المخزون وتعليق أوامر الشراء',
      };

      if (isDead) deadStock.push(item);
      else slowMoving.push(item);
    }

    // Sort by value descending
    slowMoving.sort((a, b) => b.stockValue - a.stockValue);
    deadStock.sort((a, b) => b.stockValue - a.stockValue);

    const slowValue = slowMoving.reduce((s, i) => s + i.stockValue, 0);
    const deadValue = deadStock.reduce((s, i) => s + i.stockValue, 0);

    return {
      slowMoving,
      deadStock,
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
// ═══════════════════════════════════════════════════════════════

export class StockReservationEngine {

  /**
   * حجز كمية لأمر محدد
   * يتحقق من توفر المخزون أولاً (Available = OnHand - Reserved)
   */
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
      // 1. Get current stock in warehouse
      const stock = await (tx as any).warehouseStock.findFirst({
        where: { productId, warehouseId },
        select: { quantity: true },
      }).catch(() => null);

      const onHand = Number(stock?.quantity || 0);

      // 2. Get already reserved quantity
      const reserved = await (tx as any).stockReservation.aggregate({
        _sum: { quantity: true },
        where: {
          productId,
          warehouseId,
          status: 'ACTIVE',
        },
      }).catch(() => ({ _sum: { quantity: 0 } }));

      const alreadyReserved = Number(reserved._sum?.quantity || 0);
      const available = onHand - alreadyReserved;

      if (available < quantity) {
        return {
          success: false,
          available,
          message: `الكمية المتاحة (${available}) أقل من المطلوب (${quantity})`,
        };
      }

      // 3. Create reservation
      const reservation = await (tx as any).stockReservation.create({
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
      });

      log.info(`Stock reserved: ${quantity} units of product ${productId} for ${params.referenceType}#${params.referenceId}`);

      return { success: true, reservationId: reservation.id, available: available - quantity, message: 'تم الحجز بنجاح' };
    });
  }

  /**
   * إلغاء الحجز
   */
  static async cancel(reservationId: number, reason?: string): Promise<void> {
    await (prisma as any).stockReservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() },
    }).catch(() => {
      log.warn(`Could not cancel reservation ${reservationId} — model may not exist`);
    });
  }

  /**
   * تحويل الحجز إلى صرف فعلي (عند الشحن)
   */
  static async fulfill(reservationId: number): Promise<void> {
    await (prisma as any).stockReservation.update({
      where: { id: reservationId },
      data: { status: 'FULFILLED', fulfilledAt: new Date() },
    }).catch(() => {
      log.warn(`Could not fulfill reservation ${reservationId}`);
    });
  }

  /**
   * الكمية المتاحة الفعلية (OnHand - Reserved)
   */
  static async getAvailable(productId: number, warehouseId: number): Promise<{
    onHand: number;
    reserved: number;
    available: number;
  }> {
    const [stock, reservedAgg] = await Promise.all([
      (prisma as any).warehouseStock.findFirst({
        where: { productId, warehouseId },
        select: { quantity: true },
      }).catch(() => null),
      (prisma as any).stockReservation.aggregate({
        _sum: { quantity: true },
        where: { productId, warehouseId, status: 'ACTIVE' },
      }).catch(() => ({ _sum: { quantity: 0 } })),
    ]);

    const onHand   = Number(stock?.quantity || 0);
    const reserved = Number(reservedAgg._sum?.quantity || 0);

    return {
      onHand,
      reserved,
      available: Math.max(0, onHand - reserved),
    };
  }

  /**
   * تنظيف الحجوزات المنتهية الصلاحية (للـ cron)
   */
  static async expireOld(): Promise<number> {
    const result = await (prisma as any).stockReservation.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    }).catch(() => ({ count: 0 }));

    if (result.count > 0) {
      log.info(`Expired ${result.count} stock reservations`);
    }
    return result.count;
  }
}
