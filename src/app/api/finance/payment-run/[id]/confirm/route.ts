import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';

const log = logger.child({ service: 'finance.payment-run.id.confirm' });

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const tenantId = assertTenant(auth.tenantId);
    const prisma = getPrisma(req as any);

    try {
        const id = Number((await params).id);
        
        const run = await prisma.paymentRun.findFirst({
            where: { id, tenantId },
            include: { lines: true }
        });

        if (!run) {
            return NextResponse.json({ error: 'Run not found' }, { status: 404 });
        }

        const invoiceIds: number[] = [];
        run.lines.forEach(line => {
            invoiceIds.push(...line.openItemIds);
        });

        await runFinancialTx(prisma, async (tx: any) => {
            await tx.paymentRun.update({
                where: { id, tenantId },
                data: {
                    status: 'POSTED',
                    confirmedAt: new Date(),
                    postedAt: new Date()
                }
            });

            await tx.purchaseInvoice.updateMany({
                where: { id: { in: invoiceIds }, tenantId },
                data: { status: 'PAID', paid: Number(run.totalAmount), remaining: 0 } 
            });

            EnterpriseLogger.traceFinancialTx(
                `PAYMENT_RUN_CONFIRM_${id}`,
                'PAYMENT_RUN_POSTED',
                tenantId,
                { runId: id, totalAmount: run.totalAmount, invoiceCount: invoiceIds.length }
            );

            // Real implementation would create a JournalEntry here
            // Dr 2010 AP
            // Cr 1010 Cash/Bank
        }, `PAYMENT_RUN_${id}`);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        EnterpriseLogger.error("Payment run confirm error", { tenantId, userId: auth?.userId }, e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'accountant'] });
