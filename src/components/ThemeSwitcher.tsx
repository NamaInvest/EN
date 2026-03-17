'use client';

import { useState, useEffect, useRef } from 'react';

export const themes = [
    {
        id: 'classic-dark',
        name: '🌑 الداكن الكلاسيكي',
        colors: {
            '--bg-darker': '#0B0E14',
            '--bg-dark': '#0F1218',
            '--bg-card': 'rgba(22, 27, 38, 0.95)',
            '--bg-card-hover': 'rgba(30, 37, 52, 0.9)',
            '--border': 'rgba(255, 255, 255, 0.06)',
            '--border-light': 'rgba(255, 255, 255, 0.1)',
            '--glass-border': 'rgba(255, 255, 255, 0.08)',
            '--text': '#F1F5F9',
            '--text-secondary': '#94A3B8',
            '--text-muted': '#64748B',
            '--primary': '#6C63FF',
            '--primary-light': '#8B85FF',
            '--primary-dark': '#5A52E0',
            '--gradient-primary': 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
            '--success': '#10B981',
            '--success-light': '#34D399',
            '--warning': '#F59E0B',
            '--danger': '#EF4444',
            '--purple': '#8B5CF6',
            '--sidebar-bg': 'rgba(15, 18, 24, 0.98)',
        },
    },
    {
        id: 'royal-blue',
        name: '💎 الأزرق الملكي',
        colors: {
            '--bg-darker': '#080C18',
            '--bg-dark': '#0C1224',
            '--bg-card': 'rgba(16, 25, 50, 0.95)',
            '--bg-card-hover': 'rgba(24, 38, 70, 0.9)',
            '--border': 'rgba(59, 130, 246, 0.12)',
            '--border-light': 'rgba(59, 130, 246, 0.18)',
            '--glass-border': 'rgba(59, 130, 246, 0.1)',
            '--text': '#E8F0FE',
            '--text-secondary': '#93B4E8',
            '--text-muted': '#5B7FB5',
            '--primary': '#3B82F6',
            '--primary-light': '#60A5FA',
            '--primary-dark': '#2563EB',
            '--gradient-primary': 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            '--success': '#10B981',
            '--success-light': '#34D399',
            '--warning': '#F59E0B',
            '--danger': '#EF4444',
            '--purple': '#6366F1',
            '--sidebar-bg': 'rgba(12, 18, 36, 0.98)',
        },
    },
    {
        id: 'emerald-nature',
        name: '🌿 الأخضر الطبيعي',
        colors: {
            '--bg-darker': '#081210',
            '--bg-dark': '#0C1A16',
            '--bg-card': 'rgba(16, 36, 30, 0.95)',
            '--bg-card-hover': 'rgba(24, 50, 42, 0.9)',
            '--border': 'rgba(16, 185, 129, 0.12)',
            '--border-light': 'rgba(16, 185, 129, 0.18)',
            '--glass-border': 'rgba(16, 185, 129, 0.1)',
            '--text': '#E8FAF4',
            '--text-secondary': '#86CEAE',
            '--text-muted': '#4D9A7E',
            '--primary': '#10B981',
            '--primary-light': '#34D399',
            '--primary-dark': '#059669',
            '--gradient-primary': 'linear-gradient(135deg, #10B981, #047857)',
            '--success': '#10B981',
            '--success-light': '#34D399',
            '--warning': '#F59E0B',
            '--danger': '#EF4444',
            '--purple': '#8B5CF6',
            '--sidebar-bg': 'rgba(12, 26, 22, 0.98)',
        },
    },
    {
        id: 'golden-luxury',
        name: '✨ الذهبي الفاخر',
        colors: {
            '--bg-darker': '#12100A',
            '--bg-dark': '#1A1610',
            '--bg-card': 'rgba(36, 30, 18, 0.95)',
            '--bg-card-hover': 'rgba(50, 42, 24, 0.9)',
            '--border': 'rgba(245, 158, 11, 0.12)',
            '--border-light': 'rgba(245, 158, 11, 0.18)',
            '--glass-border': 'rgba(245, 158, 11, 0.1)',
            '--text': '#FEF3E2',
            '--text-secondary': '#D4A96A',
            '--text-muted': '#9A7A48',
            '--primary': '#F59E0B',
            '--primary-light': '#FBBF24',
            '--primary-dark': '#D97706',
            '--gradient-primary': 'linear-gradient(135deg, #F59E0B, #B45309)',
            '--success': '#10B981',
            '--success-light': '#34D399',
            '--warning': '#F59E0B',
            '--danger': '#EF4444',
            '--purple': '#A78BFA',
            '--sidebar-bg': 'rgba(26, 22, 16, 0.98)',
        },
    },
    {
        id: 'crimson-bold',
        name: '🔥 الأحمر الجريء',
        colors: {
            '--bg-darker': '#140A0A',
            '--bg-dark': '#1C1010',
            '--bg-card': 'rgba(40, 18, 18, 0.95)',
            '--bg-card-hover': 'rgba(56, 26, 26, 0.9)',
            '--border': 'rgba(239, 68, 68, 0.12)',
            '--border-light': 'rgba(239, 68, 68, 0.18)',
            '--glass-border': 'rgba(239, 68, 68, 0.1)',
            '--text': '#FEE8E8',
            '--text-secondary': '#E09090',
            '--text-muted': '#A85C5C',
            '--primary': '#EF4444',
            '--primary-light': '#F87171',
            '--primary-dark': '#DC2626',
            '--gradient-primary': 'linear-gradient(135deg, #EF4444, #B91C1C)',
            '--success': '#10B981',
            '--success-light': '#34D399',
            '--warning': '#F59E0B',
            '--danger': '#EF4444',
            '--purple': '#F472B6',
            '--sidebar-bg': 'rgba(28, 16, 16, 0.98)',
        },
    },
    {
        id: 'modern-light',
        name: '☀️ الفاتح العصري',
        colors: {
            '--bg-darker': '#F0F2F5',
            '--bg-dark': '#F8F9FB',
            '--bg-card': 'rgba(255, 255, 255, 0.98)',
            '--bg-card-hover': 'rgba(241, 245, 249, 0.95)',
            '--border': 'rgba(0, 0, 0, 0.08)',
            '--border-light': 'rgba(0, 0, 0, 0.12)',
            '--glass-border': 'rgba(0, 0, 0, 0.06)',
            '--text': '#1E293B',
            '--text-secondary': '#475569',
            '--text-muted': '#94A3B8',
            '--primary': '#6C63FF',
            '--primary-light': '#8B85FF',
            '--primary-dark': '#5A52E0',
            '--gradient-primary': 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
            '--success': '#059669',
            '--success-light': '#10B981',
            '--warning': '#D97706',
            '--danger': '#DC2626',
            '--purple': '#7C3AED',
            '--sidebar-bg': 'rgba(255, 255, 255, 0.98)',
        },
    },
];

