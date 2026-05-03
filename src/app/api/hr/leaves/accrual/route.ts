/**
 * Leave Accrual API
 * POST /api/hr/leaves/accrual — تشغيل التجميع الشهري
 * GET  /api/hr/leaves/accrual — حالة التجميع
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { LeaveEngine } from '@/lib/leave-engine';

export async function POST(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const accrualDate = body.date ? new Date(body.date) : new Date();
        const result = await LeaveEngine.runMonthlyAccrual(accrualDate, user.userId);
        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'خطأ في التجميع الشهري' }, { status: 500 });
    }
}
