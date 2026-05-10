import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.prompts.eval' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface EvalResult {
    score: number; // 0 to 1
    reasoning: string;
}

/**
 * LLM-as-a-Judge implementation using Gemini 2.5 Flash to evaluate outputs.
 * 
 * Metrics:
 * - Faithfulness: Is the output factual and derived from the context?
 * - Relevance: Does it directly answer the user's prompt?
 * - Precision: Is the answer concise without hallucination?
 */
export async function evaluatePromptOutput(
    promptContext: string,
    userQuery: string,
    aiOutput: string
): Promise<EvalResult> {
    const judgePrompt = `
You are an impartial and expert LLM Judge. Evaluate the following AI output based on three metrics: Faithfulness, Relevance, and Precision.
Return ONLY a valid JSON object with the following schema, and nothing else:
{
  "score": <number between 0.0 and 1.0>,
  "reasoning": "<short explanation>"
}

Context: ${promptContext}
User Query: ${userQuery}
AI Output: ${aiOutput}
`;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        });

        const result = await model.generateContent(judgePrompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        return {
            score: parsed.score || 0,
            reasoning: parsed.reasoning || 'No reasoning provided.'
        };
    } catch (e) {
        log.error('[EvalSuite] Failed to evaluate prompt output:', e);
        return { score: 0, reasoning: 'Evaluation failed due to error.' };
    }
}
