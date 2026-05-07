/**
 * AI-07/08 — LangChain Orchestrator
 * Dynamic imports to prevent build failures when packages aren't installed.
 */
import { z } from "zod";
import { getPrisma } from '@/lib/prisma';
import { getPrompt, logPromptUsage } from './prompts/registry';

// Lazy-loaded LangChain modules
let _lcModules: any = null;

async function getLcModules() {
    if (!_lcModules) {
        try {
            const [genai, prompts, parsers, runnables, tools] = await Promise.all([
                import("@langchain/google-genai"),
                import("@langchain/core/prompts"),
                import("@langchain/core/output_parsers"),
                import("@langchain/core/runnables"),
                import("@langchain/core/tools"),
            ]);
            _lcModules = {
                ChatGoogleGenerativeAI: genai.ChatGoogleGenerativeAI,
                PromptTemplate: prompts.PromptTemplate,
                StringOutputParser: parsers.StringOutputParser,
                RunnableSequence: runnables.RunnableSequence,
                tool: tools.tool,
            };
        } catch {
            console.warn('⚠️ LangChain not available — using stub orchestrator');
            _lcModules = null;
            return null;
        }
    }
    return _lcModules;
}

// Global cache for models
const models: Record<string, any> = {};

function getModel(lc: any, modelName: string) {
    if (!models[modelName]) {
        models[modelName] = new lc.ChatGoogleGenerativeAI({
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.3,
            maxOutputTokens: 2048,
        });
    }
    return models[modelName];
}

/**
 * Creates a standard LangChain sequence using our centralized prompt registry.
 */
export async function createRegistryChain(promptKey: string, tenantId: string | null = null) {
    const lc = await getLcModules();
    if (!lc) throw new Error('[LangChain] LangChain packages not available on this environment.');

    const promptDef = await getPrompt(promptKey, tenantId);
    if (!promptDef) throw new Error(`[LangChain] Prompt key '${promptKey}' not found.`);

    const fullTemplate = `${promptDef.systemPrompt}\n\nUser: ${promptDef.userTemplate}`;
    const lcPrompt = lc.PromptTemplate.fromTemplate(fullTemplate);
    const model = getModel(lc, promptDef.modelHint || 'gemini-2.5-flash');

    const dbMetricsTool = lc.tool(
        async ({ entity }: { entity: string }) => {
            const prisma = getPrisma();
            if (entity === 'sales') return `Total sales today is ${(await prisma.salesInvoice.count()).toString()}`;
            if (entity === 'employees') return `Active employees: ${(await prisma.employee.count({ where: { active: true } })).toString()}`;
            return "I don't know the metrics for that entity.";
        },
        {
            name: "get_erp_metrics",
            description: "Get real-time counts from the ERP system database.",
            schema: z.object({
                entity: z.enum(['sales', 'employees']).describe("The business entity to check")
            }),
        }
    );

    const modelWithTools = model.bindTools([dbMetricsTool]);

    const chain = lc.RunnableSequence.from([
        lcPrompt,
        modelWithTools,
    ]);

    return { chain, promptDef };
}

/**
 * Invoke a chain and track tokens centrally.
 */
export async function invokeChain(promptKey: string, vars: Record<string, any>, tenantId: string | null = null) {
    const startTime = Date.now();
    let promptDef: any;
    let modelName = 'gemini-2.5-flash';

    try {
        const { chain, promptDef: def } = await createRegistryChain(promptKey, tenantId);
        promptDef = def;
        modelName = def.modelHint || modelName;

        const result = await chain.invoke(vars);

        await logPromptUsage({
            tenantId: tenantId || 'global',
            promptKey,
            promptVersion: promptDef.version,
            model: modelName,
            promptTokens: 0,
            completionTokens: 0,
            latencyMs: Date.now() - startTime,
            success: true
        });

        return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    } catch (e: any) {
        if (promptDef) {
            await logPromptUsage({
                tenantId: tenantId || 'global',
                promptKey,
                promptVersion: promptDef.version,
                model: modelName,
                promptTokens: 0,
                completionTokens: 0,
                latencyMs: Date.now() - startTime,
                success: false,
                errorCode: e.message
            });
        }
        throw e;
    }
}
