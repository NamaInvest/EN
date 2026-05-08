'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";

export const themes = [
    { id: 'default',       nameKey: 'sys.str_4003', name: 'الوضع افتراضي', preview: { p: '#6C63FF', b: '#1A1D27', t: '#F8FAFC' } },
    { id: 'theme-white',   nameKey: 'sys.str_4008', name: 'أبيض نقي',        preview: { p: '#1E293B', b: '#FFFFFF',  t: '#000000' } },
    { id: 'theme-light',   nameKey: 'sys.str_4004', name: 'الوضع النهاري',   preview: { p: '#4F46E5', b: '#FFFFFF',  t: '#0F172A' } },
    { id: 'theme-luxury',  nameKey: 'sys.str_4005', name: 'الفاخر الداكن',   preview: { p: '#D4AF37', b: '#04060F',  t: '#FDFBF7' } },
    { id: 'theme-cyber',   nameKey: 'sys.str_4006', name: 'السيبراني',       preview: { p: '#00FFCC', b: '#050505',  t: '#E0FFFF' } },
    { id: 'theme-soft',    nameKey: 'sys.str_4007', name: 'الناعم الرمادي', preview: { p: '#8DA9C4', b: '#E0E7ED',  t: '#4A5A6A' } },
    { id: 'theme-ocean',   nameKey: 'sys.str_4009', name: 'المحيط الزجاجي',  preview: { p: '#0EA5E9', b: '#082F49',  t: '#F0F9FF' } },
    { id: 'theme-mono',    nameKey: 'sys.str_4010', name: 'أبيض وأسود',      preview: { p: '#171717', b: '#FAFAFA',  t: '#0A0A0A' } },
    { id: 'theme-desert',  nameKey: 'sys.str_4011', name: 'الذهبي الصحراوي', preview: { p: '#B45309', b: '#FEF3C7',  t: '#451A03' } },
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
        <div style={{ display: 'none' }}>
            {/* Theme switcher disabled to enforce Unified Design System (Ocean Glass) */}
        </div>
    );
}
