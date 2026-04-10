import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { postInventoryAdjustment } from '@/lib/auto-journal';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        // Get past adjustments
        const adjustments = await prisma.stockMovement.findMany({
            where: {
                type: { in: ['adjustment', 'adjustment_in', 'adjustment_out'] }
            },
            include: {
                product: { select: { name: true, sku: true } },
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
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();
        const { productId, actualQuantity, reason } = body;

        if (!productId || actualQuantity === undefined) {
            return NextResponse.json({ error: 'المعلومات غير مكتملة' }, { status: 400 });
        }

        const adjustment = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: parseInt(productId) } });
            if (!product) throw new Error('المنتج غير موجود');

            const current = product.currentStock;
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
            const diffCost = diff * (product.buyPrice || product.cost || 0);
            if (diffCost !== 0) {
                try {
                    await postInventoryAdjustment({
                        productId: product.id,
                        diffCost: diffCost,
                        reason: reason || 'تسوية جردية يدوية',
                        userId: decoded.userId
                    });
                } catch (je) {
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
