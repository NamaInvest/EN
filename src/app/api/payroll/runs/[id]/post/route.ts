import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { PayrollPostingService } from '@/services/payroll/payroll-posting.service';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const runId = parseInt(params.id);
  if (isNaN(runId)) return NextResponse.json({ error: 'معرف الدورة غير صحيح' }, { status: 400 });

  const tenantId = user.tenantId ?? 'default';
  const prisma = getPrisma(request);

  const ctx = {
    tenant: { id: tenantId },
    user:   { id: String(user.userId ?? 'system') },
  } as any;

  try {
    const svc = new PayrollPostingService(prisma, ctx);
    const result = await svc.postPayrollRun(runId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
}
