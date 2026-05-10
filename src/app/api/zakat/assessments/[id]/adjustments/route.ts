import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zakat.assessments.id.adjustments' });

const _POSTSchema = z.object({
  category: z.any().optional(),
  description: z.any().optional(),
  amount: z.number().optional(),
  glAccountId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { category, description, amount, glAccountId } = body;
        if (!category || !['ADD', 'DEDUCT'].includes(category)) {
            return NextResponse.json({ error: 'category must be ADD or DEDUCT' }, { status: 400 });
        }
        if (!description || !amount) {
            return NextResponse.json({ error: 'description و amount مطلوبان' }, { status: 400 });
        }
        const updated = await ZakatEngine.addAdjustment(parseInt(id, 10), {
            category,
            description,
            amount: parseFloat(amount),
            glAccountId: glAccountId ? parseInt(glAccountId) : undefined,
        });
        return NextResponse.json(updated);
    } catch (e: any) {
        log.error('src/app/api/zakat/assessments/[id]/adjustments/route.ts', { error: e instanceof Error ? e.message : e });

        return apiError(e, 'فشل إضافة التسوية', { context: 'zakat/adjustments' });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
