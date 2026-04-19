import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const customer = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
        if (!customer) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
        return NextResponse.json(customer);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'خطأ' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const body = await request.json();
        const customer = await prisma.customer.update({
            where: { id: parseInt(id) },
            data: {
                name: body.name, phone: body.phone || null, address: body.address || null,
                street: body.street || null, buildingNumber: body.buildingNumber || null,
                district: body.district || null, city: body.city || null, postalCode: body.postalCode || null,
                type: parseInt(body.type) || 0, creditLimit: parseFloat(body.creditLimit) || 0,
                taxNumber: body.taxNumber || null, 
                // @ts-ignore
                crNo: body.crNo || null, notes: body.notes || null,
                routeId: body.routeId ? parseInt(body.routeId) : null,
            },
        });
        return NextResponse.json(customer);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        await prisma.customer.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}
