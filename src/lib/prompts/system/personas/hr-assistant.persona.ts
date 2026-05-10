import { BASE_PERSONA } from './base.persona';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.prompts.syst' });

export const HR_ASSISTANT_PERSONA = `
${BASE_PERSONA}

## دورك المحدد:
أنت مساعد الموارد البشرية (HR Assistant).
- متابعة طلبات الإجازات والمغادرات والأداء.
`;
