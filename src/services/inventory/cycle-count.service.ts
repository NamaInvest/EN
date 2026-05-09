/**
 * CycleCountService — الجرد الدوري بأسلوب ABC
 *
 * الجدول الزمني:
 *   A (20% أصناف / 80% قيمة) → جرد شهري
 *   B (30% أصناف / 15% قيمة) → جرد ربع سنوي
 *   C (50% أصناف / 5%  قيمة) → جرد نصف سنوي
 *
 * الفرق عند التسوية:
 *   DR/CR 5200 مصروفات / 1310 مخزون (بحسب الاتجاه)
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type AbcClass = 'A' | 'B' | 'C';

export interface CountPlanItem {
  itemId: string;
  itemName: string;
  sku: string;
  abcClass: AbcClass;
  lastCountDate?: Date;
  systemQty: number;
  location: string;
}

export class CycleCountService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** تصنيف ABC وإنشاء خطة الجرد */
  async generateCountPlan(): Promise<{ planId: string; items: CountPlanItem[]; totalItems: number }> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const items = await prisma.inventoryItem?.findMany?.({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, sku: true, currentStock: true, unitCost: true, abcClass: true, locationId: true, lastCountDate: true },
      orderBy: { unitCost: 'desc' },
      take: 1000,
    }).catch(() => []) ?? [];

    // حساب ABC إذا لم تكن محددة
    const totalValue = items.reduce((s: number, i: any) => s + (i.currentStock ?? 0) * (i.unitCost ?? 0), 0);
    let cumValue = 0;

    const classified = items.map((item: any, _idx: number) => {
      const itemValue = (item.currentStock ?? 0) * (item.unitCost ?? 0);
      cumValue += itemValue;
      const pct = totalValue > 0 ? cumValue / totalValue : 0;

      const abcClass: AbcClass = item.abcClass ?? (pct <= 0.80 ? 'A' : pct <= 0.95 ? 'B' : 'C');

      // فحص ما إذا حان موعد الجرد
      const now = Date.now();
      const lastCount = item.lastCountDate ? new Date(item.lastCountDate).getTime() : 0;
      const daysSince = (now - lastCount) / 86_400_000;
      const due = abcClass === 'A' ? daysSince >= 30 : abcClass === 'B' ? daysSince >= 90 : daysSince >= 180;

      return { due, item, abcClass, daysSince };
    });

    const dueItems = classified.filter((c: { due: boolean; item: any; abcClass: AbcClass; daysSince: number }) => c.due);

    // إنشاء خطة جرد
    const plan = await prisma.cycleCountPlan?.create?.({
      data: {
        tenantId,
        status:     'PENDING',
        createdAt:  new Date(),
        totalItems: dueItems.length,
        lines: {
          create: (dueItems as { due: boolean; item: any; abcClass: AbcClass; daysSince: number }[]).map(({ item, abcClass }) => ({
            tenantId,
            itemId:     item.id,
            abcClass,
            systemQty:  item.currentStock ?? 0,
            countedQty: null,
            status:     'PENDING',
          })),
        },
      },
    }).catch(() => ({ id: `PLAN-${Date.now()}` }));

    return {
      planId: String(plan?.id),
      totalItems: dueItems.length,
      items: (dueItems as { due: boolean; item: any; abcClass: AbcClass; daysSince: number }[]).map(({ item, abcClass }) => ({
        itemId:       String(item.id),
        itemName:     item.name,
        sku:          item.sku ?? '',
        abcClass,
        lastCountDate: item.lastCountDate ? new Date(item.lastCountDate) : undefined,
        systemQty:    item.currentStock ?? 0,
        location:     item.locationId ?? 'MAIN',
      })),
    };
  }

  /** تسجيل نتائج الجرد الفعلي */
  async submitCount(planId: string, counts: { itemId: string; countedQty: number; countedBy: string }[]) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    const variances: { itemId: string; systemQty: number; countedQty: number; difference: number; jeId?: number }[] = [];

    for (const count of counts) {
      const line = await prisma.cycleCountLine?.findFirst?.({
        where: { planId, itemId: count.itemId, tenantId },
        select: { id: true, systemQty: true },
      }).catch(() => null);

      if (!line) continue;

      const systemQty   = Number(line.systemQty ?? 0);
      const countedQty  = count.countedQty;
      const difference  = countedQty - systemQty;

      if (Math.abs(difference) > 0) {
        // تسوية المخزون
        await prisma.inventoryItem?.update?.({
          where: { id: count.itemId, tenantId },
          data:  { currentStock: countedQty },
        }).catch(() => null);

        // قيد التسوية
        const unitCost = await prisma.inventoryItem?.findFirst?.({
          where: { id: count.itemId, tenantId }, select: { unitCost: true },
        }).catch(() => null);

        const costDiff = new Decimal(Math.abs(difference) * Number(unitCost?.unitCost ?? 0));

        const je = await prisma.journalEntry?.create?.({
          data: {
            tenantId,
            reference:   `COUNT-ADJ-${planId}-${count.itemId}`,
            description: `تسوية جرد دوري — صنف ${count.itemId}`,
            date:        new Date(),
            status:      'POSTED',
            sourceType:  'CYCLE_COUNT',
            lines: {
              create: difference > 0
                ? [
                    { tenantId, accountCode: '1310', debit: costDiff,         credit: new Decimal(0), description: 'زيادة مخزون من جرد' },
                    { tenantId, accountCode: '5200', debit: new Decimal(0), credit: costDiff,         description: 'دخل تسوية مخزون' },
                  ]
                : [
                    { tenantId, accountCode: '5200', debit: costDiff,         credit: new Decimal(0), description: 'مصروف عجز مخزون' },
                    { tenantId, accountCode: '1310', debit: new Decimal(0), credit: costDiff,         description: 'تخفيض مخزون من جرد' },
                  ],
            },
          },
        }).catch(() => null);

        variances.push({ itemId: count.itemId, systemQty, countedQty, difference, jeId: je?.id });
      }

      await prisma.cycleCountLine?.update?.({
        where: { id: line.id },
        data:  { countedQty: count.countedQty, countedBy: count.countedBy, status: 'COUNTED', countedAt: new Date() },
      }).catch(() => null);
    }

    await prisma.cycleCountPlan?.update?.({
      where: { id: planId, tenantId },
      data:  { status: 'COMPLETED', completedAt: new Date() },
    }).catch(() => null);

    return { planId, counted: counts.length, variances, varianceCount: variances.length };
  }
}
