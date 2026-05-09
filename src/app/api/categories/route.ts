import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const categories = await prisma.category.findMany({
            take: 100, orderBy: { id: 'asc' } });
        return NextResponse.json(categories);
    } catch (error: any) {
        console.error('Categories GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  parentId: z.union([z.string(), z.number()]).optional(),
  description: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const category = await prisma.category.create({
            data: { name: body.name, parentId: parseInt(body.parentId) || 0, description: body.description || null },
        });
        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        console.error('Category create error:', error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user || user.role !== 'admin') {
           return NextResponse.json({ error: 'غير مصرح لك لاتخاذ هذا الإجراء' }, { status: 403 });
        }
        
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        
        if (action === 'delete_all') {
            const result = await prisma.$transaction(async (tx) => {
                // Decouple all products from categories to prevent P2003 constraint issues
                await tx.product.updateMany({
                    data: { categoryId: null }
                });
                return await tx.category.deleteMany({});
            });
            return NextResponse.json({ message: `تم إفراغ ${result.count} تصنيف بنجاح` });
        }
        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        if (error?.code === 'P2003') {
             return NextResponse.json({ error: 'لا يمكن حذف التصنيفات لوجود منتجات مرتبطة بها. قم بحذف المنتجات أولاً.' }, { status: 400 });
        }
        console.error('Delete Categories Error:', error);
        return NextResponse.json({ error: 'فشل حذف التصنيفات' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
