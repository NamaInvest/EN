'use client';
import { useState, useEffect } from 'react';

interface Payment { id: number; dueDate: string; amount: number; paid: boolean; paidDate: string }
interface Installment { id: number; totalAmount: number; paidAmount: number; remaining: number; installmentCount: number; status: string; customer: { name: string }; payments: Payment[] }

export default function InstallmentsPage() {
    const [list, setList] = useState<Installment[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/installments'); if (r.ok) setList(await r.json()); } catch (e) { console.error(e); } setLoading(false); };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    return (<><div className="page-header"><h1 className="page-title">💳 الأقساط</h1></div>
        <div className="page-content animate-fade-in">
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    list.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-text">لا توجد أقساط<br /><small>تنشأ الأقساط تلقائياً من فواتير البيع الآجل</small></div></div> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {list.map(inst => (
                                <div key={inst.id} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === inst.id ? null : inst.id)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '600' }}>{inst.customer?.name}</span>
                                        <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmt(inst.totalAmount)} ر.س</span>
                                        <span style={{ fontSize: '12px', color: '#22c55e' }}>مسدد: {fmt(inst.paidAmount)}</span>
                                        <span style={{ fontSize: '12px', color: '#ef4444' }}>متبقي: {fmt(inst.remaining)}</span>
                                        <div className="toolbar-spacer" />
                                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: inst.status === 'active' ? '#3b82f615' : '#22c55e15', color: inst.status === 'active' ? '#3b82f6' : '#22c55e' }}>{inst.status === 'active' ? '🔄 نشط' : '✅ مكتمل'}</span>
                                    </div>
                                    {expanded === inst.id && inst.payments && (
                                        <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse' }}>
                                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}><th style={{ padding: '6px', textAlign: 'right' }}>#</th><th style={{ padding: '6px', textAlign: 'right' }}>تاريخ الاستحقاق</th><th style={{ padding: '6px', textAlign: 'right' }}>المبلغ</th><th style={{ padding: '6px', textAlign: 'center' }}>الحالة</th></tr></thead>
                                            <tbody>{inst.payments.map((p, i) => (
                                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '6px', fontSize: '12px' }}>{i + 1}</td>
                                                    <td style={{ padding: '6px', fontSize: '12px' }}>{p.dueDate}</td>
                                                    <td style={{ padding: '6px', fontFamily: 'monospace' }}>{fmt(p.amount)}</td>
                                                    <td style={{ padding: '6px', textAlign: 'center' }}><span style={{ fontSize: '11px', color: p.paid ? '#22c55e' : '#f59e0b' }}>{p.paid ? '✅ مسدد' : '⏳ قيد الانتظار'}</span></td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    )}
                                </div>
                            ))}
                        </div>}
            </div>
        </div></>);
}
