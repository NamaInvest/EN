'use client';
import { useState, useEffect } from 'react';

interface OrderDetail { 
    productId: number; 
    productName: string;
    quantity: number; 
    price: number; 
    taxValue: number;
    total: number;
}

interface Order { 
    id: number; 
    orderNo: number; 
    date: string; 
    total: number; 
    taxValue: number; 
    subtotal: number; 
    status: string; 
    notes: string; 
    supplier?: { id: number; name: string };
    user?: { fullName: string };
    details: OrderDetail[];
}

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    async function load() { 
        setLoading(true); 
        try { 
            const r = await fetch('/api/purchase-orders'); 
            if (r.ok) setOrders(await r.json()); 
        } catch (e) { console.error(e); } 
        setLoading(false); 
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Status can be pending, approved, rejected, completed
    const statusLabel: Record<string, string> = { 
        pending: '⏳ بانتظار الاعتماد', 
        approved: '✅ معتمد', 
        rejected: '❌ مرفوض', 
        completed: '📦 مكتمل' 
    };
    
    const statusColor: Record<string, string> = { 
        pending: '#f59e0b', 
        approved: '#3b82f6', 
        rejected: '#ef4444', 
        completed: '#22c55e' 
    };

    const updateStatus = async (id: number, newStatus: string) => {
        // We will implement the API put logic in the next step
        try {
            const res = await fetch(`/api/purchase-orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                load();
            } else {
                alert('فشل في تحديث الحالة');
            }
        } catch (e) {
            console.error(e);
            alert('حدث خطأ');
        }
    };

    return (<>
        <div className="page-header"><h1 className="page-title">📝 أوامر الشراء (طلبات)</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{orders.length} أمر شراء</span>
                <div className="toolbar-spacer" />
                <button className="primary-btn">➕ إنشاء أمر شراء جديد</button>
            </div>
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    orders.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-text">لا توجد أوامر شراء</div></div> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{orders.map(o => (
                            <div key={o.id} className="card" style={{ padding: '12px', cursor: 'pointer', borderLeft: `4px solid ${statusColor[o.status] || '#888'}` }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold' }}>#{o.orderNo}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>👤 {o.user?.fullName || 'غير معروف'}</span>
                                    {o.supplier && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🏭 {o.supplier.name}</span>}
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {new Date(o.date).toLocaleDateString()}</span>
                                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: (statusColor[o.status] || '#888') + '15', color: statusColor[o.status] || '#888', fontWeight: 'bold' }}>{statusLabel[o.status] || o.status}</span>
                                    <div className="toolbar-spacer" />
                                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{fmt(o.total)} ر.س</span>
                                </div>
                                {expanded === o.id && o.details && (
                                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--border)' }} onClick={(e) => e.stopPropagation()}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>المنتج</th>
                                                    <th style={{ padding: '8px', textAlign: 'center' }}>الكمية</th>
                                                    <th style={{ padding: '8px', textAlign: 'center' }}>السعر</th>
                                                    <th style={{ padding: '8px', textAlign: 'center' }}>الضريبة</th>
                                                    <th style={{ padding: '8px', textAlign: 'center' }}>المجموع</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {o.details.map((item, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '8px' }}>{item.productName || `منتج #${item.productId}`}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.price)}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.taxValue)}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        {/* Action Buttons for Approvals */}
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                                            {o.status === 'pending' && (
                                                <>
                                                    <button onClick={() => updateStatus(o.id, 'rejected')} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>❌ رفض الطلب</button>
                                                    <button onClick={() => updateStatus(o.id, 'approved')} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✅ اعتماد الطلب</button>
                                                </>
                                            )}
                                            {o.status === 'approved' && (
                                                <button onClick={() => updateStatus(o.id, 'completed')} className="primary-btn">📥 تحويل إلى فاتورة مشتريات</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}</div>}
            </div>
        </div>
    </>);
}
