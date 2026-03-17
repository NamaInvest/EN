import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        body.salary = typeof body.salary === 'string' ? body.salary.replace(/,/g, '') : body.salary;
        const employee = await prisma.employee.update({
            where: { id: parseInt(id) },
            data: { 
                name: body.name, 
                phone: body.phone || null, 
                position: body.position || null, 
                salary: parseFloat(body.salary) || 0, 
                startDate: body.startDate || null,
                branchId: body.branchId ? parseInt(body.branchId) : null
            },
        });
        return NextResponse.json(employee);
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.employee.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
