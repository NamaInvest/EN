'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";

export const themes = [
    { id: 'default', name: '🌑 الداكن الكلاسيكي', preview: { p: '#6C63FF', b: '#1A1D27', t: '#F8FAFC'} },
    { id: 'theme-light', name: '💼 الفاتح النظيف', preview: { p: '#4F46E5', b: '#FFFFFF', t: '#0F172A'} },
    { id: 'theme-luxury', name: '👑 الملكي الفاخر', preview: { p: '#D4AF37', b: '#04060F', t: '#FDFBF7'} },
    { id: 'theme-cyber', name: '🔥 النيون السيبراني', preview: { p: '#00FFCC', b: '#050505', t: '#E0FFFF'} },
    { id: 'theme-soft', name: '☁️ النعومة الفائقة', preview: { p: '#8DA9C4', b: '#E0E7ED', t: '#4A5A6A'} },
];

export default function ThemeSwitcher() {
    const { t } = useTranslation();
    const [currentTheme, setCurrentTheme] = useState('default');
    const [isOpen, setIsOpen] = useState(false);
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
        // Clean up old themes
        themes.forEach(t => root.classList.remove(t.id));
        // Apply new theme class to <html> tag
        if (themeId !== 'default') {
            root.classList.add(themeId);
        }
    };

    const switchTheme = (themeId: string) => {
        setCurrentTheme(themeId);
        localStorage.setItem('namainvest-theme-premium', themeId);
        applyTheme(themeId);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="theme-switcher-btn"
                title={t('sys.str_110')}
            >
                🎨
            </button>

            {isOpen && (
                <div className="theme-dropdown" style={{ minWidth: '220px' }}>
                    <div className="theme-dropdown-title" style={{ fontSize: '13px', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid var(--border)'}}>{t('sys.str_109')}</div>
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                            onClick={() => switchTheme(theme.id)}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '10px 12px',
                                background: currentTheme === theme.id ? 'var(--bg-card-hover)' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                textAlign: 'right',
                                color: 'var(--text)',
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                marginBottom: '4px'
                            }}
                        >
                            <span className="theme-option-name" style={{ fontWeight: currentTheme === theme.id ? 'bold' : 'normal' }}>
                                {theme.name}
                            </span>
                            <div className="theme-preview" style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ background: theme.preview.p, width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 4px rgba(0,0,0,0.2)' }} />
                                <span style={{ background: theme.preview.b, width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block', border: '1px solid rgba(128,128,128,0.3)' }} />
                                <span style={{ background: theme.preview.t, width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block' }} />
                            </div>
                        </button>
                    ))}
                </div>
            )}
            
            <style jsx>{`
                .theme-switcher-btn {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    color: var(--text);
                    width: 40px;
                    height: 40px;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transition: all 0.3s ease;
                }
                .theme-switcher-btn:hover {
                    background: var(--bg-card-hover);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow);
                }
                .theme-dropdown {
                    position: absolute;
                    top: 50px;
                    left: 0;
                    background: var(--bg-dark);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    padding: 12px;
                    box-shadow: var(--shadow-lg);
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                }
            `}</style>
        </div>
    );
}
