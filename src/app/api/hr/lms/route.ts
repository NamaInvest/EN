import { NextRequest, NextResponse } from 'next/server';
import { LMSEngine } from '@/lib/lms-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'enroll') {
    const enrollment = await LMSEngine.enroll(body.tenantId, body.employeeId, body.courseId);
    return NextResponse.json({ enrollment }, { status: 201 });
  }
  if (body.type === 'progress') {
    const enrollment = await LMSEngine.updateProgress(body.enrollmentId, body.score);
    return NextResponse.json({ enrollment });
  }
  if (body.type === 'complete') {
    const enrollment = await LMSEngine.complete(body.enrollmentId);
    return NextResponse.json({ enrollment });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const catalog = await LMSEngine.getCatalog(tenantId);
  return NextResponse.json({ catalog });
}
