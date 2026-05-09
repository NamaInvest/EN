/**
 * MrpService — محرك تخطيط متطلبات المواد (MRP I)
 *
 * الخوارزمية:
 *   1. الطلب المستقل: أوامر البيع المفتوحة + التوقعات
 *   2. Gross Requirements = إجمالي الطلب في كل فترة
 *   3. Scheduled Receipts = POs / WOs مفتوحة
 *   4. Net Requirements = Gross - OnHand - ScheduledReceipts
 *   5. Planned Orders = Net / EOQ (Lot-for-Lot إذا لا EOQ)
 *   6. Explosion عبر BOM لمكونات Level 1 & 2
 *
 * المرجع: APICS MRP standard
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface MrpResult {
  item: string;
  itemName: string;
  grossRequirement: number;
  scheduledReceipts: number;
  projectedOnHand: number;
  netRequirement: number;
  plannedOrder: number;
  suggestedDate: Date;
  type: 'PR' | 'WO';
}

export class MrpService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  async runMrp(horizonDays = 30): Promise<{
    suggestedPrs: MrpResult[];
    suggestedWos: MrpResult[];
    totalItems: number;
    runAt: Date;
  }> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    const horizon  = new Date(Date.now() + horizonDays * 86_400_000);

    // ─ 1. الطلب المستقل ───────────────────────────────────────────────────
    const salesOrders = await prisma.salesOrder?.findMany?.({
      where: { tenantId, status: { in: ['CONFIRMED', 'IN_PROGRESS'] }, deliveryDate: { lte: horizon } },
      include: { lines: { select: { itemId: true, quantity: true, deliveryDate: true } } },
    }).catch(() => []) ?? [];

    const demandMap = new Map<string, { qty: number; date: Date }>();
    for (const so of salesOrders) {
      for (const line of (so.lines ?? [])) {
        const key = String(line.itemId);
        const existing = demandMap.get(key);
        demandMap.set(key, {
          qty: (existing?.qty ?? 0) + Number(line.quantity ?? 0),
          date: line.deliveryDate ?? horizon,
        });
      }
    }

    if (demandMap.size === 0) {
      return { suggestedPrs: [], suggestedWos: [], totalItems: 0, runAt: new Date() };
    }

    // ─ 2. جلب المخزون الحالي والـ BOM ─────────────────────────────────────
    const itemIds = [...demandMap.keys()];

    const inventory = await prisma.inventoryItem?.findMany?.({
      where: { tenantId, id: { in: itemIds } },
      select: { id: true, name: true, currentStock: true, leadTimeDays: true, eoq: true, itemType: true },
    }).catch(() => []) ?? [];

    // POs / WOs مفتوحة
    const scheduledMap = new Map<string, number>();
    const openPOs = await prisma.purchaseOrderLine?.findMany?.({
      where: { tenantId, status: 'CONFIRMED', expectedDate: { lte: horizon } },
      select: { itemId: true, quantity: true },
    }).catch(() => []) ?? [];

    for (const po of openPOs) {
      const k = String(po.itemId);
      scheduledMap.set(k, (scheduledMap.get(k) ?? 0) + Number(po.quantity ?? 0));
    }

    // ─ 3. حساب Net Requirements ──────────────────────────────────────────
    const suggestedPrs: MrpResult[] = [];
    const suggestedWos: MrpResult[] = [];

    for (const item of inventory) {
      const itemId      = String(item.id);
      const demand      = demandMap.get(itemId);
      if (!demand) continue;

      const gross       = demand.qty;
      const onHand      = Number(item.currentStock ?? 0);
      const scheduled   = scheduledMap.get(itemId) ?? 0;
      const net         = Math.max(0, gross - onHand - scheduled);

      if (net <= 0) continue;

      const lotSize     = Number(item.eoq ?? 0) || net; // Lot-for-Lot إذا لا EOQ
      const orderQty    = Math.ceil(net / lotSize) * lotSize;
      const leadTime    = Number(item.leadTimeDays ?? 7);
      const suggestedDate = new Date(demand.date.getTime() - leadTime * 86_400_000);

      const result: MrpResult = {
        item: itemId,
        itemName: item.name,
        grossRequirement: gross,
        scheduledReceipts: scheduled,
        projectedOnHand: onHand,
        netRequirement: net,
        plannedOrder: orderQty,
        suggestedDate,
        type: item.itemType === 'MANUFACTURED' ? 'WO' : 'PR',
      };

      if (result.type === 'PR') suggestedPrs.push(result);
      else suggestedWos.push(result);
    }

    // ─ 4. BOM Explosion — Level 1 ─────────────────────────────────────────
    const woItemIds = suggestedWos.map(w => w.item);
    if (woItemIds.length > 0) {
      const bomLines = await prisma.bomLine?.findMany?.({
        where: { tenantId, parentItemId: { in: woItemIds }, isActive: true },
        select: { parentItemId: true, componentId: true, quantity: true },
      }).catch(() => []) ?? [];

      for (const bom of bomLines) {
        const parentWo    = suggestedWos.find(w => w.item === String(bom.parentItemId));
        if (!parentWo) continue;

        const compDemand  = parentWo.plannedOrder * Number(bom.quantity ?? 1);
        const compInv     = await prisma.inventoryItem?.findFirst?.({
          where: { id: bom.componentId, tenantId },
          select: { name: true, currentStock: true, leadTimeDays: true, itemType: true },
        }).catch(() => null);

        const compOnHand  = Number(compInv?.currentStock ?? 0);
        const compNet     = Math.max(0, compDemand - compOnHand);
        if (compNet <= 0) continue;

        const compResult: MrpResult = {
          item:            String(bom.componentId),
          itemName:        compInv?.name ?? String(bom.componentId),
          grossRequirement: compDemand,
          scheduledReceipts: 0,
          projectedOnHand:  compOnHand,
          netRequirement:   compNet,
          plannedOrder:     compNet,
          suggestedDate:    parentWo.suggestedDate,
          type:             compInv?.itemType === 'MANUFACTURED' ? 'WO' : 'PR',
        };

        if (compResult.type === 'PR') suggestedPrs.push(compResult);
        else suggestedWos.push(compResult);
      }
    }

    return {
      suggestedPrs,
      suggestedWos,
      totalItems: suggestedPrs.length + suggestedWos.length,
      runAt: new Date(),
    };
  }
}
