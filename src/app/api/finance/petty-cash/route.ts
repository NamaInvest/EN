import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        // @ts-ignore
        const records = await prisma.pettyCashTransaction.findMany({
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
            orderBy: { requestDate: 'desc' }
        });

        return NextResponse.json(records);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await request.json();
        
        if (!body.employeeId || !body.amount) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        // @ts-ignore
        const record = await prisma.pettyCashTransaction.create({
            data: {
                employeeId: parseInt(body.employeeId),
                amount: parseFloat(body.amount),
                purpose: body.purpose || 'عهدة جديدة',
                status: 'PENDING'
            }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
