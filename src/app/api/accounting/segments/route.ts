import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
const db = (p: any) => p as any;

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const segments = await db(prisma).segment.findMany({
            take: 100,
            orderBy: { code: 'asc' },
            select: { id: true, code: true, name: true, nameEn: true, type: true, isActive: true },
        });
        return NextResponse.json(segments);
    } catch (e: any) {
        return apiError(e, 'فشل جلب القطاعات', { context: 'accounting/segments' });
    }
}

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
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
    } catch (e: any) {
        return apiError(e, 'فشل إنشاء قطاع', { context: 'accounting/segments' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
