import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getPrisma } from '@/lib/prisma';
import { getPrompt, logPromptUsage } from './prompts/registry';

// Global cache for models to avoid re-instantiation
const models: Record<string, ChatGoogleGenerativeAI> = {};

function getModel(modelName: string) {
    if (!models[modelName]) {
        models[modelName] = new ChatGoogleGenerativeAI({
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.3,
            maxOutputTokens: 2048,
        });
    }
    return models[modelName];
}

/**
 * Creates a standard LangChain sequence (Chain) using our centralized prompt registry.
 * This unlocks advanced orchestration, streaming, and tool bindings.
 */
export async function createRegistryChain(promptKey: string, tenantId: string | null = null) {
    const promptDef = await getPrompt(promptKey, tenantId);
    if (!promptDef) {
        throw new Error(`[LangChain] Prompt key '${promptKey}' not found.`);
    }

    // Combine system instruction + user template
    const fullTemplate = `${promptDef.systemPrompt}\n\nUser: ${promptDef.userTemplate}`;
    
    const lcPrompt = PromptTemplate.fromTemplate(fullTemplate);
    const model = getModel(promptDef.modelHint || 'gemini-2.5-flash');
    const parser = new StringOutputParser();

    // Define a sample Tool for the ERP system
    const dbMetricsTool = tool(
        async ({ entity }) => {
            const prisma = getPrisma();
            if (entity === 'sales') return `Total sales today is ${(await prisma.salesInvoice.count()).toString()}`;
            if (entity === 'employees') return `Active employees: ${(await prisma.employee.count({where: {active: true}})).toString()}`;
            return "I don't know the metrics for that entity.";
        },
        {
            name: "get_erp_metrics",
            description: "Get real-time counts from the ERP system database. Use this when asked for live metrics.",
            schema: z.object({
                entity: z.enum(['sales', 'employees']).describe("The business entity to check")
            }),
        }
    );

    // Bind tools to the model if it supports it
    const modelWithTools = model.bindTools([dbMetricsTool]);

    // Create the pipeline sequence
    const chain = RunnableSequence.from([
        lcPrompt,
        modelWithTools,
        // Optional: If we want purely parsed string, we use StringOutputParser.
        // However, if the model calls a tool, we might need an AgentExecutor instead of a simple sequence.
        // For simplicity in this demo wrapper, we return the raw AIMessage which contains tool_calls.
    ]);

    return {
        chain,
        promptDef
    };
}

/**
 * Advanced usage: Invoke a chain and track tokens centrally
 */
export async function invokeChain(promptKey: string, vars: Record<string, any>, tenantId: string | null = null) {
    const startTime = Date.now();
    let promptDef;
    let success = false;
    let modelName = 'gemini-2.5-flash';
    
    try {
        const { chain, promptDef: def } = await createRegistryChain(promptKey, tenantId);
        promptDef = def;
        modelName = def.modelHint || modelName;

        // Note: Currently, token counting requires callbacks or specific model configs in LangChain
        // For simplicity in this integration, we log the latency and success status.
        // Full token tracking would use @langchain/core callbacks.
        
        const result = await chain.invoke(vars);
        success = true;

        await logPromptUsage({
            tenantId: tenantId || 'global',
            promptKey,
            promptVersion: promptDef.version,
            model: modelName,
            promptTokens: 0, // In production, extract from callback manager
            completionTokens: 0,
            latencyMs: Date.now() - startTime,
            success: true
        });

        // The chain now returns an AIMessage (since we removed StringOutputParser to allow tool_calls).
        // If it called a tool, we would handle it here with an AgentExecutor.
        // For standard responses, return the string content.
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
