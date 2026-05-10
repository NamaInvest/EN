import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zakat.assessments' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const assessments = await prisma.zakatAssessment.findMany({
            include: { adjustments: true },
            orderBy: { id: 'desc' },
            take: 50,
        });
        return NextResponse.json(assessments);
    } catch (e: any) {
        return apiError(e, 'فشل جلب تقديرات الزكاة', { context: 'zakat/assessments' });
    }
}


const _POSTSchema = z.object({
  fiscalYearId: z.union([z.string(), z.number()]).optional(),
  saudiOwnershipPct: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { fiscalYearId, saudiOwnershipPct } = body;
        if (!fiscalYearId) {
            return NextResponse.json({ error: 'fiscalYearId مطلوب' }, { status: 400 });
        }
        const assessment = await ZakatEngine.createAssessment(parseInt(fiscalYearId), {
            saudiOwnershipPct: saudiOwnershipPct ? parseFloat(saudiOwnershipPct) : undefined,
        });
        return NextResponse.json(assessment, { status: 201 });
    } catch (e: any) {
        return apiError(e, 'فشل إنشاء تقدير الزكاة', { context: 'zakat/assessments' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
