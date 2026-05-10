import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'banks.id.transactions' });
async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const transactions = await prisma.bankTransaction.findMany({
            take: 100, 
            where: { bankAccountId: id },
            orderBy: { transactionDate: 'desc' } 
        });
        
        return NextResponse.json(transactions);
    } catch (error: any) { 
        log.error(error); 
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 }); 
    }
}


const _POSTSchema = z.object({
  amount: z.number().optional(),
  type: z.any().optional(),
}).passthrough();

async function _POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
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

        // Start transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the bank transaction
            const bankTransaction = await tx.bankTransaction.create({
                data: {
                    bankAccountId,
                    transactionDate: new Date(),
                    type: body.type,  // deposit = + balance, withdrawal = - balance
                    amount,
                    description: body.description || '',
                    reference: body.reference || null,
                    isReconciled: true, // Auto reconciled for simplicity unless workflow is needed
                }
            });

            // 2. Update the bank account balance
            const balanceChange = body.type === 'deposit' ? amount : -amount;
            
            await tx.bankAccount.update({
                where: { id: bankAccountId },
                data: {
                    currentBalance: {
                        increment: balanceChange
                    }
                }
            });

            // 3. Update the Treasury balance if it's connected
            if (body.linkedToTreasury) {
                // If depositing to bank -> withdrawing from treasury (out)
                // If withdrawing from bank -> depositing to treasury (in)
                const treasuryType = body.type === 'deposit' ? 'out' : 'in';
                
                await tx.treasury.create({
                    data: {
                        type: treasuryType,
                        amount: amount,
                        description: `تسوية بنكية: ${body.description || ''} - للبنك ${bankAccountId}`,
                        date: new Date(),
                        referenceType: 'bank_transaction',
                        referenceId: bankTransaction.id
                    }
                });
            }

            return bankTransaction;
        });

        return NextResponse.json(result);
    } catch (error: any) { 
        log.error(error); 
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'banks/[id]/transactions' }); 
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
