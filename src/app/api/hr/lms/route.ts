import { NextRequest, NextResponse } from 'next/server';
import { LMSEngine } from '@/lib/lms-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';

export async function POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const body = await req.json();
  if (body.type === 'enroll') {
    const enrollment = await LMSEngine.enroll(tenantId, body.employeeId, body.courseId);
    return NextResponse.json({ enrollment }, { status: 201 });
  }
  if (body.type === 'progress') {
    const enrollment = await LMSEngine.updateProgress(tenantId, body.enrollmentId, body.score);
    return NextResponse.json({ enrollment });
  }
  if (body.type === 'complete') {
    const enrollment = await LMSEngine.complete(tenantId, body.enrollmentId);
    return NextResponse.json({ enrollment });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const catalog = await LMSEngine.getCatalog(tenantId);
  return NextResponse.json({ catalog });
}
