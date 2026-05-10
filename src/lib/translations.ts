import ar from '../locales/ar.json';
import en from '../locales/en.json';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'translations' });

export type Language = 'ar' | 'en';

const translations: Record<Language, Record<string, string>> = {
  ar,
  en,
};

export function translate(key: string, lang: Language): string {
  if (translations[lang] && (translations[lang] as any)[key]) return (translations[lang] as any)[key];
  if (translations['ar'] && (translations['ar'] as any)[key]) return (translations['ar'] as any)[key];
  return key;
}

// Trigger Hot Reload Dictionaries
export default translations;