'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface CouponUsage { id: number; invoiceId: number | null; discountAmount: number; usedAt: string; }
interface Coupon { id: number; code: string; discountType: string; discountValue: number; minOrder: number; maxUses: number; usedCount: number; startDate: string | null; endDate: string | null; isActive: boolean; createdAt: string; usages: CouponUsage[]; }

export default function CouponsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showUsagesModal, setShowUsagesModal] = useState<Coupon | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrder: '0', maxUses: '0', startDate: '', endDate: '' });

    const token = () => localStorage.getItem('token') || '';
    const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    async function fetchData() {
        try {
            const res = await fetch('/api/coupons', { headers: headers() });
            if (res.ok) setCoupons(await res.json());
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setForm({ code: '', discountType: 'percentage', discountValue: '', minOrder: '0', maxUses: '0', startDate: '', endDate: '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code || !form.discountValue) { alert(t('sys.str_512')); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/coupons', { method: 'POST', headers: headers(), body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); } else { const d = await res.json(); alert(d.error); }
        } catch { alert(t('sys.str_446')); } finally { setSaving(false); }
    };

    const toggleStatus = async (c: Coupon) => {
        const res = await fetch(`/api/coupons/${c.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ isActive: !c.isActive }) });
        if (res.ok) fetchData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('sys.str_513'))) return;
        const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE', headers: headers() });
        if (res.ok) fetchData(); else { const d = await res.json(); alert(d.error); }
    };

    const fmt = (n: number) => isNaN(n) ? '0.00' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Check if coupon is expired or maxed out
    const isExpired = (c: Coupon) => {
        if (c.endDate && new Date(c.endDate) < new Date()) return true;
        if (c.maxUses > 0 && c.usedCount >= c.maxUses) return true;
        return false;
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{t('sys.str_492')}</h1>
                <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_493')}</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>{t('fin.str_197')}</th><th>{t('sys.str_494')}</th><th>{t('sys.str_495')}</th><th>{t('sys.str_496')}</th><th>{t('sys.str_432')}</th><th>{t('fin.str_227')}</th><th>{t('sys.str_435')}</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                            : coupons.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🎟️</div><div className="empty-state-text">{t('sys.str_497')}</div></div></td></tr>
                            : coupons.map(c => {
                                const expired = isExpired(c);
                                return (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{c.code}</td>
                                    <td style={{ fontWeight: '600' }}>{c.discountType === 'percentage' ? `${c.discountValue}%` : `${fmt(c.discountValue)} ر.س`}</td>
                                    <td>{c.minOrder > 0 ? `${fmt(c.minOrder)} ر.س` : '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span>{c.usedCount} {c.maxUses > 0 ? `/ ${c.maxUses}` : ''}</span>
                                            {c.usedCount > 0 && <button className="btn btn-sm btn-ghost" style={{ padding: '0 4px', height: '20px', minHeight: '20px' }} onClick={() => setShowUsagesModal(c)}>👁️</button>}
                                        </div>
                                    </td>
                                    <td style={{ color: expired ? '#ef4444' : 'inherit' }}>{c.endDate ? new Date(c.endDate).toLocaleDateString('en-GB') : t('sys.str_514')}</td>
                                    <td>
                                        <span className={`badge ${!c.isActive ? 'badge-error' : expired ? 'badge-warning' : 'badge-success'}`}>
                                            {!c.isActive ? t('sys.str_489') : expired ? t('sys.str_515') : t('sys.str_180')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-sm btn-ghost" onClick={() => toggleStatus(c)}>{c.isActive ? t('sys.str_516') : t('sys.str_517')}</button>
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
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_498')}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_499')}</label>
                                <input className="input" style={{ textTransform: 'uppercase', fontWeight: 'bold' }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder={t('sys.str_518')} />
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_500')}</label>
                                    <select className="input" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                                        <option value="percentage">{t('sys.str_501')}</option>
                                        <option value="fixed">{t('sys.str_502')}</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_503')}</label>
                                    <input className="input" type="number" step="0.01" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_504')}</label>
                                    <input className="input" type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_505')}</label>
                                    <input className="input" type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} placeholder={t('sys.str_519')} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_506')}</label>
                                    <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_507')}</label>
                                    <input className="input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('sys.str_454') : t('sys.str_520')}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Usages Modal */}
            {showUsagesModal && (
                <div className="modal-overlay" onClick={() => setShowUsagesModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_508')}{showUsagesModal.code}</h3>
                            <button className="modal-close" onClick={() => setShowUsagesModal(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {showUsagesModal.usages.length === 0 ? <p>{t('sys.str_509')}</p> : (
                                <table className="table">
                                    <thead><tr><th>{t('sys.str_510')}</th><th>{t('sys.str_511')}</th><th>{t('fin.str_232')}</th></tr></thead>
                                    <tbody>
                                        {showUsagesModal.usages.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.invoiceId || '-'}</td>
                                                <td style={{ fontWeight: 'bold', color: '#10b981' }}>{fmt(u.discountAmount)} {t('sys.str_68')}</td>
                                                <td>{new Date(u.usedAt).toLocaleString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowUsagesModal(null)}>{t('sys.str_77')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
