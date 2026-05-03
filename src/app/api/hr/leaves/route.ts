/**
 * Leave API Routes
 * GET  /api/hr/leaves — قائمة طلبات الإجازات
 * POST /api/hr/leaves — إنشاء طلب إجازة
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { LeaveEngine } from '@/lib/leave-engine';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    const status = url.searchParams.get('status');
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    try {
        const where: any = {};
        if (employeeId) where.employeeId = parseInt(employeeId);
        if (status) where.status = status;
        where.startDate = {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31),
        };

        const requests = await (prisma as any).leaveRequest.findMany({
            where,
            include: { employee: { select: { id: true, name: true, position: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ requests, year });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'خطأ في جلب طلبات الإجازات' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const { employeeId, leaveType, startDate, endDate, reason, attachmentUrl } = body;

        if (!employeeId || !leaveType || !startDate || !endDate) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
        }

        const result = await LeaveEngine.submitLeaveRequest({
            employeeId: parseInt(employeeId),
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            attachmentUrl,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'خطأ في إنشاء طلب الإجازة' }, { status: 400 });
    }
}
