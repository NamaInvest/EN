import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'finance.auto-ecl' });

async function _POST(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findFirst({ 
            where: { id: auth.userId, ...requireTenantFilter({ tenantId }) } 
        });
        if (!user || !['admin', 'owner', 'finance_manager', 'cfo'].includes(user.role)) {
            return NextResponse.json({ error: 'غير مصرح لك بتوليد المخصصات. هذه الصلاحية للمدير المالي (CFO/Finance Manager) والمدير العام (Admin/Owner) فقط.' }, { status: 403 });
        }

        const now = new Date();
        const pendingInvoices = await prisma.salesInvoice.findMany({ 
            take: 100,
            where: { remaining: { gt: 0 }, ...requireTenantFilter({ tenantId }) },
            select: { id: true, invoiceNo: true, remaining: true, date: true }
        });

        let totalProvision = 0;
        pendingInvoices.forEach(inv => {
            const days = Math.floor((now.getTime() - new Date(inv.date).getTime()) / (1000 * 3600 * 24));
            if (days > 90) {
                // IFRS 9: Provision 5% of debts older than 90 days
                totalProvision += n(inv.remaining) * 0.05;
            }
        });

        if (totalProvision <= 0) {
            return NextResponse.json({ message: 'لا توجد ديون تتطلب تكوين مخصص (No ECL required)' }, { status: 200 });
        }

        // Generate Journal Entry
        const je = await runFinancialTx(prisma, async (tx: any) => {
            const { getNextNumber } = await import('@/lib/numbering');
            const seqResult = await getNextNumber(tx, 'JE', undefined);

            const entry = await tx.journalEntry.create({
                data: {
                    tenantId,
                    entryDate: now.toISOString(),
                    entryNumber: seqResult.formatted,
                    description: 'إثبات مخصص ديون مشكوك في تحصيلها آلياً (Auto-ECL IFRS 9)',
                    status: 'posted',
                    totalDebit: totalProvision,
                    totalCredit: totalProvision,
                    createdBy: auth.userId,
                    lines: {
                        create: [
                            { tenantId, accountId: 5150, debit: totalProvision, credit: 0, description: 'مصروف ديون مشكوك فيها' },
                            { tenantId, accountId: 1135, debit: 0, credit: totalProvision, description: 'مخصص ديون مشكوك فيها (Contra-Asset)' }
                        ]
                    }
                }
            });
            return entry;
        }, 'AUTO_ECL_GENERATION');

        return NextResponse.json({ 
            message: 'تم توليد مخصص خسائر الائتمان المتوقعة بنجاح', 
            provisionAmount: totalProvision,
            journalEntry: je.entryNumber
        }, { status: 201 });

    } catch (e: any) {
        log.error('finance.auto-ecl.POST', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'FINANCIAL' });

