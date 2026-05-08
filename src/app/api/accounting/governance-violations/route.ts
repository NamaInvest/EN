import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const auth = getUserFromRequest(request as any);
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
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json(violations);
    } catch (error: any) {
        console.error('Violations fetch error:', error);
        return NextResponse.json({ error: 'فشل في جلب المخالفات الرقابية' }, { status: 500 });
    }
}
