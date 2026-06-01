/**
 * GR/IR Clearing & Automated Reconciliation Engine
 * ══════════════════════════════════════════════════════════════════════════════
 * GR/IR = Goods Received / Invoice Received clearing account
 *
 * This engine compares Goods Receipt Notes (GRN) with Purchase Invoices (PI)
 * linked to a given Purchase Order (PO) to identify:
 *   - Price and Quantity discrepancies.
 *   - Balances within or exceeding tolerance rules.
 *   - Accrual buckets based on age.
 *
 * Compliance: SOCPA, IFRS, and Saudi ZATCA Guidelines.
 */

import { prisma } from './prisma';
import { logger } from '@/lib/observability/logger';

const log = logger.child({ service: 'gr-ir-clearing-engine' });

export type GRIRMatchStatus =
  | 'MATCHED'
  | 'UNDER_INVOICED'
  | 'OVER_INVOICED'
  | 'PRICE_VARIANCE'
  | 'QTY_VARIANCE'
  | 'PENDING_CLEARING'
  | 'CLEARABLE_WITHIN_TOLERANCE'
  | 'BLOCKED_OVER_TOLERANCE';

export interface GRIRLine {
  poId: number;
  poNumber: string;
  vendorName: string;
  grnDate?: string;
  invoiceDate?: string;
  grnAmount: number;
  invoiceAmount: number;
  balance: number;         // GRN Amount − Invoice Amount
  ageingDays: number;
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  status: GRIRMatchStatus;
  
  // Diagnostic fields
  isPriceVariance: boolean;
  isQtyVariance: boolean;
  isUnderInvoiced: boolean;
  isOverInvoiced: boolean;
  clearableWithinTolerance: boolean;
  blockedOverTolerance: boolean;
  totalReceivedQty: number;
  totalInvoicedQty: number;
}

export interface GRIRReport {
  asOf: string;
  tenantId: string;
  lines: GRIRLine[];
  totalPositive: number;   // goods received, invoice pending (needs accrual)
  totalNegative: number;   // invoice received, goods pending (investigate)
  totalBalance: number;
  matchedCount: number;
  unmatchedCount: number;
  suggestedAccrual: number;
  toleranceAmount: number;
  tolerancePercent: number;
  autoClearEnabled: boolean;
  generatedAt: Date;
}

export interface POGrinsDetail {
  productId: number;
  quantity: number;
  acceptedQty?: number | null;
  rejectedQty?: number | null;
}

export interface POGrn {
  id: number;
  date: Date;
  details: POGrinsDetail[];
}

export interface PODetail {
  productId: number;
  quantity: number;
  price: number;
  total: number;
}

export interface POSupplier {
  name: string;
}

export interface POWithDetails {
  id: number;
  orderNo: number | null;
  tenantId: string;
  date: Date;
  supplier: POSupplier | null;
  details: PODetail[];
  goodsReceipts: POGrn[];
}

export interface InvoiceDetail {
  productId: number;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceWithDetails {
  id: number;
  purchaseOrderId: number | null;
  tenantId: string;
  date: Date;
  total: number;
  subtotal: number;
  status: string;
  details: InvoiceDetail[];
}

export class GRIRClearingEngine {
  static bucketDays(days: number): GRIRLine['bucket'] {
    if (days <= 30) return '0-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
  }

  /**
   * Helper to retrieve GR/IR specific settings from settings table with safe fallbacks
   */
  static async getGRIRSettings(tenantId: string) {
    try {
      const amountSetting = await prisma.setting.findFirst({
        where: { tenantId, key: 'GRIR_CLEARING_TOLERANCE_AMOUNT' }
      });
      
      const percentSetting = await prisma.setting.findFirst({
        where: { tenantId, key: 'GRIR_CLEARING_TOLERANCE_PERCENT' }
      });
      
      const autoClearSetting = await prisma.setting.findFirst({
        where: { tenantId, key: 'GRIR_AUTO_CLEAR_ENABLED' }
      });

      return {
        toleranceAmount: amountSetting ? Number(amountSetting.value || 10.00) : 10.00, // fallback 10 SAR
        tolerancePercent: percentSetting ? Number(percentSetting.value || 2.0) : 2.0, // fallback 2%
        autoClearEnabled: autoClearSetting ? autoClearSetting.value === 'true' : false, // fallback false
      };
    } catch (err) {
      log.warn('Could not read GR/IR settings from DB, using standard KSA compliance fallbacks', { err });
      return {
        toleranceAmount: 10.00,
        tolerancePercent: 2.0,
        autoClearEnabled: false
      };
    }
  }

