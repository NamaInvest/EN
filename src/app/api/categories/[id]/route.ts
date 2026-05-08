import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

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
