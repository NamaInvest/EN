import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'supplier-portal-engine' });

/**
 * O-06: Supplier Self-Service Portal
 * PurchaseOrder uses supplierId (not vendorId), no 'lines' include, orderBy date
 * No supplierPortalUser / vendorPayment models → use User + SalesInvoice as proxy
 */
export class SupplierPortalEngine {
  /** Get open POs for a supplier (Customer.type=1 = supplier) */
  static async getOpenPOs(supplierId: number) {
    return prisma.purchaseOrder.findMany({
      where: { supplierId, status: { in: ['pending', 'approved'] } },
      orderBy: { date: 'desc' },
      select: { id: true, orderNo: true, date: true, total: true, status: true, notes: true },
    });
  }

  /** Supplier submits an invoice against a PO */
  static async submitInvoice(supplierId: number, purchaseOrderId: number, invoiceNo: number, totalAmount: number, invoiceDate: Date) {
    const po = await prisma.purchaseOrder.findFirstOrThrow({ where: { id: purchaseOrderId, supplierId } });
    log.info(`Supplier ${supplierId} submitting invoice ${invoiceNo} against PO ${po.id}`);
    return prisma.purchaseInvoice.create({
      data: {
        tenantId: po.tenantId, supplierId, purchaseOrderId, invoiceNo,
        subtotal: totalAmount, total: totalAmount,
        date: invoiceDate, status: 'pending',
      },
    });
  }

  /** Get supplier's recent invoices (as payment proxy) */
  static async getInvoiceHistory(supplierId: number) {
    return prisma.purchaseInvoice.findMany({
      where: { supplierId },
      orderBy: { date: 'desc' },
      take: 20,
      select: { id: true, invoiceNo: true, total: true, paid: true, date: true, status: true },
    });
  }
}
