/**
 * Leave Request Actions API
 * POST /api/hr/leaves/[id]/approve — الموافقة على طلب إجازة
 * POST /api/hr/leaves/[id]/reject — رفض طلب إجازة
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { LeaveEngine } from '@/lib/leave-engine';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const requestId = parseInt(params.id);

    try {
        const body = await req.json();
        const { action, rejectionReason } = body;

        if (action === 'approve') {
            await LeaveEngine.approveLeaveRequest(requestId, user.userId);
            return NextResponse.json({ success: true, message: 'تم الموافقة على طلب الإجازة' });
        } else if (action === 'reject') {
            if (!rejectionReason) {
                return NextResponse.json({ error: 'يجب ذكر سبب الرفض' }, { status: 400 });
            }
            await LeaveEngine.rejectLeaveRequest(requestId, user.userId, rejectionReason);
            return NextResponse.json({ success: true, message: 'تم رفض طلب الإجازة' });
        } else {
            return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
        }
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'خطأ في معالجة الطلب' }, { status: 400 });
    }
}
