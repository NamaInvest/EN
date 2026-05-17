import { NextRequest, NextResponse } from 'next/server';
import { CompetencyEngine } from '@/lib/competency-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';

export async function POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const body = await req.json();
  if (body.type === 'assess') {
    const result = await CompetencyEngine.assessEmployee(tenantId, body.employeeId, body.competencyId, body.level, body.assessedBy);
    return NextResponse.json({ result }, { status: 201 });
  }
  if (body.type === 'gap') {
    const gaps = await CompetencyEngine.getGaps(tenantId, body.employeeId, body.targetJobId);
    return NextResponse.json({ gaps });
  }
  if (body.type === 'paths') {
    const paths = await CompetencyEngine.getCareerPaths(tenantId, body.fromJobId);
    return NextResponse.json({ paths });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
