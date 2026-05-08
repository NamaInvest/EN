/**
 * Sales Service Layer
 * ──────────────────────────────────────────────────────────
 * Invoice creation with auto-journal, customer balance, listing
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { createJournalEntry, ACCOUNTS } from '@/lib/auto-journal';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { AppError } from '@/lib/api-handler';

const log = logger.child({ route: 'SalesService' });

interface SalesItem {
  productId: number;
  productName?: string;
  quantity: number;
  price: number;
  discountRate?: number;
  taxRate?: number;
}

interface CreateSalesInput {
  customerId?: number;
  stockId?: number;
  paymentType: string;
  paid?: number;
  notes?: string;
  items: SalesItem[];
  userId?: number;
  branchId?: number;
  costCenterId?: number;
}

export class SalesService {
  private prisma: PrismaClient;

  constructor(req?: Request) {
    this.prisma = getPrisma(req) as any;
  }

  calculateTotals(items: SalesItem[]) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const processed = items.map(item => {
      const lineTotal = item.quantity * item.price;
      const discount = lineTotal * (item.discountRate || 0) / 100;
      const afterDiscount = lineTotal - discount;
      const tax = afterDiscount * ((item.taxRate ?? 15) / 100);
      subtotal += afterDiscount;
      totalDiscount += discount;
      totalTax += tax;
      return { ...item, lineTotal, discount, afterDiscount, tax, total: afterDiscount + tax };
    });

    return { items: processed, subtotal, totalDiscount, totalTax, grandTotal: subtotal + totalTax };
  }

  async createInvoice(input: CreateSalesInput) {
    if (!input.items?.length) throw new AppError('يجب أن تحتوي الفاتورة على صنف واحد على الأقل', 400);
    if (input.paymentType === 'credit' && !input.customerId) throw new AppError('البيع الآجل يتطلب تحديد العميل', 400);

    const calc = this.calculateTotals(input.items);
    const paid = Number(input.paid) || 0;
    const remaining = calc.grandTotal - paid;

    // Generate next invoice number
    const lastInvoice = await this.prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' }, select: { invoiceNo: true } });
    const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;

    const invoice = await this.prisma.salesInvoice.create({
      data: {
        invoiceNo,
        customerId: input.customerId ?? undefined,
        stockId: input.stockId || 1,
        paymentType: input.paymentType || 'cash',
        subtotal: calc.subtotal,
        taxValue: calc.totalTax,
        discountValue: calc.totalDiscount,
        total: calc.grandTotal,
        paid,
        remaining,
        status: remaining <= 0 ? 'paid' : 'partial',
        notes: input.notes,
        userId: input.userId,
        branchId: input.branchId,
        costCenterId: input.costCenterId,
        details: { create: calc.items.map(it => ({
          productId: it.productId,
          productName: it.productName || '',
          quantity: it.quantity,
          price: it.price,
          discountRate: it.discountRate || 0,
          taxRate: it.taxRate ?? 15,
          taxValue: it.tax,
          total: it.total,
        }))},
      },
    });

    // Auto-journal
    try {
      await createJournalEntry({
        description: `فاتورة بيع #${invoice.invoiceNo || invoice.id}`,
        reference: `SI-${invoice.id}`,
        lines: [
          { accountCode: paid > 0 ? ACCOUNTS.CASH : ACCOUNTS.RECEIVABLES, debit: calc.grandTotal, credit: 0 },
          { accountCode: ACCOUNTS.SALES, debit: 0, credit: calc.subtotal },
          ...(calc.totalTax > 0 ? [{ accountCode: ACCOUNTS.VAT_OUTPUT, debit: 0, credit: calc.totalTax }] : []),
        ],
        userId: input.userId,
        status: 'posted',
      });
    } catch (e: any) {
      log.warn(`Auto-journal failed for SI-${invoice.id}: ${e.message}`);
    }

    if (input.customerId) cache.invalidatePrefix(`customer:${input.customerId}`);
    log.info(`Invoice created: ${invoice.id}`, { total: calc.grandTotal });
    return invoice;
  }

  async getCustomerBalance(customerId: number) {
    return cache.getOrSet(`customer:${customerId}:balance`, 60, async () => {
      const invoices = await this.prisma.salesInvoice.aggregate({
        where: { customerId },
        _sum: { total: true, paid: true },
      });
      return {
        customerId,
        totalSales: Number(invoices._sum.total || 0),
        totalPaid: Number(invoices._sum.paid || 0),
        balance: Number(invoices._sum.total || 0) - Number(invoices._sum.paid || 0),
      };
    });
  }

  async listInvoices(filters: { customerId?: number; status?: string; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;

    return this.prisma.salesInvoice.findMany({
      where,
      include: { details: true, customer: { select: { name: true, phone: true } } },
      orderBy: { id: 'desc' },
      take: filters.limit || 100,
    });
  }
}
