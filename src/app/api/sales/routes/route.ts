import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        // Assume sales module permissions
        if (!(await hasPermission(auth.userId, 'sales'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        // @ts-ignore
        const routes = await prisma.route.findMany({
            include: {
                salesRep: true,
                _count: { select: { customers: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(routes);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'sales'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await request.json();
        
        if (!body.name) {
             return NextResponse.json({ error: 'اسم خط السير مطلوب' }, { status: 400 });
        }

        // @ts-ignore
        const record = await prisma.route.create({
            data: {
                name: body.name,
                description: body.description,
                salesRepId: body.salesRepId ? parseInt(body.salesRepId) : null,
                active: body.active !== undefined ? body.active : true
            }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
