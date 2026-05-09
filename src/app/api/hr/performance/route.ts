import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        // If employeeId is passed, get reviews specific to them. Otherwise get all (Admin view)
        const employeeId = searchParams.get('employeeId');

        let where = {};
        if (employeeId) {
            where = { employeeId: Number(employeeId) };
        }

        const evaluations = await prisma.employeeEvaluation.findMany({
            take: 100,
            where,
            include: {
                employee: { select: { id: true, name: true, position: true, department: true } },
                evaluator: { select: { id: true, name: true, position: true } }
            } as any,
            orderBy: { evaluationDate: 'desc' }
        });

        // Get employees list for the select dropdowns
        const employees = await prisma.employee.findMany({
            take: 100,
            where: { active: true },
            select: { id: true, name: true, position: true, department: true } as any
        });

        return NextResponse.json({ success: true, data: { evaluations, employees } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { employeeId, evaluatorId, period, score, strengths, weaknesses, recommendations } = body;

        // In a real 360 review, we'd check if evaluatorId == employeeId for Self-Assessment, 
        // or check managerId, or check peer selection.

        const newEval = await prisma.employeeEvaluation.create({
            data: {
                employeeId: Number(employeeId),
                evaluatorId: Number(evaluatorId),
                evaluationDate: new Date(),
                period: period || 'ANNUAL',
                score: Number(score),
                strengths,
                weaknesses,
                recommendations
            }
        });

        return NextResponse.json({ success: true, data: newEval });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
