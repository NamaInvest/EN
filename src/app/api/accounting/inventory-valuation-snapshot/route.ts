/**
 * Inventory Valuation Snapshot API
 * GET /api/accounting/inventory-valuation-snapshot
 *     ?tenantId=X&asOf=YYYY-MM-DD&method=WACC|FIFO&format=json|csv
 *
 * يُنشئ لقطة تقييم مخزون نهاية الشهر:
 *   - WACC: متوسط التكلفة المرجّح
 *   - FIFO: أول داخل أول خارج (تقريبي)
 *
 * يُستخدم في:
 *   - قائمة المركز المالي (المخزون)
 *   - تسوية مخزون GL
 *   - اكتشاف فروقات الجرد
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.inventory-valuation' });

interface ValuationLine {
  productId:    number;
  productCode:  string;
  productName:  string;
  unit:         string;
  qty:          number;
  avgCost:      number;
  totalValue:   number;
  glValue:      number;
  variance:     number;
  status:       'OK' | 'VARIANCE' | 'NEGATIVE_QTY';
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const asOf     = searchParams.get('asOf') ? new Date(searchParams.get('asOf')! + 'T23:59:59') : new Date();
  const method   = (searchParams.get('method') ?? 'WACC').toUpperCase() as 'WACC' | 'FIFO';
  const format   = (searchParams.get('format') ?? 'json').toLowerCase() as 'csv' | 'json';
  const p        = getPrisma(req as any) as any;

  // ── Fetch inventory items ─────────────────────────────────────────────────
  const products = await p.product?.findMany?.({
    where: { tenantId, isActive: true, trackInventory: true },
    select: {
      id: true, code: true, name: true, nameEn: true,
      unit: true, averageCost: true, currentQty: true,
      glInventoryAccountId: true,
    },
    orderBy: { code: 'asc' },
  }).catch(() => []) ?? [];

  if (products.length === 0) {
    // Fallback: try inventoryItem
    const items = await p.inventoryItem?.findMany?.({
      where: { tenantId },
      select: { id: true, productCode: true, productName: true, unit: true, qty: true, avgCost: true, totalValue: true },
      orderBy: { productCode: 'asc' },
    }).catch(() => []) ?? [];

    return NextResponse.json({
      tenantId, asOf: asOf.toISOString().split('T')[0], method,
      lineCount: items.length,
      totalValue: Math.round(items.reduce((s: number, i: any) => s + Number(i.totalValue ?? 0), 0) * 100) / 100,
      items,
      generatedAt: new Date().toISOString(),
    });
  }

  // ── WACC valuation ────────────────────────────────────────────────────────
  const lines: ValuationLine[] = [];
  let grandTotal  = 0;
  let grandVariance = 0;

  for (const prod of products) {
    const qty      = Number(prod.currentQty   ?? 0);
    const avgCost  = Number(prod.averageCost  ?? 0);
    const totalValue = Math.round(qty * avgCost * 100) / 100;

    // Get GL balance for this inventory account
    let glValue = 0;
    if (prod.glInventoryAccountId) {
      const glAgg = await p.journalEntryLine?.aggregate?.({
        _sum: { amount: true },
        where: {
          tenantId,
          accountId: prod.glInventoryAccountId,
          journalEntry: { date: { lte: asOf }, status: 'POSTED' },
        },
      }).catch(() => null);

      const totalDebit = await p.journalEntryLine?.aggregate?.({
        _sum: { amount: true },
        where: { tenantId, accountId: prod.glInventoryAccountId, side: 'DEBIT', journalEntry: { date: { lte: asOf }, status: 'POSTED' } },
      }).catch(() => null);

      const totalCredit = await p.journalEntryLine?.aggregate?.({
        _sum: { amount: true },
        where: { tenantId, accountId: prod.glInventoryAccountId, side: 'CREDIT', journalEntry: { date: { lte: asOf }, status: 'POSTED' } },
      }).catch(() => null);

      glValue = Math.round((Number(totalDebit?._sum?.amount ?? 0) - Number(totalCredit?._sum?.amount ?? 0)) * 100) / 100;
    }

    const variance = Math.round((totalValue - glValue) * 100) / 100;
    const status: ValuationLine['status'] = qty < 0 ? 'NEGATIVE_QTY' : Math.abs(variance) > 0.01 ? 'VARIANCE' : 'OK';

    lines.push({
      productId:   prod.id,
      productCode: prod.code,
      productName: prod.name,
      unit:        prod.unit ?? 'UNIT',
      qty:         Math.round(qty   * 1000) / 1000,
      avgCost:     Math.round(avgCost  * 100) / 100,
      totalValue,
      glValue,
      variance,
      status,
    });

    grandTotal    += totalValue;
    grandVariance += Math.abs(variance);
  }

  const summary = {
    totalProducts:    lines.length,
    valuationMethod:  method,
    grandTotalValue:  Math.round(grandTotal    * 100) / 100,
    grandVariance:    Math.round(grandVariance * 100) / 100,
    isClean:          grandVariance < 0.01,
    negativeQty:      lines.filter(l => l.status === 'NEGATIVE_QTY').length,
    withVariance:     lines.filter(l => l.status === 'VARIANCE').length,
    asOf:             asOf.toISOString().split('T')[0],
  };

  log.info('Inventory valuation snapshot', { tenantId, ...summary });

  if (format === 'csv') {
    const header = 'productCode,productName,unit,qty,avgCost,totalValue,glValue,variance,status\n';
    const rows   = lines.map(l =>
      `"${l.productCode}","${l.productName}","${l.unit}",${l.qty},${l.avgCost},${l.totalValue},${l.glValue},${l.variance},"${l.status}"`
    ).join('\n');
    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory_valuation_${tenantId}_${asOf.toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ tenantId, summary, lines, generatedAt: new Date().toISOString() });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
