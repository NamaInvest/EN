import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';
import { TreasuryPostingService } from '@/lib/services/treasury-posting.service';

const log = logger.child({ service: 'banks.id.transactions' });

async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const tenantId = assertTenant(auth.tenantId);

    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const transactions = await prisma.bankTransaction.findMany({ take: 100, 
            where: { 
                ...requireTenantFilter(tenantId),
                bankAccountId: id 
            },
            orderBy: { transactionDate: 'desc' } 
        });
        
        return NextResponse.json(transactions);
    } catch (error: any) { 
        EnterpriseLogger.error('Failed to fetch transactions', { tenantId, userId: auth.userId }, error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 }); 
    }
}

const _POSTSchema = z.object({
  amount: z.number().optional(),
  type: z.any().optional(),
}).passthrough();

async function _POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const tenantId = assertTenant(auth.tenantId);

    try {
        const resolvedParams = await params;
        const bankAccountId = parseInt(resolvedParams.id);
        if (isNaN(bankAccountId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const amount = parseFloat(body.amount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
        }

        if (!['deposit', 'withdrawal', 'transfer'].includes(body.type)) {
            return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
        }

        const result = await runFinancialTx(prisma, async (tx: any) => {
            const bankTransaction = await tx.bankTransaction.create({
                data: {
                    tenantId,
                    bankAccountId,
                    transactionDate: new Date(),
                    type: body.type,
                    amount,
                    description: body.description || '',
                    reference: body.reference || null,
                    isReconciled: true,
                }
            });

            const balanceChange = body.type === 'deposit' ? amount : -amount;
            
            await tx.bankAccount.update({
                where: { id: bankAccountId, tenantId },
                data: {
                    currentBalance: {
                        increment: balanceChange
                    }
                }
            });

            if (body.linkedToTreasury) {
                const treasuryType = body.type === 'deposit' ? 'out' : 'in';
                
                await TreasuryPostingService.createTreasuryEntry(
                    tx,
                    {
                        type: treasuryType,
                        amount,
                        description: `تسوية بنكية: ${body.description || ''} - للبنك ${bankAccountId}`,
                        referenceType: 'bank_transaction',
                        referenceId: bankTransaction.id,
                        treasuryAccountId: body.treasuryAccountId, // Make sure these are passed if required
                        counterpartyAccountId: body.counterpartyAccountId 
                    },
                    auth.userId,
                    null
                );
            }

            EnterpriseLogger.traceFinancialTx(
                `BANK_TX_${bankTransaction.id}`,
                'BANK_TRANSACTION_POSTED',
                tenantId,
                { bankAccountId, type: body.type, amount }
            );

            return bankTransaction;
        }, `BANK_TRANSACTION_${bankAccountId}`);

        return NextResponse.json(result);
    } catch (error: any) { 
        EnterpriseLogger.error('حدث خطأ في المعالجة', { tenantId, userId: auth?.userId }, error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'banks/[id]/transactions' }); 
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'accountant'] });
