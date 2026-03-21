import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type');

        const where: Record<string, unknown> = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }
        if (type !== null && type !== undefined && type !== '') {
            where.type = parseInt(type);
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(customers);
    } catch (error) {
        console.error('Customers GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const customer = await prisma.customer.create({
            data: {
                name: body.name,
                phone: body.phone || null,
                address: body.address || null,
                street: body.street || null,
                buildingNumber: body.buildingNumber || null,
                district: body.district || null,
                city: body.city || null,
                postalCode: body.postalCode || null,
                type: parseInt(body.type) || 0,
                creditLimit: parseFloat(body.creditLimit) || 0,
                taxNumber: body.taxNumber || null,
                // @ts-ignore: VS Code cache issue
                crNo: body.crNo || null,
                notes: body.notes || null,
                routeId: body.routeId ? parseInt(body.routeId) : null,
            },
        });
        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error('Customer create error:', error);
        return NextResponse.json({ error: 'فشل في الإنشاء' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.customer.deleteMany();
        return NextResponse.json({ message: 'تم حذف الكل' });
    } catch (error) {
        console.error('Customers delete all error:', error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}
