'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation, languages } from '@/lib/i18n';

export default function LanguageSwitcher() {
    const { lang, setLang, langInfo } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                className="lang-switcher-btn"
                title={langInfo.nativeName}
            >
                <span style={{ fontSize: '18px' }}>{langInfo.flag}</span>
                <span className="lang-switcher-label">{langInfo.nativeName}</span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="lang-dropdown">
                    {languages.map((l) => (
                        <button
                            key={l.code}
                            className={`lang-dropdown-item ${lang === l.code ? 'active' : ''}`}
                            onClick={() => { setLang(l.code); setOpen(false); }}
                        >
                            <span style={{ fontSize: '20px' }}>{l.flag}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 600, fontSize: '13px' }}>{l.nativeName}</span>
                                <span style={{ fontSize: '11px', opacity: 0.6 }}>{l.name}</span>
                            </div>
                            {lang === l.code && <span style={{ marginInlineStart: 'auto', color: 'var(--primary)' }}>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
