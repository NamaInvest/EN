import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type'); // PAYABLE, RECEIVABLE
        
        const conditions: any = {};
        if (type) conditions.type = type;

        // @ts-ignore
        const checks = await prisma.checkTransaction.findMany({
            where: conditions,
            include: {
                customer: true,
                supplier: true,
                bankAccount: true
            },
            orderBy: { dueDate: 'asc' }
        });

        return NextResponse.json(checks);
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
        
        if (!body.checkNumber || !body.amount || !body.dueDate || !body.type) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        // @ts-ignore
        const check = await prisma.checkTransaction.create({
            data: {
                type: body.type, // PAYABLE or RECEIVABLE
                checkNumber: body.checkNumber,
                bankName: body.bankName || 'غير محدد',
                dueDate: new Date(body.dueDate),
                amount: parseFloat(body.amount),
                status: 'PENDING',
                notes: body.notes,
                customerId: body.customerId || null,
                supplierId: body.supplierId || null,
                bankAccountId: body.bankAccountId || null
            }
        });

        return NextResponse.json(check, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
