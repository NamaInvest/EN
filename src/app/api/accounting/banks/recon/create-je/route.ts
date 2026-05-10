import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.banks.recon.create-je' });


const _POSTSchema = z.object({
  lineId: z.union([z.string(), z.number()]).optional(),
  accountId: z.union([z.string(), z.number()]).optional(),
  description: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { lineId, accountId, description } = body;

        if (!lineId || !accountId || !description) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Simplistic logic for mock purposes:
        const line = await prisma.bankStatementLine.findUnique({ where: { id: parseInt(lineId, 10) } });
        if (!line) return NextResponse.json({ error: 'Line not found' }, { status: 404 });

        // Mock create JE
        const je = await prisma.journalEntry.create({
            data: {
                entryNumber: `JE-RECON-${Date.now()}`,
                entryDate: line.transactionDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0],
                description,
                status: 'POSTED',
                lines: {
                    create: [
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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
