/**
 * AutoCashApplicationService — تطبيق المدفوعات تلقائياً على AR
 *
 * النماذج: OpenItem, SalesInvoice, JournalEntry, JournalLine
 *
 * الخوارزمية:
 *  1. استلام دفعة من عميل
 *  2. البحث عن الفواتير المفتوحة وترتيبها (الأقدم أولاً — FIFO)
 *  3. تطبيق الدفعة على الفواتير بالترتيب
 *  4. إذا بقي رصيد → advance payment أو نقص → partial
 *  5. ترحيل قيود إغلاق الفواتير
 *
 * يدعم: التطبيق الكامل / الجزئي / المدفوعات الزائدة
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface CashApplicationResult {
  appliedAmount: Decimal;
  invoicesClosed: number;
  invoicesPartial: number;
  overpayment: Decimal;     // إذا دفع أكثر من المستحق
  underpayment: Decimal;    // إذا دفع أقل
  journalEntryId?: number;
  applications: { invoiceId: number; appliedAmount: Decimal; closingBalance: Decimal }[];
}

export class AutoCashApplicationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * تطبيق دفعة على فواتير عميل (FIFO — الأقدم أولاً)
   */
  async apply(params: {
    customerId: number;
    paymentAmount: Decimal;
    paymentRef: string;
    paymentDate: Date;
    specificInvoiceIds?: number[];   // اختياري — إذا أراد العميل تحديد الفواتير
  }): Promise<CashApplicationResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // جلب الفواتير المفتوحة مرتبة FIFO
    const openItems = await prisma.openItem.findMany({
      where: {
        tenantId,
        partyId: params.customerId,
        partyType: 'customer',
        openAmount: { gt: 0 },
        status: 'OPEN',
        ...(params.specificInvoiceIds?.length
          ? { documentId: { in: params.specificInvoiceIds } }
          : {}),
      },
      orderBy: { documentDate: 'asc' }, // FIFO
    });

    if (openItems.length === 0) {
      throw new Error(`لا توجد فواتير مفتوحة للعميل ${params.customerId}`);
    }

    let remaining = params.paymentAmount;
    let invoicesClosed = 0;
    let invoicesPartial = 0;
    const applications: CashApplicationResult['applications'] = [];
    const updatesForTx: { id: number; newOpen: Decimal; status: string }[] = [];

    // تطبيق الدفعة على الفواتير FIFO
    for (const item of openItems) {
      if (remaining.lte(0)) break;

      const openAmt = new Decimal(item.openAmount);
      const apply = Decimal.min(remaining, openAmt);
      const closingBalance = openAmt.sub(apply);

      applications.push({
        invoiceId: item.documentId,
        appliedAmount: apply,
        closingBalance,
      });

      updatesForTx.push({
        id: item.id,
        newOpen: closingBalance,
        status: closingBalance.isZero() ? 'CLOSED' : 'PARTIAL',
      });

      if (closingBalance.isZero()) invoicesClosed++;
      else invoicesPartial++;

      remaining = remaining.sub(apply);
    }

    const totalApplied = params.paymentAmount.sub(remaining);
    const totalOpen = openItems.reduce((s: Decimal, i: any) => s.add(new Decimal(i.openAmount)), new Decimal(0));
    const overpayment = remaining.gt(0) ? remaining : new Decimal(0);
    const underpayment = totalOpen.sub(totalApplied).gt(0) ? totalOpen.sub(totalApplied) : new Decimal(0);

    // ترحيل في transaction
    const { je } = await prisma.$transaction(async (tx: any) => {
      // تحديث البنود المفتوحة
      for (const upd of updatesForTx) {
        await tx.openItem.update({
          where: { id: upd.id },
          data: { openAmount: upd.newOpen, status: upd.status },
        });
      }

      // قيد استلام الدفع
      const je = await tx.journalEntry.create({
        data: {
          tenantId,
          reference: params.paymentRef,
          description: `استلام دفعة من عميل ${params.customerId}`,
          date: params.paymentDate,
          status: 'POSTED',
          sourceType: 'CASH_APPLICATION',
          lines: {
            create: [
              {
                tenantId,
                accountCode: 'BANK',           // حساب البنك — مدين
                debit: totalApplied,
                credit: new Decimal(0),
                description: params.paymentRef,
              },
              {
                tenantId,
                accountCode: 'AR',             // حساب القبض — دائن
                debit: new Decimal(0),
                credit: totalApplied,
                description: `إغلاق ${invoicesClosed} فاتورة`,
              },
            ],
          },
        },
      });

      return { je };
    });

    return {
      appliedAmount: totalApplied,
      invoicesClosed,
      invoicesPartial,
      overpayment,
      underpayment,
      journalEntryId: je.id,
      applications,
    };
  }
}
