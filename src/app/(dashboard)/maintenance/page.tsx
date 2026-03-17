'use client';
import { useState, useEffect } from 'react';

interface Item { id: number; date: string; customerName: string; phone: string; deviceType: string; problem: string; cost: number; status: string; notes: string }

export default function MaintenancePage() {
    const [items, setItems] = useState<Item[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ customerName: '', phone: '', deviceType: '', problem: '', cost: '', notes: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/maintenance'); if (r.ok) setItems(await r.json()); } catch (e) { console.error(e); } setLoading(false); };
    const handleSave = async () => { const r = await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { setShowAdd(false); setForm({ customerName: '', phone: '', deviceType: '', problem: '', cost: '', notes: '' }); load(); } };
    const updateStatus = async (id: number, status: string) => { await fetch('/api/maintenance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); load(); };

    const statusLabel: Record<string, string> = { pending: '⏳ بانتظار', in_progress: '🔧 جاري', completed: '✅ مكتمل', delivered: '📦 مسلّم' };
    const statusColor: Record<string, string> = { pending: '#f59e0b', in_progress: '#3b82f6', completed: '#22c55e', delivered: '#8b5cf6' };

    return (<><div className="page-header"><h1 className="page-title">🔧 الصيانة</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{items.length} طلب</span><div className="toolbar-spacer" /><button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ طلب صيانة</button></div>
            {showAdd && <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>🔧 طلب صيانة جديد</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>اسم العميل</label><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>الجوال</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>نوع الجهاز</label><input value={form.deviceType} onChange={e => setForm({ ...form, deviceType: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>التكلفة</label><input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                </div>
                <div style={{ marginTop: '8px' }}><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>المشكلة</label><input value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}><button className="btn btn-sm" onClick={() => setShowAdd(false)}>إلغاء</button><button className="btn btn-primary btn-sm" onClick={handleSave}>حفظ</button></div>
            </div>}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    items.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔧</div><div className="empty-state-text">لا توجد طلبات صيانة</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>العميل</th><th style={{ padding: '8px', textAlign: 'right' }}>الجهاز</th><th style={{ padding: '8px', textAlign: 'right' }}>المشكلة</th><th style={{ padding: '8px', textAlign: 'right' }}>التكلفة</th><th style={{ padding: '8px', textAlign: 'center' }}>الحالة</th><th style={{ padding: '8px' }}>إجراء</th></tr></thead>
                            <tbody>{items.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px' }}>{item.customerName}<br /><small style={{ color: 'var(--text-muted)' }}>{item.phone}</small></td>
                                    <td style={{ padding: '8px', fontSize: '13px' }}>{item.deviceType}</td>
                                    <td style={{ padding: '8px', fontSize: '13px' }}>{item.problem}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{item.cost.toFixed(2)}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: (statusColor[item.status] || '#888') + '15', color: statusColor[item.status] || '#888' }}>{statusLabel[item.status] || item.status}</span></td>
                                    <td style={{ padding: '8px' }}>
                                        {item.status === 'pending' && <button className="btn btn-sm" onClick={() => updateStatus(item.id, 'in_progress')} style={{ fontSize: '11px' }}>🔧 بدء</button>}
                                        {item.status === 'in_progress' && <button className="btn btn-sm" onClick={() => updateStatus(item.id, 'completed')} style={{ fontSize: '11px' }}>✅ إنجاز</button>}
                                        {item.status === 'completed' && <button className="btn btn-sm" onClick={() => updateStatus(item.id, 'delivered')} style={{ fontSize: '11px' }}>📦 تسليم</button>}
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
