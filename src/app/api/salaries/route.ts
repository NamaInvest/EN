import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const salaries = await prisma.salary.findMany({ include: { employee: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(salaries);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const basic = parseFloat(body.basicSalary) || 0;
        const additions = parseFloat(body.additions) || 0;
        const deductions = parseFloat(body.deductions) || 0;
        const net = basic + additions - deductions;

        const salary = await prisma.salary.create({
            data: {
                employeeId: parseInt(body.employeeId),
                month: parseInt(body.month), year: parseInt(body.year),
                basicSalary: basic, additions, deductions, netSalary: net,
                notes: body.notes || null,
            },
            include: { employee: true },
        });

        // Treasury out
        await prisma.treasury.create({ data: { type: 'out', amount: net, description: `راتب ${salary.employee.name} - ${body.month}/${body.year}`, referenceType: 'salary', referenceId: salary.id, userId: body.userId || null } });

        return NextResponse.json(salary, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
