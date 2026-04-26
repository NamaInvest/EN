import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// GET all units
export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });
        return NextResponse.json(units);
    } catch (error) {
        console.error('Units GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

// POST create new unit name
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        if (!body.name?.trim()) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
        const unit = await prisma.unit.create({ data: { name: body.name.trim() } });
        return NextResponse.json(unit, { status: 201 });
    } catch (error) {
        console.error('Unit POST error:', error);
        return NextResponse.json({ error: 'فشل في الإضافة' }, { status: 500 });
    }
}

// DELETE a unit by id
export async function DELETE(request: NextRequest) {
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '');
        if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
        await prisma.unit.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unit DELETE error:', error);
        return NextResponse.json({ error: 'فشل في الحذف' }, { status: 500 });
    }
}
