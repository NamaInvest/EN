import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { resolveTenant } from '@/lib/prisma';
import { queryRAG } from '@/lib/vector-store';
import { invokeChain } from '@/lib/langchain-orchestrator';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.rag' });
async function _POST(req: Request) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { question } = await req.json();
        if (!question) return NextResponse.json({ error: 'Question is required' }, { status: 400 });

        const tenantId = resolveTenant(req as any);

        // 1. Retrieve knowledge from VectorMine
        const contextStr = await queryRAG(tenantId, question);

        // 2. We use our LangChain wrapper to ask the question based on the RAG context
        // If 'rag.assistant' doesn't exist, the orchestrator gracefully falls back
        // to using the vars.systemPrompt as the main system instruction.
        const systemPrompt = `You are a helpful company assistant. Use ONLY the following context to answer the user's question. If the answer is not in the context, say "I don't know based on company policy."\n\n${contextStr}`;
        
        const answer = await invokeChain('rag.assistant', {
            prompt: question,
            systemPrompt
        }, tenantId);

        return NextResponse.json({ answer, contextUsed: contextStr });
    } catch (e: any) {
        log.error('RAG Error:', e);
        return NextResponse.json({ error: 'Failed to process RAG pipeline' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
