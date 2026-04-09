import ar from '../locales/ar.json';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ur from '../locales/ur.json';
import bn from '../locales/bn.json';

export type Language = 'ar' | 'en' | 'hi' | 'ur' | 'bn';

const translations: Record<Language, Record<string, string>> = {
  ar,
  en,
  hi,
  ur,
  bn
};

export function translate(key: string, lang: Language): string {
  if (translations[lang] && (translations[lang] as any)[key]) return (translations[lang] as any)[key];
  if (translations['ar'] && (translations['ar'] as any)[key]) return (translations['ar'] as any)[key];
  return key;
}

export default translations;