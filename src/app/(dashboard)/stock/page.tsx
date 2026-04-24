'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Product { id: number; name: string; currentStock: number; minQuantity: number; buyPrice: number; unit?: { name: string }; category?: { name: string }; productStocks?: { id: number; quantity: number; location: string; stock: { name: string } }[]; }
interface Movement { id: number; date: string; type: string; quantity: number; notes: string; product?: { name: string }; }

export default function StockPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
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

    const handleLocationUpdate = async (productStockId: number, location: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/product-stocks/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ productStockId, location })
            });
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    };

    return (
        <>
            <div className="page-header"><h1 className="page-title">{t('stock.str_1442')}</h1></div>
            <div className="page-content animate-fade-in">
                <div className="kpi-grid" style={{ marginBottom: '20px' }}>
                    <div className="kpi-card purple"><div className="kpi-icon">📦</div><div className="kpi-value">{products.length}</div><div className="kpi-label">{t('stock.str_1443')}</div></div>
                    <div className="kpi-card info"><div className="kpi-icon">💎</div><div className="kpi-value">{fmt(totalValue)} {t('sys.str_68')}</div><div className="kpi-label">{t('stock.str_1444')}</div></div>
                    <div className="kpi-card danger"><div className="kpi-icon">⚠️</div><div className="kpi-value">{products.filter(p => p.currentStock <= p.minQuantity).length}</div><div className="kpi-label">{t('stock.str_1445')}</div></div>
                </div>
                <div className="tabs">
                    <button className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>{t('stock.str_1446')}</button>
                    <button className={`tab ${tab === 'movements' ? 'active' : ''}`} onClick={() => setTab('movements')}>{t('stock.str_1447')}</button>
                </div>
                {tab === 'report' ? (
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>{t('sys.str_63')}</th><th>{t('sys.str_875')}</th><th>{t('sys.str_878')}</th><th>{t('sys.str_495')}</th><th>{t('sys.str_785')}</th><th>{t('sys.str_938')}</th><th>{t('fin.str_227')}</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>⏳</td></tr>
                                    : products.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: '600' }}>{p.name}</td>
                                            <td>{p.category?.name || '-'}</td>
                                            <td style={{ fontWeight: '700' }}>
                                                <div>{p.currentStock} {p.unit?.name || ''}</div>
                                                {p.productStocks && p.productStocks.length > 0 && (
                                                    <div style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '4px', background: 'var(--bg-card-hover)', padding: '6px', borderRadius: '4px' }}>
                                                        {p.productStocks.filter(ps => ps.quantity > 0).map((ps, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                    <span>{ps.stock?.name}</span>
                                                                    <input 
                                                                        type="text" 
                                                                        defaultValue={ps.location || ''} 
                                                                        placeholder={t('sys.str_3501')}
                                                                        onBlur={(e) => handleLocationUpdate(ps.id, e.target.value)}
                                                                        title={t('sys.str_3502')}
                                                                        style={{ fontSize: '10px', padding: '2px 4px', width: '70px', border: '1px solid #ccc', borderRadius: '3px' }}
                                                                    />
                                                                </div>
                                                                <span style={{ fontWeight: 'bold' }}>{ps.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{p.minQuantity}</td>
                                            <td>{fmt(p.buyPrice)}</td>
                                            <td>{fmt(p.currentStock * p.buyPrice)}</td>
                                            <td>{p.currentStock <= p.minQuantity ? <span className="badge badge-danger">{t('stock.str_1448')}</span> : <span className="badge badge-success">{t('stock.str_1449')}</span>}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>{t('fin.str_232')}</th><th>{t('sys.str_63')}</th><th>{t('fin.str_199')}</th><th>{t('sys.str_64')}</th><th>{t('sys.str_465')}</th></tr></thead>
                            <tbody>
                                {movements.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">{t('stock.str_1450')}</div></div></td></tr>
                                    : movements.map(m => (
                                        <tr key={m.id}>
                                            <td>{new Date(m.date).toLocaleDateString('en-GB')}</td>
                                            <td>{m.product?.name || '-'}</td>
                                            <td><span className={`badge ${m.type === 'in' ? 'badge-success' : 'badge-danger'}`}>{m.type === 'in' ? t('stock.str_1451') : m.type === 'out' ? t('stock.str_1452') : m.type}</span></td>
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
