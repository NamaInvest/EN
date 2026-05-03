'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Currency {
 id: number;
 code: string;
 nameAr: string;
 nameEn: string | null;
 symbol: string | null;
 exchangeRate: number;
 isDefault: boolean;
 isActive: boolean;
}

export default function CurrenciesPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const [currencies, setCurrencies] = useState<Currency[]>([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [form, setForm] = useState({ code: '', nameAr: '', nameEn: '', symbol: '', exchangeRate: 1.0, isDefault: false, isActive: true });
 const [editId, setEditId] = useState<number | null>(null);
 const [toast, setToast] = useState('');

 async function fetchData() {
 const token = localStorage.getItem('token');
 try {
 const res = await fetch('/api/settings/currencies', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) setCurrencies(await res.json());
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 finally { setLoading(false); }
 }

 useEffect(() => {
 fetchData();
 }, []);

 const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

 const handleSave = async () => {
 if (!form.code.trim() || !form.nameAr.trim() || !form.exchangeRate) { 
 showToast(t('sys.str_2530')); 
 return; 
 }
 
 const token = localStorage.getItem('token');
 try {
 if (editId) {
 const res = await fetch(`/api/settings/currencies/${editId}`, {
 method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify(form),
 });
 if (res.ok) { showToast(t('sys.str_2531')); setShowModal(false); fetchData(); }
 else { const d = await res.json(); showToast(`❌ ${d.error}`); }
 } else {
 const res = await fetch('/api/settings/currencies', {
 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify(form),
 });
 if (res.ok) { showToast(t('sys.str_2532')); setShowModal(false); fetchData(); }
 else { const d = await res.json(); showToast(`❌ ${d.error}`); }
 }
 } catch { showToast(t('sys.str_419')); }
 };

 const deleteCurrency = async (c: Currency) => {
 if (!confirm(`هل أنت متأكد من حذف العملة "${c.nameAr}"؟`)) return;
 const token = localStorage.getItem('token');
 try {
 const res = await fetch(`/api/settings/currencies/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { showToast(t('sys.str_488')); fetchData(); }
 else { const d = await res.json(); showToast(`❌ ${d.error}`); }
 } catch { showToast(t('sys.str_419')); }
 };

 const openEdit = (c: Currency) => {
 setEditId(c.id);
 setForm({ 
 code: c.code, 
 nameAr: c.nameAr, 
 nameEn: c.nameEn || '', 
 symbol: c.symbol || '', 
 exchangeRate: c.exchangeRate, 
 isDefault: c.isDefault, 
 isActive: c.isActive 
 });
 setShowModal(true);
 };

 const openAdd = () => {
 setEditId(null);
 setForm({ code: '', nameAr: '', nameEn: '', symbol: '', exchangeRate: 1.0, isDefault: false, isActive: true });
 setShowModal(true);
 };

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">{t('sys.str_2513')}</h1>
 <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_2514')}</button>
 </div>

 <div className="page-content animate-fade-in">
 <div className="table-container">
 <table className="table">
 <thead>
 <tr>
 <th>#</th>
 <th>{t('sys.str_2515')}</th>
 <th>{t('sys.str_2516')}</th>
 <th>{t('sys.str_2517')}</th>
 <th>{t('sys.str_2518')}</th>
 <th>{t('sys.str_2519')}</th>
 <th>{t('sys.str_2520')}</th>
 <th>{t('fin.str_227')}</th>
 <th>{t('sys.str_435')}</th>
 </tr>
 </thead>
 <tbody>
 {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
 : currencies.length === 0 ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-text">{t('sys.str_2521')}</div></div></td></tr>
 : currencies.map((c, i) => (
 <tr key={c.id}>
 <td>{i + 1}</td>
 <td><span className="badge badge-outline" dir="ltr">{c.code}</span></td>
 <td style={{ fontWeight: 'bold' }}>{c.nameAr}</td>
 <td dir="ltr">{c.nameEn || '-'}</td>
 <td>{c.symbol || '-'}</td>
 <td dir="ltr" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.exchangeRate}</td>
 <td>
 {c.isDefault ? <span className="badge badge-warning">{t('sys.str_2522')}</span> : '-'}
 </td>
 <td>
 <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
 {c.isActive ? t('sys.str_2510') : t('sys.str_654')}
 </span>
 </td>
 <td style={{ display: 'flex', gap: '4px' }}>
 <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} style={{ color: 'var(--primary)', fontSize: '13px' }}>✏️</button>
 {!c.isDefault && (
 <button className="btn btn-ghost btn-sm" onClick={() => deleteCurrency(c)} style={{ color: 'var(--danger)', fontSize: '13px' }}>🗑️</button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal */}
 {showModal && (
 <div className="modal-overlay" onClick={() => setShowModal(false)}>
 <div className="modal" onClick={e => e.stopPropagation()}>
 <div className="modal-header">
 <div className="modal-title">{editId ? t('sys.str_2533') : t('sys.str_2514')}</div>
 <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
 </div>
 
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
 <div className="input-group">
 <label className="input-label">{t('sys.str_2523')}</label>
 <input className="input" type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} dir="ltr" placeholder="SAR, USD, EUR" />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_2524')}</label>
 <input className="input" type="number" step="0.00001" value={form.exchangeRate} onChange={e => setForm({ ...form, exchangeRate: parseFloat(e.target.value) || 0 })} dir="ltr" />
 </div>
 </div>

 <div className="input-group" style={{ marginTop: '15px' }}>
 <label className="input-label">{t('sys.str_2525')}</label>
 <input className="input" type="text" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder={t('sys.str_117')} />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_2526')}</label>
 <input className="input" type="text" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} dir="ltr" placeholder="Saudi Riyal" />
 </div>
 
 <div className="input-group">
 <label className="input-label">{t('sys.str_2527')}</label>
 <input className="input" type="text" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} dir="ltr" placeholder={t('sys.str_2534')} />
 </div>

 <div style={{ display: 'flex', gap: '20px', marginTop: '20px', padding: '10px', background: 'var(--bg-lighter)', borderRadius: '8px' }}>
 <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
 <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
 <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>{t('sys.str_2528')}</label>
 </div>
 <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
 <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
 <label htmlFor="isDefault" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>{t('sys.str_2529')}</label>
 </div>
 </div>

 <div className="modal-footer" style={{ marginTop: '20px' }}>
 <button className="btn btn-primary" onClick={handleSave}>{t('sys.str_484')}</button>
 <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
 </div>
 </div>
 </div>
 )}

 {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
 </>
 );
}
