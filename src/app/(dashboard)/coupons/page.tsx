'use client';

import { useState, useEffect } from 'react';

interface CouponUsage { id: number; invoiceId: number | null; discountAmount: number; usedAt: string; }
interface Coupon { id: number; code: string; discountType: string; discountValue: number; minOrder: number; maxUses: number; usedCount: number; startDate: string | null; endDate: string | null; isActive: boolean; createdAt: string; usages: CouponUsage[]; }

export default function CouponsPage() {
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
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setForm({ code: '', discountType: 'percentage', discountValue: '', minOrder: '0', maxUses: '0', startDate: '', endDate: '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code || !form.discountValue) { alert('الكود وقيمة الخصم مطلوبة'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/coupons', { method: 'POST', headers: headers(), body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); } else { const d = await res.json(); alert(d.error); }
        } catch { alert('خطأ في الاتصال'); } finally { setSaving(false); }
    };

    const toggleStatus = async (c: Coupon) => {
        const res = await fetch(`/api/coupons/${c.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ isActive: !c.isActive }) });
        if (res.ok) fetchData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('حذف هذا الكوبون؟')) return;
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
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🎟️ كوبونات الخصم</h1>
                <button className="btn btn-primary" onClick={openAdd}>➕ كوبون جديد</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>الكود</th><th>الخصم</th><th>الحد الأدنى</th><th>الاستخدامات</th><th>تاريخ الانتهاء</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                            : coupons.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🎟️</div><div className="empty-state-text">لا يوجد كوبونات</div></div></td></tr>
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
                                    <td style={{ color: expired ? '#ef4444' : 'inherit' }}>{c.endDate ? new Date(c.endDate).toLocaleDateString('ar-SA') : 'مفتوح'}</td>
                                    <td>
                                        <span className={`badge ${!c.isActive ? 'badge-error' : expired ? 'badge-warning' : 'badge-success'}`}>
                                            {!c.isActive ? 'موقوف' : expired ? 'منتهي' : 'نشط'}
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
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>➕ إضافة كوبون جديد</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">كود الكوبون *</label>
                                <input className="input" style={{ textTransform: 'uppercase', fontWeight: 'bold' }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="مثال: SAVE20" />
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">نوع الخصم</label>
                                    <select className="input" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                                        <option value="percentage">نسبة مئوية (%)</option>
                                        <option value="fixed">مبلغ ثابت (ر.س)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">قيمة الخصم *</label>
                                    <input className="input" type="number" step="0.01" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">الحد الأدنى للطلب (اختياري)</label>
                                    <input className="input" type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">الحد الأقصى للاستخدامات</label>
                                    <input className="input" type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} placeholder="0 = غير محدود" />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">تاريخ البداية</label>
                                    <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">تاريخ النهاية</label>
                                    <input className="input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 إنشاء'}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Usages Modal */}
            {showUsagesModal && (
                <div className="modal-overlay" onClick={() => setShowUsagesModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>📜 سجل الاستخدام: {showUsagesModal.code}</h3>
                            <button className="modal-close" onClick={() => setShowUsagesModal(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {showUsagesModal.usages.length === 0 ? <p>لم يتم استخدام الكوبون بعد.</p> : (
                                <table className="table">
                                    <thead><tr><th>رقم الفاتورة</th><th>قيمة الخصم</th><th>التاريخ</th></tr></thead>
                                    <tbody>
                                        {showUsagesModal.usages.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.invoiceId || '-'}</td>
                                                <td style={{ fontWeight: 'bold', color: '#10b981' }}>{fmt(u.discountAmount)} ر.س</td>
                                                <td>{new Date(u.usedAt).toLocaleString('ar-SA')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowUsagesModal(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
