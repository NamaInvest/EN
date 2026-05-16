import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'categories' });

async function _GET(request: NextRequest, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);
    try {
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const categories = await prisma.category.findMany({ 
            take: 100, 
            where: requireTenantFilter({ tenantId }),
            orderBy: { id: 'asc' } 
        });
        return NextResponse.json(categories);
    } catch (error: any) {
        log.error('categories.GET', { error: error instanceof Error ? error.message : error, tenantId });
        return NextResponse.json([], { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  parentId: z.union([z.string(), z.number()]).optional(),
  description: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);
    try {
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const category = await prisma.category.create({
            data: { 
                tenantId,
                name: body.name, 
                parentId: parseInt(body.parentId) || 0, 
                description: body.description || null 
            },
        });
        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        log.error('categories.POST', { error: error instanceof Error ? error.message : error, tenantId });
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);
    try {
        const user = await prisma.user.findFirst({
            where: { id: auth?.userId, ...requireTenantFilter({ tenantId }) }
        });
        if (!user || user.role !== 'admin') {
           return NextResponse.json({ error: 'غير مصرح لك لاتخاذ هذا الإجراء' }, { status: 403 });
        }
        
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        
        if (action === 'delete_all') {
            const result = await runInventoryTx(prisma, async (tx) => {
                // Decouple all products from categories to prevent P2003 constraint issues
                await tx.product.updateMany({
                    where: requireTenantFilter({ tenantId }),
                    data: { categoryId: null }
                });
                return await tx.category.deleteMany({
                    where: requireTenantFilter({ tenantId }),
                });
            }, 'CATEGORY_DELETE_ALL');
            return NextResponse.json({ message: `تم إفراغ ${result.count} تصنيف بنجاح` });
        }
        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        if (error?.code === 'P2003') {
             return NextResponse.json({ error: 'لا يمكن حذف التصنيفات لوجود منتجات مرتبطة بها. قم بحذف المنتجات أولاً.' }, { status: 400 });
        }
        log.error('categories.DELETE', { error: error instanceof Error ? error.message : error, tenantId });
        return NextResponse.json({ error: 'فشل حذف التصنيفات' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req, auth }) => _DELETE(req as any, auth), { rateLimit: 'DEFAULT' });

