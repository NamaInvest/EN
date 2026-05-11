import { NextRequest, NextResponse } from 'next/server';
import { MultiCountryPayrollEngine } from '@/lib/multi-country-payroll-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'calculate') {
    const result = MultiCountryPayrollEngine.calculate(body.country, body.basicSalary, body.allowances ?? 0, body.overtimePay ?? 0);
    return NextResponse.json({ result });
  }
  if (body.type === 'batch') {
    const result = MultiCountryPayrollEngine.calculateBatch(body.country, body.employees);
    return NextResponse.json({ result, count: result.length });
  }
  return NextResponse.json({ error: 'type must be calculate | batch' }, { status: 400 });
}
