import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createJournalEntry, ACCOUNTS } from '@/lib/auto-journal';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { MfaEngine } from '@/lib/mfa-engine';
import { buildOverrideContextFromRequest } from '@/lib/governance/override-context';

const log = logger.child({ service: 'accounting.journal' });

// GET - ط§ظ„ظ‚ظٹظˆط¯ ط§ظ„ظٹظˆظ…ظٹط©
async function _GET(request: Request) {
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
    } catch (error: any) {
        log.error('Journal GET error:', error);
        return NextResponse.json({ error: 'ظپط´ظ„ ظپظٹ ط¬ظ„ط¨ ط§ظ„ظ‚ظٹظˆط¯' }, { status: 500 });
    }
}

// POST - ط¥ط¶ط§ظپط© ظ‚ظٹط¯ ظٹط¯ظˆظٹ

const _POSTSchema = z.object({
  description: z.any().optional(),
  reference: z.any().optional(),
  date: z.string().optional(),
  lines: z.array(z.any()).optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    // Auth guard
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'ط؛ظٹط± ظ…طµط±ط­' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

        const CONTROL_ACCOUNTS = [ACCOUNTS.RECEIVABLES, ACCOUNTS.PAYABLES, ACCOUNTS.INVENTORY, ACCOUNTS.WIP, ACCOUNTS.FINISHED_GOODS, ACCOUNTS.VAT_INPUT, ACCOUNTS.VAT_OUTPUT]; 
        const isRestricted = lines.some((l: any) => CONTROL_ACCOUNTS.includes(l.accountCode));
        if (isRestricted) {
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: auth?.userId || 1,
                        action: 'GOVERNANCE_VIOLATION_ATTEMPT',
                        tableName: 'JournalEntry',
                        recordId: '0',
                        details: JSON.stringify({ reason: 'Attempted to manually post to control account', attemptedLines: lines })
                    }
                });
            } catch (e: any) { log.error(e); }
            return NextResponse.json({ error: 'ظ…ظ†ط¹ ط±ظ‚ط§ط¨ظٹ: ظٹظ…ظ†ط¹ ط¥ط¯ط®ط§ظ„ ظ‚ظٹط¯ ظٹط¯ظˆظٹ ظ…ط¨ط§ط´ط± ط¹ظ„ظ‰ ط­ط³ط§ط¨ط§طھ ط§ظ„ظ…ط±ط§ظ‚ط¨ط© (ط¹ظ…ظ„ط§ط،طŒ ظ…ظˆط±ط¯ظٹظ†طŒ ظ…ط®ط²ظˆظ†). ظٹط¬ط¨ ط£ظ† طھظ†ط´ط£ ط¢ظ„ظٹط§ظ‹ ظ…ظ† ط§ظ„ظپظˆط§طھظٹط±.' }, { status: 403 });
        }

        // --- MFA Step-Up Auth for large amounts ---
        if (totalDebit > 100000) {
            if (!body.mfaToken) {
                try {
                    const stepUpRes = await (MfaEngine as any).requireStepUpAuth(auth.userId, 'إدخال قيد يتجاوز 100,000');
                    return NextResponse.json({ requiresStepUpMFA: true, message: stepUpRes.message }, { status: 403 });
                } catch (e: any) {
                    return NextResponse.json({ error: e.message }, { status: 403 });
                }
            }

            const isValidMfa = await (MfaEngine as any).verifyToken(auth.userId, body.mfaToken);
            if (!isValidMfa) {
                return NextResponse.json({ error: 'رمز التحقق الثنائي (2FA) غير صحيح' }, { status: 401 });
            }
        }
        // ------------------------------------------

        const overrideContext = buildOverrideContextFromRequest(request, {
            tenantId: auth.tenantId || 'default',
            actorId: String(auth.userId),
            actorRole: auth.role || 'USER'
        });

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
            overrideContext
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, entryId: result.entryId }, { status: 201 });
    } catch (error: any) {
        console.error('DEBUG ERROR:', error);
        throw error; // Rethrow to surface the error in vitest
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
