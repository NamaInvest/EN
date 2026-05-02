import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = getUserFromRequest(request);
    if (!auth || auth.role !== 'admin') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const prisma = getPrisma(request as any);
    try {
        const violations = await prisma.auditLog.findMany({
            where: {
                action: 'GOVERNANCE_VIOLATION_ATTEMPT',
            },
            include: {
                user: { select: { username: true, fullName: true } }
            },
            orderBy: { date: 'desc' },
            take: 50
        });

        return NextResponse.json(violations);
    } catch (error) {
        console.error('Violations fetch error:', error);
        return NextResponse.json({ error: 'فشل في جلب المخالفات الرقابية' }, { status: 500 });
    }
}
