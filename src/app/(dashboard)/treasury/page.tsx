'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface TreasuryEntry { id: number; date: string; type: string; amount: number; description: string; referenceType: string; }

export default function TreasuryPage() {
    const { t } = useTranslation();
    const [entries, setEntries] = useState<TreasuryEntry[]>([]);
    const [balance, setBalance] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ type: 'in', amount: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    async function fetchData() {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        try {
            const [eRes, bRes] = await Promise.all([
                fetch(`/api/treasury?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/treasury/balance', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (eRes.ok) setEntries(await eRes.json());
            if (bRes.ok) { const d = await bRes.json(); setBalance(d.balance); }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            const res = await fetch('/api/treasury', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount), userId: user.id }),
            });
            if (res.ok) { setShowModal(false); setForm({ type: 'in', amount: '', description: '' }); fetchData(); }
        } catch (err) { console.error(err); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    return (
        <>
            <div className="page-header"><h1 className="page-title">{t('sys.str_1275')}</h1></div>
            <div className="page-content animate-fade-in">
                {/* Balance Card */}
                <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                    <div className="kpi-card cyan" style={{ gridColumn: 'span 2' }}>
                        <div className="kpi-icon">💰</div>
                        <div className="kpi-value">{fmt(balance)} {t('sys.str_68')}</div>
                        <div className="kpi-label">{t('sys.str_1489')}</div>
                    </div>
                </div>

                <div className="toolbar">
                    <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                    <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                    <div className="toolbar-spacer" />
                    <button className="btn btn-success" onClick={() => { setForm({ type: 'in', amount: '', description: '' }); setShowModal(true); }}>{t('sys.str_1490')}</button>
                    <button className="btn btn-danger" onClick={() => { setForm({ type: 'out', amount: '', description: '' }); setShowModal(true); }}>{t('sys.str_1491')}</button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>#</th><th>{t('fin.str_232')}</th><th>{t('fin.str_199')}</th><th>{t('sys.str_463')}</th><th>{t('fin.str_212')}</th><th>{t('sys.str_1492')}</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                            ) : entries.length === 0 ? (
                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">💰</div><div className="empty-state-text">{t('stock.str_1450')}</div></div></td></tr>
                            ) : entries.map((e, i) => (
                                <tr key={e.id}>
                                    <td>{i + 1}</td>
                                    <td>{new Date(e.date).toLocaleDateString('ar-SA')}</td>
                                    <td><span className={`badge ${e.type === 'in' ? 'badge-success' : 'badge-danger'}`}>{e.type === 'in' ? t('sys.str_1490') : t('sys.str_1491')}</span></td>
                                    <td style={{ fontWeight: '700', color: e.type === 'in' ? 'var(--success-light)' : 'var(--danger-light)' }}>{e.type === 'in' ? '+' : '-'}{fmt(e.amount)} {t('sys.str_68')}</td>
                                    <td>{e.description || '-'}</td>
                                    <td>{e.referenceType || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{form.type === 'in' ? t('sys.str_1490') : t('sys.str_1491')}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="input-group"><label className="input-label">{t('sys.str_577')}</label>
                            <input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" dir="ltr" /></div>
                        <div className="input-group"><label className="input-label">{t('sys.str_576')}</label>
                            <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('sys.str_1493')} /></div>
                        <div className="modal-footer">
                            <button className={`btn ${form.type === 'in' ? 'btn-success' : 'btn-danger'}`} onClick={handleSave}>{t('sys.str_455')}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
