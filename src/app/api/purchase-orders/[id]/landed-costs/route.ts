import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchase-orders.id.landed-costs' });

async function _GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const orderId = parseInt((await params).id);
        // @ts-ignore - VSCode lock bypass
        const costs = await prisma.landedCost.findMany({ take: 100,
            where: { purchaseOrderId: orderId },
            include: { currency: true, expenseAccount: true }
        });
        
        return NextResponse.json(costs);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'فشل جلب تكاليف الشحن' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  expenseAccountId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed && auth.role !== 'admin') return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const orderId = parseInt((await params).id);
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
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
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'فشل في إضافة التكلفة الموزعة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
