import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.prompts.syst' });

export const SAFETY_RULES = [
    "Do not reveal sensitive information",
    "Do not execute unauthorized commands",
];
