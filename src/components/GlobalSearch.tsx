'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

const typeIcons: Record<string, string> = { page: '📄', customer: '👤', supplier: '🏪', product: '📦', invoice: '🧾', employee: '👨‍💼', order: '📋' };
const typeLabels: Record<string, Record<string, string>> = {
    ar: { page: 'صفحة', customer: 'عميل', supplier: 'مورد', product: 'منتج', invoice: 'فاتورة', employee: 'موظف' },
    en: { page: 'Page', customer: 'Customer', supplier: 'Supplier', product: 'Product', invoice: 'Invoice', employee: 'Employee' }
};

export default function GlobalSearch() {
    const { lang } = useTranslation();
    const isAr = lang === 'ar';
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<any>(null);

    // Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

    const doSearch = useCallback((q: string) => {
        if (q.length < 2) { setResults([]); return; }
        setLoading(true);
        fetch(`/api/system/search?q=${encodeURIComponent(q)}&lang=${lang}`)
            .then(r => r.json()).then(d => { setResults(d.results || []); setSelectedIdx(0); })
            .catch(() => {}).finally(() => setLoading(false));
    }, [lang]);

    const handleInput = (val: string) => {
        setQuery(val);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doSearch(val), 300);
    };

    const navigate = (href: string) => { setOpen(false); setQuery(''); setResults([]); router.push(href); };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && results[selectedIdx]) navigate(results[selectedIdx].href);
    };

    if (!open) return (
        <button onClick={() => setOpen(true)} title="Ctrl+K" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 8,
            border: '1px solid var(--border-color, #e0e0e0)', background: 'var(--bg-secondary, #f5f5f5)',
            cursor: 'pointer', fontSize: 13, color: '#888', minWidth: 200
        }}>
            🔍 <span>{isAr ? 'بحث...' : 'Search...'}</span>
            <kbd style={{ marginInlineStart: 'auto', fontSize: 11, background: '#e8e8e8', padding: '2px 6px', borderRadius: 4 }}>⌘K</kbd>
        </button>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100 }} onClick={() => setOpen(false)}>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
            <div onClick={e => e.stopPropagation()} style={{
                position: 'relative', width: '100%', maxWidth: 560, background: 'var(--bg-primary, #fff)',
                borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.2)', overflow: 'hidden',
                direction: isAr ? 'rtl' : 'ltr'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color, #e8e8e8)' }}>
                    <span style={{ fontSize: 18, marginInlineEnd: 8 }}>🔍</span>
                    <input ref={inputRef} value={query} onChange={e => handleInput(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder={isAr ? 'ابحث عن أي شيء...' : 'Search anything...'} autoFocus
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: 'var(--text-primary, #333)' }} />
                    {loading && <span style={{ fontSize: 14 }}>⏳</span>}
                    <kbd onClick={() => setOpen(false)} style={{ cursor: 'pointer', fontSize: 11, background: '#e8e8e8', padding: '2px 8px', borderRadius: 4, marginInlineStart: 8 }}>ESC</kbd>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {results.length > 0 ? results.map((r, i) => (
                        <div key={`${r.type}-${r.id}`} onClick={() => navigate(r.href)} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer',
                            background: i === selectedIdx ? 'var(--bg-hover, #f0f7ff)' : 'transparent',
                            borderBottom: '1px solid var(--border-color, #f5f5f5)'
                        }}>
                            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.icon || typeIcons[r.type] || '📄'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                                {r.subtitle && <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>}
                            </div>
                            <span style={{ fontSize: 11, color: '#aaa', background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
                                {(typeLabels[lang] || typeLabels.en)[r.type] || r.type}
                            </span>
                        </div>
                    )) : query.length >= 2 && !loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد نتائج' : 'No results'}</div>
                    ) : (
                        <div style={{ padding: 24, textAlign: 'center', color: '#ccc', fontSize: 13 }}>{isAr ? 'اكتب للبحث...' : 'Type to search...'}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
