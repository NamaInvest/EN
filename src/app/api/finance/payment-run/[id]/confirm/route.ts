import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
        
        // 1. Fetch the run with lines to update invoice status
        const run = await prisma.paymentRun.findUnique({
            where: { id },
            include: { lines: true }
        });

        if (!run) {
            return NextResponse.json({ error: 'Run not found' }, { status: 404 });
        }

        // 2. Update all associated invoices to 'PAID'
        const invoiceIds: number[] = [];
        run.lines.forEach(line => {
            invoiceIds.push(...line.openItemIds);
        });

        // 3. Mark run as POSTED and update invoices
        await prisma.$transaction([
            prisma.paymentRun.update({
                where: { id },
                data: {
                    status: 'POSTED',
                    confirmedAt: new Date(),
                    postedAt: new Date()
                }
            }),
            prisma.purchaseInvoice.updateMany({
                where: { id: { in: invoiceIds } },
                data: { status: 'PAID', paid: Number(run.totalAmount), remaining: 0 } // simplistic approach
            })
            // Real implementation would create a JournalEntry here
            // Dr 2010 AP
            // Cr 1010 Cash/Bank
        ]);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
