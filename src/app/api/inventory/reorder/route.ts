/**
 * Inventory Reorder API
 * GET  /api/inventory/reorder?format=json|csv      — Reorder report (below ROP)
 * GET  /api/inventory/reorder?action=alerts        — Critical items only
 * POST /api/inventory/reorder { action: 'generate-po', productIds: [...] }
 */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ReorderEngine } from '@/lib/reorder-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.inventory.reorder' });

export const GET = withRoute(async ({ req, prisma, auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const action   = searchParams.get('action');
    const format   = searchParams.get('format') || 'json';
    const stockId  = searchParams.get('stockId') ? parseInt(searchParams.get('stockId')!) : undefined;
    const category = searchParams.get('category');

    // Critical alerts (qty = 0)
    if (action === 'alerts') {
      const critical = await prisma.product.findMany({
        where: {
          deletedAt: null,
          currentStock:  { lte: 0 },
        },
        select: {
          id: true, name: true, barcode: true,
          currentStock: true, minQuantity: true,
        },
        take: 100,
        orderBy: { name: 'asc' },
      }).catch(() => [] as any[]);

      return NextResponse.json({
        count:    critical.length,
        critical,
        message:  critical.length === 0 ? 'لا توجد منتجات نفد مخزونها' : `${critical.length} منتج نفد مخزونه`,
      });
    }

    // Full reorder report using engine
    const report = await ReorderEngine.evaluate(prisma).catch(async () => {
      // Fallback: query products below minQuantity (reorder point)
      const prods = await prisma.product.findMany({
        where: {
          deletedAt: null,
          minQuantity: { gt: 0 },
        },
        select: {
          id: true, name: true, barcode: true,
          currentStock: true, minQuantity: true, buyPrice: true,
        },
        take: 300,
      });

      return prods
        .filter((p: any) => Number(p.currentStock) <= Number(p.minQuantity))
        .map((p: any) => ({
          productId:    p.id,
          productName:  p.name,
          barcode:      p.barcode,
          currentQty:   Number(p.currentStock),
          reorderLevel: Number(p.minQuantity),
          deficit:      Math.max(0, Number(p.minQuantity) - Number(p.currentStock)),
          unitCost:     Number(p.buyPrice || 0),
        }));
    });

    if (format === 'csv') {
      const header = 'Product ID,Name,Category,Current Qty,Reorder Level,Deficit,Unit Cost\n';
      const rows   = (report as any[]).map((r: any) =>
        `${r.productId},"${r.productName}","${r.category || ''}",${r.currentQty},${r.reorderLevel},${r.deficit},${r.unitCost}`
      ).join('\n');
      return new NextResponse(header + rows, {
        headers: {
          'Content-Type':        'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reorder-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      count:    (report as any[]).length,
      items:    report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    log.error('Reorder GET error:', error);
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 });
  }
}, { rateLimit: 'DEFAULT', tenantRequired: true });

export const POST = withRoute(async ({ req, prisma, auth }) => {
  try {
    const body   = await req.json();
    const action = body.action;

    // Auto-generate Purchase Order for reorder items
    if (action === 'generate-po') {
      const { productIds, supplierId, stockId } = body;
      if (!productIds?.length) {
        return NextResponse.json({ error: 'productIds مطلوب' }, { status: 400 });
      }

      const products = await prisma.product.findMany({
        where: { id: { in: productIds.map(Number) }, deletedAt: null },
        select: {
          id: true, name: true, minQuantity: true,
          currentStock: true, buyPrice: true, taxRate: true,
        },
      });

      const details = products.map((p: any) => {
        const deficit = Math.max(1, Number(p.minQuantity || 10) - Number(p.currentStock || 0));
        const price   = Number(p.buyPrice || 0);
        const taxRate = Number(p.taxRate || 15);
        const taxValue = price * deficit * (taxRate / 100);
        return {
          productId:    p.id,
          productName:  p.name,
          quantity:     deficit,
          price,
          taxRate,
          taxValue:     Math.round(taxValue * 100) / 100,
          total:        Math.round((price * deficit + taxValue) * 100) / 100,
        };
      });

      const grandTotal  = details.reduce((s: number, d: any) => s + d.total, 0);
      const grandTax    = details.reduce((s: number, d: any) => s + d.taxValue, 0);

      return NextResponse.json({
        success: true,
        draftPO: {
          supplierId:  supplierId || null,
          stockId:     stockId    || 1,
          date:        new Date().toISOString().split('T')[0],
          details,
          subtotal:    Math.round((grandTotal - grandTax) * 100) / 100,
          taxValue:    Math.round(grandTax * 100) / 100,
          total:       Math.round(grandTotal * 100) / 100,
          notes:       'أمر شراء تلقائي من محرك إعادة الطلب',
        },
      });
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('Reorder POST error:', error);
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 });
  }
}, { rateLimit: 'DEFAULT', tenantRequired: true });
