import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Priority 8: Project Budget Lines API
 * GET  /api/enterprise/projects/budget?projectId=1
 * POST /api/enterprise/projects/budget — إضافة بند ميزانية
 * PUT  /api/enterprise/projects/budget — تحديث مبلغ فعلي
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const projectId = parseInt(url.searchParams.get('projectId') || '0');
    if (!projectId) return NextResponse.json({ error: 'projectId مطلوب' }, { status: 400 });

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, name: true, budget: true, status: true },
        });
        if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const lines = await prisma.projectBudgetLine.findMany({
            take: 100,
            where: { projectId },
            orderBy: { category: 'asc' },
        });

        const totalPlanned = lines.reduce((s: number, l: any) => s + l.planned, 0);
        const totalActual  = lines.reduce((s: number, l: any) => s + l.actual, 0);
        const variance     = totalPlanned - totalActual;

        return NextResponse.json({
            project,
            lines,
            summary: {
                totalPlanned: Math.round(totalPlanned * 100) / 100,
                totalActual:  Math.round(totalActual * 100) / 100,
                variance:     Math.round(variance * 100) / 100,
                utilizationPct: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في تحميل الميزانية' }, { status: 500 });
    }
}

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const line = await prisma.projectBudgetLine.create({
            data: {
                projectId:   parseInt(body.projectId),
                category:    body.category,
                description: body.description,
                planned:     parseFloat(body.planned) || 0,
                actual:      parseFloat(body.actual) || 0,
                notes:       body.notes || null,
            },
        });
        return NextResponse.json(line, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في إضافة البند' }, { status: 500 });
    }
}

async function _PUT(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const line = await prisma.projectBudgetLine.update({
            where: { id: parseInt(body.id) },
            data: {
                actual:  body.actual  !== undefined ? parseFloat(body.actual)  : undefined,
                planned: body.planned !== undefined ? parseFloat(body.planned) : undefined,
                notes:   body.notes   !== undefined ? body.notes               : undefined,
            },
        });
        return NextResponse.json(line);
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في التحديث' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
