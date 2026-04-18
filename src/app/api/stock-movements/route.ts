import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { syncStockToSalla } from '@/lib/salla';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const stockId = searchParams.get('stock_id');
        const where: Record<string, unknown> = {};
        if (stockId) where.stockId = parseInt(stockId);
        const movements = await prisma.stockMovement.findMany({ where, include: { product: true, stock: true }, orderBy: { date: 'desc' }, take: 100 });
        return NextResponse.json(movements);
    } catch (error) { console.error(error); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const movement = await prisma.stockMovement.create({
            data: { productId: parseInt(body.productId), stockId: parseInt(body.stockId) || 1, type: body.type, quantity: parseFloat(body.quantity), referenceType: body.referenceType || 'manual', notes: body.notes || null, userId: body.userId || null },
        });
        const increment = (body.type === 'in' || body.type === 'adjustment') ? parseFloat(body.quantity) : -parseFloat(body.quantity);
        const updatedProduct = await prisma.product.update({ where: { id: parseInt(body.productId) }, data: { currentStock: { increment } } });
        
        if (updatedProduct.barcode) {
            await syncStockToSalla(updatedProduct.barcode, updatedProduct.currentStock);
        }

        return NextResponse.json(movement, { status: 201 });
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
