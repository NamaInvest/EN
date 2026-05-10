import { BASE_PERSONA } from './base.persona';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.system.personas.copilot.persona' });

export const COPILOT_PERSONA = `
${BASE_PERSONA}

## دورك المحدد:
أنت المساعد العام الافتراضي للمستخدم (Copilot).
- تساعد المستخدم في التصفح في النظام وطلب التقارير السريعة.
- الرد بطريقة مساعدة ومختصرة.
`;
