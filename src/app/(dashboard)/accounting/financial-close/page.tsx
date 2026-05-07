'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function FinancialClosePage() {
    const { lang } = useTranslation();
    const isAr = lang === 'ar';
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [items, setItems] = useState<any[]>([]);
    const [progress, setProgress] = useState({ total: 0, done: 0, percent: 0 });

    const load = () => {
        fetch(`/api/accounting/financial-close?period=${period}`).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
        fetch(`/api/accounting/financial-close?period=${period}&view=progress`).then(r => r.json()).then(setProgress).catch(() => {});
    };
    useEffect(load, [period]);

    const toggle = (itemOrder: number, completed: boolean) => {
        fetch('/api/accounting/financial-close', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period, itemOrder, completed }) })
            .then(() => { setItems(items.map(i => i.order === itemOrder ? { ...i, completed } : i)); setProgress({ ...progress, done: progress.done + (completed ? 1 : -1), percent: Math.round(((progress.done + (completed ? 1 : -1)) / progress.total) * 100) }); });
    };

    return (
        <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>{isAr ? '🔒 إقفال الفترة المالية' : '🔒 Financial Period Close'}</h1>
                <input type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 12, padding: 20, marginBottom: 20, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{isAr ? 'تقدم الإقفال' : 'Close Progress'}</span>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>{progress.percent}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                    <div style={{ background: '#fff', height: '100%', width: `${progress.percent}%`, borderRadius: 8, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{progress.done}/{progress.total} {isAr ? 'مكتمل' : 'completed'}</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {items.map((item, i) => (
                    <div key={item.order || i} onClick={() => toggle(item.order, !item.completed)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.2s', background: item.completed ? '#F1F8E9' : 'transparent' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${item.completed ? '#4CAF50' : '#ddd'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.completed ? '#4CAF50' : 'transparent', color: '#fff', fontSize: 14, flexShrink: 0 }}>
                            {item.completed && '✓'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                                {isAr ? item.titleAr : item.titleEn}
                            </div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>{item.category}</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#aaa' }}>#{item.order}</span>
                    </div>
                ))}
                {items.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#ccc' }}>{isAr ? 'اختر الفترة' : 'Select period'}</div>}
            </div>
        </div>
    );
}
