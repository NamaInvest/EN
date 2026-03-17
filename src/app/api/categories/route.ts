import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
