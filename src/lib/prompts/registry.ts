import { getPrisma } from '@/lib/prisma';
import { resolvePromptVersion } from './ab-testing/traffic-splitter';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'PromptRegistry' });

export async function getPrompt(key: string, tenantId: string | null = null, enableABTest: boolean = false) {
    const prisma = getPrisma();
    let prompt;

    try {
        // Use Traffic Splitter for A/B Testing
        prompt = await resolvePromptVersion(tenantId, key, enableABTest);

        if (!prompt && tenantId) {
            // Fallback to global (null tenant) if tenant-specific not found
            prompt = await resolvePromptVersion(null, key, enableABTest);
        }
    } catch (e) {
        log.error(`[PromptRegistry] Error resolving prompt via traffic splitter for ${key}`, e);
    }

    if (!prompt) {
        // Fallback to local file-based library if not in DB
        try {
            // key format: 'cfo.daily_summary' -> library/cfo/daily-summary.prompt.ts
            const parts = key.split('.');
            if (parts.length === 2) {
                const moduleName = parts[0];
                const actionName = parts[1].replace(/_/g, '-');
                // Dynamic import of the prompt template
                const template = require(`./library/${moduleName}/${actionName}.prompt`);
                return {
                    userTemplate: template.default || template.template,
                    systemPrompt: template.systemPrompt || '',
                    modelHint: template.model || 'gemini-2.5-flash',
                    temperature: template.temperature || 0.2,
                    maxTokens: template.maxTokens || 2048,
                    version: 1,
                };
            }
        } catch (e) {
            log.error(`[PromptRegistry] Failed to load local prompt for key ${key}`);
        }
    }

    return prompt;
}

export function renderPrompt(template: string, vars: Record<string, any>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) {
        const regex = new RegExp(`{{${k}}}`, 'g');
        result = result.replace(regex, v?.toString() || '');
    }
    return result;
}

export async function logPromptUsage(data: {
    tenantId: string;
    promptKey: string;
    promptVersion: number;
    model: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    success: boolean;
    errorCode?: string;
    costUsd?: number;
}) {
    try {
        const prisma = getPrisma();
        await prisma.promptUsageLog.create({
            data
        });
    } catch (e: any) {
        log.error('[PromptRegistry] Failed to log usage:', e);
    }
}
