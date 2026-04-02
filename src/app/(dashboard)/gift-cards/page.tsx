'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface GiftCard { id: number; code: string; initialBalance: number; currentBalance: number; customerId: number | null; expiryDate: string | null; isActive: boolean; createdAt: string; }

export default function GiftCardsPage() {
    const { t } = useTranslation();
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ code: '', initialBalance: '', expiryDate: '' });

    const token = () => localStorage.getItem('token') || '';
    const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    async function fetchData() {
        try {
            const res = await fetch('/api/gift-cards', { headers: headers() });
            if (res.ok) setCards(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setForm({ code: '', initialBalance: '', expiryDate: '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.initialBalance) { alert(t('sys.str_652')); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/gift-cards', { method: 'POST', headers: headers(), body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); } else { const d = await res.json(); alert(d.error); }
        } catch { alert(t('sys.str_446')); } finally { setSaving(false); }
    };

    const toggleStatus = async (c: GiftCard) => {
        const res = await fetch(`/api/gift-cards/${c.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ isActive: !c.isActive }) });
        if (res.ok) fetchData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('sys.str_653'))) return;
        const res = await fetch(`/api/gift-cards/${id}`, { method: 'DELETE', headers: headers() });
        if (res.ok) fetchData(); else { const d = await res.json(); alert(d.error); }
    };

    const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const isExpired = (c: GiftCard) => c.expiryDate && new Date(c.expiryDate) < new Date();
    const isFullyUsed = (c: GiftCard) => c.currentBalance <= 0;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{t('sys.str_637')}</h1>
                <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_638')}</button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_639')}</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--primary-color)' }}>{fmt(cards.reduce((sum, c) => sum + c.initialBalance, 0))} {t('sys.str_68')}</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_640')}</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#10b981' }}>{fmt(cards.filter(c => c.isActive && !isExpired(c)).reduce((sum, c) => sum + c.currentBalance, 0))} {t('sys.str_68')}</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_641')}</div>
                    <div style={{ fontSize: '22px', fontWeight: '700' }}>{cards.length}</div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>{t('sys.str_642')}</th><th>{t('sys.str_643')}</th><th>{t('sys.str_644')}</th><th>{t('sys.str_645')}</th><th>{t('sys.str_432')}</th><th>{t('fin.str_227')}</th><th>{t('sys.str_435')}</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                            : cards.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-text">{t('sys.str_646')}</div></div></td></tr>
                            : cards.map(c => {
                                const expired = isExpired(c);
                                const fullyUsed = isFullyUsed(c);
                                return (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: '700', color: 'var(--primary-color)', letterSpacing: '2px' }}>{c.code}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleDateString('ar-SA')}</td>
                                    <td>{fmt(c.initialBalance)} {t('sys.str_68')}</td>
                                    <td style={{ fontWeight: 'bold', color: fullyUsed ? '#ef4444' : '#10b981' }}>{fmt(c.currentBalance)} {t('sys.str_68')}</td>
                                    <td style={{ color: expired ? '#ef4444' : 'inherit' }}>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('ar-SA') : 'مفتوح'}</td>
                                    <td>
                                        <span className={`badge ${!c.isActive ? 'badge-error' : expired ? 'badge-warning' : fullyUsed ? 'badge-ghost' : 'badge-success'}`}>
                                            {!c.isActive ? 'موقوفة' : expired ? 'منتهية' : fullyUsed ? 'مستنفدة' : 'فعالة'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-sm btn-ghost" onClick={() => toggleStatus(c)}>{c.isActive ? '⏸️ إيقاف' : '▶️ تفعيل'}</button>
                                            <button className="btn btn-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none' }} onClick={() => handleDelete(c.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_647')}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_648')}</label>
                                <input className="input" style={{ textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px' }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder={t('sys.str_658')} />
                                <small style={{ color: 'var(--text-muted)' }}>{t('sys.str_649')}</small>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_650')}</label>
                                <input className="input" type="number" value={form.initialBalance} onChange={e => setForm({ ...form, initialBalance: e.target.value })} placeholder={t('sys.str_659')} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_651')}</label>
                                <input className="input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 إصدار البطاقة'}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
