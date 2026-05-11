import { NextRequest, NextResponse } from 'next/server';
import { NPSEngine } from '@/lib/nps-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'template') {
    const tmpl = await NPSEngine.createTemplate(body.tenantId, body.name, body.surveyType, body.questions);
    return NextResponse.json({ tmpl }, { status: 201 });
  }
  const resp = await NPSEngine.recordResponse(body.tenantId, body.templateId, body.customerId, body.answers, body.npsScore, body.csatScore);
  return NextResponse.json({ resp }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? '1';
  const templateId = Number(searchParams.get('templateId') ?? 0);
  const nps = await NPSEngine.calculateNPS(tenantId, templateId);
  return NextResponse.json({ nps });
}
