import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { expenseCreateSchema, expenseUpdateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';
import { getMainBranchId } from '@/lib/getDefaults';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { TreasuryPostingService } from '@/lib/services/treasury-posting.service';
import { postExpense } from '@/lib/auto-journal';

const log = logger.child({ service: 'expenses' });

// ── GET ──────────────────────────────────────────────────────────────────────

async function _GET(request: NextRequest, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');

        const user = auth?.userId ? await prisma.user.findUnique({ 
            where: { id: auth.userId }, 
            select: { role: true, branchId: true } 
        }) : null;

        const where: Record<string, unknown> = requireTenantFilter({ tenantId });
        if (from || to) { 
            where.date = {}; 
            if (from) (where.date as Record<string, unknown>).gte = new Date(from); 
            if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59'); 
        }

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const expenses = await prisma.expense.findMany({ 
            take: 100, 
            where, 
            include: { user: { select: { id: true, username: true, fullName: true, role: true } }, costCenter: true }, 
            orderBy: { date: 'desc' } 
        });
        return NextResponse.json(expenses);
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error, tenantId });
        return handleApiError(error); 
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────

async function _POST(request: Request, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const rawBody = await request.json();
        
        // Zod Runtime Validation & mass-assignment protection
        const body = expenseCreateSchema.parse(rawBody);

        const userId = body.userId || null;
        let branchId: number | null = body.branchId ? Number(body.branchId) : null;

        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { branchId: true } });
            branchId = user?.branchId ?? null;
        }
        // Fallback → الفرع الرئيسي إذا لم يتحدد فرع
        if (!branchId) branchId = await getMainBranchId();

        // --- Database Transaction for Atomicity (Atomic Operation) ---
        const expense = await runFinancialTx(prisma, async (tx) => {
            const newExpense = await tx.expense.create({
                data: { 
                    tenantId,
                    category: body.category, 
                    description: body.description, 
                    amount: body.amount, 
                    userId: userId ? Number(userId) : null, 
                    branchId: branchId ? Number(branchId) : null, 
                    notes: body.notes || undefined, 
                    costCenterId: body.costCenterId ? Number(body.costCenterId) : null 
                },
            });
            
            await TreasuryPostingService.createTreasuryEntry(tx, {
                tenantId,
                type: 'out', 
                amount: newExpense.amount, 
                description: `مصروف: ${body.description}`, 
                referenceType: 'expense', 
                referenceId: newExpense.id
            }, userId ? Number(userId) : null, branchId ? Number(branchId) : null);
            
            // Auto-journal entry
            try {
                await postExpense({
                    id: newExpense.id,
                    category: newExpense.category || 'عام',
                    amount: n(newExpense.amount),
                    description: newExpense.description,
                    userId: userId ? Number(userId) : undefined,
                    branchId: branchId ? Number(branchId) : undefined,
                    costCenterId: newExpense.costCenterId || undefined,
                    date: new Date().toISOString().split('T')[0],
                    txClient: tx, // Provide txClient for atomicity
                });
            } catch (journalErr: unknown) {
                log.warn('Auto-journal for expense failed:', journalErr);
            }

            return newExpense;
        }, 'EXPENSE_POST');

        return NextResponse.json(expense, { status: 201 });
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error, tenantId });
        return handleApiError(error); 
    }
}

// ── PUT ──────────────────────────────────────────────────────────────────────

