import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { salaryCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';

export async function GET() {
    const prisma = getPrisma(request);
    try {
        const salaries = await prisma.salary.findMany({ 
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } }, 
            orderBy: { id: 'desc' } 
        });
        return NextResponse.json(salaries);
    } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        // Zod validation - no negative amounts, valid IDs, no mass assignment
        const body = salaryCreateSchema.parse(rawBody);

        const basic = Number(body.basicSalary);
        const additions = Number(body.additions || 0);
        const deductions = Number(body.deductions || 0);
        const net = basic + additions - deductions;

        if (net < 0) {
            return NextResponse.json({ error: 'صافي الراتب لا يمكن أن يكون سالباً (الخصومات أكبر من الأساس + الإضافات)' }, { status: 400 });
        }

        // Atomic transaction: create salary AND treasury deduction together
        const salary = await prisma.$transaction(async (tx) => {
            const newSalary = await tx.salary.create({
                data: {
                    employeeId: Number(body.employeeId),
                    month: body.month,
                    year: body.year,
                    basicSalary: basic,
                    additions,
                    deductions,
                    netSalary: round2(net),
                    notes: body.notes || null,
                },
                include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
            });

            // Treasury out - only if net > 0
            if (net > 0) {
                await tx.treasury.create({ 
                    data: { 
                        type: 'out', 
                        amount: net, 
                        description: `راتب ${newSalary.employee.name} - ${body.month}/${body.year}`, 
                        referenceType: 'salary', 
                        referenceId: newSalary.id, 
                        userId: body.userId ? Number(body.userId) : null 
                    } 
                });
            }

            return newSalary;
        });

        return NextResponse.json(salary, { status: 201 });
    } catch (e) { return handleApiError(e); }
}
