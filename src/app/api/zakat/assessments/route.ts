import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const assessments = await prisma.zakatAssessment.findMany({
            include: { adjustments: true },
            orderBy: { id: 'desc' },
            take: 50,
        });
        return NextResponse.json(assessments);
    } catch (e) {
        return apiError(e, 'فشل جلب تقديرات الزكاة', { context: 'zakat/assessments' });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const { fiscalYearId, saudiOwnershipPct } = body;
        if (!fiscalYearId) {
            return NextResponse.json({ error: 'fiscalYearId مطلوب' }, { status: 400 });
        }
        const assessment = await ZakatEngine.createAssessment(parseInt(fiscalYearId), {
            saudiOwnershipPct: saudiOwnershipPct ? parseFloat(saudiOwnershipPct) : undefined,
        });
        return NextResponse.json(assessment, { status: 201 });
    } catch (e) {
        return apiError(e, 'فشل إنشاء تقدير الزكاة', { context: 'zakat/assessments' });
    }
}
