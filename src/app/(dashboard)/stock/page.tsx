'use client';
import { useState, useEffect } from 'react';

interface Product { id: number; name: string; currentStock: number; minQuantity: number; buyPrice: number; unit?: { name: string }; category?: { name: string }; productStocks?: { quantity: number; stock: { name: string } }[]; }
interface Movement { id: number; date: string; type: string; quantity: number; notes: string; product?: { name: string }; }

export default function StockPage() {
    const [tab, setTab] = useState<'report' | 'movements'>('report');
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        Promise.all([
            fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/stock-movements', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        ]).then(([p, m]) => { setProducts(p); setMovements(m); }).finally(() => setLoading(false));
    }, []);

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    const totalValue = products.reduce((s, p) => s + p.currentStock * p.buyPrice, 0);

    return (
        <>
            <div className="page-header"><h1 className="page-title">🏭 المخزون</h1></div>
            <div className="page-content animate-fade-in">
                <div className="kpi-grid" style={{ marginBottom: '20px' }}>
                    <div className="kpi-card purple"><div className="kpi-icon">📦</div><div className="kpi-value">{products.length}</div><div className="kpi-label">عدد الأصناف</div></div>
                    <div className="kpi-card info"><div className="kpi-icon">💎</div><div className="kpi-value">{fmt(totalValue)} ر.س</div><div className="kpi-label">قيمة المخزون</div></div>
                    <div className="kpi-card danger"><div className="kpi-icon">⚠️</div><div className="kpi-value">{products.filter(p => p.currentStock <= p.minQuantity).length}</div><div className="kpi-label">أصناف تحت الحد</div></div>
                </div>
                <div className="tabs">
                    <button className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>📊 تقرير المخزون</button>
                    <button className={`tab ${tab === 'movements' ? 'active' : ''}`} onClick={() => setTab('movements')}>📋 حركات المخزون</button>
                </div>
                {tab === 'report' ? (
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>المنتج</th><th>التصنيف</th><th>المخزون</th><th>الحد الأدنى</th><th>سعر الشراء</th><th>القيمة</th><th>الحالة</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>⏳</td></tr>
                                    : products.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: '600' }}>{p.name}</td>
                                            <td>{p.category?.name || '-'}</td>
                                            <td style={{ fontWeight: '700' }}>
                                                <div>{p.currentStock} {p.unit?.name || ''}</div>
                                                {p.productStocks && p.productStocks.length > 0 && (
                                                    <div style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '4px', background: 'var(--bg-card-hover)', padding: '4px', borderRadius: '4px' }}>
                                                        {p.productStocks.filter(ps => ps.quantity > 0).map((ps, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                                <span>{ps.stock?.name}:</span>
                                                                <span style={{ fontWeight: 'bold' }}>{ps.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{p.minQuantity}</td>
                                            <td>{fmt(p.buyPrice)}</td>
                                            <td>{fmt(p.currentStock * p.buyPrice)}</td>
                                            <td>{p.currentStock <= p.minQuantity ? <span className="badge badge-danger">🔴 منخفض</span> : <span className="badge badge-success">✅ طبيعي</span>}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>التاريخ</th><th>المنتج</th><th>النوع</th><th>الكمية</th><th>ملاحظات</th></tr></thead>
                            <tbody>
                                {movements.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">لا توجد حركات</div></div></td></tr>
                                    : movements.map(m => (
                                        <tr key={m.id}>
                                            <td>{new Date(m.date).toLocaleDateString('ar-SA')}</td>
                                            <td>{m.product?.name || '-'}</td>
                                            <td><span className={`badge ${m.type === 'in' ? 'badge-success' : 'badge-danger'}`}>{m.type === 'in' ? '📥 وارد' : m.type === 'out' ? '📤 صادر' : m.type}</span></td>
                                            <td style={{ fontWeight: '600' }}>{m.quantity}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{m.notes || '-'}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
