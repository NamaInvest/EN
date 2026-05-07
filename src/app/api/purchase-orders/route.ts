import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getNextNumber } from '@/lib/numbering';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        }

        const orders = await prisma.purchaseOrder.findMany({
            take: 100, 
            where,
            include: { details: true, supplier: { select: { id: true, name: true, phone: true,  } }, user: { select: { fullName: true } } }, 
            orderBy: { id: 'desc' } 
        });
        return NextResponse.json(orders);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const userId = body.userId ? parseInt(body.userId) : null;
        let branchId = body.branchId ? parseInt(body.branchId) : null;
        
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const seqResult = await getNextNumber(prisma, 'PO', branchId);
        const orderNo = seqResult.current;

        let subtotal = 0;
        const details = (body.items || []).map((item: any) => {
            const qty = parseFloat(item.quantity) || 1;
            const price = parseFloat(item.price) || 0;
            const itemSub = qty * price;
            const tax = itemSub * 0.15;
            subtotal += itemSub;
            return { 
                productId: parseInt(item.productId), 
                productName: item.productName || '',
                quantity: qty, 
                price: price, 
                taxRate: 15,
                taxValue: tax,
                total: itemSub + tax
            };
        });

        const taxValue = subtotal * 0.15;
        const total = subtotal + taxValue;

        // Check Maker-Checker Approval Rules
        const rules = await prisma.approvalRule.findMany({
            take: 100,
            where: {
                documentType: 'PURCHASE_ORDER',
                isActive: true,
                minAmount: { lte: total }
            },
            orderBy: { level: 'asc' }
        });

        const applicableRules = rules.filter(r => r.maxAmount === null || r.maxAmount >= total);
        
        let initialStatus = 'pending';
        if (applicableRules.length > 0) {
            initialStatus = 'pending_approval';
        }

        const order = await prisma.purchaseOrder.create({
            data: {
                orderNo, 
                supplierId: body.supplierId ? parseInt(body.supplierId) : null,
                stockId: body.stockId ? parseInt(body.stockId) : 1,
                date: new Date(),
                subtotal, taxValue, total,
                status: initialStatus, notes: body.notes || null, 
                userId, branchId,
                details: { create: details },
            },
            include: { details: true },
        });

        // Generate Approval Request and Steps if needed
        if (applicableRules.length > 0 && userId) {
            await prisma.approvalRequest.create({
                data: {
                    documentType: 'PURCHASE_ORDER',
                    documentId: order.id,
                    status: 'pending',
                    requestedBy: userId,
                    steps: {
                        create: applicableRules.map(r => ({
                            approverId: r.approverId,
                            level: r.level,
                            status: 'pending'
                        }))
                    }
                }
            });
        }

        return NextResponse.json(order, { status: 201 });
    } catch (e) { 
        console.error(e); 
        return NextResponse.json({ error: 'فشل في الحفظ' }, { status: 500 }); 
    }
}
