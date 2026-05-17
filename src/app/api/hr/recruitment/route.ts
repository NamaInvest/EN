import { NextRequest, NextResponse } from 'next/server';
import { ATSEngine } from '@/lib/ats-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';

export async function POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const body = await req.json();
  if (body.type === 'candidate') {
    const candidate = await ATSEngine.createCandidate(tenantId, body);
    return NextResponse.json({ candidate }, { status: 201 });
  }
  if (body.type === 'apply') {
    const app = await ATSEngine.applyToRequisition(tenantId, body.candidateId, body.requisitionId);
    return NextResponse.json({ app }, { status: 201 });
  }
  if (body.type === 'advance') {
    const app = await ATSEngine.advanceStage(tenantId, body.applicationId, body.stage);
    return NextResponse.json({ app });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const { searchParams } = new URL(req.url);
  const requisitionId = Number(searchParams.get('requisitionId') ?? 0);
  const pipeline = await ATSEngine.getPipeline(tenantId, requisitionId);
  return NextResponse.json({ pipeline });
}
