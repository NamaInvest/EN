import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');

        const auth = getUserFromRequest(request);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (from || to) { where.date = {}; if (from) (where.date as Record<string, unknown>).gte = new Date(from); if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59'); }

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const expenses = await prisma.expense.findMany({ where, include: { user: true }, orderBy: { date: 'desc' } });
        return NextResponse.json(expenses);
    } catch (error) { console.error(error); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = body.userId ? parseInt(body.userId) : null;
        let branchId = body.branchId ? parseInt(body.branchId) : null;
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const expense = await prisma.expense.create({
            data: { category: body.category, description: body.description, amount: parseFloat(body.amount) || 0, userId, branchId, notes: body.notes || undefined },
        });
        await prisma.treasury.create({
            data: { type: 'out', amount: expense.amount, description: `مصروف: ${body.description}`, referenceType: 'expense', referenceId: expense.id, userId, branchId },
        });

        // Auto-journal entry
        try {
            const { postExpense } = await import('@/lib/auto-journal');
            await postExpense({
                id: expense.id,
                category: expense.category || 'عام',
                amount: expense.amount,
                description: expense.description,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (journalErr) {
            console.warn('Auto-journal for expense skipped:', journalErr);
        }

        return NextResponse.json(expense, { status: 201 });
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'edit_expense');
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية تعديل المصروفات' }, { status: 403 });

        const body = await request.json();
        if (!body.id) return NextResponse.json({ error: 'معرف المصروف مطلوب' }, { status: 400 });

        const oldExpense = await prisma.expense.findUnique({ where: { id: body.id } });
        if (!oldExpense) return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });

        const expense = await prisma.expense.update({
            where: { id: body.id },
            data: {
                category: body.category || oldExpense.category,
                description: body.description || oldExpense.description,
                amount: body.amount ? parseFloat(body.amount) : oldExpense.amount,
                notes: body.notes !== undefined ? body.notes : oldExpense.notes,
            },
        });

        // Update related treasury entry amount
        await prisma.treasury.updateMany({
            where: { referenceType: 'expense', referenceId: body.id },
            data: { amount: expense.amount, description: `مصروف: ${expense.description}` },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Expenses PUT error:', error);
        return NextResponse.json({ error: 'فشل في تعديل المصروف' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));
        const deleteAll = searchParams.get('all') === 'true';

        // Delete ALL expenses
        if (deleteAll) {
            const allowed = await hasPermission(auth.userId, 'delete_all_expenses');
            if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف كافة المصروفات' }, { status: 403 });

            const count = await prisma.expense.count();
            // Delete related treasury entries
            await prisma.treasury.deleteMany({ where: { referenceType: 'expense' } });
            // Delete all expenses
            await prisma.expense.deleteMany({});
            return NextResponse.json({ success: true, message: `تم حذف ${count} مصروف بنجاح`, count });
        }

        // Delete SINGLE expense
        const allowed = await hasPermission(auth.userId, 'delete_expense');
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف المصروفات' }, { status: 403 });

        if (!id) return NextResponse.json({ error: 'معرف المصروف مطلوب' }, { status: 400 });

        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });

        await prisma.treasury.deleteMany({ where: { referenceType: 'expense', referenceId: id } });
        await prisma.expense.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'تم حذف المصروف بنجاح' });
    } catch (error) {
        console.error('Expenses DELETE error:', error);
        return NextResponse.json({ error: 'فشل في حذف المصروف' }, { status: 500 });
    }
}
