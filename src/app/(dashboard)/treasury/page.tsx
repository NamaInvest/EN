'use client';

import { useState, useEffect } from 'react';

interface TreasuryEntry { id: number; date: string; type: string; amount: number; description: string; referenceType: string; }

export default function TreasuryPage() {
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
            <div className="page-header"><h1 className="page-title">💰 الخزينة</h1></div>
            <div className="page-content animate-fade-in">
                {/* Balance Card */}
                <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                    <div className="kpi-card cyan" style={{ gridColumn: 'span 2' }}>
                        <div className="kpi-icon">💰</div>
                        <div className="kpi-value">{fmt(balance)} ر.س</div>
                        <div className="kpi-label">الرصيد الحالي للخزينة</div>
                    </div>
                </div>

                <div className="toolbar">
                    <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                    <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                    <div className="toolbar-spacer" />
                    <button className="btn btn-success" onClick={() => { setForm({ type: 'in', amount: '', description: '' }); setShowModal(true); }}>📥 إيداع</button>
                    <button className="btn btn-danger" onClick={() => { setForm({ type: 'out', amount: '', description: '' }); setShowModal(true); }}>📤 سحب</button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>المرجع</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                            ) : entries.length === 0 ? (
                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">💰</div><div className="empty-state-text">لا توجد حركات</div></div></td></tr>
                            ) : entries.map((e, i) => (
                                <tr key={e.id}>
                                    <td>{i + 1}</td>
                                    <td>{new Date(e.date).toLocaleDateString('ar-SA')}</td>
                                    <td><span className={`badge ${e.type === 'in' ? 'badge-success' : 'badge-danger'}`}>{e.type === 'in' ? '📥 إيداع' : '📤 سحب'}</span></td>
                                    <td style={{ fontWeight: '700', color: e.type === 'in' ? 'var(--success-light)' : 'var(--danger-light)' }}>{e.type === 'in' ? '+' : '-'}{fmt(e.amount)} ر.س</td>
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
                            <div className="modal-title">{form.type === 'in' ? '📥 إيداع' : '📤 سحب'}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="input-group"><label className="input-label">المبلغ *</label>
                            <input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" dir="ltr" /></div>
                        <div className="input-group"><label className="input-label">الوصف *</label>
                            <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="سبب الإيداع / السحب" /></div>
                        <div className="modal-footer">
                            <button className={`btn ${form.type === 'in' ? 'btn-success' : 'btn-danger'}`} onClick={handleSave}>💾 حفظ</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
