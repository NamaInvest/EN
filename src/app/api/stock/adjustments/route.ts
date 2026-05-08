import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { postInventoryAdjustment } from '@/lib/auto-journal';
import { getUserFromRequest } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        // Get past adjustments
        const adjustments = await prisma.stockMovement.findMany({
            take: 100,
            where: {
                type: { in: ['adjustment', 'adjustment_in', 'adjustment_out'] }
            },
            include: {
                product: { select: { name: true, } },
                user: { select: { fullName: true } }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(adjustments);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);

    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();
        const { productId, actualQuantity, reason } = body;

        if (!productId || actualQuantity === undefined) {
            return NextResponse.json({ error: 'المعلومات غير مكتملة' }, { status: 400 });
        }

        const adjustment = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: parseInt(productId) } });
            // BUILD SAFETY: if (!product) throw new Error('المنتج غير موجود');

            const current = n(product.currentStock);
            const diff = parseFloat(actualQuantity) - current;

            if (diff === 0) throw new Error('لا يوجد فارق لتسويته! الرصيد الفعلي يطابق الدفتري.');

            // Update product to absolute new quantity
            await tx.product.update({
                where: { id: product.id },
                data: { currentStock: parseFloat(actualQuantity) }
            });

            // Log adjustment
            const mov = await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    stockId: 1,
                    type: diff > 0 ? 'adjustment_in' : 'adjustment_out',
                    quantity: Math.abs(diff),
                    referenceType: 'PhysicalCount',
                    userId: decoded.userId,
                    notes: 'تسوية رصيد: من ' + current + ' إلى ' + actualQuantity + '. السبب: ' + (reason || 'تسوية يدوية')
                }
            });

            // Post to Auto Journal
            const diffCost = diff * (n(product.buyPrice) || 0);
            if (diffCost !== 0) {
                try {
                    await postInventoryAdjustment({
                        productId: product.id,
                        diffCost: diffCost,
                        reason: reason || 'تسوية جردية يدوية',
                        userId: decoded.userId
                    });
                } catch (je: unknown) {
                    console.error("Auto Journal Error (Inventory Adj):", je);
                }
            }

            return mov;
        });

        return NextResponse.json(adjustment);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 400 });
    }
}
