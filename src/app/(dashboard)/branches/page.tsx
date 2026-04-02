'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Branch {
    id: number;
    name: string;
    code: string | null;
    address: string | null;
    phone: string | null;
    isActive: boolean;
    _count?: {
        users: number;
        stocks: number;
        shifts: number;
        invoices: number;
    }
}

export default function BranchesPage() {
    const { t } = useTranslation();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', isActive: true });
    const [editId, setEditId] = useState<number | null>(null);
    const [toast, setToast] = useState('');

    async function fetchData() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setBranches(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleSave = async () => {
        if (!form.name.trim()) { showToast(t('sys.str_485')); return; }
        
        const token = localStorage.getItem('token');
        try {
            if (editId) {
                const res = await fetch('/api/branches', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ id: editId, ...form }),
                });
                if (res.ok) { showToast(t('sys.str_486')); setShowModal(false); fetchData(); }
                else { const d = await res.json(); showToast(`❌ ${d.error}`); }
            } else {
                const res = await fetch('/api/branches', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(form),
                });
                if (res.ok) { showToast(t('sys.str_487')); setShowModal(false); fetchData(); }
                else { const d = await res.json(); showToast(`❌ ${d.error}`); }
            }
        } catch { showToast(t('sys.str_419')); }
    };

    const deleteBranch = async (b: Branch) => {
        if (!confirm(`هل أنت متأكد من حذف الفرع "${b.name}"؟`)) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/branches?id=${b.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { showToast(t('sys.str_488')); fetchData(); }
            else { const d = await res.json(); showToast(`❌ ${d.error}`); }
        } catch { showToast(t('sys.str_419')); }
    };

    const openEdit = (b: Branch) => {
        setEditId(b.id);
        setForm({ name: b.name, code: b.code || '', address: b.address || '', phone: b.phone || '', isActive: b.isActive });
        setShowModal(true);
    };

    const openAdd = () => {
        setEditId(null);
        setForm({ name: '', code: '', address: '', phone: '', isActive: true });
        setShowModal(true);
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">{t('sys.str_472')}</h1>
                <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_473')}</button>
            </div>

            <div className="page-content animate-fade-in">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t('sys.str_474')}</th>
                                <th>{t('sys.str_475')}</th>
                                <th>{t('sys.str_476')}</th>
                                <th>{t('sys.str_477')}</th>
                                <th>{t('sys.str_478')}</th>
                                <th>{t('fin.str_227')}</th>
                                <th>{t('sys.str_435')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                                : branches.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">{t('sys.str_479')}</div></div></td></tr>
                                    : branches.map((b, i) => (
                                        <tr key={b.id}>
                                            <td>{i + 1}</td>
                                            <td style={{ fontWeight: 'bold' }}>{b.name}</td>
                                            <td><span className="badge badge-outline">{b.code || '-'}</span></td>
                                            <td>{b.address || '-'}</td>
                                            <td dir="ltr" style={{ textAlign: 'right' }}>{b.phone || '-'}</td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {b._count ? `👥 ${b._count.users} | 🧾 ${b._count.invoices}` : '-'}
                                            </td>
                                            <td>
                                                <span className={`badge ${b.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                    {b.isActive ? 'نشط' : 'موقوف'}
                                                </span>
                                            </td>
                                            <td style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)} style={{ color: 'var(--primary)', fontSize: '13px' }}>✏️</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => deleteBranch(b)} style={{ color: 'var(--danger)', fontSize: '13px' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><div className="modal-title">{editId ? '✏️ تعديل الفرع' : '➕ إضافة فرع'}</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_480')}</label>
                            <input className="input" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('sys.str_491')} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_481')}</label>
                            <input className="input" type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} dir="ltr" placeholder="BR-01" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_476')}</label>
                            <input className="input" type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_482')}</label>
                            <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" />
                        </div>
                        <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                            <label htmlFor="isActive" style={{ margin: 0 }}>{t('sys.str_483')}</label>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleSave}>{t('sys.str_484')}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}
