import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPrompt, renderPrompt, logPromptUsage } from './prompts/registry';

// Initialize Gemini SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);

/**
 * Universal LLM Client wrapper that uses PromptRegistry.
 * Features: Centralized prompting, usage logging, fallback mechanisms.
 */
export async function callLLM(promptKey: string, vars: Record<string, any>, tenantId: string | null = null): Promise<string> {
    const startTime = Date.now();
    let promptDef;
    let modelName = 'gemini-2.5-flash';
    let systemPrompt = '';
    let userPrompt = '';
    let promptVersion = 1;

    try {
        promptDef = await getPrompt(promptKey, tenantId);
        
        if (promptDef) {
            systemPrompt = promptDef.systemPrompt;
            userPrompt = renderPrompt(promptDef.userTemplate, vars);
            modelName = promptDef.modelHint || modelName;
            promptVersion = promptDef.version;
        } else {
            console.warn(`[LLM] Prompt key '${promptKey}' not found in registry. Using fallback bare invocation if vars.prompt is provided.`);
            userPrompt = vars.prompt || 'Hello';
            systemPrompt = vars.systemPrompt || 'You are a helpful assistant.';
            promptVersion = 0;
        }

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
        
        // Log successful usage
        await logPromptUsage({
            tenantId: tenantId || 'global',
            promptKey,
            promptVersion,
            model: modelName,
            promptTokens: usage?.promptTokenCount || 0,
            completionTokens: usage?.candidatesTokenCount || 0,
            latencyMs,
            success: true
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
        console.error('[LLM Client] callLLM failed:', e);
        throw e;
    }
}
