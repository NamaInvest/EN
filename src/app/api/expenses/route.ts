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
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'expenses' });

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

        const expenses = await prisma.expense.findMany({ take: 100, 
            where, 
            include: { user: { select: { id: true, username: true, fullName: true, role: true } }, costCenter: true }, 
            orderBy: { date: 'desc' } 
        });
        return NextResponse.json(expenses);
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error });
 
        return handleApiError(error); 
    }
}

async function _POST(request: Request) {

    const prisma = getPrisma(request);
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
        const expense = await prisma.$transaction(async (tx) => {
            const newExpense = await tx.expense.create({
                data: { 
                    category: body.category, 
                    description: body.description, 
                    amount: body.amount, 
                    userId: userId ? Number(userId) : null, 
                    branchId: branchId ? Number(branchId) : null, 
                    notes: body.notes || undefined, 
                    costCenterId: body.costCenterId ? Number(body.costCenterId) : null 
                },
            });
            
            await tx.treasury.create({
                data: { 
                    type: 'out', 
                    amount: newExpense.amount, 
                    description: `مصروف: ${body.description}`, 
                    referenceType: 'expense', 
                    referenceId: newExpense.id, 
                    userId: userId ? Number(userId) : null, 
                    branchId: branchId ? Number(branchId) : null 
                },
            });
            
            return newExpense;
        });

        // Auto-journal entry
        try {
            const { postExpense } = await import('@/lib/auto-journal');
            await postExpense({
                id: expense.id,
                category: expense.category || 'عام',
                amount: n(expense.amount),
                description: expense.description,
                userId: userId ? Number(userId) : undefined,
                branchId: branchId ? Number(branchId) : undefined,
                costCenterId: expense.costCenterId || undefined,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (journalErr: unknown) {
            log.warn('Auto-journal for expense skipped:', journalErr);
        }

        return NextResponse.json(expense, { status: 201 });
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error });
 
        return handleApiError(error); 
    }
}

async function _PUT(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'edit_expense', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية تعديل المصروفات' }, { status: 403 });

        const rawBody = await request.json();
        
        // Zod Validation
        const body = expenseUpdateSchema.parse(rawBody);

        const oldExpense = await prisma.expense.findUnique({ where: { id: Number(body.id) } });
        if (!oldExpense) return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });

        // Transaction updates
        const expense = await prisma.$transaction(async (tx) => {
            const updatedExpense = await tx.expense.update({
                where: { id: Number(body.id) },
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
                where: { referenceType: 'expense', referenceId: Number(body.id) },
                data: { amount: updatedExpense.amount, description: `مصروف: ${updatedExpense.description}` },
            });
            
            return updatedExpense;
        });

        return NextResponse.json(expense);
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error });

        return handleApiError(error);
    }
}

async function _DELETE(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));
        const deleteAll = searchParams.get('all') === 'true';

        // Delete ALL expenses
        if (deleteAll) {
            const allowed = await hasPermission(auth.userId, 'delete_all_expenses', prisma);
            if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف كافة المصروفات' }, { status: 403 });

            const count = await prisma.$transaction(async (tx) => {
                const total = await tx.expense.count();
                await tx.treasury.deleteMany({ where: { referenceType: 'expense' } });
                await tx.expense.deleteMany({});
                return total;
            });
            
            return NextResponse.json({ success: true, message: `تم حذف ${count} مصروف بنجاح`, count });
        }

        // Delete SINGLE expense
        const allowed = await hasPermission(auth.userId, 'delete_expense', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف المصروفات' }, { status: 403 });

        if (!id) return NextResponse.json({ error: 'معرف المصروف مطلوب' }, { status: 400 });

        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            await tx.treasury.deleteMany({ where: { referenceType: 'expense', referenceId: id } });
            await tx.expense.delete({ where: { id } });
        });

        return NextResponse.json({ success: true, message: 'تم حذف المصروف بنجاح' });
    } catch (error: any) {
        log.error('src/app/api/expenses/route.ts', { error: error instanceof Error ? error.message : error });

        return handleApiError(error);
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
