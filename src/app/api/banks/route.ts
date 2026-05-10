import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'banks' });
async function _GET(request: Request) {
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    if (!_getAuth(request)) return NextResponse.json({ error: 'UnauthorizedUnauthorizedUnauthorized UnauthorizedUnauthorizedUnauthorizedUnauthorized' }, { status: 401 });
    const prisma = getPrisma(request);
    try {
        const banks = await prisma.bankAccount.findMany({ take: 100, 
            include: { branch: true },
            orderBy: { id: 'desc' } 
        });
        return NextResponse.json(banks);
    } catch (error: any) { 
        log.error(error); 
        return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 }); 
    }
}


const _POSTSchema = z.object({
  branchId: z.union([z.string(), z.number()]).optional(),
  currentBalance: z.any().optional(),
  bankName: z.any().optional(),
  accountName: z.any().optional(),
  accountNumber: z.any().optional(),
  iban: z.any().optional(),
  currency: z.any().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
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
        log.error(error); 
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'banks' }); 
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
