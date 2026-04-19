'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";

export const themes = [
    { id: 'default',       nameKey: 'sys.str_4003', name: 'ط§ظ„ظˆط¶ط¹ ط§ظ„ط§ظپطھط±ط§ط¶ظٹ', preview: { p: '#6C63FF', b: '#1A1D27', t: '#F8FAFC' } },
    { id: 'theme-white',   nameKey: 'sys.str_4008', name: 'ط£ط¨ظٹط¶ ظ†ظ‚ظٹ',        preview: { p: '#1E293B', b: '#FFFFFF',  t: '#000000' } },
    { id: 'theme-light',   nameKey: 'sys.str_4004', name: 'ط§ظ„ظˆط¶ط¹ ط§ظ„ظ†ظ‡ط§ط±ظٹ',   preview: { p: '#4F46E5', b: '#FFFFFF',  t: '#0F172A' } },
    { id: 'theme-luxury',  nameKey: 'sys.str_4005', name: 'ط§ظ„ظپط§ط®ط± ط§ظ„ط¯ط§ظƒظ†',   preview: { p: '#D4AF37', b: '#04060F',  t: '#FDFBF7' } },
    { id: 'theme-cyber',   nameKey: 'sys.str_4006', name: 'ط§ظ„ط³ظٹط¨ط±ط§ظ†ظٹ',       preview: { p: '#00FFCC', b: '#050505',  t: '#E0FFFF' } },
    { id: 'theme-soft',    nameKey: 'sys.str_4007', name: 'ط§ظ„ظ†ط§ط¹ظ… ط§ظ„ط±ظ…ط§ط¯ظٹ', preview: { p: '#8DA9C4', b: '#E0E7ED',  t: '#4A5A6A' } },
];

export default function ThemeSwitcher() {
    const { t } = useTranslation();
    const [currentTheme, setCurrentTheme] = useState('default');
    const [isOpen, setIsOpen] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('namainvest-theme-premium') || 'default';
        setCurrentTheme(saved);
        applyTheme(saved);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const applyTheme = (themeId: string) => {
        const root = document.documentElement;
        themes.forEach(th => root.classList.remove(th.id));
        if (themeId !== 'default') root.classList.add(themeId);
    };

    const switchTheme = (themeId: string) => {
        setCurrentTheme(themeId);
        localStorage.setItem('namainvest-theme-premium', themeId);
        applyTheme(themeId);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>

            {/* â”€â”€ Toggle Button â”€â”€ */}
            <button
                id="theme-switcher-btn"
                onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
                title={t('sys.str_110') || 'طھط؛ظٹظٹط± ط§ظ„ط«ظٹظ…'}
                style={{
                    background: isOpen ? 'var(--primary, #6C63FF)' : 'transparent',
                    border: '2px solid var(--border-light, #94A3B8)',
                    color: 'var(--text, #f8fafc)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    flexShrink: 0,
                }}
            >
                ًںژ¨
            </button>

            {/* â”€â”€ Dropdown Panel â”€â”€ */}
            {isOpen && (
                <>
                    {/* Backdrop to close on outside click */}
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                        onClick={() => setIsOpen(false)}
                    />
                    {/* The actual panel â€” opens DOWNWARD */}
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        minWidth: '230px',
                        background: 'var(--bg-darker, #1a1d27)',
                        border: '2px solid var(--border-light, #CBD5E1)',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        zIndex: 99999,
                        backdropFilter: 'blur(12px)',
                        direction: 'rtl',
                    }}>
                        {/* Section header */}
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            paddingBottom: '8px',
                            marginBottom: '8px',
                            borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
                            color: 'var(--text-muted, #94a3b8)',
                            textAlign: 'right',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>
                            {t('sys.str_109') || 'ًںژ¨ ط§ط®طھط± ط§ظ„ط«ظٹظ…'}
                        </div>

                        {/* Theme options */}
                        {themes.map(theme => {
                            const isActive = currentTheme === theme.id;
                            const isHov = hovered === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={(e) => { e.stopPropagation(); switchTheme(theme.id); }}
                                    onMouseEnter={() => setHovered(theme.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '9px 12px',
                                        background: isActive
                                            ? 'rgba(108,99,255,0.18)'
                                            : isHov ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        border: isActive
                                            ? '1px solid rgba(108,99,255,0.45)'
                                            : '1px solid transparent',
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        color: isActive ? '#a5b4fc' : 'var(--text, #f8fafc)',
                                        fontSize: '13px',
                                        fontWeight: isActive ? '700' : '400',
                                        transition: 'all 0.12s',
                                        marginBottom: '3px',
                                        fontFamily: "'Lateef', sans-serif",
                                        outline: 'none',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {/* Checkmark */}
                                    <span style={{
                                        width: '16px',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        color: '#6C63FF',
                                        visibility: isActive ? 'visible' : 'hidden',
                                    }}>âœ“</span>

                                    {/* Theme name */}
                                    <span style={{ flex: 1, textAlign: 'right', margin: '0 6px' }}>
                                        {t(theme.nameKey) || theme.name}
                                    </span>

                                    {/* Color swatches */}
                                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                        {[theme.preview.p, theme.preview.b, theme.preview.t].map((color, i) => (
                                            <span key={i} style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: color,
                                                display: 'inline-block',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                flexShrink: 0,
                                                boxShadow: i === 0 ? `0 0 5px ${color}88` : 'none',
                                            }} />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

