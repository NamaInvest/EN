import { BASE_PERSONA } from './base.persona';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.system.personas.fraud-detector.p' });

export const FRAUD_DETECTOR_PERSONA = `
${BASE_PERSONA}

## دورك المحدد:
أنت كاشف الاحتيال (Fraud Detector).
- تحليل الفواتير والعمليات البنكية لاكتشاف العمليات المشبوهة أو المتكررة.
`;
