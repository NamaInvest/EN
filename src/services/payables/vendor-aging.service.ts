/**
 * Vendor Aging Service — AP aging report
 * Uses PurchaseInvoice (remaining, paid, supplierId)
 */
import { PrismaClient } from '@prisma/client';

export class VendorAgingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * AP Aging report for all vendors
   */
  async getAgingReport(tenantId: string, asOfDate: Date): Promise<{
    vendors: { supplierId: number; name: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }[];
    totals: { current: number; days30: number; days60: number; days90: number; over90: number; total: number };
  }> {
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        date: { lte: asOfDate },
        remaining: { gt: 0 },
        supplierId: { not: null },
      },
      select: {
        supplierId: true,
        remaining: true,
        date: true,
        dueDate: true,
        supplier: { select: { name: true } },
      } as any,
    });

    const vendorMap = new Map<number, { name: string; current: number; days30: number; days60: number; days90: number; over90: number }>();

    for (const inv of invoices as any[]) {
      if (!inv.supplierId) continue;
      const dueDate = inv.dueDate ?? inv.date;
      const overdueDays = dueDate < asOfDate
        ? Math.ceil((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const remaining = Number(inv.remaining);
      const existing = vendorMap.get(inv.supplierId) ?? { name: inv.supplier?.name ?? '', current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };

      if (overdueDays <= 0) existing.current += remaining;
      else if (overdueDays <= 30) existing.days30 += remaining;
      else if (overdueDays <= 60) existing.days60 += remaining;
      else if (overdueDays <= 90) existing.days90 += remaining;
      else existing.over90 += remaining;

      vendorMap.set(inv.supplierId, existing);
    }

    const vendors = Array.from(vendorMap.entries()).map(([supplierId, v]) => ({
      supplierId,
      name: v.name,
      current: v.current,
      days30: v.days30,
      days60: v.days60,
      days90: v.days90,
      over90: v.over90,
      total: v.current + v.days30 + v.days60 + v.days90 + v.over90,
    })).sort((a, b) => b.over90 - a.over90);

    const totals = vendors.reduce((acc, v) => ({
      current: acc.current + v.current,
      days30: acc.days30 + v.days30,
      days60: acc.days60 + v.days60,
      days90: acc.days90 + v.days90,
      over90: acc.over90 + v.over90,
      total: acc.total + v.total,
    }), { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 });

    return { vendors, totals };
  }

  /**
   * Get overdue payments for a vendor
   */
  async getVendorOverdue(tenantId: string, supplierId: number): Promise<{
    invoiceNo: number;
    date: Date;
    total: number;
    remaining: number;
    overdueDays: number;
  }[]> {
    const today = new Date();
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: { tenantId, supplierId, deletedAt: null, remaining: { gt: 0 } },
      select: { invoiceNo: true, date: true, total: true, remaining: true },
      orderBy: { date: 'asc' },
    });

    return invoices.map((inv) => ({
      invoiceNo: inv.invoiceNo,
      date: inv.date,
      total: Number(inv.total),
      remaining: Number(inv.remaining),
      overdueDays: Math.max(0, Math.ceil((today.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24))),
    }));
  }
}
