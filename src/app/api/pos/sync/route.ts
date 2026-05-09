/**
 * POS Offline Sync API
 * POST /api/pos/sync  — رفع المبيعات الأوفلاين
 * GET  /api/pos/sync  — جلب بيانات الكاش (منتجات + عملاء)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { z } from 'zod';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const SaleItemSchema = z.object({
  productId:   z.number().int().positive().optional().nullable(),
  name:        z.string().optional(),
  description: z.string().optional(),
  qty:         z.coerce.number().positive().default(1),
  price:       z.coerce.number().min(0),
  taxRate:     z.coerce.number().min(0).max(100).default(15),
  total:       z.coerce.number().min(0),
});

const SaleSchema = z.object({
  invoiceNo:  z.string().optional(),
  customerId: z.number().int().positive().optional().nullable(),
  createdAt:  z.string().optional(),
  subtotal:   z.coerce.number().min(0),
  tax:        z.coerce.number().min(0).default(0),
  discount:   z.coerce.number().min(0).default(0),
  total:      z.coerce.number().min(0),
  paid:       z.coerce.number().min(0),
  tenantId:   z.string().optional(),
  offlineId:  z.string().optional(),
  id:         z.union([z.string(), z.number()]).optional(),
  items:      z.array(SaleItemSchema).default([]),
});

const POSTSchema = z.object({
  sales: z.array(SaleSchema).min(1, 'يجب تحديد مبيعة واحدة على الأقل').max(500, 'الحد الأقصى 500 مبيعة في الطلب الواحد'),
});

// ── POST — رفع المبيعات الأوفلاين ─────────────────────────────────────────

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const rawBody = await request.json();
    const parsed = POSTSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { sales } = parsed.data;
    const results = [];
    for (const sale of sales) {
      try {
        const invoice = await (prisma as any).invoice.create({
          data: {
            invoiceNo:      sale.invoiceNo || `OFF-${Date.now()}`,
            type:           'SALES',
            partyId:        sale.customerId || null,
            date:           sale.createdAt ? new Date(sale.createdAt) : new Date(),
            subtotal:       sale.subtotal,
            taxAmount:      sale.tax,
            discountAmount: sale.discount,
            total:          sale.total,
            paidAmount:     sale.paid,
            status:         'PAID',
            notes:          `[OFFLINE SYNC] ${sale.offlineId || ''}`,
            tenantId:       sale.tenantId || 'default',
          },
        });

        for (const item of sale.items) {
          await (prisma as any).invoiceItem.create({
            data: {
              invoiceId:   invoice.id,
              productId:   item.productId || null,
              description: item.name || item.description || '',
              quantity:    item.qty,
              unitPrice:   item.price,
              taxRate:     item.taxRate,
              total:       item.total,
            },
          });
        }

        results.push({ offlineId: sale.id, serverId: invoice.id, status: 'synced' });
      } catch (itemError: any) {
        results.push({ offlineId: sale.id, status: 'error', error: itemError.message });
      }
    }

    return NextResponse.json({
      synced:  results.filter(r => r.status === 'synced').length,
      errors:  results.filter(r => r.status === 'error').length,
      results,
    });
  } catch (e: any) {
    return apiError(e, 'Sync Error', { context: 'pos/sync' });
  }
}

// ── GET — جلب بيانات الكاش ─────────────────────────────────────────────────

async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const [products, customers] = await Promise.all([
      (prisma as any).product.findMany({
        select: { id: true, name: true, barcode: true, salePrice: true, taxRate: true, stockQty: true, category: true },
        where:  { isActive: true },
        take:   5000,
      }),
      (prisma as any).party.findMany({
        select: { id: true, name: true, phone: true, email: true },
        where:  { type: 'CUSTOMER' },
        take:   2000,
      }),
    ]);

    return NextResponse.json({
      products:  products  || [],
      customers: customers || [],
      cachedAt:  new Date().toISOString(),
    });
  } catch (e: any) {
    return apiError(e, 'Cache Error', { context: 'pos/sync' });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
