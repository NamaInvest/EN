import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Categories GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const body = await request.json();
        const category = await prisma.category.create({
            data: { name: body.name, parentId: parseInt(body.parentId) || 0, description: body.description || null },
        });
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Category create error:', error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
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
