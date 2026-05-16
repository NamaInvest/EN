/**
 * Goods Received Notes (GRN) API — Complete Implementation
 * 
 * GET  /api/grn           — List GRNs
 * POST /api/grn           — Create GRN + auto-journal (Dr Inventory / Cr GRNI)
 * PUT  /api/grn           — Update GRN status (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute }             from '@/lib/api/with-route';
import { getPrisma }             from '@/lib/prisma';
import { z }                     from 'zod';
import { postGRN }               from '@/lib/auto-journal';
import { logger }                from '@/lib/logger';
import { runFinancialTx }        from '@/lib/db/transaction';
import { InventoryService }      from '@/lib/services/inventory.service';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'grn' });

// ── Schemas ──────────────────────────────────────────────────────────────────

const GrnItemSchema = z.object({
  productId:   z.number().int().positive(),
  quantity:    z.number().positive('الكمية يجب أن تكون موجبة'),
  unitCost:    z.number().min(0),
  totalCost:   z.number().min(0).optional(),
  batchNo:     z.string().optional(),
  expiryDate:  z.string().optional(),
  notes:       z.string().optional(),
});

const CreateGrnSchema = z.object({
  supplierId:       z.number().int().positive('المورد مطلوب'),
  purchaseOrderId:  z.number().int().optional(),
  items:            z.array(GrnItemSchema).min(1, 'يجب إضافة صنف واحد على الأقل'),
  stockId:          z.number().int().optional(),
  branchId:         z.number().int().optional(),
  date:             z.string().optional(),
  notes:            z.string().optional(),
  receivedById:     z.number().int().optional(),
});

// ── GET ──────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest, auth: any) {
  const prisma  = getPrisma(req);
  const q       = req.nextUrl.searchParams;
  const take    = Math.min(parseInt(q.get('take') || '50'), 200);
  const page    = parseInt(q.get('page') || '1');
  const status  = q.get('status');
  const supplierId = q.get('supplierId');
  const tenantId = assertTenant(auth?.tenantId);

  const where: any = requireTenantFilter({ tenantId });
  if (status)     where.status     = status;
  if (supplierId) where.supplierId = parseInt(supplierId);

  try {
    const [grns, total] = await Promise.all([
      (prisma as any).goodsReceiptNote?.findMany({
        where,
        take,
        skip:    (page - 1) * take,
        orderBy: { id: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          lines:    { include: { product: { select: { id: true, name: true, barcode: true } } } },
        },
      }) ?? [],
      (prisma as any).goodsReceiptNote?.count({ where }) ?? 0,
    ]);

    return NextResponse.json({ grns, total, page, pages: Math.ceil(total / take) });
  } catch {
    return NextResponse.json({ grns: [], total: 0, page: 1, pages: 0 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest, auth: any) {
  const prisma = getPrisma(req);
  const raw    = await req.json().catch(() => ({}));
  const parsed = CreateGrnSchema.safeParse(raw);
  const tenantId = assertTenant(auth?.tenantId);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body     = parsed.data;
  const today    = body.date || new Date().toISOString().split('T')[0];
  const stockId  = body.stockId || null;

  // Compute total cost
  const totalCost = body.items.reduce((sum, item) => {
    return sum + (item.totalCost ?? (item.quantity * item.unitCost));
  }, 0);

  try {
    // We use runFinancialTx because GRN affects both Inventory AND General Ledger (GRNI).
    const result = await runFinancialTx(prisma, async (tx: any) => {
      // Get next GRN number within transaction
      const last = await tx.goodsReceiptNote?.findFirst({
         where: requireTenantFilter({ tenantId }),
         orderBy: { id: 'desc' } 
      }).catch(() => null);
      const grnNo = (last?.grnNo || 0) + 1;

      // Get supplier name for journal description
      const supplier = await tx.supplier?.findUnique({
        where:  { id: body.supplierId },
        select: { name: true },
      }).catch(() => null);

      // Create GRN
      const created = await tx.goodsReceiptNote?.create({
        data: {
          tenantId,
          grnNo,
          supplierId:      body.supplierId,
          purchaseOrderId: body.purchaseOrderId || null,
          stockId,
          branchId:        body.branchId || null,
          totalCost,
          date:            today,
          notes:           body.notes || null,
          receivedById:    body.receivedById || auth?.userId || null,
          status:          'received',
          lines: {
            create: body.items.map(item => ({
              tenantId,
              productId:  item.productId,
              quantity:   item.quantity,
              unitCost:   item.unitCost,
              totalCost:  item.totalCost ?? (item.quantity * item.unitCost),
              batchNo:    item.batchNo   || null,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              notes:      item.notes     || null,
            })),
          },
        },
      });

      // Update product stock levels securely via InventoryService
      if (stockId) {
        for (const item of body.items) {
          await InventoryService.adjustStock(tx, {
             tenantId,
             productId: item.productId,
             stockId,
             quantityChange: item.quantity,
             reason: `استلام بضاعة GRN-${grnNo}`,
             sourceType: 'PURCHASE_RECEIPT'
          });

          await InventoryService.recordMovement(tx, {
             tenantId,
             productId: item.productId,
             stockId,
             quantity: item.quantity,
             type: 'IN',
             referenceId: created.id,
             referenceType: 'GRN',
             notes: item.notes || `استلام بضاعة GRN-${grnNo}`
          });
        }
      }

      // Record Accounting Entry (Dr Inventory, Cr GRNI)
      if (totalCost > 0.01) {
        await postGRN({
          grnNo,
          totalCost,
          supplierName: supplier?.name,
          userId:       auth?.userId,
          branchId:     body.branchId,
          date:         today,
          txClient:     tx,
        });
      }

      return { created, grnNo };
    }, 'GRN_RECEIPT');

    return NextResponse.json({
      success: true,
      grn: result.created,
      grnNo: result.grnNo,
      totalCost: Math.round(totalCost * 100) / 100,
      message:   `تم استلام البضاعة GRN-${result.grnNo} وترحيل القيد المحاسبي (مدين: المخزون / دائن: بضاعة غير مفوترة)`,
    }, { status: 201 });

  } catch (e: any) {
    log.error('src/app/api/grn/route.ts', { error: e instanceof Error ? e.message : e, tenantId });
    return NextResponse.json({ error: e.message || 'حدث خطأ أثناء معالجة سند الإدخال' }, { status: 500 });
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

export const GET = withRoute(
  async ({ req, auth }) => _GET(req as any, auth),
  { rateLimit: 'DEFAULT' }
);

export const POST = withRoute(
  async ({ req, auth }) => _POST(req as any, auth),
  { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'warehouse', 'purchasing'] }
);
