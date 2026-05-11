import { NextRequest, NextResponse } from 'next/server';
import { KBRAGEngine } from '@/lib/kb-rag-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userQuery, topK } = body;
  if (!userQuery) return NextResponse.json({ error: 'userQuery required' }, { status: 400 });
  const result = await KBRAGEngine.answer(userQuery, topK);
  return NextResponse.json(result);
}
