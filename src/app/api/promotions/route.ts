import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const promos = await prisma.promotion.findMany({ orderBy: { id: 'desc' } });
        return NextResponse.json(promos);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const promo = await prisma.promotion.create({
            data: {
                name: body.name, type: body.type || 'percentage',
                discountType: body.discountType || 'percentage',
                discountValue: parseFloat(body.discountValue) || 0,
                buyQty: parseInt(body.buyQty) || 0, getQty: parseInt(body.getQty) || 0,
                minQty: parseInt(body.minQty) || 0, categoryId: parseInt(body.categoryId) || 0,
                productId: parseInt(body.productId) || 0,
                startDate: body.startDate || null, endDate: body.endDate || null,
                startTime: body.startTime || null, endTime: body.endTime || null,
                isActive: true,
            },
        });
        return NextResponse.json(promo, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const promo = await prisma.promotion.update({ where: { id: body.id }, data: { isActive: body.isActive ?? true, name: body.name, discountValue: body.discountValue } });
        return NextResponse.json(promo);
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
