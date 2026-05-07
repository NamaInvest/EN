import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: Request) {
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    if (!_getAuth(request)) return NextResponse.json({ error: 'UnauthorizedUnauthorizedUnauthorized UnauthorizedUnauthorizedUnauthorizedUnauthorized' }, { status: 401 });
    const prisma = getPrisma(request);
    try {
        const banks = await prisma.bankAccount.findMany({
            take: 100, 
            include: { branch: true },
            orderBy: { id: 'desc' } 
        });
        return NextResponse.json(banks);
    } catch (error) { 
        console.error(error); 
        return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 }); 
    }
}

export async function POST(request: Request) {
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        
        const branchId = body.branchId ? parseInt(body.branchId.toString()) : null;
        const initialBalance = parseFloat(body.currentBalance || '0');

        const bank = await prisma.bankAccount.create({
            data: { 
                bankName: body.bankName,
                accountName: body.accountName,
                accountNumber: body.accountNumber,
                iban: body.iban || null,
                currency: body.currency || 'SAR',
                currentBalance: initialBalance,
                branchId: branchId,
                isActive: body.isActive !== undefined ? body.isActive : true
            }
        });

        // If there is an initial balance, create a transaction for it
        if (initialBalance > 0) {
            await prisma.bankTransaction.create({
                data: {
                    bankAccountId: bank.id,
                    transactionDate: new Date(),
                    type: 'deposit',
                    amount: initialBalance,
                    description: 'رصيد افتتاحي',
                    isReconciled: true // Opening balances are usually reconciled
                }
            });
        }

        return NextResponse.json(bank);
    } catch (error: any) { 
        console.error(error); 
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'banks' }); 
    }
}
