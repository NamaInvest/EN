import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        const loans = await prisma.employeeLoan.findMany({
            where: employeeId ? { employeeId: parseInt(employeeId) } : {},
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(loans);
    } catch (error) {
        console.error('Error fetching loans:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const auth = getUserFromRequest(request);
        
        const { employeeId, amount, monthlyDeduction, reason, startDate } = body;
        
        if (!employeeId || !amount || !monthlyDeduction) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const loan = await prisma.employeeLoan.create({
            data: {
                employeeId: parseInt(employeeId),
                amount: parseFloat(amount),
                monthlyDeduction: parseFloat(monthlyDeduction),
                remainingAmount: parseFloat(amount),
                reason,
                startDate: new Date(startDate || new Date()),
                status: 'active'
            }
        });

        // Optionally, generate an automatic journal entry for giving the loan!
        try {
            const { createJournalEntry } = await import('@/lib/auto-journal');
            await createJournalEntry({
                description: `سلفة للموظف رقم ${employeeId}`,
                reference: `LOAN-${loan.id}`,
                lines: [
                    { accountCode: '1200', debit: loan.amount, credit: 0, description: `سلفة الموظف ${reason || ''}` }, // المدينون / عهد موظفين
                    { accountCode: '1110', debit: 0, credit: loan.amount, description: 'دفع سلفة نقداً' } // الصندوق
                ],
                userId: auth?.userId
            });
        } catch(e) { console.error('Auto-journal for loan failed:', e); }

        return NextResponse.json(loan, { status: 201 });
    } catch (error) {
        console.error('Error creating loan:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
