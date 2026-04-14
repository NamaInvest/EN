// /api/hr/employees — proxy to /api/employees for backwards compatibility
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
        const employees = await prisma.employee.findMany({
            where,
            include: { branch: true },
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(employees);
    } catch (error) {
        console.error('hr/employees GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        body.salary = typeof body.salary === 'string' ? body.salary.replace(/,/g, '') : body.salary;
        const employee = await prisma.employee.create({
            data: {
                name: body.name,
                phone: body.phone || null,
                position: body.position || null,
                salary: parseFloat(body.salary) || 0,
                housingAllowance: parseFloat(body.housingAllowance) || 0,
                transportAllowance: parseFloat(body.transportAllowance) || 0,
                otherAllowance: parseFloat(body.otherAllowance) || 0,
                bankName: body.bankName || null,
                iban: body.iban || null,
                startDate: body.startDate || null,
                branchId: body.branchId ? parseInt(body.branchId) : null,
            },
        });
        return NextResponse.json(employee, { status: 201 });
    } catch (error) {
        console.error('hr/employees POST error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الموظف' }, { status: 500 });
    }
}
