import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { treasuryCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';
import { createJournalEntry } from '@/lib/auto-journal';
import { withIdempotency } from '@/lib/idempotency';

const log = logger.child({ service: 'treasury' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');

        const auth = getUserFromRequest(request as any);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (from || to) { where.date = {}; if (from) (where.date as Record<string, unknown>).gte = new Date(from); if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59'); }

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const entries = await prisma.treasury.findMany({ take: 100, where, include: { user: { select: { id: true, username: true, fullName: true, role: true, phone: true } } }, orderBy: { date: 'desc' } });
        return NextResponse.json(entries);
    } catch (error: any) {
        log.error('src/app/api/treasury/route.ts', { error: error instanceof Error ? error.message : error });
 
        return handleApiError(error); 
    }
}

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        
        // Zod Runtime Validation & Strip mass-assignment fields
        const body = treasuryCreateSchema.parse(rawBody);

        const userId = body.userId || null;
        let branchId = body.branchId || null;
        
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        // Strict Validation for Manual Entries
        if (body.referenceType === 'manual') {
            if (!body.counterpartyAccountId) {
                return NextResponse.json({ error: 'Manual treasury entry requires counterpartyAccountId' }, { status: 400 });
            }
            if (!body.treasuryAccountId) {
                return NextResponse.json({ error: 'Manual treasury entry requires treasuryAccountId' }, { status: 400 });
            }
        }

        const treasuryAccountId = body.treasuryAccountId;
        const counterpartyAccountId = body.counterpartyAccountId;

        // Transactions inside Treasury to align with architecture constraints
        const entry = await prisma.$transaction(async (tx) => {
            const newTreasury = await tx.treasury.create({
                data: { 
                    type: body.type, 
                    amount: body.amount, 
                    description: body.description || null, 
                    referenceType: body.referenceType || 'manual', 
                    referenceId: body.referenceId ? Number(body.referenceId) : null, 
                    userId: userId ? Number(userId) : null, 
                    branchId: branchId ? Number(branchId) : null 
                },
            });

            // Journal Entry Binding if Accounts are Explicit
            if (treasuryAccountId && counterpartyAccountId) {
                const treasuryAccount = await tx.account.findUnique({ where: { id: Number(treasuryAccountId) }, select: { code: true } });
                const counterpartyAccount = await tx.account.findUnique({ where: { id: Number(counterpartyAccountId) }, select: { code: true } });

                if (!treasuryAccount || !counterpartyAccount) {
                    throw new Error("Invalid account IDs provided for treasury or counterparty.");
                }

                const journalLines = [];
                const amountNum = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount as string);

                if (body.type === 'in') {
                    // Receipt: Debit Treasury, Credit Counterparty
                    journalLines.push({ accountCode: treasuryAccount.code, debit: amountNum, credit: 0, description: body.description || 'Treasury Receipt' });
                    journalLines.push({ accountCode: counterpartyAccount.code, debit: 0, credit: amountNum, description: body.description || 'Treasury Receipt' });
                } else if (body.type === 'out') {
                    // Payment: Debit Counterparty, Credit Treasury
                    journalLines.push({ accountCode: counterpartyAccount.code, debit: amountNum, credit: 0, description: body.description || 'Treasury Payment' });
                    journalLines.push({ accountCode: treasuryAccount.code, debit: 0, credit: amountNum, description: body.description || 'Treasury Payment' });
                }

                await createJournalEntry({
                    description: body.description || `Treasury ${body.type === 'in' ? 'Receipt' : 'Payment'}`,
                    reference: `TREAS-${newTreasury.id}`,
                    lines: journalLines,
                    userId: userId ? Number(userId) : undefined,
                    branchId: branchId ? Number(branchId) : undefined,
                    date: new Date().toISOString(),
                    txClient: tx,
                });
            } else if (body.referenceType === 'manual') {
                 throw new Error("Manual treasury entries strictly require both treasury and counterparty accounts.");
            }

            return newTreasury;
        });
        
        return NextResponse.json(entry, { status: 201 });
    } catch (error: any) {
        log.error('src/app/api/treasury/route.ts', { error: error instanceof Error ? error.message : error });
        return handleApiError(error); 
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => {
  return withIdempotency(req as NextRequest, 'POST /api/treasury', async () => _POST(req as any));
}, { rateLimit: 'FINANCIAL' });
