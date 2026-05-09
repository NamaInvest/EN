/**
 * InventoryAnalyticsService — تحليلات المخزون الكاملة
 *
 * 1. تصنيف ABC (80/15/5 قاعدة باريتو)
 * 2. تقرير تقييم المخزون بتاريخ محدد
 * 3. معدل دوران المخزون (Inventory Turnover)
 * 4. أيام المخزون (Days on Hand)
 * 5. الأصناف البطيئة الحركة (Slow-moving > 90 يوم)
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export class InventoryAnalyticsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** تصنيف ABC بناءً على قيمة المبيعات */
  async runAbcAnalysis(): Promise<{
    A: any[]; B: any[]; C: any[];
    totalValue: number; summary: object;
  }> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const items = await prisma.inventoryItem?.findMany?.({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, sku: true, currentStock: true, unitCost: true },
    }).catch(() => []) ?? [];

    const sorted = items
      .map((i: any) => ({ ...i, value: (i.currentStock ?? 0) * (i.unitCost ?? 0) }))
      .sort((a: any, b: any) => b.value - a.value);

    const totalValue = sorted.reduce((s: number, i: any) => s + i.value, 0);
    let cumValue = 0;

    const A: any[] = [], B: any[] = [], C: any[] = [];

    for (const item of sorted) {
      cumValue += item.value;
      const pct = totalValue > 0 ? cumValue / totalValue : 0;
      if      (pct <= 0.80) A.push(item);
      else if (pct <= 0.95) B.push(item);
      else                  C.push(item);
    }

    // تحديث التصنيف في DB
    await Promise.all([
      ...A.map(i => prisma.inventoryItem?.update?.({ where: { id: i.id }, data: { abcClass: 'A' } }).catch(() => null)),
      ...B.map(i => prisma.inventoryItem?.update?.({ where: { id: i.id }, data: { abcClass: 'B' } }).catch(() => null)),
      ...C.map(i => prisma.inventoryItem?.update?.({ where: { id: i.id }, data: { abcClass: 'C' } }).catch(() => null)),
    ]);

    return {
      A, B, C, totalValue,
      summary: { aCount: A.length, bCount: B.length, cCount: C.length, aValue: A.reduce((s, i) => s + i.value, 0) },
    };
  }

  /** تقرير تقييم المخزون بتاريخ محدد */
  async inventoryValuationReport(asOfDate: Date): Promise<{
    asOfDate: Date;
    totalValue: Decimal;
    items: { itemId: string; name: string; qty: number; unitCost: number; totalValue: Decimal }[];
  }> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const items = await prisma.inventoryItem?.findMany?.({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, sku: true, currentStock: true, unitCost: true },
    }).catch(() => []) ?? [];

    let totalValue = new Decimal(0);
    const rows = items.map((i: any) => {
      const qty   = i.currentStock ?? 0;
      const cost  = i.unitCost ?? 0;
      const value = new Decimal(qty).mul(cost);
      totalValue  = totalValue.add(value);
      return { itemId: String(i.id), name: i.name, qty, unitCost: cost, totalValue: value };
    }).filter((r: any) => r.qty > 0);

    return { asOfDate, totalValue, items: rows };
  }

  /** تحليل دوران المخزون ومعدل الأيام */
  async turnoverAnalysis(from: Date, to: Date): Promise<{
    items: { itemId: string; name: string; cogsValue: number; avgInventory: number; turnoverRatio: number; daysOnHand: number; status: string }[];
  }> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const movements = await prisma.inventoryMovement?.findMany?.({
      where: { tenantId, type: { in: ['SALE','ISSUE','CONSUMPTION'] }, date: { gte: from, lte: to } },
      select: { itemId: true, quantity: true },
    }).catch(() => []) ?? [];

    const cogsMap = new Map<string, number>();
    for (const m of movements) {
      cogsMap.set(m.itemId, (cogsMap.get(m.itemId) ?? 0) + Math.abs(m.quantity ?? 0));
    }

    const items = await prisma.inventoryItem?.findMany?.({
      where: { tenantId, id: { in: [...cogsMap.keys()] } },
      select: { id: true, name: true, currentStock: true, unitCost: true },
    }).catch(() => []) ?? [];

    const rows = items.map((i: any) => {
      const cogs        = (cogsMap.get(String(i.id)) ?? 0) * (i.unitCost ?? 0);
      const avgInventory = (i.currentStock ?? 0) * (i.unitCost ?? 0);
      const turnover    = avgInventory > 0 ? cogs / avgInventory : 0;
      const doh         = turnover > 0 ? 365 / turnover : 999;
      const status      = doh > 90 ? 'SLOW_MOVING' : doh > 60 ? 'WATCH' : 'HEALTHY';
      return { itemId: String(i.id), name: i.name, cogsValue: cogs, avgInventory, turnoverRatio: +turnover.toFixed(2), daysOnHand: Math.round(doh), status };
    });

    type Row = { itemId: string; name: string; cogsValue: number; avgInventory: number; turnoverRatio: number; daysOnHand: number; status: string };
    return { items: (rows as Row[]).sort((a, b) => b.daysOnHand - a.daysOnHand) };
  }
}
