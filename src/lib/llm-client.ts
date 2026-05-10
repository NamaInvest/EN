import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPrompt, renderPrompt, logPromptUsage } from './prompts/registry';

// Initialize Gemini SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);

/**
 * Universal LLM Client wrapper that uses PromptRegistry.
 * Features: Centralized prompting, usage logging, fallback mechanisms.
 */
import { redactPII } from './prompts/system/guardrails/pii-redactor';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'llm-client' });

export async function callLLM(promptKey: string, vars: Record<string, any>, tenantId: string | null = null, enableABTest: boolean = false): Promise<string> {
    const startTime = Date.now();
    let promptDef;
    let modelName = 'gemini-2.5-flash';
    let systemPrompt = '';
    let userPrompt = '';
    let promptVersion = 1;

    try {
        promptDef = await getPrompt(promptKey, tenantId, enableABTest);
        
        if (promptDef) {
            systemPrompt = promptDef.systemPrompt;
            userPrompt = renderPrompt(promptDef.userTemplate, vars);
            modelName = promptDef.modelHint || modelName;
            promptVersion = promptDef.version;
        } else {
            log.warn(`[LLM] Prompt key '${promptKey}' not found in registry. Using fallback bare invocation if vars.prompt is provided.`);
            userPrompt = vars.prompt || 'Hello';
            systemPrompt = vars.systemPrompt || 'You are a helpful assistant.';
            promptVersion = 0;
        }

        // Apply Guardrails (PII Redaction)
        userPrompt = redactPII(userPrompt);

        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: systemPrompt 
        });

        // Try generating content
        const result = await model.generateContent(userPrompt);
        const response = result.response;
        const text = response.text();
        
        const usage = response.usageMetadata;
        const latencyMs = Date.now() - startTime;
        
        // Cost Calculation (Estimated for gemini-2.5-flash)
        const promptTokens = usage?.promptTokenCount || 0;
        const completionTokens = usage?.candidatesTokenCount || 0;
        let costUsd = 0;
        
        if (modelName.includes('gemini-2.5-flash')) {
            costUsd = (promptTokens * 0.000000075) + (completionTokens * 0.00000030);
        } else if (modelName.includes('gemini-2.5-pro')) {
            costUsd = (promptTokens * 0.00125) + (completionTokens * 0.005); // e.g. pro pricing ($1.25/1M, $5.00/1M)
        }

        // Log successful usage
        await logPromptUsage({
            tenantId: tenantId || 'global',
            promptKey,
            promptVersion,
            model: modelName,
            promptTokens,
            completionTokens,
            latencyMs,
            success: true,
            costUsd
        });

        return text;
    } catch (e: any) {
        const latencyMs = Date.now() - startTime;
        await logPromptUsage({
            tenantId: tenantId || 'global',
            promptKey,
            promptVersion,
            model: modelName,
            promptTokens: 0,
            completionTokens: 0,
            latencyMs,
            success: false,
            errorCode: e.message
        });
        log.error('[LLM Client] callLLM failed:', e);
        throw e;
    }
}
