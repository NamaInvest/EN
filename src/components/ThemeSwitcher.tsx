'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

/**
 * ThemeSwitcher — cycles through light / dark / system.
 * Syncs with localStorage key: 'namasoft-theme'
 * Applies .dark class on <html> accordingly.
 */
export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('namasoft-theme') ?? 'system') as Theme;
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(t: Theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = t === 'dark' || (t === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    // Also update old key for backwards compat
    localStorage.setItem('namainvest-theme', isDark ? 'dark' : 'light');
  }

  function cycleTheme() {
    const next: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
    const newTheme = next[theme];
    setTheme(newTheme);
    localStorage.setItem('namasoft-theme', newTheme);
    applyTheme(newTheme);
  }

  if (!mounted) return null;

  const icons: Record<Theme, React.ReactNode> = {
    light:  <Sun size={16} />,
    dark:   <Moon size={16} />,
    system: <Monitor size={16} />,
  };
  const labels: Record<Theme, string> = {
    light:  'الوضع النهاري',
    dark:   'الوضع الداكن',
    system: 'تلقائي (النظام)',
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      title={labels[theme]}
      aria-label={`الوضع الحالي: ${labels[theme]}. اضغط للتبديل.`}
    >
      {icons[theme]}
    </button>
  );
}
