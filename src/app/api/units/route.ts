import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });
        return NextResponse.json(units);
    } catch (error) {
        console.error('Units GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();
        const unit = await prisma.unit.create({
            data: { name: body.name }
        });
        return NextResponse.json(unit, { status: 201 });
    } catch (error) {
        console.error('Unit POST error:', error);
        return NextResponse.json({ error: 'فشل الإنشاء' }, { status: 500 });
    }
}
