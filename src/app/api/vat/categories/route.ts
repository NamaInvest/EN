import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * VAT Categories + Returns API
 * GET  /api/vat/categories — List categories
 * POST /api/vat/categories — Seed defaults or create
 * GET  /api/vat/return?from=&to= — Build VAT return
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getVatCategories, seedVatCategories, buildVatReturn } from '@/lib/vat-classifier';
import { z } from 'zod';

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const from = req.nextUrl.searchParams.get('from');
        const to = req.nextUrl.searchParams.get('to');

        if (from && to) {
            const vatReturn = await buildVatReturn(prisma, from, to);
            return NextResponse.json(vatReturn);
        }

        const categories = await getVatCategories(prisma);
        return NextResponse.json(categories);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'seed') {
            const count = await seedVatCategories(prisma);
            return NextResponse.json({ seeded: count });
        }
        return NextResponse.json({ error: 'استخدم action=seed لتهيئة التصنيفات' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
