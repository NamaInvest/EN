import { logger } from '@/lib/logger';

const log = logger.child({ service: 'token-budget' });

/**
 * AI-05 — Token Budget Manager
 * Prevents context window overflow and enforces per-tenant monthly quotas.
 */

interface TokenBudgetConfig {
    maxContextTokens: number;     // Model context window
    warningThreshold: number;     // 0.7 = warn at 70%
    hardLimit: number;            // 0.9 = fail at 90%
    monthlyQuota: number;         // Per-tenant monthly limit
}

const DEFAULT_CONFIG: TokenBudgetConfig = {
    maxContextTokens: 1_000_000,  // Gemini 2.5 Flash = 1M context
    warningThreshold: 0.7,
    hardLimit: 0.9,
    monthlyQuota: 500_000,        // 500K tokens/month for free tier
};

const TIER_QUOTAS: Record<string, number> = {
    free: 500_000,
    pro: 5_000_000,
    enterprise: 50_000_000,
};

/**
 * Estimate token count for text (rough approximation).
 * Arabic text averages ~3 chars/token, English ~4 chars/token.
 */
export function estimateTokens(text: string): number {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const otherChars = text.length - arabicChars;
    return Math.ceil(arabicChars / 3 + otherChars / 4);
}

/**
 * Check if prompt fits within context window.
 */
export function checkTokenBudget(
    promptTokens: number,
    config: Partial<TokenBudgetConfig> = {}
): { allowed: boolean; warning: string | null; usage: number } {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const usage = promptTokens / cfg.maxContextTokens;

    if (usage >= cfg.hardLimit) {
        return {
            allowed: false,
            warning: `Token budget exceeded: ${promptTokens} tokens (${(usage * 100).toFixed(0)}% of ${cfg.maxContextTokens}). Reduce context or chunk the input.`,
            usage,
        };
    }

    if (usage >= cfg.warningThreshold) {
        return {
            allowed: true,
            warning: `High token usage: ${promptTokens} tokens (${(usage * 100).toFixed(0)}%). Consider summarizing context.`,
            usage,
        };
    }

    return { allowed: true, warning: null, usage };
}

/**
 * Get monthly quota for a tier.
 */
export function getMonthlyQuota(tier: string): number {
    return TIER_QUOTAS[tier] || TIER_QUOTAS.free;
}

/**
 * Check if tenant has remaining monthly quota.
 */
export function checkMonthlyQuota(
    usedTokens: number,
    tier: string = 'free'
): { allowed: boolean; remaining: number; percentUsed: number } {
    const quota = getMonthlyQuota(tier);
    const remaining = Math.max(0, quota - usedTokens);
    const percentUsed = (usedTokens / quota) * 100;

    return {
        allowed: remaining > 0,
        remaining,
        percentUsed: Math.min(100, percentUsed),
    };
}

/**
 * Chunk long text into smaller pieces for sequential summarization.
 * Used when input exceeds context window.
 */
export function chunkText(text: string, maxTokensPerChunk: number = 4000): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let current: string[] = [];
    let currentTokens = 0;

    for (const word of words) {
        const wordTokens = estimateTokens(word);
        if (currentTokens + wordTokens > maxTokensPerChunk && current.length > 0) {
            chunks.push(current.join(' '));
            current = [];
            currentTokens = 0;
        }
        current.push(word);
        currentTokens += wordTokens;
    }

    if (current.length > 0) chunks.push(current.join(' '));
    return chunks;
}
