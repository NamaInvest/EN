import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { LeaseAccountingService } from '@/services/accounting/lease-accounting.service';

// POST /api/assets/leases/[id]/post-inception
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contractId = parseInt(params.id);
  if (isNaN(contractId)) return NextResponse.json({ error: 'معرف العقد غير صحيح' }, { status: 400 });

  const tenantId = user.tenantId ?? 'default';
  const ctx = { tenant: { id: tenantId }, user: { id: String(user.userId) } } as any;

  try {
    const svc = new LeaseAccountingService(getPrisma(request), ctx);
    const result = await svc.recognizeLeaseWithGL(contractId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
}
