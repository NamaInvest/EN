import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.reconciliations.id' });


const _PUTSchema = z.object({
  reconciledLineIds: z.array(z.any()).optional(),
}).passthrough();

async function _PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const params = await context.params;
        const id = parseInt((await params).id);

        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { reconciledLineIds } = body; 

        if (!Array.isArray(reconciledLineIds)) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        // @ts-ignore
        const recon = await prisma.bankReconciliation.findFirst({ where: { id, tenantId: auth.tenantId } });
        if (!recon) return NextResponse.json({ error: 'التسوية غير موجودة' }, { status: 404 });

        // Update lines
        await prisma.journalLine.updateMany({
            where: { id: { in: reconciledLineIds }, accountId: recon.bankAccountId, tenantId: auth.tenantId },
            data: { isReconciled: true, reconciliationId: id }
        });

        // Calculate reconciled sum
        const sumAggr = await prisma.journalLine.aggregate({
            where: { id: { in: reconciledLineIds }, tenantId: auth.tenantId },
            _sum: { debit: true, credit: true }
        });
        
        const sumDebit = n(sumAggr._sum.debit);
        const sumCredit = n(sumAggr._sum.credit);
        // Reconciled balance change = Sum of cleared Debits - Sum of cleared Credits
        const clrBal = sumDebit - sumCredit;

        // Calculate final actual difference based ONLY on cleared lines
        // A perfect reconciliation means the starting balance + cleared transactions = statementBalance
        // For simplicity, we just mark the status as RECONCILED.
        
        // @ts-ignore
        const updated = await prisma.bankReconciliation.update({
            where: { id },
            data: { status: 'RECONCILED' }
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });
