import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai-copilot-engine' });

/**
 * P-16: AI Copilot with RAG
 * Wraps Gemini API with NamaSoft-specific financial context
 */

interface CopilotContext {
  tenantId: string;
  userId: string;
  module: 'FINANCE' | 'HR' | 'INVENTORY' | 'CRM' | 'MANUFACTURING';
  period?: string;
}

export class AICopilotEngine {
  private static readonly SYSTEM_PROMPT = `You are NamaSoft ERP AI Copilot — an expert in Saudi accounting (SOCPA), IFRS, ZATCA e-invoicing, and GCC labor law.
You provide concise, actionable answers in Arabic or English based on the user's language.
Always cite IFRS/IAS standards when answering accounting questions.
For ZATCA questions, reference the latest ZATCA guidelines.
Never fabricate data — if unsure, ask for clarification.`;

  static buildMessages(userQuery: string, context: CopilotContext, ragContext: string[] = []) {
    const contextStr = ragContext.length ? `\nRelevant context:\n${ragContext.map((c, i) => `[${i+1}] ${c}`).join('\n')}` : '';
    return [
      { role: 'system', content: this.SYSTEM_PROMPT },
      { role: 'user', content: `Module: ${context.module}${context.period ? `, Period: ${context.period}` : ''}\n\n${userQuery}${contextStr}` },
    ];
  }

  static async query(userQuery: string, context: CopilotContext, ragContext: string[] = []) {
    const messages = this.buildMessages(userQuery, context, ragContext);
    log.info(`AI Copilot query: module=${context.module}, user=${context.userId}`);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { answer: text, model: 'gemini-2.0-flash', sources: ragContext.length };
  }
}
