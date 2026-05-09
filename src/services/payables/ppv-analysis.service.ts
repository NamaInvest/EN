/**
 * PPV Analysis Service — Purchase Price Variance
 * Uses PurchaseInvoice.ppvAmount and PurchaseInvoiceDetail
 */
import { PrismaClient } from '@prisma/client';

export interface PPVReport {
  productId: number;
  productName: string;
  supplierId: number;
  supplierName: string;
  standardPrice: number;
  actualPrice: number;
  quantity: number;
  ppv: number;
  ppvPercent: number;
  isFavorable: boolean;
}

export class PPVAnalysisService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Analyze purchase price variance for a period
   */
  async analyze(tenantId: string, fromDate: Date, toDate: Date): Promise<{
    rows: PPVReport[];
    totalFavorable: number;
    totalUnfavorable: number;
    netPPV: number;
  }> {
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        date: { gte: fromDate, lte: toDate },
      },
      include: {
        supplier: { select: { name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    const rows: PPVReport[] = [];

    for (const inv of invoices as any[]) {
      for (const detail of inv.details ?? []) {
        if (!detail.product) continue;
        // Standard price = current unit price; PPV tracked via invoice-level ppvAmount
        const actualPrice = Number(detail.price);
        const standardPrice = actualPrice; // would come from standard cost if available
        const quantity = Number(detail.quantity);
        // Use per-detail allocation of invoice PPV
        const ppv = Number(inv.ppvAmount ?? 0) / Math.max(1, (inv.details ?? []).length);

        rows.push({
          productId: detail.productId,
          productName: detail.productName ?? detail.product.name,
          supplierId: inv.supplierId ?? 0,
          supplierName: inv.supplier?.name ?? 'Unknown',
          standardPrice,
          actualPrice,
          quantity,
          ppv: Math.round(ppv * 100) / 100,
          ppvPercent: standardPrice > 0 ? Math.round((ppv / (standardPrice * quantity)) * 10000) / 100 : 0,
          isFavorable: ppv > 0,
        });
      }
    }

    const totalFavorable = rows.filter((r) => r.isFavorable).reduce((s, r) => s + r.ppv, 0);
    const totalUnfavorable = rows.filter((r) => !r.isFavorable).reduce((s, r) => s + Math.abs(r.ppv), 0);

    return {
      rows: rows.sort((a, b) => Math.abs(b.ppv) - Math.abs(a.ppv)),
      totalFavorable,
      totalUnfavorable,
      netPPV: totalFavorable - totalUnfavorable,
    };
  }

  /**
   * Top PPV suppliers
   */
  async getTopPPVSuppliers(tenantId: string, fromDate: Date, toDate: Date, limit: number = 10): Promise<{
    supplierId: number | null;
    supplierName: string;
    totalPPV: number;
    invoiceCount: number;
  }[]> {
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: { tenantId, deletedAt: null, date: { gte: fromDate, lte: toDate }, ppvAmount: { not: 0 } },
      select: {
        supplierId: true,
        ppvAmount: true,
        supplier: { select: { name: true } },
      },
    });

    const supplierMap = new Map<number | null, { name: string; totalPPV: number; count: number }>();
    for (const inv of invoices) {
      const key = inv.supplierId;
      const existing = supplierMap.get(key) ?? { name: inv.supplier?.name ?? 'Unknown', totalPPV: 0, count: 0 };
      existing.totalPPV += Number(inv.ppvAmount);
      existing.count++;
      supplierMap.set(key, existing);
    }

    return Array.from(supplierMap.entries())
      .map(([supplierId, v]) => ({ supplierId, supplierName: v.name, totalPPV: v.totalPPV, invoiceCount: v.count }))
      .sort((a, b) => Math.abs(b.totalPPV) - Math.abs(a.totalPPV))
      .slice(0, limit);
  }
}
