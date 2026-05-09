import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _PUTSchema = z.object({
  name: z.any().optional(),
  parentId: z.union([z.string(), z.number()]).optional(),
  description: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const category = await prisma.category.update({
            where: { id: parseInt((await params).id) },
            data: { 
                name: body.name, 
                parentId: body.parentId ? parseInt(body.parentId) : 0, 
                description: body.description || null 
            },
        });
        return NextResponse.json(category);
    } catch (error: any) {
        console.error('Category update error:', error);
        return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        // Check if there are products using this category
        const productsCount = await prisma.product.count({
            where: { categoryId: parseInt((await params).id) }
        });

        if (productsCount > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف القسم لوجود منتجات مرتبطة به' }, { status: 400 });
        }

        await prisma.category.delete({
            where: { id: parseInt((await params).id) }
        });

        return NextResponse.json({ message: 'تم الحذف بنجاح' });
    } catch (error: any) {
        console.error('Category delete error:', error);
        return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
