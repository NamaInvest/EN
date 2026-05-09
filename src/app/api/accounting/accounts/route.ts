import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

// GET - شجرة الحسابات
import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const accounts = await prisma.account.findMany({
            take: 100,
            orderBy: { code: 'asc' },
        });
        return NextResponse.json(accounts);
    } catch (error: any) {
        console.error('Accounts GET error:', error);
        return NextResponse.json({ error: 'فشل في جلب الحسابات' }, { status: 500 });
    }
}

// POST - إضافة حساب جديد
async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

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
    } catch (error: any) {
        console.error('Account create error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الحساب' }, { status: 500 });
    }
}

// PUT - تعديل حساب
async function _PUT(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

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
    } catch (error: any) {
        console.error('Account update error:', error);
        return NextResponse.json({ error: 'فشل في تحديث الحساب' }, { status: 500 });
    }
}

// DELETE - حذف حساب (فقط إذا لم يكن له حركات)
async function _DELETE(request: Request) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
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
    } catch (error: any) {
        console.error('Account delete error:', error);
        return NextResponse.json({ error: 'فشل في حذف الحساب' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'FINANCIAL' });
