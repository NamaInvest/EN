import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const orderId = parseInt((await params).id);
        // @ts-ignore - VSCode lock bypass
        const costs = await prisma.landedCost.findMany({
            take: 100,
            where: { purchaseOrderId: orderId },
            include: { currency: true, expenseAccount: true }
        });
        
        return NextResponse.json(costs);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل جلب تكاليف الشحن' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed && auth.role !== 'admin') return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const orderId = parseInt((await params).id);
        const body = await request.json();
        
        const order = await prisma.purchaseOrder.findUnique({
            where: { id: orderId },
            include: { details: true }
        });
        
        if (!order) return NextResponse.json({ error: 'لم يتم العثور على الطلب' }, { status: 404 });
        
        // Ensure expense account exists or use default
        let expenseAccountId = body.expenseAccountId ? parseInt(body.expenseAccountId) : undefined;
        if (!expenseAccountId) {
            const firstAcc = await prisma.account.findFirst();
            if (firstAcc) expenseAccountId = firstAcc.id;
        }

        // @ts-ignore - VSCode lock bypass
        const cost = await prisma.landedCost.create({
            data: {
                purchaseOrderId: orderId,
                letterOfCreditId: body.letterOfCreditId ? parseInt(body.letterOfCreditId) : null,
                expenseAccountId: expenseAccountId || 1,
                description: body.description || 'مصاريف توريد',
                amount: parseFloat(body.amount),
                currencyId: body.currencyId ? parseInt(body.currencyId) : null,
                exchangeRate: parseFloat(body.exchangeRate || 1.0),
                allocationMethod: body.allocationMethod || 'value',
                isAllocated: false
            },
            include: { expenseAccount: true, currency: true }
        });
        
        return NextResponse.json(cost, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل في إضافة التكلفة الموزعة' }, { status: 500 });
    }
}
