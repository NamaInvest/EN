// /api/hr/employees — proxy to /api/employees for backwards compatibility
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { GOSIService } from '@/lib/gosi-service';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.employees' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
        const employees = await prisma.employee.findMany({ take: 100,
            where,
            include: { branch: true },
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(employees);
    } catch (error: any) {
        log.error('hr/employees GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}


const _POSTSchema = z.object({
  salary: z.number().optional(),
  name: z.any().optional(),
  phone: z.string().optional(),
  position: z.any().optional(),
  housingAllowance: z.any().optional(),
  transportAllowance: z.any().optional(),
  otherAllowance: z.any().optional(),
  bankName: z.any().optional(),
  iban: z.any().optional(),
  startDate: z.string().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

        // Trigger GOSI Auto-Registration (Non-blocking)
        const tenantId = (request as any).headers?.get('x-tenant-id') || 'default';
        GOSIService.registerEmployee(tenantId, employee, Number(employee.salary), Number(employee.housingAllowance))
            .catch(err => log.error('GOSI async registration failed', { error: err.message }));

        return NextResponse.json(employee, { status: 201 });
    } catch (error: any) {
        log.error('hr/employees POST error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الموظف' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
