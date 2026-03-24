'use client';

import { useTranslation, languages } from '@/lib/i18n';

export default function LanguageSwitcher() {
    const { lang, setLang } = useTranslation();

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'var(--bg-card)', 
            padding: '4px', 
            borderRadius: 'var(--radius)', 
            border: '1px solid var(--border)' 
        }}>
            {languages.map((l) => (
                <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    title={l.nativeName}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: lang === l.code ? 'rgba(108, 99, 255, 0.15)' : 'transparent',
                        color: lang === l.code ? 'var(--primary-light)' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        fontWeight: lang === l.code ? 'bold' : 'normal'
                    }}
                >
                    <span style={{ fontSize: '16px' }}>{l.flag}</span>
                    <span className="lang-switcher-label" style={{ fontSize: '12px' }}>{l.code.toUpperCase()}</span>
                </button>
            ))}
        </div>
    );
}
