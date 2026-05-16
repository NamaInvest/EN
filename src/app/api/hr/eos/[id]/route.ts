import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * EOS Actions API
 * POST /api/hr/eos/[id] — approve or pay
 */
import { NextResponse } from 'next/server';
import { SaudiEOSEngine } from '@/lib/saudi-eos-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { runFinancialTx } from '@/lib/db/transaction';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.eos.id' });


const _POSTSchema = z.object({
  action: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(req as any);

    const eosId = parseInt((await params).id);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action } = body;

        if (action === 'approve') {
            const prisma = getPrisma(req as any);
            await runFinancialTx(prisma, async (tx: any) => {
                const eos = await tx.endOfServiceCalculation.findUnique({ where: { id: eosId, tenantId } });
                if (!eos) throw new Error(`EOS ${eosId} not found`);
                if (eos.status !== 'DRAFT') throw new Error(`EOS ${eosId} is not in DRAFT status`);

                await tx.endOfServiceCalculation.update({
                    where: { id: eosId, tenantId },
                    data: {
                        status: 'APPROVED',
                        approvedBy: user.userId,
                        approvedAt: new Date()
                    }
                });
            }, 'EOS_APPROVE');
            return NextResponse.json({ success: true, message: 'تم الموافقة على التسوية' });
        } else if (action === 'pay') {
            const prisma = getPrisma(req as any);
            await runFinancialTx(prisma, async (tx: any) => {
                const eos = await tx.endOfServiceCalculation.findUnique({ 
                    where: { id: eosId, tenantId },
                    include: { employee: true }
                });
                if (!eos) throw new Error(`EOS ${eosId} not found`);
                if (eos.status !== 'APPROVED') throw new Error(`EOS ${eosId} is not APPROVED`);

                const { createJournalEntry, ACCOUNTS } = await import('@/lib/auto-journal');
                const jeResult = await createJournalEntry({
                    description: `تسوية نهاية خدمة للموظف ${eos.employee.name}`,
                    reference: `EOS-${eosId}`,
                    lines: [
                        { accountCode: ACCOUNTS.SALARIES, debit: Number(eos.netSettlement), credit: 0, description: `مصروف نهاية خدمة ${eos.employee.name}` },
                        { accountCode: ACCOUNTS.CASH, debit: 0, credit: Number(eos.netSettlement), description: `سداد نهاية خدمة ${eos.employee.name}` }
                    ],
                    userId: user.userId,
                    date: new Date().toISOString().split('T')[0],
                    txClient: tx
                });

                if (!jeResult.success) {
                    throw new Error(`Failed to create Journal Entry: ${jeResult.error}`);
                }

                await tx.endOfServiceCalculation.update({
                    where: { id: eosId, tenantId },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                        journalEntryId: jeResult.entryId
                    }
                });
            }, 'EOS_PAY');
            return NextResponse.json({ success: true, message: 'تم صرف التسوية وإنشاء القيد' });
        } else {
            return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
        }
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
