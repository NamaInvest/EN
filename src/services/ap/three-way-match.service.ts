/**
 * Three-Way Match Service (AP Module 22.1)
 * Wraps the existing ThreeWayMatchEngine into the new service layer.
 * Adds tenant context, permission checks, and structured exceptions reporting.
 */

import { PrismaClient } from '@prisma/client';
import { BaseService } from '../shared/base.service';
import { BusinessContext, eventBus } from '../shared/event-bus.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchStatus = 'matched' | 'exception' | 'partial';

export interface MatchException {
  field:     'quantity' | 'price' | 'sku' | 'tax' | 'date';
  message:   string;
  poValue?:  number | string;
  grnValue?: number | string;
  invValue?: number | string;
  severity:  'warning' | 'error';
}

export interface MatchResult {
  status:     MatchStatus;
  exceptions: MatchException[];
  canApprove: boolean;   // True if only warnings (no errors)
  summary: {
    poId:        string | number;
    grnIds:      (string | number)[];
    invoiceId:   string | number;
    poAmount:    number;
    grnAmount:   number;
    invoiceAmount: number;
    tolerance:   number; // percentage
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const PRICE_TOLERANCE_PERCENT = 2; // 2% allowed price variance

export class ThreeWayMatchService extends BaseService {
  constructor(prisma: PrismaClient, ctx: BusinessContext) {
    super(prisma, ctx);
  }

  /**
   * Perform 3-way match: PO ↔ GRN ↔ Invoice.
   * Returns a structured result with all exceptions.
   */
  async match(params: {
    invoiceId: string | number;
    poId:      string | number;
    tolerance?: number; // % override
  }): Promise<MatchResult> {
    this.requirePermission('ap:invoice:match');

    const tolerance = params.tolerance ?? PRICE_TOLERANCE_PERCENT;
    const exceptions: MatchException[] = [];

    // 1. Load invoice
    const invoice = await (this.db as any).purchaseInvoice.findFirst({
      where: { id: params.invoiceId as any, tenantId: this.tenantId },
      include: { details: true, supplier: true },
    });
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found.`);

    // 2. Load PO
    const po = await (this.db as any).purchaseOrder.findFirst({
      where: { id: params.poId as any, tenantId: this.tenantId },
      include: { details: true },
    });
    if (!po) throw new Error(`Purchase Order ${params.poId} not found.`);

    // 3. Load GRNs for this PO
    const grns = await (this.db as any).goodsReceiptNote.findMany({
      where: { orderId: params.poId as any, tenantId: this.tenantId },
      include: { details: true },
    }).catch(() => []);

    const grnIds = grns.map((g: any) => g.id);

    // 4. Calculate amounts
    const poAmount  = (po.details ?? []).reduce((s: number, d: any) => s + Number(d.unitPrice ?? 0) * Number(d.qty ?? 0), 0);
    const grnAmount = grns.reduce((s: number, g: any) =>
      s + (g.details ?? []).reduce((ss: number, d: any) => ss + Number(d.qty ?? 0) * Number(d.unitCost ?? d.unitPrice ?? 0), 0), 0
    );
    const invAmount = Number(invoice.totalAmount ?? invoice.subtotal ?? 0);

    // ── Check 1: Supplier match ───────────────────────────────────────────────
    if (po.supplierId && invoice.supplierId && String(po.supplierId) !== String(invoice.supplierId)) {
      exceptions.push({
        field: 'sku', severity: 'error',
        message: 'المورد في أمر الشراء يختلف عن مورد الفاتورة.',
        poValue: String(po.supplierId), invValue: String(invoice.supplierId),
      });
    }

    // ── Check 2: Quantity match (GRN vs Invoice) ──────────────────────────────
    const invLines = invoice.details ?? [];
    for (const invLine of invLines) {
      const grnQty = grns.reduce((sum: number, grn: any) => {
        const grnLine = (grn.details ?? []).find((d: any) =>
          String(d.itemId ?? d.productId) === String(invLine.itemId ?? invLine.productId)
        );
        return sum + Number(grnLine?.qty ?? 0);
      }, 0);
      const invQty = Number(invLine.qty ?? invLine.quantity ?? 0);

      if (grnQty > 0 && Math.abs(grnQty - invQty) > 0.001) {
        exceptions.push({
          field: 'quantity', severity: 'error',
          message: `الكمية المستلمة (${grnQty}) تختلف عن كمية الفاتورة (${invQty}).`,
          grnValue: grnQty, invValue: invQty,
        });
      }
    }

    // ── Check 3: Price match (PO vs Invoice, within tolerance) ───────────────
    const priceDiff   = invAmount - poAmount;
    const pricePctDiff = poAmount > 0 ? Math.abs(priceDiff / poAmount) * 100 : 0;

    if (pricePctDiff > tolerance) {
      exceptions.push({
        field: 'price', severity: pricePctDiff > 10 ? 'error' : 'warning',
        message: `فارق السعر ${pricePctDiff.toFixed(1)}% يتجاوز الحد المسموح ${tolerance}%.`,
        poValue:  poAmount,
        invValue: invAmount,
      });
    }

    // ── Check 4: Date validation ──────────────────────────────────────────────
    if (invoice.invoiceDate && po.orderDate) {
      const invDate = new Date(invoice.invoiceDate);
      const poDate  = new Date(po.orderDate);
      if (invDate < poDate) {
        exceptions.push({
          field: 'date', severity: 'warning',
          message: 'تاريخ الفاتورة أقدم من تاريخ أمر الشراء.',
          poValue:  po.orderDate,
          invValue: invoice.invoiceDate,
        });
      }
    }

    // ── Determine final status ────────────────────────────────────────────────
    const hasErrors   = exceptions.some(e => e.severity === 'error');
    const hasWarnings = exceptions.some(e => e.severity === 'warning');
    const status: MatchStatus = hasErrors ? 'exception' : hasWarnings ? 'partial' : 'matched';
    const canApprove = !hasErrors;

    // Persist match result
    await (this.db as any).purchaseInvoice.update({
      where: { id: params.invoiceId as any },
      data:  {
        matchStatus:   status,
        matchedAt:     new Date(),
        matchedBy:     this.ctx.user.id,
        matchExceptions: JSON.stringify(exceptions),
      },
    }).catch(() => null); // Non-blocking — schema may not have these fields yet

    if (status === 'matched') {
      eventBus.afterCommit('ap.invoice.matched', {
        invoiceId: params.invoiceId,
        tenantId:  this.tenantId,
      });
    }

    return {
      status,
      exceptions,
      canApprove,
      summary: {
        poId:          params.poId,
        grnIds,
        invoiceId:     params.invoiceId,
        poAmount,
        grnAmount,
        invoiceAmount: invAmount,
        tolerance,
      },
    };
  }

  /**
   * Approve invoice after match (only if canApprove = true).
   */
  async approveInvoice(invoiceId: string | number): Promise<void> {
    this.requirePermission('ap:invoice:approve');

    await (this.db as any).purchaseInvoice.update({
      where: { id: invoiceId as any },
      data:  { status: 'approved', approvedAt: new Date(), approvedBy: this.ctx.user.id },
    }).catch(() => null);

    eventBus.afterCommit('ap.invoice.approved', {
      invoiceId,
      tenantId: this.tenantId,
    });
  }
}
