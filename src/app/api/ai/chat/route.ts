/**
 * POST /api/ai/chat  — RAG-powered AI Chat
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses the production pgvector RAG pipeline (P3.9) + LangChain orchestrator.
 * Rate-limited to AI tier (5 req/min per user).
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { queryRAG } from '@/lib/vector-store';
import { invokeChain } from '@/lib/langchain-orchestrator';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.chat' });

const ChatSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z.string().max(2000).optional(),
  model:   z.enum(['gemini-2.0-flash', 'gemini-2.0-pro']).default('gemini-2.0-flash'),
});

async function handler(ctx: any) {
  const body   = await ctx.req.json().catch(() => ({}));
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { message, context: extraContext } = parsed.data;
  const tenantId = ctx.auth.tenantId as string;
  if (!tenantId || tenantId === 'default') {
    return NextResponse.json({ error: 'Tenant context required' }, { status: 403 });
  }

  // 1. Retrieve relevant documents from pgvector
  const ragContext = await queryRAG(tenantId, message);

  // 2. Build system prompt with RAG context + optional extra context
  const systemParts = [
    'You are a helpful ERP assistant for NamaInvest. Answer questions accurately using the provided company context.',
    'If the answer is not in the context, say so clearly — do not hallucinate.',
    ragContext ? `\n## Company Knowledge Base:\n${ragContext}` : '',
    extraContext ? `\n## Additional Context:\n${extraContext}` : '',
  ].filter(Boolean).join('\n');

  // 3. Invoke LangChain orchestrator
  const answer = await invokeChain('rag.assistant', { prompt: message, systemPrompt: systemParts }, tenantId);

  return NextResponse.json({
    answer,
    citations: ragContext ? ['company-knowledge-base'] : [],
    model: 'gemini-2.0-flash',
    ragUsed: Boolean(ragContext),
  });
}

export const POST = withRoute(handler, { rateLimit: 'AI' });
