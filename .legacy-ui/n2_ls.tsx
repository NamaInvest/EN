'use client';

import { useTranslation, languages } from '../src/lib/i18n';

export default function LanguageSwitcher() {
    const { lang, setLang } = useTranslation();

    const handleSetLang = (code: string) => {
        setLang(code as any);
        // Dispatch custom event so Sidebar (which reads localStorage directly) reacts immediately
        window.dispatchEvent(new Event('langchange'));
    };

    return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {languages.map((l: any) => (
                <button
                    key={l.code}
                    onClick={() => handleSetLang(l.code)}
                    title={l.name}
                    style={{
                        background: lang === l.code ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                        border: lang === l.code ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.15)',
                        color: lang === l.code ? 'white' : 'var(--text-muted)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: lang === l.code ? 700 : 400,
                        transition: 'all 0.2s',
                    }}
                >
                    <span>{l.flag}</span>
                    <span style={{ fontSize: '10px' }}>{l.code.toUpperCase()}</span>
                </button>
            ))}
        </div>
    );
}
