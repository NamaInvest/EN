import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { PeriodCloseEngine } from '@/lib/period-close';

export async function GET(request: Request) {
    const prisma = getPrisma(request as any);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const periods = await prisma.fiscalPeriod.findMany({
            include: {
                periodCloseChecklists: true,
                periodLockLogs: true
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });

        return NextResponse.json({ periods });
    } catch (error: any) {
        console.error("Fiscal Periods API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request as any);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { action, fiscalPeriodId, reason, taskId, notes } = await request.json();

        switch (action) {
            case 'start_closing':
                const checklists = await PeriodCloseEngine.startClosing(fiscalPeriodId);
                return NextResponse.json({ success: true, checklists });

            case 'complete_task':
                const task = await PeriodCloseEngine.completeTask(taskId, String(user.username || user.userId), notes);
                return NextResponse.json({ success: true, task });

            case 'soft_close':
                await PeriodCloseEngine.softClose(fiscalPeriodId, String(user.userId));
                return NextResponse.json({ success: true, message: 'تم إغلاق الفترة بنجاح (Soft Close)' });

            case 'hard_close':
                await PeriodCloseEngine.hardClose(fiscalPeriodId, String(user.userId));
                return NextResponse.json({ success: true, message: 'تم إقفال الفترة نهائياً (Hard Close)' });

            case 'reopen':
                await PeriodCloseEngine.reopen(fiscalPeriodId, String(user.userId), reason || 'طلب إعادة فتح');
                return NextResponse.json({ success: true, message: 'تم إعادة فتح الفترة' });

            default:
                return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Period Action Error:", error);
        return NextResponse.json({ error: error.message || 'فشل تنفيذ الإجراء' }, { status: 400 });
    }
}
