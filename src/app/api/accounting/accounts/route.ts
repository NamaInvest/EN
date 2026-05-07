import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// GET - شجرة الحسابات
export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const accounts = await prisma.account.findMany({
            take: 100,
            orderBy: { code: 'asc' },
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error('Accounts GET error:', error);
        return NextResponse.json({ error: 'فشل في جلب الحسابات' }, { status: 500 });
    }
}

// POST - إضافة حساب جديد
export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { code, name, nameEn, type, parentId, level } = body;

        if (!code || !name || !type) {
            return NextResponse.json({ error: 'الكود والاسم والنوع مطلوبة' }, { status: 400 });
        }

        // Check duplicate code
        const existing = await prisma.account.findFirst({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: 'كود الحساب موجود مسبقاً' }, { status: 400 });
        }

        const account = await prisma.account.create({
            data: {
                code,
                name,
                nameEn: nameEn || '',
                type,
                parentId: parentId || 0,
                level: level || 1,
                isActive: true,
                balance: 0,
            },
        });

        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error('Account create error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الحساب' }, { status: 500 });
    }
}

// PUT - تعديل حساب
export async function PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { id, name, nameEn, isActive } = body;

        if (!id) return NextResponse.json({ error: 'معرف الحساب مطلوب' }, { status: 400 });

        const account = await prisma.account.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(nameEn !== undefined && { nameEn }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(account);
    } catch (error) {
        console.error('Account update error:', error);
        return NextResponse.json({ error: 'فشل في تحديث الحساب' }, { status: 500 });
    }
}

// DELETE - حذف حساب (فقط إذا لم يكن له حركات)
export async function DELETE(request: Request) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '0');

        if (!id) return NextResponse.json({ error: 'معرف الحساب مطلوب' }, { status: 400 });

        // Check if account has journal lines
        const lines = await prisma.journalLine.count({ where: { accountId: id } });
        if (lines > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف حساب له حركات محاسبية' }, { status: 400 });
        }

        await prisma.account.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Account delete error:', error);
        return NextResponse.json({ error: 'فشل في حذف الحساب' }, { status: 500 });
    }
}
