import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { invokeChain } from '@/lib/langchain-orchestrator';
import { getPrompt, renderPrompt } from '@/lib/prompts/registry';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.copilot.chat' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (conversationId) {
            const messages = await prisma.aiConversationMessage.findMany({
            take: 100,
                where: { conversationId },
                orderBy: { createdAt: 'asc' }
            });
            return NextResponse.json(messages);
        }

        // List conversations
        const conversations = await prisma.aiConversation.findMany({
            where: { tenantId, userId: auth.userId.toString() },
            orderBy: { startedAt: 'desc' },
            take: 50
        });

        return NextResponse.json(conversations);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { message, conversationId } = await request.json();

        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

        // 1. Get or create conversation
        let convId = conversationId;
        if (!convId) {
            const conv = await prisma.aiConversation.create({
                data: {
                    tenantId,
                    userId: auth.userId.toString(),
                    title: message.substring(0, 60) + (message.length > 60 ? '...' : ''),
                }
            });
            convId = conv.id;
        }

        // 2. Save user message
        await prisma.aiConversationMessage.create({
            data: { conversationId: convId, role: 'user', content: message }
        });

        // 3. Build context from previous messages (last 10)
        const history = await prisma.aiConversationMessage.findMany({
            where: { conversationId: convId },
            orderBy: { createdAt: 'asc' },
            take: 10
        });

        const contextStr = history.map((m: any) => `${m.role}: ${m.content}`).join('\n');

        // 4. Get System Prompt from Registry
        const promptTemplate = await getPrompt('copilot.general_assistant', tenantId);
        if (!promptTemplate?.systemPrompt) {
            return NextResponse.json({ error: 'Prompt template not found' }, { status: 500 });
        }

        const systemPrompt = renderPrompt(promptTemplate.systemPrompt, {
            contextStr: contextStr
        });

        // 5. Call LLM with conversation context
        const answer = await invokeChain('copilot.chat', {
            prompt: message,
            systemPrompt
        }, tenantId);

        // 5. Save assistant response
        await prisma.aiConversationMessage.create({
            data: { conversationId: convId, role: 'assistant', content: answer }
        });

        return NextResponse.json({
            conversationId: convId,
            answer,
        });
    } catch (e: any) {
        log.error('Copilot error:', e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AI' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
