import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const { id } = params;
        const body = await req.json();
        const { resolutionNotes, override } = body;

        const match = await prisma.threeWayMatch.findUnique({
            where: { id: Number(id) }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match record not found' }, { status: 404 });
        }

        const dataToUpdate: any = {
            resolvedAt: new Date(),
            resolutionNotes
        };

        if (override) {
            dataToUpdate.matchStatus = 'OVERRIDDEN';
            dataToUpdate.paymentBlocked = false; // Release for payment
        } else {
            // Keep it blocked but add notes
            dataToUpdate.matchStatus = 'MANUAL_REVIEW';
        }

        const updatePromises: any[] = [
            prisma.threeWayMatch.update({
                where: { id: Number(id) },
                data: dataToUpdate
            })
        ];

        if (override) {
            updatePromises.push(
                prisma.purchaseInvoice.update({
                    where: { id: match.invoiceId },
                    data: { status: 'APPROVED_FOR_PAYMENT' }
                })
            );
        }

        const [updated] = await prisma.$transaction(updatePromises);

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
