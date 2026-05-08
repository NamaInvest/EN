'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Product { id: number; name: string; currentStock: number; barcode: string }
interface StocktakeItem { productId: number; productName: string; systemQty: number; actualQty: number; difference: number; status: string }
interface Stocktake { id: number; stocktakeDate: string; totalItems: number; matched: number; over: number; short: number; status: string; items: StocktakeItem[] }

export default function StocktakePage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);
 const [products, setProducts] = useState<Product[]>([]);
 const [showNew, setShowNew] = useState(false);
 const [items, setItems] = useState<{ productId: number; actualQty: number }[]>([]);
 const [loading, setLoading] = useState(false);
 const [expandedId, setExpandedId] = useState<number | null>(null);

 useEffect(() => { loadStocktakes(); loadProducts(); }, []);

 async function loadStocktakes() {
 try { const r = await fetch('/api/stocktake'); if (r.ok) setStocktakes(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
 };

 async function loadProducts() {
 try { const r = await fetch('/api/products'); if (r.ok) setProducts(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
 };

 const startNewStocktake = () => {
 setItems(products.filter(p => p.currentStock > 0 || true).map(p => ({ productId: p.id, actualQty: p.currentStock })));
 setShowNew(true);
 };

 const handleSave = async (apply: boolean) => {
 setLoading(true);
 try {
 const res = await fetch('/api/stocktake', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ items, applyAdjustment: apply }),
 });
 if (res.ok) { setShowNew(false); loadStocktakes(); if (apply) loadProducts(); }
 else { const e = await res.json(); toastError(e.error || t('stock.str_2638')); }
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
 setLoading(false);
 };

 const getProduct = (id: number) => products.find(p => p.id === id);
 const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 0 });

 return (<><div className="page-header"><h1 className="page-title">{t('stock.str_1472')}</h1></div>
 <div className="page-content animate-fade-in">
 <div className="toolbar">
 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stocktakes.length} {t('stock.str_1473')}</span>
 <div className="toolbar-spacer" />
 <button className="btn btn-primary" onClick={startNewStocktake}>{t('stock.str_1474')}</button>
 </div>

 {showNew && (
 <div className="card" style={{ marginBottom: '16px' }}>
 <h3 style={{ marginBottom: '12px' }}>{t('stock.str_1475')}</h3>
 <div style={{ maxHeight: '400px', overflow: 'auto' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead><tr style={{ background: 'rgba(108,99,255,0.05)', position: 'sticky', top: 0 }}>
 <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_63')}</th>
 <th style={{ padding: '8px', textAlign: 'center' }}>{t('stock.str_1476')}</th>
 <th style={{ padding: '8px', textAlign: 'center' }}>{t('stock.str_1477')}</th>
 <th style={{ padding: '8px', textAlign: 'center' }}>{t('stock.str_1478')}</th>
 </tr></thead>
 <tbody>{items.map((item, i) => {
 const p = getProduct(item.productId);
 const diff = item.actualQty - (p?.currentStock || 0);
 return (
 <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: diff !== 0 ? (diff > 0 ? '#22c55e08' : '#ef444408') : 'transparent' }}>
 <td style={{ padding: '8px', fontSize: '13px' }}>{p?.name}</td>
 <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(p?.currentStock || 0)}</td>
 <td style={{ padding: '8px', textAlign: 'center' }}>
 <input type="number" value={item.actualQty} onChange={e => { const n = [...items]; n[i].actualQty = parseFloat(e.target.value) || 0; setItems(n); }}
 style={{ width: '80px', padding: '4px 8px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border)' }} />
 </td>
 <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold', color: diff === 0 ? 'var(--text-muted)' : diff > 0 ? '#22c55e' : '#ef4444' }}>
 {diff > 0 ? '+' : ''}{fmt(diff)}
 </td>
 </tr>
 );
 })}</tbody>
 </table>
 </div>
 <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
 <button className="btn btn-sm" onClick={() => setShowNew(false)}>{t('fin.str_206')}</button>
 <button className="btn btn-sm" onClick={() => handleSave(false)} disabled={loading}>{t('stock.str_1479')}</button>
 <button className="btn btn-primary btn-sm" onClick={() => handleSave(true)} disabled={loading}>{t('stock.str_1480')}</button>
 </div>
 </div>
 )}

 {stocktakes.length === 0 ? (
 <div className="card"><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">{t('stock.str_1481')}</div></div></div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
 {stocktakes.map(s => (
 <div key={s.id} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.stocktakeDate}</span>
 <span style={{ fontSize: '13px' }}>{s.totalItems} {t('sys.str_867')}</span>
 <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: '#22c55e20', color: '#22c55e' }}>✅ {s.matched} {t('stock.str_1482')}</span>
 {s.over > 0 && <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: '#3b82f620', color: '#3b82f6' }}>📈 {s.over} {t('stock.str_1483')}</span>}
 {s.short > 0 && <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: '#ef444420', color: '#ef4444' }}>📉 {s.short} {t('stock.str_1484')}</span>}
 <div className="toolbar-spacer" />
 <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: s.status === 'applied' ? '#22c55e15' : '#f59e0b15', color: s.status === 'applied' ? '#22c55e' : '#f59e0b' }}>{s.status === 'applied' ? t('stock.str_1487') : t('stock.str_1488')}</span>
 </div>
 {expandedId === s.id && s.items && (
 <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse' }}>
 <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}>
 <th style={{ padding: '6px', textAlign: 'right' }}>{t('sys.str_63')}</th>
 <th style={{ padding: '6px', textAlign: 'center' }}>{t('stock.str_1485')}</th>
 <th style={{ padding: '6px', textAlign: 'center' }}>{t('stock.str_1486')}</th>
 <th style={{ padding: '6px', textAlign: 'center' }}>{t('stock.str_1478')}</th>
 <th style={{ padding: '6px', textAlign: 'center' }}>{t('fin.str_227')}</th>
 </tr></thead>
 <tbody>{s.items.map((item, j) => (
 <tr key={j} style={{ borderBottom: '1px solid var(--border)' }}>
 <td style={{ padding: '6px', fontSize: '12px' }}>{getProduct(item.productId)?.name || `#${item.productId}`}</td>
 <td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.systemQty)}</td>
 <td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.actualQty)}</td>
 <td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace', color: item.difference === 0 ? 'var(--text-muted)' : item.difference > 0 ? '#22c55e' : '#ef4444' }}>
 {item.difference > 0 ? '+' : ''}{fmt(item.difference)}
 </td>
 <td style={{ padding: '6px', textAlign: 'center' }}>
 <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '8px', background: item.status === 'matched' ? '#22c55e15' : item.status === 'over' ? '#3b82f615' : '#ef444415', color: item.status === 'matched' ? '#22c55e' : item.status === 'over' ? '#3b82f6' : '#ef4444' }}>
 {item.status === 'matched' ? t('stock.str_1482') : item.status === 'over' ? t('stock.str_1483') : t('stock.str_1484')}
 </span>
 </td>
 </tr>
 ))}</tbody>
 </table>
 )}
 </div>
 ))}
 </div>
 )}
 </div></>);
}
