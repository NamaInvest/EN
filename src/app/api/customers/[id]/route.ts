import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logFieldChanges, logDelete, auditContextFromRequest } from '@/lib/field-audit';

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
        const customerId = parseInt(id);
        const auth = getUserFromRequest(request as unknown as NextRequest);
        const body = await request.json();

        // 1. Read before state for audit
        const before = await prisma.customer.findUnique({ where: { id: customerId } });

        // 2. Perform update
        const customer = await prisma.customer.update({
            where: { id: customerId },
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

        // 3. Audit trail — log all field changes
        try {
            await logFieldChanges(prisma, 'Customer', customerId, before, customer, auditContextFromRequest(request, auth ?? undefined));
        } catch (e) { console.error('[audit] Customer update audit failed:', e); }

        return NextResponse.json(customer);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(request as unknown as NextRequest);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const customerId = parseInt(id);

        // Audit trail — log deletion before it happens
        try {
            const before = await prisma.customer.findUnique({ where: { id: customerId } });
            if (before) await logDelete(prisma, 'Customer', customerId, before as any, auditContextFromRequest(request, auth));
        } catch (e) { console.error('[audit] Customer delete audit failed:', e); }

        await prisma.customer.delete({ where: { id: customerId } });
        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}
