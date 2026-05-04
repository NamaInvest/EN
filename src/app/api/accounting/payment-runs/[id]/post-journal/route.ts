import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { userId } = body;
        const runId = parseInt(params.id, 10);

        const run = await prisma.paymentRun.findUnique({
            where: { id: runId },
            include: { lines: true }
        });

        if (!run || run.status !== 'CONFIRMED') {
            throw new Error("Payment run must be CONFIRMED to post journal");
        }

        // Journal Entry Creation using schema fields
        const newJe = await prisma.journalEntry.create({
            data: {
                entryNumber: `JE-PRUN-${run.runNumber}`,
                entryDate: new Date().toISOString().split('T')[0], // e.g. "2026-05-04"
                description: `Payment Run ${run.runNumber} via Bank`,
                reference: `PR-${run.id}`,
                totalDebit: Number(run.totalAmount),
                totalCredit: Number(run.totalAmount),
                createdBy: typeof userId === 'number' ? userId : null,
                status: 'posted',
                lines: {
                    create: [
                        {
                            accountId: 2010, // Accounts Payable
                            debit: Number(run.totalAmount),
                            credit: 0,
                            description: 'Payment Run Settled'
                        },
                        {
                            accountId: run.bankAccountId, // Bank Account
                            debit: 0,
                            credit: Number(run.totalAmount),
                            description: 'Cash Outflow'
                        }
                    ]
                }
            }
        });

        const updatedRun = await prisma.paymentRun.update({
            where: { id: runId },
            data: {
                status: 'POSTED',
                postedAt: new Date(),
                postedByUserId: userId || 'system',
                journalEntryId: newJe.id
            }
        });

        return NextResponse.json(updatedRun);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
