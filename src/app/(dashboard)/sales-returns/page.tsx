'use client';
import { useState, useEffect } from 'react';

interface Return { id: number; returnNo: number; date: string; subtotal: number; taxValue: number; total: number; notes: string }

export default function SalesReturnsPage() {
    const [returns, setReturns] = useState<Return[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ subtotal: '', notes: '', originalInvoiceId: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/sales-returns'); if (r.ok) setReturns(await r.json()); } catch (e) { console.error(e); } setLoading(false); };
    const handleSave = async () => { const r = await fetch('/api/sales-returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { setShowAdd(false); setForm({ subtotal: '', notes: '', originalInvoiceId: '' }); load(); } };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });
    const subtotal = parseFloat(form.subtotal) || 0;
    const tax = subtotal * 0.15;

    return (<><div className="page-header"><h1 className="page-title">🔄 مرتجعات المبيعات</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{returns.length} مرتجع</span><div className="toolbar-spacer" /><button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ مرتجع جديد</button></div>
            {showAdd && <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>🔄 مرتجع مبيعات</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>رقم الفاتورة الأصلية</label><input value={form.originalInvoiceId} onChange={e => setForm({ ...form, originalInvoiceId: e.target.value })} style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>المبلغ (قبل الضريبة)</label><input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} style={{ width: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ضريبة: {fmt(tax)} | الإجمالي: <strong>{fmt(subtotal + tax)}</strong></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ملاحظات</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '200px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>حفظ</button><button className="btn btn-sm" onClick={() => setShowAdd(false)}>إلغاء</button>
                </div>
            </div>}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    returns.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔄</div><div className="empty-state-text">لا توجد مرتجعات مبيعات</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>#</th><th style={{ padding: '8px', textAlign: 'right' }}>التاريخ</th><th style={{ padding: '8px', textAlign: 'right' }}>المبلغ</th><th style={{ padding: '8px', textAlign: 'right' }}>الضريبة</th><th style={{ padding: '8px', textAlign: 'right' }}>الإجمالي</th><th style={{ padding: '8px', textAlign: 'right' }}>ملاحظات</th></tr></thead>
                            <tbody>{returns.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{r.returnNo}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{new Date(r.date).toLocaleDateString('ar-SA')}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.subtotal)}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{fmt(r.taxValue)}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: '#ef4444' }}>{fmt(r.total)}</td>
                                    <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.notes || '-'}</td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
