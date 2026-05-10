import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'finance.auto-ecl' });
async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: auth.userId } });
        if (!user || (user.role !== 'admin' && user.role !== 'cfo')) {
            return NextResponse.json({ error: 'غير مصرح لك بتوليد المخصصات. هذه الصلاحية للمدير المالي (CFO) والمدير العام (Admin) فقط.' }, { status: 403 });
        }

        const now = new Date();
        const pendingInvoices = await prisma.salesInvoice.findMany({ take: 100,
            where: { remaining: { gt: 0 } },
            select: { id: true, invoiceNo: true, remaining: true, date: true }
        });

        let totalProvision = 0;
        pendingInvoices.forEach(inv => {
            const days = Math.floor((now.getTime() - inv.date.getTime()) / (1000 * 3600 * 24));
            if (days > 90) {
                // IFRS 9: Provision 5% of debts older than 90 days
                totalProvision += n(inv.remaining) * 0.05;
            }
        });

        if (totalProvision <= 0) {
            return NextResponse.json({ message: 'لا توجد ديون تتطلب تكوين مخصص (No ECL required)' }, { status: 200 });
        }

        // Generate Journal Entry
        const je = await prisma.$transaction(async (tx: any) => {
            const entry = await tx.journalEntry.create({
                data: {
                    date: new Date(),
                    description: 'إثبات مخصص ديون مشكوك في تحصيلها آلياً (Auto-ECL IFRS 9)',
                    reference: 'ECL-' + Date.now(),
                    lines: {
                        create: [
                            { accountId: 5150, debit: totalProvision, credit: 0, description: 'مصروف ديون مشكوك فيها' },
                            { accountId: 1135, debit: 0, credit: totalProvision, description: 'مخصص ديون مشكوك فيها (Contra-Asset)' }
                        ]
                    }
                }
            });
            return entry;
        });

        return NextResponse.json({ 
            message: 'تم توليد مخصص خسائر الائتمان المتوقعة بنجاح', 
            provisionAmount: totalProvision,
            journalEntry: je.reference
        }, { status: 201 });

    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
