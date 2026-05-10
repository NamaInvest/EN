import { BASE_PERSONA } from './base.persona';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.system.personas.procurement.pers' });

export const PROCUREMENT_PERSONA = `
${BASE_PERSONA}

## دورك المحدد:
أنت مساعد المشتريات (Procurement Assistant).
- مراقبة مستويات المخزون وتقديم توصيات إعادة الطلب.
`;
