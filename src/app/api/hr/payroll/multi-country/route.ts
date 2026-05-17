import { NextRequest, NextResponse } from 'next/server';
import { MultiCountryPayrollEngine } from '@/lib/multi-country-payroll-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const tenantId = requireTenantId(req as any);

  const body = await req.json();
  if (body.type === 'calculate') {
    const result = MultiCountryPayrollEngine.calculate(body.country, body.basicSalary, body.allowances ?? 0, body.overtimePay ?? 0, tenantId);
    return NextResponse.json({ result });
  }
  if (body.type === 'batch') {
    const result = MultiCountryPayrollEngine.calculateBatch(body.country, body.employees, tenantId);
    return NextResponse.json({ result, count: result.length });
  }
  return NextResponse.json({ error: 'type must be calculate | batch' }, { status: 400 });
}
