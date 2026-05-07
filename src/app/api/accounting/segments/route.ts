import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiError } from '@/lib/api-error';

const db = (p: any) => p as any;

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const segments = await db(prisma).segment.findMany({
            orderBy: { code: 'asc' },
            select: { id: true, code: true, name: true, nameEn: true, type: true, isActive: true },
        });
        return NextResponse.json(segments);
    } catch (e) {
        return apiError(e, 'فشل جلب القطاعات', { context: 'accounting/segments' });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const { code, name, nameEn, type } = body;
        if (!code || !name) {
            return NextResponse.json({ error: 'code و name مطلوبان' }, { status: 400 });
        }

        const validTypes = ['GEO', 'PRODUCT_LINE', 'CHANNEL'];
        const segType = validTypes.includes(type) ? type : 'GEO';

        // Check for duplicate code
        const existing = await db(prisma).segment.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: `رمز القطاع '${code}' مستخدم بالفعل` }, { status: 409 });
        }

        const seg = await db(prisma).segment.create({
            data: {
                code,
                name,
                nameEn: nameEn || null,
                type: segType,
                isActive: true,
            },
        });
        return NextResponse.json(seg, { status: 201 });
    } catch (e) {
        return apiError(e, 'فشل إنشاء قطاع', { context: 'accounting/segments' });
    }
}
