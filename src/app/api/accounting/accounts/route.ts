import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';

// GET - شجرة الحسابات
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting/accounts' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    const tenantId = requireTenantId(request as any);
    try {
        const accounts = await prisma.account.findMany({ 
            take: 100,
            where: { tenantId },
            orderBy: { code: 'asc' },
        });
        return NextResponse.json(accounts);
    } catch (error: any) {
        log.error('Accounts GET error:', error);
        return NextResponse.json({ error: 'فشل في جلب الحسابات' }, { status: 500 });
    }
}

// POST - إضافة حساب جديد

const _POSTSchema = z.object({
  code: z.any().optional(),
  name: z.any().optional(),
  nameEn: z.any().optional(),
  type: z.any().optional(),
  parentId: z.union([z.string(), z.number()]).optional(),
  level: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const { code, name, nameEn, type, parentId, level } = body;

        if (!code || !name || !type) {
            return NextResponse.json({ error: 'الكود والاسم والنوع مطلوبة' }, { status: 400 });
        }

        const tenantId = requireTenantId(request as any);
        // Check duplicate code
        const existing = await prisma.account.findFirst({ where: { tenantId, code } });
        if (existing) {
            return NextResponse.json({ error: 'كود الحساب موجود مسبقاً' }, { status: 400 });
        }

        const account = await prisma.account.create({
            data: {
                tenantId,
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
        log.error('Account create error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الحساب' }, { status: 500 });
    }
}

// PUT - تعديل حساب

const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  nameEn: z.any().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

async function _PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { id, name, nameEn, isActive } = body;

        const tenantId = requireTenantId(request as any);
        if (!id) return NextResponse.json({ error: 'معرف الحساب مطلوب' }, { status: 400 });

        const account = await prisma.account.update({
            where: { id, tenantId },
            data: {
                ...(name && { name }),
                ...(nameEn !== undefined && { nameEn }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(account);
    } catch (error: any) {
        log.error('Account update error:', error);
        return NextResponse.json({ error: 'فشل في تحديث الحساب' }, { status: 500 });
    }
}

// DELETE - حذف حساب (فقط إذا لم يكن له حركات)
async function _DELETE(request: Request) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '0');

        if (!id) return NextResponse.json({ error: 'معرف الحساب مطلوب' }, { status: 400 });

        const tenantId = requireTenantId(request as any);
        // Check if account has journal lines
        const lines = await prisma.journalLine.count({ where: { accountId: id, tenantId } });
        if (lines > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف حساب له حركات محاسبية' }, { status: 400 });
        }

        await prisma.account.delete({ where: { id, tenantId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        log.error('Account delete error:', error);
        return NextResponse.json({ error: 'فشل في حذف الحساب' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'FINANCIAL' });
