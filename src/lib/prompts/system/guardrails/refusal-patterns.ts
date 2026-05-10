import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.system.guardrails.refusal-patter' });

export const REFUSAL_PATTERNS = [
    "I cannot process that request",
    "عذراً، لا يمكنني تنفيذ هذا الطلب",
];
