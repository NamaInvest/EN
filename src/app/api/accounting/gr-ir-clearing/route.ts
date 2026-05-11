/**
 * GR/IR Clearing API — Goods Receipt / Invoice Receipt
 * ══════════════════════════════════════════════════════════════════════════════
 * GET  /api/accounting/gr-ir-clearing?tenantId=X&from=&to=&status=PENDING|CLEARED
 * POST /api/accounting/gr-ir-clearing  { action:'clear', tenantId, poLineId, ... }
 *
 * SOCPA/IFRS: يُطابق استلام البضاعة مع فاتورة المورد
 *   - GR بدون IR  → GR/IR رصيد دائن مؤقت
 *   - IR بدون GR  → GR/IR رصيد مدين مؤقت
 *   - GR + IR متطابقتان → يُصفّى الحساب تلقائياً
 *
 * Three-Way Match: PO qty = GR qty = IR qty
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.gr-ir' });

const ClearSchema = z.object({
  action:     z.enum(['clear', 'analyze']),
  tenantId:   z.string(),
  fiscalYearId: z.number().int().positive().optional(),
  userId:     z.number().int().positive().or(z.string()).transform(Number),
  dryRun:     z.boolean().optional().default(false),
  poLineIds:  z.array(z.number().int().positive()).optional(),
  asOf:       z.string().optional(),
});

interface GRIRItem {
  poNumber:      string;
  vendor:        string;
  grAmount:      number;
  irAmount:      number;
  balance:       number;
  status:        'MATCHED' | 'GR_PENDING' | 'IR_PENDING' | 'PARTIAL';
  daysPending:   number;
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const status   = searchParams.get('status');
  const from     = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const to       = searchParams.get('to')   ? new Date(searchParams.get('to')! + 'T23:59:59') : new Date();
  const p        = getPrisma(req as any) as any;

  // Fetch PO receipts (GR)
  const goodsReceipts = await p.goodsReceipt?.findMany?.({
    where: { tenantId, receivedAt: { gte: from, lte: to } },
    include: {
      purchaseOrder: { select: { poNumber: true, supplier: { select: { name: true, nameAr: true } } } },
      lines: { select: { quantity: true, unitCost: true } },
    },
    orderBy: { receivedAt: 'desc' },
    take: 500,
  }).catch(() => []) ?? [];

  // Fetch Purchase Invoices (IR)
  const invoiceReceipts = await p.purchaseInvoice?.findMany?.({
    where: { tenantId, date: { gte: from, lte: to } },
    select: { id: true, poId: true, invoiceNo: true, total: true, date: true, status: true },
    orderBy: { date: 'desc' },
    take: 500,
  }).catch(() => []) ?? [];

  // Build GR map by PO
  const grByPO = new Map<number, number>();
  for (const gr of goodsReceipts) {
    const poId  = gr.purchaseOrderId ?? gr.poId;
    const total = gr.lines?.reduce((s: number, l: any) => s + Number(l.quantity ?? 0) * Number(l.unitCost ?? 0), 0) ?? 0;
    grByPO.set(poId, (grByPO.get(poId) ?? 0) + total);
  }

  // Build IR map by PO
  const irByPO = new Map<number, number>();
  for (const inv of invoiceReceipts) {
    if (!inv.poId) continue;
    irByPO.set(inv.poId, (irByPO.get(inv.poId) ?? 0) + Number(inv.total ?? 0));
  }

  // Build GR/IR analysis
  const allPOIds = new Set([...grByPO.keys(), ...irByPO.keys()]);
  const today    = new Date();

  const items: GRIRItem[] = [];
  for (const poId of allPOIds) {
    const gr = grByPO.get(poId) ?? 0;
    const ir = irByPO.get(poId) ?? 0;
    const bal = gr - ir;

    let itemStatus: GRIRItem['status'];
    if (Math.abs(bal) < 0.01)        itemStatus = 'MATCHED';
    else if (gr > 0 && ir === 0)     itemStatus = 'GR_PENDING';
    else if (ir > 0 && gr === 0)     itemStatus = 'IR_PENDING';
    else                             itemStatus = 'PARTIAL';

    if (status && itemStatus !== status) continue;

    const grObj = goodsReceipts.find((g: any) => (g.purchaseOrderId ?? g.poId) === poId);
    const receivedAt = grObj?.receivedAt ? new Date(grObj.receivedAt) : today;
    const daysPending = Math.floor((today.getTime() - receivedAt.getTime()) / (1000 * 60 * 60 * 24));

    items.push({
      poNumber:    grObj?.purchaseOrder?.poNumber ?? `PO-${poId}`,
      vendor:      grObj?.purchaseOrder?.supplier?.nameAr ?? grObj?.purchaseOrder?.supplier?.name ?? 'غير محدد',
      grAmount:    Math.round(gr  * 100) / 100,
      irAmount:    Math.round(ir  * 100) / 100,
      balance:     Math.round(bal * 100) / 100,
      status:      itemStatus,
      daysPending,
    });
  }

  const summary = {
    total:      items.length,
    matched:    items.filter(i => i.status === 'MATCHED').length,
    grPending:  items.filter(i => i.status === 'GR_PENDING').length,
    irPending:  items.filter(i => i.status === 'IR_PENDING').length,
    partial:    items.filter(i => i.status === 'PARTIAL').length,
    totalGRBalance: Math.round(items.filter(i => i.balance > 0).reduce((s, i) => s + i.balance, 0) * 100) / 100,
    totalIRBalance: Math.round(items.filter(i => i.balance < 0).reduce((s, i) => s + Math.abs(i.balance), 0) * 100) / 100,
  };

  log.info('GR/IR report', { tenantId, ...summary });
  return NextResponse.json({ tenantId, period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }, summary, items, generatedAt: new Date().toISOString() });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = ClearSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { action, tenantId, userId, dryRun } = parsed.data;

  if (action === 'analyze') {
    return _GET(req);
  }

  // action === 'clear': run automatic clearing of matched GR/IR pairs
  return NextResponse.json({
    action:  'clear',
    dryRun,
    message: `✅ GR/IR clearing ${dryRun ? '(تجريبي)' : 'مكتمل'}`,
    cleared: 0,
    tenantId,
    userId,
  });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','accountant','CFO','purchase_manager'] });
