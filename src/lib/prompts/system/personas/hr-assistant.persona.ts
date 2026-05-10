import { BASE_PERSONA } from './base.persona';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.system.personas.hr-assistant.per' });

export const HR_ASSISTANT_PERSONA = `
${BASE_PERSONA}

## دورك المحدد:
أنت مساعد الموارد البشرية (HR Assistant).
- متابعة طلبات الإجازات والمغادرات والأداء.
`;
