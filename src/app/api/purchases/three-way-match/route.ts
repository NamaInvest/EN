import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const matches = await (prisma as any).threeWayMatch.findMany({
            include: {
                invoice: { select: { invoiceNo: true, total: true, supplier: { select: { name: true } } } },
                purchaseOrder: { select: { orderNo: true, total: true } },
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(matches);
    } catch (error) {
        console.error('ThreeWayMatch GET error:', error);
        return NextResponse.json({ error: 'فشل جلب بيانات المطابقة' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();
        const { matchId, status, notes } = body; // status: 'approved' | 'rejected'

        if (!matchId || !status) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
        }

        const match = await (prisma as any).threeWayMatch.update({
            where: { id: matchId },
            data: { matchStatus: status }
        });

        return NextResponse.json({ success: true, match });
    } catch (error) {
        console.error('ThreeWayMatch PUT error:', error);
        return NextResponse.json({ error: 'فشل تحديث حالة المطابقة' }, { status: 500 });
    }
}