  /**
   * Generates a 100% read-only / preview reconciliation report across KSA subledgers
   * Enforces absolute tenant isolation and zero DB write side-effects.
   */
  static async generateReport(tenantId: string, asOf?: Date): Promise<GRIRReport> {
    const asOfDate = asOf ?? new Date();

    // 1. Fetch settings
    const settings = await this.getGRIRSettings(tenantId);

    // 2. Fetch purchase orders with details and goods receipts
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      include: {
        supplier: { select: { name: true } },
        details: {
          select: {
            productId: true,
            quantity: true,
            price: true,
            total: true,
          }
        },
        goodsReceipts: {
          where: {
            status: { not: 'CANCELLED' }
          },
          include: {
            details: {
              select: {
                productId: true,
                quantity: true,
                acceptedQty: true,
              }
            }
          }
        }
      }
    }).catch((err) => {
      log.error('Error fetching purchase orders for GR/IR', { err, tenantId });
      return [];
    }) as unknown as POWithDetails[];

    const poIds = pos.map(p => p.id);

    // 3. Fetch purchase invoices linked to these purchase orders
    const invoices = poIds.length > 0 ? await prisma.purchaseInvoice.findMany({
      where: {
        purchaseOrderId: { in: poIds },
        tenantId,
        deletedAt: null,
        status: { not: 'CANCELLED' },
      },
      include: {
        details: {
          select: {
            productId: true,
            quantity: true,
            price: true,
            total: true,
          }
        }
      }
    }).catch((err) => {
      log.error('Error fetching purchase invoices for GR/IR', { err, tenantId });
      return [];
    }) as unknown as InvoiceWithDetails[] : [];

    const lines: GRIRLine[] = [];

