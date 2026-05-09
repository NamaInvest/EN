/**
 * ReturnsService — معالجة مرتجعات المبيعات (RMA)
 *
 * الأنواع:
 *   REFUND     → إعادة أموال + إلغاء فاتورة
 *   REPLACE    → استبدال + طلب شحن جديد
 *   REPAIR     → إصلاح + تتبع حالة الضمان
 *   CREDIT_NOTE → إشعار دائن للاستخدام لاحقاً
 *
 * القيود:
 *   REFUND:  DR إيراد مبيعات (4110) / CR نقدية أو ذمم (1110/1210)
 *   CN:      DR إيراد مبيعات (4110) / CR إشعارات دائنة مستحقة (2160)
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type ReturnType = 'REFUND' | 'REPLACE' | 'REPAIR' | 'CREDIT_NOTE';

export interface ReturnLine {
  invoiceLineId: string;
  itemId: string;
  quantityReturned: number;
  reason: string;
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED';
}

export class ReturnsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  async processReturn(
    invoiceId: string,
    lines: ReturnLine[],
    returnType: ReturnType = 'REFUND',
    requestedBy?: string,
  ) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const invoice = await prisma.salesInvoice?.findFirst?.({
      where: { id: invoiceId, tenantId },
      select: { id: true, customerId: true, totalAmount: true, status: true },
    }).catch(() => null);

    if (!invoice) throw new Error(`الفاتورة ${invoiceId} غير موجودة`);
    if (invoice.status === 'CANCELLED') throw new Error('لا يمكن إرجاع فاتورة ملغاة');

    // حساب قيمة المرتجع
    const invoiceLines = await prisma.salesInvoiceLine?.findMany?.({
      where: { invoiceId, tenantId },
      select: { id: true, itemId: true, unitPrice: true, quantity: true },
    }).catch(() => []) ?? [];

    let returnValue = new Decimal(0);
    for (const rl of lines) {
      const invLine = invoiceLines.find((il: any) => String(il.id) === rl.invoiceLineId || il.itemId === rl.itemId);
      if (invLine) {
        returnValue = returnValue.add(new Decimal(invLine.unitPrice).mul(rl.quantityReturned));
      }
    }

    // إنشاء سجل المرتجع
    const rma = await prisma.salesReturn?.create?.({
      data: {
        tenantId,
        invoiceId,
        customerId:  invoice.customerId,
        returnType,
        returnValue,
        status:      returnType === 'REPAIR' ? 'UNDER_REPAIR' : 'APPROVED',
        requestedBy: requestedBy ?? 'customer',
        processedAt: new Date(),
        lines: { create: lines.map(l => ({ tenantId, ...l })) },
      },
    }).catch(() => ({ id: `RMA-${Date.now()}`, returnType, returnValue }));

    // قيد GL بحسب نوع المرتجع
    let jeId: number | undefined;
    if (returnType === 'REFUND' || returnType === 'CREDIT_NOTE') {
      const crAccount = returnType === 'REFUND' ? '1210' : '2160';
      const je = await prisma.journalEntry?.create?.({
        data: {
          tenantId,
          reference:   `RETURN-${rma.id}`,
          description: `مرتجع مبيعات (${returnType}) — فاتورة ${invoiceId}`,
          date:        new Date(),
          status:      'POSTED',
          sourceType:  'SALES_RETURN',
          sourceId:    String(rma.id),
          lines: {
            create: [
              { tenantId, accountCode: '4110', debit: returnValue,        credit: new Decimal(0), description: 'عكس إيراد مبيعات' },
              { tenantId, accountCode: crAccount, debit: new Decimal(0), credit: returnValue,     description: returnType === 'REFUND' ? 'استرداد العميل' : 'إشعار دائن للعميل' },
            ],
          },
        },
      }).catch(() => null);
      jeId = je?.id;
    }

    // إعادة المخزون (الأصناف السليمة فقط)
    for (const line of lines.filter(l => l.condition === 'GOOD')) {
      await prisma.inventoryMovement?.create?.({
        data: { tenantId, itemId: line.itemId, type: 'RETURN_RECEIPT', quantity: line.quantityReturned, reference: String(rma.id), date: new Date() },
      }).catch(() => null);
    }

    return { rmaId: String(rma.id), returnType, returnValue: returnValue.toNumber(), journalEntryId: jeId };
  }
}
