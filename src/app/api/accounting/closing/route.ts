import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';

async function _POST(request: Request) {
    const prisma = getPrisma(request as any);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const tenantId = assertTenant(user.tenantId);

    try {
        const { year, month } = await request.json();

        // 1. Verify Fiscal Period Exists and is Open (Tenant Isolated)
        const period = await prisma.fiscalPeriod.findFirst({
            where: {
                tenantId,
                year: parseInt(year),
                month: parseInt(month)
            }
        });

        if (!period) return NextResponse.json({ error: 'الفترة المالية غير موجودة' }, { status: 404 });
        if (period.status !== 'open') return NextResponse.json({ error: 'الفترة المالية مغلقة مسبقاً' }, { status: 400 });

        await runFinancialTx(prisma, async (tx: any) => {
            // 2. Perform Soft-Close Validations
            // Ensure no "draft" journal entries exist for this month
            const draftEntries = await tx.journalEntry.count({
                where: requireTenantFilter({
                    tenantId,
                    status: 'draft',
                    entryDate: { startsWith: `${year}-${String(month).padStart(2, '0')}` }
                })
            });
            if (draftEntries > 0) throw new Error(`يوجد ${draftEntries} قيود يومية غير مرحلة. يجب ترحيلها قبل الإغلاق.`);

            // 3. Lock the Period
            await tx.fiscalPeriod.update({
                where: { id: period.id, tenantId },
                data: {
                    status: 'closed',
                    closedBy: user.userId,
                    closedAt: new Date(),
                    notes: 'تم الإغلاق الآلي'
                }
            });

            EnterpriseLogger.traceFinancialTx(
                `CLOSE_${year}_${month}`,
                'FISCAL_PERIOD_CLOSED',
                tenantId,
                { year, month, periodId: period.id }
            );
        }, `PERIOD_CLOSE_${year}_${month}`);

        return NextResponse.json({
            success: true,
            message: `تم إغلاق الفترة ${month}/${year} بنجاح. تم تجميد القيود.`
        });

    } catch (error: any) {
        EnterpriseLogger.error("Closing Engine Error:", { tenantId: user.tenantId, userId: user.userId }, error);
        return NextResponse.json({ error: error.message || 'فشل إغلاق الفترة المالية' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
