import prisma from '@/lib/prisma';

export async function getPrompt(key: string, tenantId: string | null = null, version?: number) {
    let prompt;
    if (version) {
        prompt = await prisma.promptTemplate.findUnique({
            // @ts-expect-error [TS2322] Type assignment mismatch - pending strict types
            where: { tenantId_key_version: { tenantId, key, version } }
        });
    } else {
        // Get the latest active version
        prompt = await prisma.promptTemplate.findFirst({
            where: { key, tenantId, active: true },
            orderBy: { version: 'desc' }
        });
    }

    if (!prompt && tenantId) {
        // Fallback to global default
        prompt = await prisma.promptTemplate.findFirst({
            where: { key, tenantId: null, active: true },
            orderBy: { version: 'desc' }
        });
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
        await prisma.promptUsageLog.create({
            data
        });
    } catch (e: any) {
        console.error('[PromptRegistry] Failed to log usage:', e);
    }
}
