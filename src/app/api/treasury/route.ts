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

        const { runFinancialTx } = await import('@/lib/db/transaction');
        const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');

        const auth = getUserFromRequest(request as any);
        const overrideContext = buildOverrideContextFromRequest(request, {
            tenantId: auth?.tenantId || 'default',
            actorId: String(auth?.userId || userId || '0'),
            actorRole: auth?.role || 'USER'
        });

        // Transactions inside Treasury to align with architecture constraints
        const entry = await runFinancialTx(prisma, async (tx) => {
            return await TreasuryPostingService.createTreasuryEntry(
                tx,
                body,
                userId ? Number(userId) : null,
                branchId ? Number(branchId) : null,
                overrideContext
            );
        }, `treasury-posting-${userId || 'sys'}`);
        
        return NextResponse.json(entry, { status: 201 });
    } catch (error: any) {
        log.error('src/app/api/treasury/route.ts', { error: error instanceof Error ? error.message : error });
        return handleApiError(error); 
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'treasury_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _POST(req as any);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'treasury_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'treasury_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'treasury_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL' });
