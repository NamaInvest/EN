import { NextRequest, NextResponse } from 'next/server';
import { ReportBuilderEngine, type ReportDefinition } from '@/lib/report-builder-engine';

export async function POST(req: NextRequest) {
  const body = await req.json() as ReportDefinition;
  const id = ReportBuilderEngine.save(body);
  return NextResponse.json({ id }, { status: 201 });
}

export async function GET(_req: NextRequest) {
  const reports = ReportBuilderEngine.list();
  return NextResponse.json({ reports, count: reports.length });
}
