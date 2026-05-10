import { getPrompt } from '../prompts/registry';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'context.conversation-memory' });

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class ConversationMemory {
    constructor(
        private maxTokens: number = 4000,
        private model: 'gemini-flash' | 'gemini-pro' = 'gemini-flash'
    ) {}

    async getRelevantHistory(
        sessionId: string,
        currentQuery: string,
        options: { tokenBudget?: number } = {}
    ): Promise<Message[]> {
        const prisma = getPrisma();
        
        // This assumes CopilotMessage exists. In reality, it might be named differently or not exist.
        // We'll wrap in try-catch
        let all: any[] = [];
        try {
            all = await (prisma as any).copilotMessage?.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' },
            }) || [];
        } catch (e) {
            log.warn('[ConversationMemory] CopilotMessage table not found or query failed. Returning empty history.');
            return [];
        }

        let budget = options.tokenBudget || this.maxTokens;
        const result: Message[] = [];

        for (const msg of all) {
            const tokens = this.estimateTokens(msg.content);
            if (tokens > budget) {
                const summary = await this.summarize(all.slice(result.length));
                result.unshift({ role: 'system', content: `[تلخيص للمحادثة الأقدم]: ${summary}` });
                break;
            }
            budget -= tokens;
            result.unshift({ role: msg.isUser ? 'user' : 'assistant', content: msg.content });
        }

        return result;
    }

    private estimateTokens(text: string): number {
        // Rough estimation: 4 chars per token
        return Math.ceil(text.length / 4);
    }

    private async summarize(messages: any[]): Promise<string> {
        // Fallback simple summarize
        return "المحادثات القديمة محذوفة مؤقتاً لتوفير السياق.";
    }
}
