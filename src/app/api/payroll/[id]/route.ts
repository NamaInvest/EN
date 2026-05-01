import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const prisma = getPrisma(request);
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const invoice = await prisma.payrollInvoice.findUnique({
            where: { id },
            include: {
                employee: true,
                details: true
            }
        });

        if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Payslip GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch payslip' }, { status: 500 });
    }
}
