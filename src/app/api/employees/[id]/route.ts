import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import type { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logFieldChanges, logDelete, auditContextFromRequest } from '@/lib/field-audit';
import { getUserFromRequest } from '@/lib/auth';
import { getHrScope } from '@/lib/hr-scope';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'employees' });

const _PUTSchema = z.object({
  salary: z.number().optional(),
  name: z.any().optional(),
  phone: z.string().optional(),
  position: z.any().optional(),
  housingAllowance: z.any().optional(),
  transportAllowance: z.any().optional(),
  otherAllowance: z.any().optional(),
  ba: z.any().optional(),
}).passthrough();

async function _PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const employeeId = parseInt(id);
        const auth = getUserFromRequest(request as unknown as NextRequest);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const tenantId = requireTenantId(request as any);
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        body.salary = typeof body.salary === 'string' ? body.salary.replace(/,/g, '') : body.salary;

        const baseWhere = await getHrScope(auth, tenantId, true) as any;

        // Read before state for audit
        const before = await prisma.employee.findFirst({ where: { id: employeeId, tenantId, ...baseWhere } });
        if (!before) return NextResponse.json({ error: 'غير موجود أو غير مصرح' }, { status: 404 });

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
        } catch (e: any) { log.error('[audit] Employee update audit failed:', e); }

        return NextResponse.json(employee);
    } catch (error: any) { log.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(request as unknown as NextRequest);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(request as any);

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const employeeId = parseInt(id);

        const baseWhere = await getHrScope(auth, tenantId, true) as any;

        // Audit trail — log deletion
        const before = await prisma.employee.findFirst({ where: { id: employeeId, tenantId, ...baseWhere } });
        if (!before) return NextResponse.json({ error: 'غير موجود أو غير مصرح' }, { status: 404 });

        try {
            await logDelete(prisma, 'Employee', employeeId, before as any, auditContextFromRequest(request, auth));
        } catch (e: any) { log.error('[audit] Employee delete audit failed:', e); }

        await prisma.employee.delete({ where: { id: employeeId } });
        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error: any) { log.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
