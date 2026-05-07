/**
 * Period Close API — v2 (Foundation Build #5)
 * GET  — get period close status
 * POST — init tasks / complete task
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { initPeriodCloseTasks, completeTask, getPeriodCloseStatus } from '@/lib/period-close-engine';

export async function GET(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const periodId = req.nextUrl.searchParams.get('periodId');
        if (!periodId) return NextResponse.json({ error: 'مطلوب: periodId' }, { status: 400 });

        const status = await getPeriodCloseStatus(prisma, parseInt(periodId));
        return NextResponse.json(status);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const body = await req.json();

        if (body.action === 'init') {
            if (!body.periodId) return NextResponse.json({ error: 'مطلوب: periodId' }, { status: 400 });
            const count = await initPeriodCloseTasks(prisma, body.periodId);
            return NextResponse.json({ initialized: count });
        }

        if (body.action === 'complete') {
            if (!body.periodId || !body.taskCode || !body.userId) {
                return NextResponse.json({ error: 'مطلوب: periodId, taskCode, userId' }, { status: 400 });
            }
            const result = await completeTask(prisma, body.periodId, body.taskCode, body.userId, body.notes);
            if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'مطلوب: action (init | complete)' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