    // 4. Match and compare in-memory
    for (const po of pos) {
      const poDetails = po.details || [];
      const grns = po.goodsReceipts || [];
      const poInvoices = invoices.filter(i => i.purchaseOrderId === po.id);

      // Quantities & value aggregates per product
      const productMetrics = new Map<number, {
        poPrice: number;
        poQty: number;
        receivedQty: number;
        invoicedQty: number;
        invoicedValue: number;
      }>();

      // Initialize with PO details
      for (const item of poDetails) {
        productMetrics.set(item.productId, {
          poPrice: Number(item.price || 0),
          poQty: Number(item.quantity || 1),
          receivedQty: 0,
          invoicedQty: 0,
          invoicedValue: 0
        });
      }

      // Aggregate received quantities from GRNs
      for (const grn of grns) {
        for (const detail of (grn.details || [])) {
          const metrics = productMetrics.get(detail.productId) || {
            poPrice: 0,
            poQty: 0,
            receivedQty: 0,
            invoicedQty: 0,
            invoicedValue: 0
          };
          // Sum up accepted quantity (standard receipt)
          metrics.receivedQty += Number(detail.acceptedQty || detail.quantity || 0);
          productMetrics.set(detail.productId, metrics);
        }
      }

      // Aggregate invoiced quantities and values from Purchase Invoices
      for (const inv of poInvoices) {
        for (const detail of (inv.details || [])) {
          const metrics = productMetrics.get(detail.productId) || {
            poPrice: Number(detail.price || 0),
            poQty: Number(detail.quantity || 0),
            receivedQty: 0,
            invoicedQty: 0,
            invoicedValue: 0
          };
          metrics.invoicedQty += Number(detail.quantity || 0);
          metrics.invoicedValue += Number(detail.total || (Number(detail.quantity) * Number(detail.price)) || 0);
          productMetrics.set(detail.productId, metrics);
        }
      }

      // Calculate total GRN amount and total Invoice amount for this PO
      let grnTotal = 0;
      let invoiceTotal = 0;
      let totalReceivedQty = 0;
      let totalInvoicedQty = 0;
      let isPriceVariance = false;
      let isQtyVariance = false;

      for (const [, metrics] of productMetrics.entries()) {
        const receivedVal = metrics.receivedQty * metrics.poPrice;
        grnTotal += receivedVal;
        invoiceTotal += metrics.invoicedValue;
        totalReceivedQty += metrics.receivedQty;
        totalInvoicedQty += metrics.invoicedQty;

        // Check for line item variances
        if (metrics.receivedQty !== metrics.invoicedQty) {
          isQtyVariance = true;
        }

        // Calculate average invoice price for this product
        const avgInvPrice = metrics.invoicedQty > 0 ? (metrics.invoicedValue / metrics.invoicedQty) : 0;
        if (metrics.invoicedQty > 0 && Math.abs(avgInvPrice - metrics.poPrice) > 0.01) {
          isPriceVariance = true;
        }
      }

      const balance = grnTotal - invoiceTotal;
      const absBalance = Math.abs(balance);

      // Skip fully matched items with zero balances
      if (absBalance < 0.01 && totalReceivedQty > 0 && totalInvoicedQty > 0) {
        // MATCHED
        const latestGRN = grns.sort((a: { date: Date }, b: { date: Date }) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const latestInvoice = poInvoices.sort((a: { date: Date }, b: { date: Date }) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        lines.push({
          poId: po.id,
          poNumber: po.orderNo ? `PO-${po.orderNo}` : `PO-${po.id}`,
          vendorName: po.supplier?.name || '',
          grnDate: latestGRN?.date?.toISOString()?.split('T')[0],
          invoiceDate: latestInvoice?.date?.toISOString()?.split('T')[0],
          grnAmount: Math.round(grnTotal * 100) / 100,
          invoiceAmount: Math.round(invoiceTotal * 100) / 100,
          balance: 0,
          ageingDays: 0,
          bucket: '0-30',
          status: 'MATCHED',
          isPriceVariance: false,
          isQtyVariance: false,
          isUnderInvoiced: false,
          isOverInvoiced: false,
          clearableWithinTolerance: true,
          blockedOverTolerance: false,
          totalReceivedQty,
          totalInvoicedQty
        });
        continue;
      }

      // Determine date and age
      const latestGRN = grns.sort((a: { date: Date }, b: { date: Date }) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const latestInvoice = poInvoices.sort((a: { date: Date }, b: { date: Date }) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const referenceDate = latestGRN?.date || latestInvoice?.date || po.date || asOfDate;
      const ageingDays = Math.max(0, Math.floor((asOfDate.getTime() - new Date(referenceDate).getTime()) / 86_400_000));

      const isUnderInvoiced = invoiceTotal < grnTotal;
      const isOverInvoiced = invoiceTotal > grnTotal;

      // Tolerance Calculations
      const variancePct = grnTotal > 0 ? (absBalance / grnTotal) * 100 : 100;
      const clearableWithinTolerance = absBalance <= settings.toleranceAmount && variancePct <= settings.tolerancePercent;
      const blockedOverTolerance = !clearableWithinTolerance;

      // Classify Primary Match Status
      let status: GRIRMatchStatus = 'PENDING_CLEARING';

      if (grnTotal > 0 && invoiceTotal === 0) {
        status = 'PENDING_CLEARING';
      } else if (grnTotal === 0 && invoiceTotal > 0) {
        status = 'PENDING_CLEARING';
      } else if (clearableWithinTolerance) {
        status = 'CLEARABLE_WITHIN_TOLERANCE';
      } else if (blockedOverTolerance) {
        status = 'BLOCKED_OVER_TOLERANCE';
      } else if (isPriceVariance) {
        status = 'PRICE_VARIANCE';
      } else if (isQtyVariance) {
        status = 'QTY_VARIANCE';
      } else if (isUnderInvoiced) {
        status = 'UNDER_INVOICED';
      } else if (isOverInvoiced) {
        status = 'OVER_INVOICED';
      }

      lines.push({
        poId: po.id,
        poNumber: po.orderNo ? `PO-${po.orderNo}` : `PO-${po.id}`,
        vendorName: po.supplier?.name || '',
        grnDate: latestGRN?.date?.toISOString()?.split('T')[0],
        invoiceDate: latestInvoice?.date?.toISOString()?.split('T')[0],
        grnAmount: Math.round(grnTotal * 100) / 100,
        invoiceAmount: Math.round(invoiceTotal * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        ageingDays,
        bucket: this.bucketDays(ageingDays),
        status,
        isPriceVariance,
        isQtyVariance,
        isUnderInvoiced,
        isOverInvoiced,
        clearableWithinTolerance,
        blockedOverTolerance,
        totalReceivedQty,
        totalInvoicedQty
      });
    }

    // Sort by absolute balance descending to highlight discrepancies first
    lines.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    const totalPositive = lines.filter(l => l.balance > 0).reduce((s, l) => s + l.balance, 0);
    const totalNegative = lines.filter(l => l.balance < 0).reduce((s, l) => s + l.balance, 0);
    const totalBalance = totalPositive + totalNegative;
    const matchedCount = lines.filter(l => l.status === 'MATCHED').length;
    const unmatchedCount = lines.filter(l => l.status !== 'MATCHED').length;

    // Suggested accrual: Positive balances older than 30 days (received, no invoice)
    const suggestedAccrual = lines
      .filter(l => l.balance > 0 && l.ageingDays > 30)
      .reduce((s, l) => s + l.balance, 0);

    return {
      asOf: asOfDate.toISOString().split('T')[0],
      tenantId,
      lines,
      totalPositive: Math.round(totalPositive * 100) / 100,
      totalNegative: Math.round(totalNegative * 100) / 100,
      totalBalance: Math.round(totalBalance * 100) / 100,
      matchedCount,
      unmatchedCount,
      suggestedAccrual: Math.round(suggestedAccrual * 100) / 100,
      toleranceAmount: settings.toleranceAmount,
      tolerancePercent: settings.tolerancePercent,
      autoClearEnabled: settings.autoClearEnabled,
      generatedAt: new Date(),
    };
  }
}
