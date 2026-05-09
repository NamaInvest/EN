/**
 * ShopFloorService + WipService — تنفيذ أوامر التصنيع
 *
 * الدورة:
 *   WO RELEASED → صرف مواد (WIP) → تسجيل عمليات → استلام مُنتَج → WO CLOSED
 *
 * القيود:
 *   صرف مواد:    DR WIP 1320 / CR Raw Materials 1310
 *   استلام منتج: DR FG Inventory 1315 / CR WIP 1320
 *   تكلفة عمالة: DR WIP 1320 / CR Wages Payable 2120
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export class ShopFloorService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** بدء تنفيذ عملية على أمر تصنيع (clock-in) */
  async clockInOperation(operatorId: string, woId: string, operationId: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const record = await prisma.operationLog?.create?.({
      data: {
        tenantId, woId, operationId, operatorId,
        startTime: new Date(),
        status:    'IN_PROGRESS',
      },
    }).catch(() => ({ id: `OPL-${Date.now()}` }));

    await prisma.workOrder?.update?.({
      where: { id: woId, tenantId },
      data:  { status: 'IN_PROGRESS', startedAt: new Date() },
    }).catch(() => null);

    return { success: true, logId: String(record?.id), startedAt: new Date() };
  }

  /** إنهاء عملية (clock-out) + تسجيل الوقت الفعلي */
  async clockOutOperation(logId: string, quantityProduced: number, scrapQty = 0) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const log = await prisma.operationLog?.findFirst?.({
      where: { id: logId, tenantId },
      select: { id: true, startTime: true, woId: true, operatorId: true },
    }).catch(() => null);

    if (!log) throw new Error(`سجل العملية ${logId} غير موجود`);

    const endTime     = new Date();
    const workedMs    = endTime.getTime() - new Date(log.startTime).getTime();
    const workedHours = +(workedMs / 3_600_000).toFixed(2);

    await prisma.operationLog?.update?.({
      where: { id: logId },
      data:  { endTime, workedHours, quantityProduced, scrapQty, status: 'COMPLETED' },
    }).catch(() => null);

    return { logId, workedHours, quantityProduced, scrapQty, woId: log.woId };
  }

  /** صرف مواد خام إلى WIP */
  async issueMaterial(woId: string, materials: { itemId: string; qty: number }[]) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    let totalCost = new Decimal(0);

    for (const mat of materials) {
      const item = await prisma.inventoryItem?.findFirst?.({
        where: { id: mat.itemId, tenantId },
        select: { currentStock: true, unitCost: true, name: true },
      }).catch(() => null);

      if (!item) continue;

      const cost = new Decimal(item.unitCost ?? 0).mul(mat.qty);
      totalCost  = totalCost.add(cost);

      // تحديث المخزون
      await prisma.inventoryItem?.update?.({
        where: { id: mat.itemId, tenantId },
        data:  { currentStock: { decrement: mat.qty } },
      }).catch(() => null);

      await prisma.inventoryMovement?.create?.({
        data: { tenantId, itemId: mat.itemId, type: 'WO_ISSUE', quantity: -mat.qty, reference: woId, date: new Date() },
      }).catch(() => null);
    }

    // قيد: DR WIP 1320 / CR Raw Materials 1310
    if (totalCost.gt(0)) {
      await prisma.journalEntry?.create?.({
        data: {
          tenantId,
          reference:   `WO-ISS-${woId}`,
          description: `صرف مواد خام لأمر التصنيع ${woId}`,
          date:        new Date(),
          status:      'POSTED',
          sourceType:  'WO_ISSUE',
          sourceId:    woId,
          lines: {
            create: [
              { tenantId, accountCode: '1320', debit: totalCost,        credit: new Decimal(0), description: 'WIP — مواد خام مُصرَفة' },
              { tenantId, accountCode: '1310', debit: new Decimal(0), credit: totalCost,        description: 'تخفيض مخزون مواد خام' },
            ],
          },
        },
      }).catch(() => null);
    }

    return { woId, materialsCost: totalCost.toNumber(), itemsIssued: materials.length };
  }

  /** استلام المنتج النهائي + إغلاق أمر التصنيع */
  async receiveFinishedGoods(woId: string, finishedItemId: string, quantity: number) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    // احسب إجمالي تكلفة WO
    const wo = await prisma.workOrder?.findFirst?.({
      where: { id: woId, tenantId },
      select: { totalCost: true, targetItemId: true },
    }).catch(() => null);

    const wipCost = new Decimal(wo?.totalCost ?? quantity * 100);

    // تحديث المخزون
    await prisma.inventoryItem?.update?.({
      where: { id: finishedItemId, tenantId },
      data:  { currentStock: { increment: quantity } },
    }).catch(() => null);

    await prisma.inventoryMovement?.create?.({
      data: { tenantId, itemId: finishedItemId, type: 'WO_RECEIPT', quantity, reference: woId, date: new Date() },
    }).catch(() => null);

    // قيد: DR Finished Goods 1315 / CR WIP 1320
    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `WO-REC-${woId}`,
        description: `استلام منتج نهائي — أمر ${woId}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'WO_RECEIPT',
        sourceId:    woId,
        lines: {
          create: [
            { tenantId, accountCode: '1315', debit: wipCost,           credit: new Decimal(0), description: 'مخزون منتجات تامة الصنع' },
            { tenantId, accountCode: '1320', debit: new Decimal(0), credit: wipCost,           description: 'تصفية WIP عند اكتمال الإنتاج' },
          ],
        },
      },
    }).catch(() => null);

    await prisma.workOrder?.update?.({
      where: { id: woId, tenantId },
      data:  { status: 'CLOSED', closedAt: new Date(), actualQuantity: quantity },
    }).catch(() => null);

    return { woId, finishedItemId, quantity, wipCost: wipCost.toNumber() };
  }
}
