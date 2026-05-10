/**
 * Environment & Secrets Validation Layer (AI-25)
 * 
 * Validates all required environment variables at startup using Zod.
 * Prevents the app from running with missing or malformed secrets.
 * Replaces plain-text DB storage of API keys.
 */
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'Env' });

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),

    // Auth
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

    // AI Providers — loaded from env, NOT from DB
    GEMINI_API_KEY: z.string().min(10, 'GEMINI_API_KEY is required').optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),

    // External Services
    SENTRY_DSN: z.string().optional(),
    REDIS_URL: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),

    // App
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _validated: EnvConfig | null = null;

/**
 * Validates and returns the environment configuration.
 * Caches the result after first validation.
 * Throws at startup if critical secrets are missing.
 */
export function getEnv(): EnvConfig {
    if (_validated) return _validated;

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        log.error('❌ Environment validation failed:');
        Object.entries(errors).forEach(([key, msgs]) => {
            log.error(`  ${key}: ${(msgs as string[]).join(', ')}`);
        });

        // In production, fail hard. In dev, warn but continue.
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Missing required environment variables. See logs above.');
        }
    }

    _validated = (result.success ? result.data : envSchema.parse({
        ...process.env,
        // Provide safe defaults for dev only
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/namasoft',
        JWT_SECRET: (process.env.JWT_SECRET as string),
        NODE_ENV: process.env.NODE_ENV || 'development',
    })) as EnvConfig;

    return _validated;
}

/**
 * Get a specific AI provider key safely.
 * Falls back gracefully if not configured.
 */
export function getAIProviderKey(provider: 'gemini' | 'openai' | 'anthropic'): string | undefined {
    const env = getEnv();
    switch (provider) {
        case 'gemini': return env.GEMINI_API_KEY;
        case 'openai': return env.OPENAI_API_KEY;
        case 'anthropic': return env.ANTHROPIC_API_KEY;
    }
}

/**
 * Redact a secret for safe logging (show first 4 + last 4 chars only).
 */
export function redactSecret(secret: string): string {
    if (secret.length <= 8) return '****';
    return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}
