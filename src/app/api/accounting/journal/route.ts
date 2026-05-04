import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createJournalEntry } from '@/lib/auto-journal';

// GET - ط§ظ„ظ‚ظٹظˆط¯ ط§ظ„ظٹظˆظ…ظٹط©
export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const status = searchParams.get('status');

        const where: Record<string, unknown> = {};
        if (from) where.entryDate = { ...(where.entryDate as object || {}), gte: from };
        if (to) where.entryDate = { ...(where.entryDate as object || {}), lte: to };
        if (status) where.status = status;

        const entries = await prisma.journalEntry.findMany({
            where,
            include: {
                lines: {
                    include: { 
                        account: { select: { code: true, name: true, type: true } },
                        costCenter: { select: { name: true } }
                    },
                },
            },
            orderBy: { id: 'desc' },
            take: 200,
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Journal GET error:', error);
        return NextResponse.json({ error: 'ظپط´ظ„ ظپظٹ ط¬ظ„ط¨ ط§ظ„ظ‚ظٹظˆط¯' }, { status: 500 });
    }
}

// POST - ط¥ط¶ط§ظپط© ظ‚ظٹط¯ ظٹط¯ظˆظٹ
export async function POST(request: Request) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'ط؛ظٹط± ظ…طµط±ط­' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { description, reference, date, lines, userId } = body;

        if (!description || !lines || lines.length < 2) {
            return NextResponse.json({ error: 'ط§ظ„ظˆطµظپ ظˆط³ط·ط±ظٹظ† ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ ظ…ط·ظ„ظˆط¨ظٹظ†' }, { status: 400 });
        }

        // Validate balance
        const totalDebit = lines.reduce((s: number, l: { debit: number }) => s + (l.debit || 0), 0);
        const totalCredit = lines.reduce((s: number, l: { credit: number }) => s + (l.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: `ط§ظ„ظ‚ظٹط¯ ط؛ظٹط± ظ…طھظˆط§ط²ظ†: ظ…ط¯ظٹظ† ${totalDebit} â‰  ط¯ط§ط¦ظ† ${totalCredit}` }, { status: 400 });
        }

        const { ACCOUNTS } = require('@/lib/auto-journal');
        const CONTROL_ACCOUNTS = [ACCOUNTS.RECEIVABLES, ACCOUNTS.PAYABLES, ACCOUNTS.INVENTORY, ACCOUNTS.WIP, ACCOUNTS.FINISHED_GOODS, ACCOUNTS.VAT_INPUT, ACCOUNTS.VAT_OUTPUT]; 
        const isRestricted = lines.some((l: any) => CONTROL_ACCOUNTS.includes(l.accountCode));
        if (isRestricted) {
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: auth?.userId || 1,
                        action: 'GOVERNANCE_VIOLATION_ATTEMPT',
                        tableName: 'JournalEntry',
                        recordId: 0,
                        details: JSON.stringify({ reason: 'Attempted to manually post to control account', attemptedLines: lines })
                    }
                });
            } catch (e) { console.error(e); }
            return NextResponse.json({ error: 'ظ…ظ†ط¹ ط±ظ‚ط§ط¨ظٹ: ظٹظ…ظ†ط¹ ط¥ط¯ط®ط§ظ„ ظ‚ظٹط¯ ظٹط¯ظˆظٹ ظ…ط¨ط§ط´ط± ط¹ظ„ظ‰ ط­ط³ط§ط¨ط§طھ ط§ظ„ظ…ط±ط§ظ‚ط¨ط© (ط¹ظ…ظ„ط§ط،طŒ ظ…ظˆط±ط¯ظٹظ†طŒ ظ…ط®ط²ظˆظ†). ظٹط¬ط¨ ط£ظ† طھظ†ط´ط£ ط¢ظ„ظٹط§ظ‹ ظ…ظ† ط§ظ„ظپظˆط§طھظٹط±.' }, { status: 403 });
        }

        // --- MFA Step-Up Auth for large amounts ---
        if (totalDebit > 100000) {
            const { MfaEngine } = require('@/lib/mfa-engine');
            if (!body.mfaToken) {
                try {
                    const stepUpRes = await MfaEngine.requireStepUpAuth(auth.userId, 'ط¥ط¯ط®ط§ظ„ ظ‚ظٹط¯ ظٹطھط¬ط§ظˆط² 100,000');
                    return NextResponse.json({ requiresStepUpMFA: true, message: stepUpRes.message }, { status: 403 });
                } catch (e: any) {
                    return NextResponse.json({ error: e.message }, { status: 403 });
                }
            }

            const isValidMfa = await MfaEngine.verifyToken(auth.userId, body.mfaToken);
            if (!isValidMfa) {
                return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ط§ظ„ط«ظ†ط§ط¦ظٹ (2FA) ط؛ظٹط± طµط­ظٹط­' }, { status: 401 });
            }
        }
        // ------------------------------------------

        const result = await createJournalEntry({
            description,
            reference,
            date,
            lines: lines.map((l: { accountCode: string; costCenterId?: number; debit: number; credit: number; description?: string }) => ({
                accountCode: l.accountCode,
                costCenterId: l.costCenterId,
                debit: l.debit || 0,
                credit: l.credit || 0,
                description: l.description,
            })),
            userId,
            status: body.status || 'draft',
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, entryId: result.entryId }, { status: 201 });
    } catch (error) {
        console.error('Journal create error:', error);
        return NextResponse.json({ error: 'ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„ظ‚ظٹط¯' }, { status: 500 });
    }
}
