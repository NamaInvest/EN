import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireTenantId } from '@/lib/tenant/tenant-guard';

const log = logger.child({ service: 'hr.org-chart' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const tenantId = requireTenantId(req as any);
        const employees = await prisma.employee.findMany({ take: 100,
            where: { active: true, tenantId } as any,
            select: {
                id: true,
                name: true,
                position: true,
                department: true,
                managerId: true,
                branch: { select: { name: true } }
            } as any
        });

        // Build Tree
        const map = new Map();
        const roots: any[] = [];

        employees.forEach((emp: any) => {
            map.set(emp.id, { ...emp, children: [] });
        });

        employees.forEach((emp: any) => {
            if (emp.managerId && map.has(emp.managerId)) {
                map.get(emp.managerId).children.push(map.get(emp.id));
            } else {
                roots.push(map.get(emp.id));
            }
        });

        return NextResponse.json({ success: true, data: roots });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
