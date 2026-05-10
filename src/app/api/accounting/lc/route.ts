import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'accounting.lc' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const lcs = await prisma.letterOfCredit.findMany({
            take: 100,
            include: { bank: true, supplier: true },
            orderBy: { id: 'desc' }
        });
        
        const banks = await prisma.bankAccount.findMany({
            take: 100, where: { isActive: true } });
        const suppliers = await prisma.customer.findMany({
            take: 100, where: { type: { in: [1, 2] } } });

        return NextResponse.json({ lcs, banks, suppliers }, { status: 200 });
    } catch (error: any) {
        return apiError(error, 'فشل جلب الاعتمادات المستندية', { context: 'accounting/lc' });
    }
}


const _POSTSchema = z.object({
  lcNumber: z.any().optional(),
  bankId: z.union([z.string(), z.number()]).optional(),
  supplierId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currencyId: z.union([z.string(), z.number()]).optional(),
  exchangeRate: z.number().optional(),
  openDate: z.string().optional(),
  expiryDate: z.string().optional(),
  marginPercent: z.any().optional(),
  marginPaid: z.union([z.string(), z.number()]).optional(),
  portOfLoading: z.any().optional(),
  port: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const newLc = await prisma.letterOfCredit.create({
            data: {
                lcNumber: body.lcNumber,
                bankId: parseInt(body.bankId),
                supplierId: parseInt(body.supplierId),
                amount: parseFloat(body.amount),
                currencyId: body.currencyId ? parseInt(body.currencyId) : 1,
                exchangeRate: parseFloat(body.exchangeRate) || 3.75,
                openDate: body.openDate ? new Date(body.openDate) : new Date(),
                expiryDate: new Date(body.expiryDate),
                marginPercent: parseFloat(body.marginPercent) || 0,
                marginPaid: parseFloat(body.marginPaid) || 0,
                portOfLoading: body.portOfLoading,
                portOfDischarge: body.portOfDischarge,
                notes: body.notes,
                status: 'draft'
            }
        });

        // Auto-Generate a Journal Entry for Margin Payment (Cash out from Bank)
        if (n(newLc.marginPaid) > 0) {
            await prisma.$transaction(async (tx) => {
                 await tx.bankTransaction.create({
                     data: {
                         bankAccountId: newLc.bankId,
                         type: 'out',
                         amount: n(newLc.marginPaid),
                         transactionDate: new Date(),
                         description: `سحب تغطية نقدية لاعتماد مستندي رقم ${newLc.lcNumber}`,
                         reference: `LC-${newLc.id}`
                     }
                 });
                 await tx.bankAccount.update({
                     where: { id: newLc.bankId },
                     data: { currentBalance: { decrement: n(newLc.marginPaid) } }
                 });
            });
        }

        return NextResponse.json(newLc, { status: 201 });
    } catch (error: any) {
        return apiError(error, 'Error opening LC', { context: 'accounting/lc' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
