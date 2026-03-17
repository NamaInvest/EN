'use client';
import { useState, useEffect } from 'react';

interface Promo { id: number; name: string; type: string; discountType: string; discountValue: number; startDate: string; endDate: string; isActive: boolean }

export default function PromotionsPage() {
    const [promos, setPromos] = useState<Promo[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'percentage', discountType: 'percentage', discountValue: '', startDate: '', endDate: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/promotions'); if (r.ok) setPromos(await r.json()); } catch (e) { console.error(e); } setLoading(false); };
    const handleSave = async () => { const r = await fetch('/api/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { setShowAdd(false); setForm({ name: '', type: 'percentage', discountType: 'percentage', discountValue: '', startDate: '', endDate: '' }); load(); } };
    const toggleActive = async (id: number, isActive: boolean) => { await fetch('/api/promotions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) }); load(); };

    const typeLabels: Record<string, string> = { percentage: '📊 نسبة مئوية', fixed: '💰 مبلغ ثابت', bogo: '🎁 اشتر واحصل', quantity: '📦 كمية', happy_hour: '⏰ ساعة سعيدة' };

    return (<><div className="page-header"><h1 className="page-title">🎯 العروض والترويج</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{promos.length} عرض</span><div className="toolbar-spacer" /><button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ عرض جديد</button></div>
            {showAdd && <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>🎯 عرض جديد</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>اسم العرض</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>النوع</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="percentage">نسبة مئوية</option><option value="fixed">مبلغ ثابت</option><option value="bogo">اشتر واحصل</option><option value="quantity">كمية</option><option value="happy_hour">ساعة سعيدة</option></select></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>قيمة الخصم</label><input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>تاريخ البداية</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>تاريخ النهاية</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}><button className="btn btn-sm" onClick={() => setShowAdd(false)}>إلغاء</button><button className="btn btn-primary btn-sm" onClick={handleSave}>حفظ</button></div>
            </div>}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    promos.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🎯</div><div className="empty-state-text">لا توجد عروض</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>العرض</th><th style={{ padding: '8px', textAlign: 'right' }}>النوع</th><th style={{ padding: '8px', textAlign: 'right' }}>القيمة</th><th style={{ padding: '8px', textAlign: 'right' }}>الفترة</th><th style={{ padding: '8px', textAlign: 'center' }}>الحالة</th></tr></thead>
                            <tbody>{promos.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px', fontWeight: '600' }}>{p.name}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{typeLabels[p.type] || p.type}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{p.discountValue}{p.discountType === 'percentage' ? '%' : ' ر.س'}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{p.startDate || '-'} → {p.endDate || '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}><button onClick={() => toggleActive(p.id, p.isActive)} className="btn btn-sm" style={{ fontSize: '11px', background: p.isActive ? '#22c55e15' : '#ef444415', color: p.isActive ? '#22c55e' : '#ef4444' }}>{p.isActive ? '✅ نشط' : '⏸️ متوقف'}</button></td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
