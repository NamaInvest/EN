import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { fifo, lifo, weightedAverage, CostLayer } from '@/lib/costing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/costing — حساب تكلفة المخزون بطرق مختلفة
 * ?productId=1&method=fifo|lifo|average
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
      where: { productId },
      include: { invoice: { select: { date: true, invoiceNo: true } } },
      orderBy: { id: 'asc' },
    });

    const layers: CostLayer[] = purchaseDetails.map(d => ({
      qty: d.quantity,
      unitCost: d.price,
      date: d.invoice?.date || new Date(),
    }));

    if (layers.length === 0) {
      // لا توجد حركات شراء — نرجع سعر الشراء المخزن
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, buyPrice: true, currentStock: true },
      });
      return NextResponse.json({
        productId,
        method,
        layers: [],
        result: {
          totalCost: (product?.buyPrice || 0) * (product?.currentStock || 0),
          unitCost: product?.buyPrice || 0,
          availableStock: product?.currentStock || 0,
        },
        message: 'لا توجد حركات شراء — تم استخدام سعر الشراء المخزن',
      });
    }

    // 2. حساب التكلفة حسب الطريقة المطلوبة
    let result;
    switch (method) {
      case 'fifo':
        result = fifo(layers, sellQty || undefined);
        break;
      case 'lifo':
        result = lifo(layers, sellQty || undefined);
        break;
      case 'average':
      default:
        result = weightedAverage(layers, sellQty || undefined);
        break;
    }

    // 3. مقارنة الطرق الثلاث
    const comparison = {
      fifo: fifo(layers, sellQty || undefined),
      lifo: lifo(layers, sellQty || undefined),
      average: weightedAverage(layers, sellQty || undefined),
    };

    return NextResponse.json({
      productId,
      method,
      selectedResult: result,
      comparison,
      layers: layers.map(l => ({
        qty: l.qty,
        unitCost: l.unitCost,
        date: l.date,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
