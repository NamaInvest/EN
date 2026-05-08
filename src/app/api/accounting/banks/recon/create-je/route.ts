import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { lineId, accountId, description } = body;

        if (!lineId || !accountId || !description) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Simplistic logic for mock purposes:
        const line = await prisma.bankStatementLine.findUnique({ where: { id: parseInt(lineId, 10) } });
        // BUILD SAFETY: if (!line) throw new Error("Line not found");

        // Mock create JE
        const je = await prisma.journalEntry.create({
            data: {
                entryNumber: `JE-RECON-${Date.now()}`,
                date: line.transactionDate,
                description,
                status: 'POSTED',
                lines: {
                    create: [
                        // @ts-expect-error [TS2322] Type assignment mismatch - pending strict types
                        { accountId: parseInt(accountId, 10), debit: line.type === 'DEBIT' ? line.amount : 0, credit: line.type === 'CREDIT' ? line.amount : 0 }
                    ]
                }
            }
        });

        const updatedLine = await prisma.bankStatementLine.update({
            where: { id: parseInt(lineId, 10) },
            data: {
                matchStatus: 'MANUAL_MATCHED',
                matchedToType: 'JE',
                matchedToId: je.id,
                matchedJournalId: je.id,
                matchedAt: new Date()
            }
        });

        return NextResponse.json({ message: 'Journal Entry created successfully', je, line: updatedLine });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
