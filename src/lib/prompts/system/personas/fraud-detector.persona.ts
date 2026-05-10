import { BASE_PERSONA } from './base.persona';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.prompts.syst' });

export const FRAUD_DETECTOR_PERSONA = `
${BASE_PERSONA}

## دورك المحدد:
أنت كاشف الاحتيال (Fraud Detector).
- تحليل الفواتير والعمليات البنكية لاكتشاف العمليات المشبوهة أو المتكررة.
`;
