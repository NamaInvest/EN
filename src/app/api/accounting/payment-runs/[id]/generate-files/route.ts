import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();
        const { formats, userId } = body;
        const runId = parseInt((await params).id, 10);

        const run = await prisma.paymentRun.findUnique({
            where: { id: runId },
            include: { lines: true }
        });

        if (!run || run.status !== 'APPROVED') {
            throw new Error("Payment run must be APPROVED to generate files");
        }

        // Mock generating bank files (SARIE, SEPA, etc.)
        for (const format of formats) {
            await prisma.paymentRunBankFile.create({
                data: {
                    runId,
                    fileFormat: format,
                    bankAccountId: run.bankAccountId,
                    fileUrl: `https://storage.mock.com/bank-files/${runId}_${format}.xml`,
                    fileName: `${run.runNumber}_${format}.xml`,
                    fileHash: `mockhash_${Date.now()}`,
                    fileSizeBytes: 1024,
                    generatedByUserId: userId || 'system',
                    txnCount: run.lines.length,
                    totalAmount: run.totalAmount,
                    currency: run.currency
                }
            });
        }

        const updatedRun = await prisma.paymentRun.update({
            where: { id: runId },
            data: {
                status: 'FILE_GENERATED',
                filesGeneratedAt: new Date()
            }
        });

        return NextResponse.json(updatedRun);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
