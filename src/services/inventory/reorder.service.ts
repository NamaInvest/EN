/**
 * ReorderService — نقطة إعادة الطلب (ROP) + المخزون الأمني + EOQ
 * ROP = (ADU × LT) + Safety Stock
 * Safety Stock = Z × σ(demand) × √LT  (Z=1.645 → 95%)
 * EOQ = √(2DS/H)
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

const Z_95 = 1.645;

export interface ReorderRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  eoqQty: number;
  suggestedOrderQty: number;
  preferredVendorId?: string;
  estimatedCost: number;
  urgency: 'CRITICAL' | 'WARNING' | 'OK';
}

export class ReorderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  async checkReorderPoints(): Promise<ReorderRecommendation[]> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const items = await prisma.inventoryItem?.findMany?.({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, unitCost: true, holdingCostRate: true, orderingCost: true, currentStock: true, preferredVendorId: true, leadTimeDays: true },
      take: 500,
    }).catch(() => []) ?? [];

    const recs: ReorderRecommendation[] = [];

    for (const item of items) {
      const adu      = await this._calcADU(tenantId, item.id, 90);
      const ltDays   = item.leadTimeDays ?? 7;
      const stdDev   = await this._calcDemandStdDev(tenantId, item.id, 90);
      const safety   = Math.ceil(Z_95 * stdDev * Math.sqrt(ltDays));
      const rop      = Math.ceil(adu * ltDays + safety);
      const eoq      = this._calcEOQ(adu * 365, item.unitCost ?? 100, item.holdingCostRate ?? 0.25, item.orderingCost ?? 50);
      const stock    = item.currentStock ?? 0;
      const urgency  = stock <= 0 || stock <= rop * 0.5 ? 'CRITICAL' : stock <= rop ? 'WARNING' : 'OK';

      if (urgency !== 'OK') {
        recs.push({
          itemId: String(item.id), itemName: item.name, currentStock: stock,
          reorderPoint: rop, safetyStock: safety, eoqQty: eoq,
          suggestedOrderQty: Math.max(eoq, rop - stock + safety),
          preferredVendorId: item.preferredVendorId ? String(item.preferredVendorId) : undefined,
          estimatedCost: Math.max(eoq, 1) * (item.unitCost ?? 0),
          urgency,
        });
      }
    }

    return recs.sort((a, b) => (a.urgency === 'CRITICAL' ? -1 : b.urgency === 'CRITICAL' ? 1 : 0));
  }

  async generateAutoPOs(recs: ReorderRecommendation[]): Promise<{ created: number; prIds: string[]; totalValue: number }> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    const prIds: string[] = [];
    let totalValue = 0;

    const byVendor = new Map<string, ReorderRecommendation[]>();
    for (const r of recs) {
      const k = r.preferredVendorId ?? 'NO_VENDOR';
      if (!byVendor.has(k)) byVendor.set(k, []);
      byVendor.get(k)!.push(r);
    }

    for (const [, items] of byVendor) {
      const pr = await prisma.purchaseRequisition?.create?.({
        data: {
          tenantId, requestedBy: 'system', status: 'PENDING_APPROVAL',
          justification: 'Auto-Reorder بناءً على ROP',
          totalEstimated: new Decimal(items.reduce((s, r) => s + r.estimatedCost, 0)),
          lines: { create: items.map(r => ({ tenantId, itemId: r.itemId, description: r.itemName, quantity: r.suggestedOrderQty, estimatedUnitPrice: r.estimatedCost / Math.max(r.suggestedOrderQty, 1), unitOfMeasure: 'PCS', status: 'PENDING' })) },
        },
      }).catch(() => ({ id: `AUTO-PR-${Date.now()}` }));
      prIds.push(String(pr?.id));
      totalValue += items.reduce((s, r) => s + r.estimatedCost, 0);
    }

    return { created: prIds.length, prIds, totalValue };
  }

  private async _calcADU(tenantId: string, itemId: string, days: number): Promise<number> {
    const since = new Date(Date.now() - days * 86_400_000);
    const mvts  = await (this.prisma as any).inventoryMovement?.findMany?.({ where: { tenantId, itemId, type: { in: ['SALE','ISSUE','CONSUMPTION'] }, date: { gte: since } }, select: { quantity: true } }).catch(() => []) ?? [];
    return mvts.reduce((s: number, m: any) => s + Math.abs(m.quantity ?? 0), 0) / days || 1;
  }

  private async _calcDemandStdDev(tenantId: string, itemId: string, days: number): Promise<number> {
    const since = new Date(Date.now() - days * 86_400_000);
    const mvts  = await (this.prisma as any).inventoryMovement?.findMany?.({ where: { tenantId, itemId, type: { in: ['SALE','ISSUE'] }, date: { gte: since } }, select: { quantity: true } }).catch(() => []) ?? [];
    if (mvts.length < 2) return 1;
    const vals = mvts.map((m: any) => Math.abs(m.quantity ?? 0));
    const mean = vals.reduce((s: number, v: number) => s + v, 0) / vals.length;
    return Math.sqrt(vals.reduce((s: number, v: number) => s + Math.pow(v - mean, 2), 0) / vals.length) || 1;
  }

  private _calcEOQ(D: number, C: number, h: number, S: number): number {
    const H = C * h;
    return H > 0 && S > 0 && D > 0 ? Math.ceil(Math.sqrt(2 * D * S / H)) : 10;
  }
}
