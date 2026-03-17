'use client';

import { useState, useEffect } from 'react';

interface DepreciationRecord { id: number; depreciationDate: string; amount: number; }
interface FixedAssetItem { id: number; assetName: string; assetType: string; purchaseDate: string; purchaseCost: number; salvageValue: number; usefulLifeYears: number; currentValue: number; location: string | null; status: string; depreciations: DepreciationRecord[]; }

const ASSET_TYPES = [
    { value: 'equipment', label: '⚙️ معدات' },
    { value: 'vehicle', label: '🚗 مركبات' },
    { value: 'furniture', label: '🪑 أثاث' },
    { value: 'computer', label: '💻 أجهزة حاسب' },
    { value: 'building', label: '🏢 مباني' },
    { value: 'land', label: '🌍 أراضي' },
    { value: 'other', label: '📦 أخرى' },
];

export default function FixedAssetsPage() {
    const [assets, setAssets] = useState<FixedAssetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<FixedAssetItem | null>(null);
    const [showDepModal, setShowDepModal] = useState<FixedAssetItem | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        assetName: '', assetType: 'equipment', purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: '', salvageValue: '0', usefulLifeYears: '5', location: ''
    });

    const token = () => localStorage.getItem('token') || '';
    const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    async function fetchData() {
        try {
            const res = await fetch('/api/fixed-assets', { headers: headers() });
            if (res.ok) setAssets(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setEditItem(null);
        setForm({ assetName: '', assetType: 'equipment', purchaseDate: new Date().toISOString().split('T')[0], purchaseCost: '', salvageValue: '0', usefulLifeYears: '5', location: '' });
        setShowModal(true);
    };
    const openEdit = (a: FixedAssetItem) => {
        setEditItem(a);
        setForm({
            assetName: a.assetName, assetType: a.assetType,
            purchaseDate: a.purchaseDate.split('T')[0],
            purchaseCost: a.purchaseCost.toString(), salvageValue: a.salvageValue.toString(),
            usefulLifeYears: a.usefulLifeYears.toString(), location: a.location || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.assetName || !form.purchaseCost) { alert('اسم الأصل وتكلفة الشراء مطلوبة'); return; }
        setSaving(true);
        try {
            const url = editItem ? `/api/fixed-assets/${editItem.id}` : '/api/fixed-assets';
            const method = editItem ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); } else { const d = await res.json(); alert(d.error); }
        } catch { alert('خطأ في الاتصال'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الأصل وجميع سجلات الإهلاك المرتبطة؟')) return;
        const res = await fetch(`/api/fixed-assets/${id}`, { method: 'DELETE', headers: headers() });
        if (res.ok) fetchData(); else { const d = await res.json(); alert(d.error); }
    };

    const handleDepreciate = async (id: number) => {
        if (!confirm('هل تريد تسجيل إهلاك سنوي لهذا الأصل؟')) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/fixed-assets/${id}/depreciate`, { method: 'POST', headers: headers() });
            if (res.ok) { fetchData(); setShowDepModal(null); alert('✅ تم تسجيل الإهلاك بنجاح'); }
            else { const d = await res.json(); alert(d.error); }
        } catch { alert('خطأ'); } finally { setSaving(false); }
    };

    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const typeLabel = (t: string) => ASSET_TYPES.find(x => x.value === t)?.label || t;
    const statusLabels: Record<string, { label: string; cls: string }> = {
        active: { label: 'نشط', cls: 'badge-success' },
        disposed: { label: 'مستبعد', cls: 'badge-error' },
        fully_depreciated: { label: 'مُهلك بالكامل', cls: 'badge-warning' },
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🏢 الأصول الثابتة</h1>
                <button className="btn btn-primary" onClick={openAdd}>➕ إضافة أصل ثابت</button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إجمالي التكاليف</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--primary-color)' }}>{fmt(assets.reduce((s, a) => s + a.purchaseCost, 0))} ر.س</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>القيمة الحالية</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#10b981' }}>{fmt(assets.reduce((s, a) => s + a.currentValue, 0))} ر.س</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>الإهلاك المتراكم</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#f59e0b' }}>{fmt(assets.reduce((s, a) => s + (a.purchaseCost - a.currentValue), 0))} ر.س</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>عدد الأصول</div>
                    <div style={{ fontSize: '22px', fontWeight: '700' }}>{assets.length}</div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>اسم الأصل</th><th>النوع</th><th>تاريخ الشراء</th><th>تكلفة الشراء</th><th>القيمة الحالية</th><th>العمر</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                            : assets.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">🏢</div><div className="empty-state-text">لا يوجد أصول ثابتة مسجلة</div></div></td></tr>
                            : assets.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: '600' }}>{a.assetName}</td>
                                    <td><span className="badge badge-outline">{typeLabel(a.assetType)}</span></td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(a.purchaseDate).toLocaleDateString('ar-SA')}</td>
                                    <td>{fmt(a.purchaseCost)} ر.س</td>
                                    <td style={{ fontWeight: '700', color: a.currentValue <= a.salvageValue ? '#f59e0b' : '#10b981' }}>{fmt(a.currentValue)} ر.س</td>
                                    <td>{a.usefulLifeYears} سنة</td>
                                    <td><span className={`badge ${statusLabels[a.status]?.cls || ''}`}>{statusLabels[a.status]?.label || a.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {a.status === 'active' && <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', border: 'none', fontSize: '11px' }} onClick={() => handleDepreciate(a.id)}>📉 إهلاك</button>}
                                            <button className="btn btn-sm btn-ghost" style={{ fontSize: '11px' }} onClick={() => setShowDepModal(a)}>📋 السجل</button>
                                            <button className="btn btn-sm btn-ghost" style={{ fontSize: '11px' }} onClick={() => openEdit(a)}>✏️</button>
                                            <button className="btn btn-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', fontSize: '11px' }} onClick={() => handleDelete(a.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>{editItem ? '✏️ تعديل أصل ثابت' : '➕ إضافة أصل ثابت'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2">
                                <div className="input-group"><label className="input-label">اسم الأصل *</label><input className="input" value={form.assetName} onChange={e => setForm({ ...form, assetName: e.target.value })} placeholder="مثال: طابعة HP" /></div>
                                <div className="input-group"><label className="input-label">نوع الأصل</label>
                                    <select className="input" value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })}>
                                        {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="input-group"><label className="input-label">تاريخ الشراء</label><input className="input" type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} /></div>
                                {!editItem && <div className="input-group"><label className="input-label">تكلفة الشراء *</label><input className="input" type="number" dir="ltr" value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })} /></div>}
                                <div className="input-group"><label className="input-label">القيمة المتبقية</label><input className="input" type="number" dir="ltr" value={form.salvageValue} onChange={e => setForm({ ...form, salvageValue: e.target.value })} /></div>
                                <div className="input-group"><label className="input-label">العمر الافتراضي (سنوات)</label><input className="input" type="number" min="1" value={form.usefulLifeYears} onChange={e => setForm({ ...form, usefulLifeYears: e.target.value })} /></div>
                                <div className="input-group"><label className="input-label">الموقع</label><input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="مثال: المكتب الرئيسي" /></div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 حفظ'}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Depreciation History Modal */}
            {showDepModal && (
                <div className="modal-overlay" onClick={() => setShowDepModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>📋 سجل إهلاك: {showDepModal.assetName}</h3>
                            <button className="modal-close" onClick={() => setShowDepModal(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>تكلفة الشراء:</span><strong>{fmt(showDepModal.purchaseCost)} ر.س</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>القيمة الحالية:</span><strong style={{ color: '#10b981' }}>{fmt(showDepModal.currentValue)} ر.س</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>إجمالي الإهلاك:</span><strong style={{ color: '#f59e0b' }}>{fmt(showDepModal.purchaseCost - showDepModal.currentValue)} ر.س</strong></div>
                            </div>
                            {showDepModal.depreciations.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا يوجد سجلات إهلاك بعد</div>
                            ) : (
                                <table className="table">
                                    <thead><tr><th>التاريخ</th><th>المبلغ</th></tr></thead>
                                    <tbody>
                                        {showDepModal.depreciations.map(d => (
                                            <tr key={d.id}>
                                                <td>{new Date(d.depreciationDate).toLocaleDateString('ar-SA')}</td>
                                                <td style={{ fontWeight: '600', color: '#ef4444' }}>-{fmt(d.amount)} ر.س</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowDepModal(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
