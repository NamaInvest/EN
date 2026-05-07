import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { getUserFromRequest } = require('@/lib/auth');
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);

    try {
        // Fetch all pending approval steps for the current user
        const steps = await prisma.approvalStep.findMany({
            take: 100,
            where: {
                approverId: auth.userId,
                status: 'PENDING'
            },
            include: {
                request: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        return NextResponse.json(steps);
    } catch (error: any) {
        console.error('Approvals GET error:', error);
        return NextResponse.json({ error: error.message || 'فشل في جلب الموافقات' }, { status: 500 });
    }
}
