/**
 * ThreeWayMatchService — مطابقة أمر الشراء / إذن الاستلام / الفاتورة
 *
 * النماذج: ThreeWayMatch, ThreeWayMatchLine, PurchaseOrder, GoodsReceiptNote, PurchaseInvoice
 *
 * المنطق:
 *  PO (الكمية المطلوبة + السعر المتفق عليه)
 *  GRN (الكمية المستلمة فعلياً)
 *  Invoice (الكمية والسعر المطالب بهم)
 *
 *  الحالات:
 *  MATCHED  — الثلاثة متطابقة في الحدود المسموحة
 *  PRICE_VARIANCE — سعر الفاتورة يختلف عن أمر الشراء
 *  QTY_VARIANCE   — كمية الفاتورة تختلف عن المستلم
 *  BLOCKED        — فارق يتجاوز الحد المسموح → لا يُدفع حتى الحل
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface MatchLineResult {
  productId: number;
  poQty: Decimal;
  poPrice: Decimal;
  grnQty: Decimal;
  invoiceQty: Decimal;
  invoicePrice: Decimal;
  priceVariancePct: Decimal;
  qtyVariancePct: Decimal;
  priceMatched: boolean;
  qtyMatched: boolean;
}

export type MatchStatus = 'MATCHED' | 'PRICE_VARIANCE' | 'QTY_VARIANCE' | 'BLOCKED';

export interface ThreeWayMatchResult {
  matchId?: number;
  invoiceId: number;
  poId: number;
  status: MatchStatus;
  lines: MatchLineResult[];
  totalPoAmount: Decimal;
  totalGrnAmount: Decimal;
  totalInvoiceAmount: Decimal;
  canPay: boolean;
}

// هوامش التسامح الافتراضية
const DEFAULT_PRICE_TOLERANCE_PCT = 2;  // 2% فارق في السعر مقبول
const DEFAULT_QTY_TOLERANCE_PCT   = 0;  // لا فارق مقبول في الكمية

export class ThreeWayMatchService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * تشغيل المطابقة الثلاثية لفاتورة شراء
   */
  async match(
    invoiceId: number,
    priceTolerance = DEFAULT_PRICE_TOLERANCE_PCT,
    qtyTolerance   = DEFAULT_QTY_TOLERANCE_PCT,
  ): Promise<ThreeWayMatchResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // 1. جلب الفاتورة والـ PO المرتبط
    const invoice = await prisma.purchaseInvoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        details: { include: { product: true } },
        purchaseOrder: {
          include: { details: true },
        },
      },
    });
    if (!invoice) throw new Error(`الفاتورة ${invoiceId} غير موجودة`);
    if (!invoice.purchaseOrder) throw new Error('الفاتورة غير مرتبطة بأمر شراء');

    const po = invoice.purchaseOrder;

    // 2. جلب أذون الاستلام المرتبطة بالـ PO
    const grns = await prisma.goodsReceiptNote.findMany({
      where: { tenantId, purchaseOrderId: po.id, status: { in: ['RECEIVED', 'POSTED'] } },
      include: { details: true },
    });

    // 3. تجميع كميات GRN لكل منتج
    const grnQtyByProduct = new Map<number, Decimal>();
    for (const grn of grns) {
      for (const line of grn.details) {
        const existing = grnQtyByProduct.get(line.productId) ?? new Decimal(0);
        grnQtyByProduct.set(line.productId, existing.add(new Decimal(line.quantity)));
      }
    }

    // 4. فهرسة الـ PO لكل منتج
    const poByProduct = new Map<number, { quantity: Decimal; unitPrice: Decimal }>();
    for (const line of po.details) {
      poByProduct.set(line.productId, {
        quantity: new Decimal(line.quantity),
        unitPrice: new Decimal(line.unitPrice),
      });
    }

    // 5. مطابقة كل سطر في الفاتورة
    const lines: MatchLineResult[] = [];
    let allMatched = true;
    let hasBlocker = false;

    for (const invLine of invoice.details) {
      const pid = invLine.productId;
      const poLine = poByProduct.get(pid) ?? { quantity: new Decimal(0), unitPrice: new Decimal(0) };
      const grnQty = grnQtyByProduct.get(pid) ?? new Decimal(0);
      const invQty   = new Decimal(invLine.quantity);
      const invPrice = new Decimal(invLine.unitPrice);

      const priceVariancePct = poLine.unitPrice.isZero()
        ? new Decimal(0)
        : invPrice.sub(poLine.unitPrice).div(poLine.unitPrice).mul(100).abs();

      const qtyVariancePct = grnQty.isZero()
        ? new Decimal(100)
        : invQty.sub(grnQty).div(grnQty).mul(100).abs();

      const priceMatched = priceVariancePct.lte(priceTolerance);
      const qtyMatched   = qtyVariancePct.lte(qtyTolerance);

      if (!priceMatched || !qtyMatched) allMatched = false;
      if (priceVariancePct.gt(10) || qtyVariancePct.gt(10)) hasBlocker = true;

      lines.push({
        productId: pid,
        poQty: poLine.quantity,
        poPrice: poLine.unitPrice,
        grnQty,
        invoiceQty: invQty,
        invoicePrice: invPrice,
        priceVariancePct,
        qtyVariancePct,
        priceMatched,
        qtyMatched,
      });
    }

    // 6. تحديد الحالة الإجمالية
    let status: MatchStatus;
    if (allMatched) {
      status = 'MATCHED';
    } else if (hasBlocker) {
      status = 'BLOCKED';
    } else if (lines.some((l) => !l.priceMatched)) {
      status = 'PRICE_VARIANCE';
    } else {
      status = 'QTY_VARIANCE';
    }

    const totalPoAmount     = po.details.reduce((s: Decimal, l: any) => s.add(new Decimal(l.totalAmount)), new Decimal(0));
    const totalGrnAmount    = [...grnQtyByProduct.entries()].reduce((s, [pid, qty]) => {
      const price = poByProduct.get(pid)?.unitPrice ?? new Decimal(0);
      return s.add(qty.mul(price));
    }, new Decimal(0));
    const totalInvoiceAmount = new Decimal(invoice.totalAmount ?? 0);

    // 7. حفظ نتيجة المطابقة
    const existing = await prisma.threeWayMatch.findUnique({ where: { invoiceId } });
    let matchId: number | undefined;

    if (!existing) {
      const saved = await prisma.threeWayMatch.create({
        data: {
          tenantId,
          invoiceId,
          purchaseOrderId: po.id,
          poTotalAmount: totalPoAmount,
          poTotalQuantity: new Decimal(0),
          grnTotalAmount: totalGrnAmount,
          grnTotalQuantity: new Decimal(0),
          invoiceTotalAmount: totalInvoiceAmount,
          invoiceTotalQuantity: new Decimal(0),
          status,
          matchedAt: new Date(),
          lines: {
            create: lines.map((l) => ({
              tenantId,
              productId: l.productId,
              poQuantity: l.poQty,
              poUnitPrice: l.poPrice,
              grnQuantity: l.grnQty,
              invoiceQuantity: l.invoiceQty,
              invoiceUnitPrice: l.invoicePrice,
              priceMatched: l.priceMatched,
              qtyMatched: l.qtyMatched,
            })),
          },
        },
      });
      matchId = saved.id;
    } else {
      await prisma.threeWayMatch.update({
        where: { invoiceId },
        data: { status, matchedAt: new Date() },
      });
      matchId = existing.id;
    }

    return {
      matchId,
      invoiceId,
      poId: po.id,
      status,
      lines,
      totalPoAmount,
      totalGrnAmount,
      totalInvoiceAmount,
      canPay: status === 'MATCHED' || status === 'PRICE_VARIANCE',
    };
  }
}
