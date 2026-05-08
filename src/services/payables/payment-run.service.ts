/**
 * PaymentRunService — دفعة سداد المورّدين (AP)
 *
 * النماذج: PaymentRun, PaymentRunLine, OpenItem, JournalEntry
 *
 * سير العمل:
 *  DRAFT → PROPOSED → PENDING_APPROVAL → APPROVED → FILE_GENERATED → SENT_TO_BANK → POSTED
 *
 * يجمع الفواتير المستحقة للموردين، ينشئ دفعة، ويُرسلها للبنك
 * بعد التأكيد يُرحِّل قيود الدفع ويُغلق البنود المفتوحة
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface PaymentRunProposal {
  runId: number;
  runNumber: string;
  suppliers: {
    supplierId: number;
    supplierName: string;
    invoiceCount: number;
    totalAmount: Decimal;
    iban: string;
  }[];
  totalAmount: Decimal;
  currency: string;
}

export class PaymentRunService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * إنشاء دفعة مقترحة لجميع الفواتير المستحقة حتى تاريخ معين
   */
  async propose(dueDateUntil: Date, currency = 'SAR'): Promise<PaymentRunProposal> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // جلب البنود المفتوحة للموردين (payables) المستحقة
    const openItems = await prisma.openItem.findMany({
      where: {
        tenantId, partyType: 'vendor', currency,
        dueDate: { lte: dueDateUntil },
        openAmount: { gt: 0 },
        status: 'OPEN',
      },
      include: { vendor: { select: { id: true, name: true, iban: true } } },
    }).catch(() => []);

    if (openItems.length === 0) {
      throw new Error('لا توجد فواتير مستحقة للدفع حتى التاريخ المحدد');
    }

    // تجميع حسب المورد
    const bySupplier = new Map<number, { name: string; iban: string; items: any[] }>();
    for (const item of openItems) {
      const vid = item.partyId;
      if (!bySupplier.has(vid)) {
        bySupplier.set(vid, {
          name: item.vendor?.name ?? `مورد ${vid}`,
          iban: item.vendor?.iban ?? '',
          items: [] as any[],
        });
      }
      bySupplier.get(vid)!.items.push(item);
    }


    // إنشاء PaymentRun + PaymentRunLine في transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const run = await tx.paymentRun.create({
        data: {
          tenantId,
          description: `دفعة موردين حتى ${dueDateUntil.toLocaleDateString('ar-SA')}`,
          dueDateUntil,
          currency,
          status: 'PROPOSED',
          createdByUserId: this.ctx.user.id,
        },
      });

      const suppliers = [];
      for (const [supplierId, info] of bySupplier) {
        const totalAmount = info.items.reduce(
          (s: Decimal, i: any) => s.add(new Decimal(i.openAmount)),
          new Decimal(0),
        );
        await tx.paymentRunLine.create({
          data: {
            tenantId,
            runId: run.id,
            supplierId,
            openItemIds: info.items.map((i: any) => i.id),
            invoiceCount: info.items.length,
            amount: totalAmount,
            currency,
            iban: info.iban,
            status: 'PENDING',
          },
        });
        suppliers.push({ supplierId, supplierName: info.name, invoiceCount: info.items.length, totalAmount, iban: info.iban });
      }

      const totalAmount = suppliers.reduce((s, sup) => s.add(sup.totalAmount), new Decimal(0));
      await tx.paymentRun.update({ where: { id: run.id }, data: { totalAmount } });

      return { run, suppliers, totalAmount };
    });

    return {
      runId: result.run.id,
      runNumber: result.run.runNumber,
      suppliers: result.suppliers,
      totalAmount: result.totalAmount,
      currency,
    };
  }

  /**
   * الموافقة على الدفعة وترحيل القيود المحاسبية
   */
  async approve(runId: number): Promise<void> {
    const prisma = this.prisma as any;
    await prisma.paymentRun.update({
      where: { id: runId },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedByUserId: this.ctx.user.id },
    });
  }

  /**
   * ترحيل القيود وإغلاق البنود المفتوحة
   */
  async post(runId: number): Promise<{ postedLines: number; journalEntryId: number }> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const run = await prisma.paymentRun.findFirst({
      where: { id: runId, tenantId },
      include: { lines: true },
    });
    if (!run) throw new Error(`دفعة السداد ${runId} غير موجودة`);
    if (run.status !== 'APPROVED') throw new Error('يجب الموافقة على الدفعة أولاً');

    const result = await prisma.$transaction(async (tx: any) => {
      // قيد الدفع الرئيسي
      const je = await tx.journalEntry.create({
        data: {
          tenantId,
          reference: `PAY-RUN-${run.runNumber}`,
          description: run.description,
          date: new Date(),
          status: 'POSTED',
          sourceType: 'PAYMENT_RUN',
          sourceId: runId,
          lines: {
            create: run.lines.map((line: any) => ({
              tenantId,
              accountCode: 'AP', // حساب الدائنون
              supplierId: line.supplierId,
              credit: new Decimal(0),
              debit: new Decimal(line.amount), // مدين لإغلاق الرصيد
              description: `سداد ${line.invoiceCount} فاتورة`,
            })),
          },
        },
      });

      // إغلاق البنود المفتوحة
      for (const line of run.lines) {
        await tx.openItem.updateMany({
          where: { id: { in: line.openItemIds }, tenantId },
          data: { status: 'CLOSED', openAmount: new Decimal(0) },
        });
        await tx.paymentRunLine.update({
          where: { id: line.id },
          data: { status: 'POSTED', journalLineId: je.id },
        });
      }

      await tx.paymentRun.update({
        where: { id: runId },
        data: { status: 'POSTED', postedAt: new Date(), journalEntryId: je.id },
      });

      return { je, postedLines: run.lines.length };
    });

    return { postedLines: result.postedLines, journalEntryId: result.je.id };
  }
}
