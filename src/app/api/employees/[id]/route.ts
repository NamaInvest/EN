import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logFieldChanges, logDelete, auditContextFromRequest } from '@/lib/field-audit';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const employeeId = parseInt(id);
        const auth = getUserFromRequest(request as unknown as NextRequest);
        const body = await request.json();
        body.salary = typeof body.salary === 'string' ? body.salary.replace(/,/g, '') : body.salary;

        // Read before state for audit
        const before = await prisma.employee.findUnique({ where: { id: employeeId } });

        const employee = await prisma.employee.update({
            where: { id: employeeId },
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
                branchId: body.branchId ? parseInt(body.branchId) : null
            },
        });

        // Audit trail — log changes
        try {
            await logFieldChanges(prisma, 'Employee', employeeId, before, employee, auditContextFromRequest(request, auth ?? undefined));
        } catch (e) { console.error('[audit] Employee update audit failed:', e); }

        return NextResponse.json(employee);
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(request as unknown as NextRequest);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const employeeId = parseInt(id);

        // Audit trail — log deletion
        try {
            const before = await prisma.employee.findUnique({ where: { id: employeeId } });
            if (before) await logDelete(prisma, 'Employee', employeeId, before as any, auditContextFromRequest(request, auth));
        } catch (e) { console.error('[audit] Employee delete audit failed:', e); }

        await prisma.employee.delete({ where: { id: employeeId } });
        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
