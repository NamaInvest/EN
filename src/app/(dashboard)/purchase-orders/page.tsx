'use client';
import { useState, useEffect } from 'react';

interface Order { id: number; orderNumber: string; orderDate: string; total: number; taxAmount: number; grandTotal: number; status: string; notes: string; items: { productId: number; quantity: number; unitPrice: number; receivedQty: number; total: number }[] }

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/purchase-orders'); if (r.ok) setOrders(await r.json()); } catch (e) { console.error(e); } setLoading(false); };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });
    const statusLabel: Record<string, string> = { draft: '📝 مسودة', sent: '📤 مرسل', received: '📦 مستلم', cancelled: '❌ ملغي' };
    const statusColor: Record<string, string> = { draft: '#f59e0b', sent: '#3b82f6', received: '#22c55e', cancelled: '#ef4444' };

    return (<><div className="page-header"><h1 className="page-title">📦 أوامر الشراء</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{orders.length} أمر</span><div className="toolbar-spacer" /></div>
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    orders.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">لا توجد أوامر شراء</div></div> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{orders.map(o => (
                            <div key={o.id} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{o.orderNumber}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.orderDate}</span>
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: (statusColor[o.status] || '#888') + '15', color: statusColor[o.status] || '#888' }}>{statusLabel[o.status] || o.status}</span>
                                    <div className="toolbar-spacer" />
                                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(o.grandTotal)} ر.س</span>
                                </div>
                                {expanded === o.id && o.items && <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}><th style={{ padding: '6px', textAlign: 'right' }}>#</th><th style={{ padding: '6px', textAlign: 'center' }}>الكمية</th><th style={{ padding: '6px', textAlign: 'center' }}>السعر</th><th style={{ padding: '6px', textAlign: 'center' }}>المجموع</th></tr></thead>
                                    <tbody>{o.items.map((item, i) => <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '6px' }}>{item.productId}</td><td style={{ padding: '6px', textAlign: 'center' }}>{item.quantity}</td><td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.unitPrice)}</td><td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.total)}</td></tr>)}</tbody>
                                </table>}
                            </div>
                        ))}</div>}
            </div>
        </div></>);
}
