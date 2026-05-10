import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'subscriptions' });
const prisma = new PrismaClient();


const _POSTSchema = z.object({
  companyId: z.union([z.string(), z.number()]).optional(),
  action: z.any().optional(),
  days: z.union([z.string(), z.number()]).optional(),
  planLabel: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const user = await getUserFromRequest(request as any);
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ error: 'عفواً، هذه الصلاحية مخصصة لمالك المنصة فقط' }, { status: 403 });
    }

    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { companyId, action, days, planLabel } = body;

        if (!companyId || !action) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        if (action === 'extend') {
            const extraDays = parseInt(days) || 30;
            const newEndDate = new Date();
            newEndDate.setDate(newEndDate.getDate() + extraDays);
            
            // Suspend old ones
            await prisma.subscription.updateMany({
                where: { companyId: parseInt(companyId), status: 'ACTIVE' },
                data: { status: 'EXPIRED' }
            });

            // Create new one
            await prisma.subscription.create({
                data: {
                    companyId: parseInt(companyId),
                    planLabel: planLabel || 'PRO',
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: newEndDate
                }
            });
            return NextResponse.json({ message: 'تم تجديد الاشتراك بنجاح' });
        }

        if (action === 'suspend') {
            await prisma.subscription.updateMany({
                where: { companyId: parseInt(companyId), status: 'ACTIVE' },
                data: { status: 'SUSPENDED' }
            });
            return NextResponse.json({ message: 'تم إيقاف الاشتراك بنجاح' });
        }

        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    } catch (error: any) {
        log.error('Subscription API Error:', error);
        return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
