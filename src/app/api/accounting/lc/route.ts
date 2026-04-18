import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const lcs = await prisma.letterOfCredit.findMany({
            include: { bank: true, supplier: true },
            orderBy: { id: 'desc' }
        });
        
        const banks = await prisma.bankAccount.findMany({ where: { isActive: true } });
        const suppliers = await prisma.customer.findMany({ where: { type: { in: [1, 2] } } });

        return NextResponse.json({ lcs, banks, suppliers }, { status: 200 });
    } catch (error: any) {
        return apiError(error, 'فشل جلب الاعتمادات المستندية', { context: 'accounting/lc' });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        
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
        if (newLc.marginPaid > 0) {
            await prisma.$transaction(async (tx) => {
                 await tx.bankTransaction.create({
                     data: {
                         bankAccountId: newLc.bankId,
                         type: 'out',
                         amount: newLc.marginPaid,
                         transactionDate: new Date(),
                         description: `سحب تغطية نقدية لاعتماد مستندي رقم ${newLc.lcNumber}`,
                         reference: `LC-${newLc.id}`
                     }
                 });
                 await tx.bankAccount.update({
                     where: { id: newLc.bankId },
                     data: { currentBalance: { decrement: newLc.marginPaid } }
                 });
            });
        }

        return NextResponse.json(newLc, { status: 201 });
    } catch (error: any) {
        return apiError(error, 'Error opening LC', { context: 'accounting/lc' });
    }
}
