import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(request);
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
    } catch (error) {
        console.error('Category update error:', error);
        return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(request);
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
    } catch (error) {
        console.error('Category delete error:', error);
        return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
    }
}
