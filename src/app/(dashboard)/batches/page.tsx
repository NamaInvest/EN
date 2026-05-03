'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Product { id: number; name: string; barcode: string | null; }
interface ProductBatch { id: number; productId: number; batchNumber: string; productionDate: string | null; expiryDate: string | null; initialQuantity: number; currentQuantity: number; unitCost: number; createdAt: string; product: Product; }

export default function BatchesPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const [batches, setBatches] = useState<ProductBatch[]>([]);
 const [products, setProducts] = useState<Product[]>([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [saving, setSaving] = useState(false);
 const [editItem, setEditItem] = useState<ProductBatch | null>(null);

 const [form, setForm] = useState({ productId: '', batchNumber: '', productionDate: '', expiryDate: '', initialQuantity: '', unitCost: '' });

 const token = () => localStorage.getItem('token') || '';
 const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

 async function fetchData() {
 try {
 const [bRes, pRes] = await Promise.all([
 fetch('/api/batches', { headers: headers() }),
 fetch('/api/products', { headers: headers() })
 ]);
 if (bRes.ok) setBatches(await bRes.json());
 if (pRes.ok) {
 const pData = await pRes.json();
 setProducts(Array.isArray(pData) ? pData : pData.products || []);
 }
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
 finally { setLoading(false); }
 };

 useEffect(() => { fetchData(); }, []);

 const openAdd = () => {
 setEditItem(null);
 setForm({ productId: '', batchNumber: '', productionDate: '', expiryDate: '', initialQuantity: '', unitCost: '' });
 setShowModal(true);
 };

 const openEdit = (b: ProductBatch) => {
 setEditItem(b);
 setForm({
 productId: b.productId.toString(),
 batchNumber: b.batchNumber, // Cannot edit
 productionDate: b.productionDate ? new Date(b.productionDate).toISOString().split('T')[0] : '',
 expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : '',
 initialQuantity: b.initialQuantity.toString(), // Cannot edit
 unitCost: b.unitCost.toString()
 });
 setShowModal(true);
 };

 const handleSave = async () => {
 if (!editItem && (!form.productId || !form.batchNumber || !form.initialQuantity)) { 
 alert(t('sys.str_445')); return; 
 }
 setSaving(true);
 try {
 const url = editItem ? `/api/batches/${editItem.id}` : '/api/batches';
 const method = editItem ? 'PUT' : 'POST';
 const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
 if (res.ok) { setShowModal(false); fetchData(); } else { const d = await res.json(); alert(d.error); }
 } catch { alert(t('sys.str_446')); } finally { setSaving(false); }
 };

 const handleDelete = async (id: number) => {
 if (!confirm(t('sys.str_447'))) return;
 const res = await fetch(`/api/batches/${id}`, { method: 'DELETE', headers: headers() });
 if (res.ok) fetchData(); else { const d = await res.json(); alert(d.error); }
 };

 const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
 // Check expiry logic mapping
 const getExpiryStatus = (expiryDate: string | null) => {
 if (!expiryDate) return { label: t('sys.str_179'), cls: 'badge-ghost', color: 'inherit' };
 const now = new Date();
 const exp = new Date(expiryDate);
 const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
 
 if (diffDays <= 0) return { label: t('sys.str_448'), cls: 'badge-error', color: '#ef4444' };
 if (diffDays <= 30) return { label: `ينتهي قريباً (${diffDays} يوم)`, cls: 'badge-warning', color: '#f59e0b' };
 return { label: `صالح (${diffDays} يوم)`, cls: 'badge-success', color: '#10b981' };
 };

 return (
 <div style={{ padding: '20px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
 <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{t('sys.str_426')}</h1>
 <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_427')}</button>
 </div>

 {/* Warnings section for things expiring in <= 30 days */}
 {batches.filter(b => b.currentQuantity > 0 && b.expiryDate && Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / 86400000) <= 30).length > 0 && (
 <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
 <h3 style={{ color: '#ef4444', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '15px' }}>{t('sys.str_428')}</h3>
 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
 {batches.filter(b => b.currentQuantity > 0 && b.expiryDate && Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / 86400000) <= 30).map(b => (
 <span key={b.id} className="badge badge-error badge-outline">{b.product?.name} {t('sys.str_429')}{b.currentQuantity})</span>
 ))}
 </div>
 </div>
 )}

 <div className="card">
 <div className="table-container">
 <table className="table">
 <thead><tr><th>{t('sys.str_63')}</th><th>{t('sys.str_430')}</th><th>{t('sys.str_431')}</th><th>{t('sys.str_432')}</th><th>{t('sys.str_433')}</th><th>{t('sys.str_434')}</th><th>{t('fin.str_227')}</th><th>{t('sys.str_435')}</th></tr></thead>
 <tbody>
 {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
 : batches.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">{t('sys.str_436')}</div></div></td></tr>
 : batches.map(b => {
 const status = getExpiryStatus(b.expiryDate);
 return (
 <tr key={b.id} style={{ opacity: b.currentQuantity <= 0 ? 0.6 : 1 }}>
 <td style={{ fontWeight: '600' }}>{b.product?.name} <br/><small style={{ color: 'var(--text-muted)' }}>{b.product?.barcode}</small></td>
 <td style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{b.batchNumber}</td>
 <td style={{ color: 'var(--text-secondary)' }}>{b.productionDate ? new Date(b.productionDate).toLocaleDateString('en-GB') : '-'}</td>
 <td style={{ color: status.color, fontWeight: 'bold' }}>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-GB') : '-'}</td>
 <td>
 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
 <strong style={{ color: b.currentQuantity > 0 ? 'var(--primary-color)' : '#ef4444' }}>{b.currentQuantity}</strong> 
 <span style={{ color: 'var(--text-muted)' }}>/ {b.initialQuantity}</span>
 </div>
 </td>
 <td>{fmt(b.unitCost)}</td>
 <td><span className={`badge ${b.currentQuantity <= 0 ? 'badge-ghost' : status.cls}`}>{b.currentQuantity <= 0 ? t('sys.str_449') : status.label}</span></td>
 <td>
 <div style={{ display: 'flex', gap: '4px' }}>
 <button className="btn btn-sm btn-ghost" onClick={() => openEdit(b)}>✏️</button>
 <button className="btn btn-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none' }} onClick={() => handleDelete(b.id)}>🗑️</button>
 </div>
 </td>
 </tr>
 )})}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal */}
 {showModal && (
 <div className="modal-overlay" onClick={() => setShowModal(false)}>
 <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
 <div className="modal-header">
 <h3>{editItem ? t('sys.str_450') : t('sys.str_451')}</h3>
 <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
 </div>
 <div className="modal-body">
 {!editItem && (
 <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
 {t('sys.str_437')}</div>
 )}

 <div className="grid-2">
 <div className="input-group">
 <label className="input-label">{t('sys.str_438')}</label>
 <select className="input" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} disabled={!!editItem}>
 <option value="">{t('sys.str_439')}</option>
 {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.barcode ? `(${p.barcode})` : ''}</option>)}
 </select>
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_440')}</label>
 <input className="input" style={{ textTransform: 'uppercase' }} value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} disabled={!!editItem} placeholder={t('sys.str_452')} />
 </div>
 </div>
 
 {!editItem && (
 <div className="input-group">
 <label className="input-label">{t('sys.str_441')}</label>
 <input className="input" type="number" step="0.01" value={form.initialQuantity} onChange={e => setForm({ ...form, initialQuantity: e.target.value })} placeholder={t('sys.str_453')} />
 </div>
 )}

 <div className="grid-2">
 <div className="input-group">
 <label className="input-label">{t('sys.str_442')}</label>
 <input className="input" type="date" value={form.productionDate} onChange={e => setForm({ ...form, productionDate: e.target.value })} />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_443')}</label>
 <input className="input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
 </div>
 </div>

 <div className="input-group">
 <label className="input-label">{t('sys.str_444')}</label>
 <input className="input" type="number" step="0.01" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} />
 </div>
 </div>
 <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
 <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('sys.str_454') : t('sys.str_455')}</button>
 <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
