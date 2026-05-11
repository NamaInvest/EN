import { NextRequest, NextResponse } from 'next/server';
import { CrossDockEngine } from '@/lib/cross-dock-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'assign') {
    const assignment = await CrossDockEngine.createAssignment(body.tenantId, body.grnId, body.soId, body.itemId, body.quantity);
    return NextResponse.json({ assignment }, { status: 201 });
  }
  if (body.type === 'complete') {
    const result = await CrossDockEngine.complete(body.id);
    return NextResponse.json({ result });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