export default function ThemeSwitcher() {
    const [currentTheme, setCurrentTheme] = useState('classic-dark');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('namainvest-theme') || 'classic-dark';
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
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Special handling for light theme
        if (themeId === 'modern-light') {
            root.style.setProperty('--shadow', '0 2px 8px rgba(0, 0, 0, 0.08)');
            root.style.setProperty('--shadow-lg', '0 8px 24px rgba(0, 0, 0, 0.12)');
        } else {
            root.style.setProperty('--shadow', '0 2px 8px rgba(0, 0, 0, 0.3)');
            root.style.setProperty('--shadow-lg', '0 8px 24px rgba(0, 0, 0, 0.4)');
        }
    };

    const switchTheme = (themeId: string) => {
        setCurrentTheme(themeId);
        localStorage.setItem('namainvest-theme', themeId);
        applyTheme(themeId);
        setIsOpen(false);
    };

    const current = themes.find(t => t.id === currentTheme);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="theme-switcher-btn"
                title="تغيير الشكل"
            >
                🎨
            </button>

            {isOpen && (
                <div className="theme-dropdown">
                    <div className="theme-dropdown-title">اختر الشكل</div>
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                            onClick={() => switchTheme(theme.id)}
                        >
                            <span className="theme-option-name">{theme.name}</span>
                            <div className="theme-preview">
                                <span style={{ background: theme.colors['--primary'], width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' }} />
                                <span style={{ background: theme.colors['--bg-card'], width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', border: '1px solid ' + theme.colors['--border-light'] }} />
                                <span style={{ background: theme.colors['--text'], width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' }} />
                            </div>
                            {currentTheme === theme.id && <span className="theme-check">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
