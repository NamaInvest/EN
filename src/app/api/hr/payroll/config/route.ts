import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.payroll.config' });

async function _GET(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(req as any);

    const prisma = getPrisma(req as any);
    try {
        const setting = await prisma.setting.findFirst({
            where: { key: 'payroll_accounting_config', tenantId }
        });

        const accounts = await prisma.account.findMany({ take: 100,
            where: { isActive: true, tenantId },
            select: { id: true, code: true, name: true, type: true }
        });

        let config = setting?.value ? JSON.parse(setting.value) : {
            basicSalary: null,
            housingAllowance: null,
            transportAllowance: null,
            otherAllowance: null,
            gosiDeduction: null,
            unpaidLeaveDeduction: null,
            netPayableLiability: null
        };

        return NextResponse.json({ success: true, data: { config, accounts } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  config: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(req as any);

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { config } = body;

        const existing = await prisma.setting.findFirst({
            where: { key: 'payroll_accounting_config', tenantId }
        });

        if (existing) {
            await prisma.setting.update({
                where: { id: existing.id },
                data: { value: JSON.stringify(config) }
            });
        } else {
            await prisma.setting.create({
                data: { 
                    key: 'payroll_accounting_config', 
                    value: JSON.stringify(config), 
                    description: 'Mapping of payroll components to GL Accounts',
                    tenantId
                }
            });
        }

        return NextResponse.json({ success: true, message: 'تم حفظ إعدادات الرواتب المحاسبية بنجاح' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
