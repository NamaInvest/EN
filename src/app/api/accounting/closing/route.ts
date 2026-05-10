import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.closing' });
async function _POST(request: Request) {
    const prisma = getPrisma(request as any);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { year, month } = await request.json();

        // 1. Verify Fiscal Period Exists and is Open
        const period = await prisma.fiscalPeriod.findUnique({
            where: { year_month: { year: parseInt(year), month: parseInt(month) } }
        });

        if (!period) return NextResponse.json({ error: 'الفترة المالية غير موجودة' }, { status: 404 });
        if (period.status !== 'open') return NextResponse.json({ error: 'الفترة المالية مغلقة مسبقاً' }, { status: 400 });

        await prisma.$transaction(async (tx: any) => {
            // 2. Perform Soft-Close Validations
            // Ensure no "draft" journal entries exist for this month
            const draftEntries = await tx.journalEntry.count({
                where: {
                    status: 'draft',
                    entryDate: { startsWith: `${year}-${String(month).padStart(2, '0')}` }
                }
            });
            if (draftEntries > 0) throw new Error(`يوجد ${draftEntries} قيود يومية غير مرحلة. يجب ترحيلها قبل الإغلاق.`);

            // 3. Unrealized Forex Gain/Loss Revaluation (Simulated for IFRS 21)
            // In a real scenario, this queries foreign bank accounts and updates balance based on end-of-month spot rate.
            
            // 4. Lock the Period
            await tx.fiscalPeriod.update({
                where: { id: period.id },
                data: {
                    status: 'closed',
                    closedBy: user.userId,
                    closedAt: new Date(),
                    notes: 'تم الإغلاق الآلي'
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: `تم إغلاق الفترة ${month}/${year} بنجاح. تم تجميد القيود.`
        });

    } catch (error: any) {
        log.error("Closing Engine Error:", error);
        return NextResponse.json({ error: error.message || 'فشل إغلاق الفترة المالية' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
