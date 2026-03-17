import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const transactions = await prisma.bankTransaction.findMany({ 
            where: { bankAccountId: id },
            orderBy: { transactionDate: 'desc' } 
        });
        
        return NextResponse.json(transactions);
    } catch (error) { 
        console.error(error); 
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 }); 
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const bankAccountId = parseInt(resolvedParams.id);
        if (isNaN(bankAccountId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const body = await request.json();
        
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
        console.error(error); 
        return NextResponse.json({ error: error.message }, { status: 500 }); 
    }
}
