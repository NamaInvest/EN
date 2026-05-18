import { NextRequest, NextResponse } from 'next/server';
import { MultiCountryPayrollEngine } from '@/lib/multi-country-payroll-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const user = auth;
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    if (body.type === 'calculate') {
    const result = MultiCountryPayrollEngine.calculate(body.country, body.basicSalary, body.allowances ?? 0, body.overtimePay ?? 0, tenant);
    return NextResponse.json({ result });
    }
    if (body.type === 'batch') {
    const result = MultiCountryPayrollEngine.calculateBatch(body.country, body.employees, tenant);
    return NextResponse.json({ result, count: result.length });
    }
    return NextResponse.json({ error: 'type must be calculate | batch' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