async function _PUT(request: NextRequest, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'edit_expense', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية تعديل المصروفات' }, { status: 403 });

        const rawBody = await request.json();
        
        // Zod Validation
        const body = expenseUpdateSchema.parse(rawBody);

        const oldExpense = await prisma.expense.findUnique({ 
            where: { id: Number(body.id), ...requireTenantFilter({ tenantId }) } 
        });
        if (!oldExpense) return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });

        // Transaction updates
        const expense = await runFinancialTx(prisma, async (tx) => {
            const updatedExpense = await tx.expense.update({
                where: { id: Number(body.id), tenantId },
                data: {
                    category: body.category || oldExpense.category,
                    description: body.description || oldExpense.description,
                    amount: body.amount ?? oldExpense.amount,
                    notes: body.notes !== undefined ? body.notes : oldExpense.notes,
                    costCenterId: body.costCenterId !== undefined ? (body.costCenterId ? Number(body.costCenterId) : null) : oldExpense.costCenterId,
                },
            });

            // Sync treasury
            await tx.treasury.updateMany({
                where: { referenceType: 'expense', referenceId: Number(body.id), tenantId },
                data: { amount: updatedExpense.amount, description: `مصروف: ${updatedExpense.description}` },
            });

            // Re-post auto-journal if amount or category changed
            if (updatedExpense.amount !== oldExpense.amount || updatedExpense.category !== oldExpense.category || updatedExpense.costCenterId !== oldExpense.costCenterId) {
                try {
                    await postExpense({
                        id: updatedExpense.id,
                        category: updatedExpense.category || 'عام',
                        amount: n(updatedExpense.amount),
                        description: updatedExpense.description,
                        userId: updatedExpense.userId || undefined,
                        branchId: updatedExpense.branchId || undefined,
                        costCenterId: updatedExpense.costCenterId || undefined,
                        date: updatedExpense.date.toISOString().split('T')[0],
                        txClient: tx, // Atomic update
                    });
                } catch (journalErr: unknown) {
                    log.warn('Auto-journal update for expense failed:', journalErr);
                }
            }
            
            return updatedExpense;
        }, 'EXPENSE_UPDATE');

        return NextResponse.json(expense);
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error, tenantId });
        return handleApiError(error);
    }
}

// ── DELETE ───────────────────────────────────────────────────────────────────

async function _DELETE(request: NextRequest, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));
        const deleteAll = searchParams.get('all') === 'true';

        // Delete ALL expenses
        if (deleteAll) {
            const allowed = await hasPermission(auth.userId, 'delete_all_expenses', prisma);
            if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف كافة المصروفات' }, { status: 403 });

            const count = await runFinancialTx(prisma, async (tx) => {
                const total = await tx.expense.count({ where: requireTenantFilter({ tenantId }) });
                await tx.treasury.deleteMany({ where: { referenceType: 'expense', tenantId } });
                await tx.journalEntry.deleteMany({ where: { reference: { startsWith: 'EXP-' }, tenantId } });
                await tx.expense.deleteMany({ where: requireTenantFilter({ tenantId }) });
                return total;
            }, 'EXPENSE_DELETE_ALL');
            
            return NextResponse.json({ success: true, message: `تم حذف ${count} مصروف بنجاح`, count });
        }

        // Delete SINGLE expense
        const allowed = await hasPermission(auth.userId, 'delete_expense', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف المصروفات' }, { status: 403 });

        if (!id) return NextResponse.json({ error: 'معرف المصروف مطلوب' }, { status: 400 });

        const expense = await prisma.expense.findUnique({ 
            where: { id, ...requireTenantFilter({ tenantId }) } 
        });
        if (!expense) return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });

        await runFinancialTx(prisma, async (tx) => {
            await tx.treasury.deleteMany({ where: { referenceType: 'expense', referenceId: id, tenantId } });
            await tx.journalEntry.deleteMany({ where: { reference: `EXP-${id}`, tenantId } });
            await tx.expense.delete({ where: { id, tenantId } });
        }, 'EXPENSE_DELETE');

        return NextResponse.json({ success: true, message: 'تم حذف المصروف بنجاح' });
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error, tenantId });
        return handleApiError(error);
    }
}

// ── Exports ──────────────────────────────────────────────────────────────────

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'expense_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _POST(req as any, auth);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'expense_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'expense_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'expense_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL' });

export const PUT = withRoute(async ({ req, auth }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'expense_put', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _PUT(req as any, auth);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'expense_put', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'expense_put', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'expense_put', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req, auth }) => _DELETE(req as any, auth), { rateLimit: 'FINANCIAL' });

