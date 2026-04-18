import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { key } = await params;
        const setting = await prisma.setting.findUnique({ where: { key } });
        return NextResponse.json(setting || { key, value: '' });
    } catch (error) { console.error(error); return NextResponse.json({ error: 'خطأ' }, { status: 500 }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { key } = await params;
        const body = await request.json();
        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: body.value },
            create: { key, value: body.value },
        });
        return NextResponse.json(setting);
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
