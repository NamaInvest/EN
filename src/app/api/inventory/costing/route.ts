import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fifoCost, lifoCost, averageCost, calculateCost, CostBatch } from '@/lib/costing';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/costing — حساب تكلفة المخزون بطرق مختلفة
 * ?productId=1&method=fifo|lifo|average&qty=10
 */
export async function GET(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const productId = parseInt(searchParams.get('productId') || '0');
    const method = searchParams.get('method') || 'average';
    const sellQty = parseFloat(searchParams.get('qty') || '0');

    if (!productId) {
      return NextResponse.json({ error: 'معرف المنتج مطلوب' }, { status: 400 });
    }

    // 1. جلب جميع حركات الشراء (طبقات التكلفة)
    const purchaseDetails = await prisma.purchaseInvoiceDetail.findMany({
            take: 100,
      where: { productId },
      include: { invoice: { select: { date: true, invoiceNo: true } } },
      orderBy: { id: 'asc' },
    });

    const layers: CostBatch[] = purchaseDetails.map((d, i) => ({
      id: d.id || i + 1,
      quantity: n(d.quantity),
      unitCost: n(d.price),
      date: d.invoice?.date || new Date(),
    }));

    if (layers.length === 0) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, buyPrice: true, currentStock: true },
      });
      return NextResponse.json({
        productId,
        method,
        layers: [],
        result: {
          totalCost: (n(product?.buyPrice) || 0) * (n(product?.currentStock) || 0),
          unitCost: n(product?.buyPrice),
          availableStock: n(product?.currentStock),
        },
        message: 'لا توجد حركات شراء — تم استخدام سعر الشراء المخزن',
      });
    }

    // 2. حساب التكلفة حسب الطريقة المطلوبة
    const qty = sellQty || layers.reduce((s: any, l: any) => s + l.quantity, 0);
    const result = calculateCost(method as any, layers, qty);

    // 3. مقارنة الطرق الثلاث
    const comparison = {
      fifo: calculateCost('fifo', layers, qty),
      lifo: calculateCost('lifo', layers, qty),
      average: calculateCost('average', layers, qty),
    };

    return NextResponse.json({
      productId,
      method,
      sellQty: qty,
      selectedResult: result,
      comparison,
      layers: layers.map(l => ({
        id: l.id,
        qty: l.quantity,
        unitCost: l.unitCost,
        date: l.date,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

