'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
    // CRITICAL FIX: Always start with 'ar' during SSR to avoid hydration mismatch
    // Then immediately switch to the correct language after mount using useEffect
    const [lang, setLangState] = useState<Language>('ar');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // This runs ONLY in the browser after hydration is complete
        const saved = localStorage.getItem('app_lang') as Language;
        // FIX: validate against languages array, NOT translations object (which may not have per-lang keys)
        const validCodes = languages.map(l => l.code);
        const actualLang: Language = (saved && validCodes.includes(saved as Language)) ? (saved as Language) : 'ar';
        setLangState(actualLang);
        const info = languages.find(l => l.code === actualLang)!;
        document.documentElement.dir = info.dir;
        document.documentElement.lang = actualLang;
        setMounted(true);
    }, []);


    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('app_lang', newLang);
        // Dispatch event so Sidebar (which reads localStorage directly) updates immediately
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('langchange'));
        }
        const info = languages.find(l => l.code === newLang)!;
        document.documentElement.dir = info.dir;
        document.documentElement.lang = newLang;
    };

    const t = (key: string): string => {
        return translate(key, lang);
    };

    const langInfo = languages.find(l => l.code === lang) || languages[0];

    return (
        <I18nContext.Provider value={{ lang, setLang, t, dir: langInfo.dir, langInfo }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(I18nContext);
    const currentLang = ctx.lang || 'ar';
    // Use useMemo to avoid Turbopack variable naming collision (e=e=>l(e,u) bug)
    const tFn = useMemo(() => {
        return (key: string): string => translate(key, currentLang);
    }, [currentLang]);
    return { ...ctx, t: tFn };
}
