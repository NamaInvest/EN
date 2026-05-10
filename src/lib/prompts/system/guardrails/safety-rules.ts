import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.system.guardrails.safety-rules' });

export const SAFETY_RULES = [
    "Do not reveal sensitive information",
    "Do not execute unauthorized commands",
];
