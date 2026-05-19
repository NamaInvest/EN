/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  VAT Categories + Returns API — `/api/vat/categories`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة فئات ضريبة القيمة المضافة (VAT) للسعودية:
 *   - S (Standard 15%) — الأساسية
 *   - Z (Zero-rated 0%) — صادرات، أدوية، ذهب
 *   - E (Exempt) — العقارات السكنية، التعليم، الصحة
 *   - O (Out of scope) — خارج النطاق
 *   - RC (Reverse Charge) — الـ B2B المستورد
 *
 *  Endpoints:
 *   GET  /api/vat/categories                   → قائمة الفئات
 *   GET  /api/vat/categories?from=Y&to=Z       → بناء VAT Return للفترة
 *   POST /api/vat/categories { action: 'seed' } → تهيئة الفئات الافتراضية (SOCPA)
 *
 *  Security:
 *   - RBAC: admin / owner / accountant / tax_officer
 *   - Audit log للـ seed
 *
 *  ZATCA: كل فئة لها zatcaCode (مثل VATEX-SA-29 للإعفاء).
 *
 *  @see src/lib/vat-classifier.ts — engine
 *  @see prisma/schema.prisma — model VatCategory
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { getVatCategories, seedVatCategories, buildVatReturn } from '@/lib/vat-classifier';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vat.categories' });

const ALLOWED_ROLES = ['admin', 'owner', 'accountant', 'tax_officer', 'cfo'] as const;

/** Schema لـ POST */
const PostSchema = z.object({
  action: z.enum(['seed']),
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET — قائمة الفئات أو VAT return
// ═══════════════════════════════════════════════════════════════════════════

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  try {
    // مسار 1: build VAT return
    if (from && to) {
      // basic ISO date validation
      const fromD = new Date(from);
      const toD = new Date(to);
      if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) {
        return NextResponse.json({ error: 'تواريخ غير صحيحة' }, { status: 400 });
      }
      const vatReturn = await buildVatReturn(prisma, from, to);
      log.info('VAT return built', { requestId, userId: auth.userId, from, to });
      return NextResponse.json(vatReturn);
    }

    // مسار 2: قائمة الفئات
    const categories = await getVatCategories(prisma);
    return NextResponse.json({ items: categories, count: categories.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('VAT categories failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل العملية', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — seed defaults
// ═══════════════════════════════════════════════════════════════════════════

async function handlePost(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'استخدم action=seed لتهيئة التصنيفات', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const count = await seedVatCategories(prisma);

    await logAuditAction({
      userId: auth.userId,
      action: 'SEED_VAT_CATEGORIES',
      tableName: 'vat_categories',
      recordId: 'all',
      details: JSON.stringify({ seeded: count }),
    });

    log.info('VAT categories seeded', { requestId, userId: auth.userId, count });
    return NextResponse.json({ seeded: count, message: `تم إنشاء/تحديث ${count} فئة` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('VAT seed failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل التهيئة', detail: msg }, { status: 500 });
  }
}

export const GET = withRoute(handleGet, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});

export const POST = withRoute(handlePost, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
