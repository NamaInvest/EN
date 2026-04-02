'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { translate, type Language } from './translations';

export type { Language };

export interface LanguageInfo {
    code: Language;
    name: string;
    nativeName: string;
    dir: 'rtl' | 'ltr';
    flag: string;
}

export const languages: LanguageInfo[] = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
    { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', flag: '🇧🇩' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', flag: '🇵🇰' },
];

interface I18nContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'rtl' | 'ltr';
    langInfo: LanguageInfo;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'ar',
    setLang: () => { },
    t: (key: string) => translate(key, 'ar'),
    dir: 'rtl',
    langInfo: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app_lang') as Language;
            if (saved && translations[saved]) return saved;
        }
        return 'ar';
    });

    useEffect(() => {
        const saved = localStorage.getItem('app_lang') as Language;
        if (saved && translations[saved] && saved !== lang) {
            setLangState(saved);
        }
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('app_lang', newLang);
        const info = languages.find(l => l.code === newLang)!;
        document.documentElement.dir = info.dir;
        document.documentElement.lang = newLang;
    };

    const t = (key: string): string => {
        return translate(key, lang);
    };

    const langInfo = languages.find(l => l.code === lang)!;

    return (
        <I18nContext.Provider value={{ lang, setLang, t, dir: langInfo.dir, langInfo }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(I18nContext);
    // Direct reference to translations ensures bundler includes the dictionary
    const lang = ctx.lang || 'ar';
    const t = (key: string): string => translate(key, lang);
    return { ...ctx, t };
}
