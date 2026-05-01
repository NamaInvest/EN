import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const loans = await prisma.employeeLoan.findMany({
            include: { employee: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(loans);
    } catch (error) {
        console.error("Loans GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { employeeId, amount, monthlyDeduction, reason } = body;

        if (!employeeId || !amount || !monthlyDeduction) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const loan = await prisma.employeeLoan.create({
            data: {
                employeeId: parseInt(employeeId),
                amount: parseFloat(amount),
                monthlyDeduction: parseFloat(monthlyDeduction),
                remainingAmount: parseFloat(amount),
                reason: reason || null,
                startDate: new Date(),
                status: 'active'
            }
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (error) {
        console.error("Loans POST error:", error);
        return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 });
    }
}
