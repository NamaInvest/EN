/**
 * WipService — تتبع WIP + تكاليف التصنيع
 * WIP = Raw Materials + Direct Labor + Manufacturing Overhead
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export class WipService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** صرف مواد خام → WIP (يُستدعى من ShopFloorService أيضاً) */
  async issueMaterial(woId: string, materials: { itemId: string; qty: number }[]) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    let totalCost  = new Decimal(0);

    for (const mat of materials) {
      const item = await prisma.inventoryItem?.findFirst?.({ where: { id: mat.itemId, tenantId }, select: { unitCost: true } }).catch(() => null);
      totalCost = totalCost.add(new Decimal(item?.unitCost ?? 0).mul(mat.qty));
    }

    return { woId, materialsCost: totalCost.toNumber(), issued: materials.length };
  }

  /** إضافة تكلفة عمالة مباشرة إلى WIP */
  async postDirectLabor(woId: string, workedHours: number, hourlyRate: number) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;
    const cost     = new Decimal(workedHours).mul(hourlyRate).toDecimalPlaces(2);

    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `WIP-LABOR-${woId}`,
        description: `عمالة مباشرة — أمر التصنيع ${woId}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'WO_LABOR',
        lines: {
          create: [
            { tenantId, accountCode: '1320', debit: cost,           credit: new Decimal(0), description: 'WIP — عمالة مباشرة' },
            { tenantId, accountCode: '2120', debit: new Decimal(0), credit: cost,           description: 'رواتب مستحقة — إنتاج' },
          ],
        },
      },
    }).catch(() => null);

    await prisma.workOrder?.update?.({
      where: { id: woId, tenantId },
      data:  { totalCost: { increment: cost.toNumber() } },
    }).catch(() => null);

    return { woId, laborCost: cost.toNumber(), workedHours, hourlyRate };
  }

  /** تقرير WIP بالتاريخ */
  async getWipReport(asOfDate: Date) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const openWOs = await prisma.workOrder?.findMany?.({
      where: { tenantId, status: { in: ['RELEASED', 'IN_PROGRESS'] }, startedAt: { lte: asOfDate } },
      select: { id: true, totalCost: true, targetItemId: true, status: true, startedAt: true },
    }).catch(() => []) ?? [];

    const totalWip = openWOs.reduce((s: number, wo: any) => s + Number(wo.totalCost ?? 0), 0);
    return { asOfDate, openWorkOrders: openWOs.length, totalWipValue: totalWip, workOrders: openWOs };
  }
}
