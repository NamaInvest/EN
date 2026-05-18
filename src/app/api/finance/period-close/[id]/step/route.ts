import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.period-close.id.step' });


const _PATCHSchema = z.object({
  status: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { getUserFromRequest } = require('@/lib/auth');
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!['admin', 'owner', 'finance_manager'].includes(user.role)) {
        return NextResponse.json({ error: 'صلاحية المسؤول المالي مطلوبة' }, { status: 403 });
    }
  const { id } = await params;
    try {
        const stepId = parseInt((await params).id);
        const body = await req.json();

        const _parsed = _PATCHSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { status, notes } = body;

        const updated = await prisma.periodCloseChecklist.updateMany({
            where: { id: stepId, tenantId: user.tenantId },
            data: { 
                status, 
                notes,
                completedAt: status === 'DONE' ? new Date() : null
            }
        });

        if (updated.count === 0) {
            return NextResponse.json({ error: 'الخطوة غير موجودة أو لا تملك صلاحية' }, { status: 404 });
        }

        return NextResponse.json({ success: true, count: updated.count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const PATCH = withRoute(async ({ req }, context) => _PATCH(req as any, context), { rateLimit: 'DEFAULT' });
