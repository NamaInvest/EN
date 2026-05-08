import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const profitCenters = await prisma.profitCenter.findMany({
            take: 100,
            orderBy: { code: 'asc' },
            select: { id: true, code: true, name: true, nameEn: true, parentId: true, isActive: true, createdAt: true },
        });
        return NextResponse.json(profitCenters);
    } catch (e: any) {
        return apiError(e, 'فشل جلب مراكز الربحية', { context: 'accounting/profit-centers' });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const { code, name, nameEn, parentId } = body;
        if (!code || !name) {
            return NextResponse.json({ error: 'code و name مطلوبان' }, { status: 400 });
        }

        // Check for duplicate code
        const existing = await prisma.profitCenter.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: `رمز مركز الربحية '${code}' مستخدم بالفعل` }, { status: 409 });
        }

        const pc = await prisma.profitCenter.create({
            data: {
                code,
                name,
                nameEn: nameEn || null,
                parentId: parentId ? parseInt(parentId, 10) : null,
                isActive: true,
            },
        });
        return NextResponse.json(pc, { status: 201 });
    } catch (e: any) {
        return apiError(e, 'فشل إنشاء مركز ربحية', { context: 'accounting/profit-centers' });
    }
}
