import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.system.guardrails.content-filter' });

export const CONTENT_FILTER = {
    profanityEnabled: true,
    strictMode: true,
};
