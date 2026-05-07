import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { invokeChain } from '@/lib/langchain-orchestrator';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (conversationId) {
            const messages = await prisma.aiConversationMessage.findMany({
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
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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

        // 4. Call LLM with conversation context
        const systemPrompt = `You are NamaSoft AI Copilot, a helpful enterprise assistant for a Saudi ERP system.
You help with accounting, HR, inventory, manufacturing, sales, and compliance questions.
Answer in the same language the user uses (Arabic or English).
Be concise but thorough. If you don't know, say so.

Previous conversation:
${contextStr}`;

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
        console.error('Copilot error:', e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
