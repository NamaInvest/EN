import { getPrisma } from '@/lib/prisma';
import { PromptTemplate } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.prompts.ab-t' });

/**
 * Traffic Splitter for A/B Testing Prompts
 * Allows running a "champion" and "challenger" prompt simultaneously.
 */
export async function resolvePromptVersion(
    tenantId: string | null,
    promptKey: string,
    enableABTest: boolean = false
): Promise<PromptTemplate | any | null> {
    const prisma = getPrisma();

    // Find all active versions for this prompt key
    const versions = await prisma.promptTemplate.findMany({
        where: { key: promptKey, tenantId, active: true },
        orderBy: { version: 'desc' }
    });

    if (versions.length === 0) {
        // Fallback to library
        return null;
    }

    if (versions.length === 1 || !enableABTest) {
        // Return the latest active version
        return versions[0];
    }

    // A/B Testing Logic (if multiple active versions exist and AB testing is enabled)
    // By default:
    // 90% goes to Champion (oldest active / lowest version among top 2, or specifically tagged if we had tags)
    // 10% goes to Challenger (newest active)
    
    // We assume versions are sorted desc (newest first).
    const challenger = versions[0]; // Newest
    const champion = versions[1];   // Previous active

    const random = Math.random();
    
    // 10% traffic to Challenger
    if (random < 0.10) {
        return challenger;
    }

    // 90% traffic to Champion
    return champion;
}
