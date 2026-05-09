import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const { getUserFromRequest } = require('@/lib/auth');
    const auth = getUserFromRequest(request as any);
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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
