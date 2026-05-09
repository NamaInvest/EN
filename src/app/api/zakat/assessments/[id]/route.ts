import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const prisma = getPrisma(req);
    try {
        const assessment = await prisma.zakatAssessment.findUnique({
            where: { id: parseInt(id, 10) },
            include: { adjustments: true },
        });
        if (!assessment) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

        const form = await ZakatEngine.generateForm(assessment.id);
        return NextResponse.json({ assessment, form });
    } catch (e: any) {
        return apiError(e, 'فشل جلب التقدير', { context: 'zakat/assessments/[id]' });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
