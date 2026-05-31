import { PrismaClient, SalesInvoice } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BaseService } from '../shared/base.service';
import { BusinessContext, eventBus } from '../shared/event-bus.service';
import { FinancialPeriodService } from '../accounting/financial-period.service';

export interface CreateInvoiceInput {
  customerId?: string;
  date: Date;
  items: InvoiceItemInput[];
}

export interface InvoiceItemInput {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  taxRate: number;
}

export interface InvoiceTotals {
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
}

export class SalesInvoiceService extends BaseService {
  constructor(
    prisma: PrismaClient,
    ctx: BusinessContext
  ) {
    super(prisma, ctx);
  }

  async create(input: CreateInvoiceInput): Promise<SalesInvoice> {
    // 1. Permission check
    this.requirePermission('sales:invoice:create');

    // 2. Period check
    this.requireOpenFiscalPeriod();

    // 3. Execute in transaction
    return await this.db.$transaction(async (tx: any) => {
      // Phase 3: Period Lock Enforcement inside transaction
      const periodService = new FinancialPeriodService(tx, this.ctx);
      await periodService.requireOpenPeriod(input.date);

      // 4. Calculate totals
      const totals = this.calculateTotals(input.items);

      // 5. Create invoice
      const invoice = await tx.salesInvoice.create({
        data: {
          tenantId: this.tenantId,
          // invoiceNo: 'SI-' + Date.now(), // Real implementation would use numberingService
          customerId: input.customerId,
          branchId: this.ctx.branch?.id || 'default-branch',
          date: input.date,
          subtotal: new Decimal(totals.subtotal),
          discountValue: new Decimal(totals.discount),
          taxValue: new Decimal(totals.tax),
          total: new Decimal(totals.total),
          status: 'draft',
          createdBy: this.ctx.user.id,
          details: {
            create: input.items.map((item: any) => ({
              productId: item.productId,
              quantity: new Decimal(item.quantity),
              price: new Decimal(item.price),
              discountValue: new Decimal(item.discount || 0),
              taxRate: new Decimal(item.taxRate),
            })),
          },
        },
        include: { details: true },
      });

      // 6. Publish domain event
      eventBus.afterCommit('sales.invoice.created', {
        invoiceId: invoice.id,
        tenantId: this.tenantId,
        amount: invoice.total.toString(),
        customerId: invoice.customerId,
      });

      return invoice;
    });
  }

  async post(invoiceId: string): Promise<void> {
    return await this.db.$transaction(async (tx: any) => {
      // Find invoice
      const invoice = await tx.salesInvoice.findFirstOrThrow({
        where: { id: invoiceId, tenantId: this.tenantId }
      });

      if (invoice.status !== 'draft') {
         throw new Error('Invoice must be in draft status to post.');
      }

      // Phase 3: Period Lock Enforcement inside transaction
      const periodService = new FinancialPeriodService(tx, this.ctx);
      await periodService.requireOpenPeriod(invoice.date);

      // Update
      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: { status: 'posted', postedAt: new Date(), postedBy: this.ctx.user.id },
      });

      // --- SLA Sub-Ledger: Create Open Item for posted invoice ---
      if (invoice.customerId) {
        const { OpenItemsEngine } = await import('@/lib/open-items');
        await OpenItemsEngine.createOpenItem({
          partyId: Number(invoice.customerId),
          partyType: 'customer',
          documentType: 'sales_invoice',
          documentId: Number(invoiceId),
          documentNumber: String(invoice.invoiceNo),
          documentDate: invoice.date,
          amount: Number(invoice.total),
          tenantId: this.tenantId,
          dueDate: invoice.dueDate || invoice.date,
        }, tx);
      }

      // Submit to ZATCA / Event Bus
      eventBus.afterCommit('sales.invoice.posted', { invoiceId });
    });
  }

  private calculateTotals(items: InvoiceItemInput[]): InvoiceTotals {
    let subtotal = new Decimal(0);
    let discount = new Decimal(0);
    let tax = new Decimal(0);

    for (const item of items) {
      const itemSubtotal = new Decimal(item.quantity).mul(item.price);
      const itemDiscount = new Decimal(item.discount || 0);
      const afterDiscount = itemSubtotal.sub(itemDiscount);
      const itemTax = afterDiscount.mul(item.taxRate || 0).div(100);

      subtotal = subtotal.add(itemSubtotal);
      discount = discount.add(itemDiscount);
      tax = tax.add(itemTax);
    }

    return {
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      tax: tax.toString(),
      total: subtotal.sub(discount).add(tax).toString(),
    };
  }
}
