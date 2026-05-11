import { NextRequest, NextResponse } from 'next/server';
import { AICopilotEngine } from '@/lib/ai-copilot-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, tenantId, userId, module, period, ragContext } = body;
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });
  const result = await AICopilotEngine.query(query, { tenantId, userId, module: module ?? 'FINANCE', period }, ragContext ?? []);
  return NextResponse.json(result);
}
