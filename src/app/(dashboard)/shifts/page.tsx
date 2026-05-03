'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Shift {
 id: number;
 startTime: string;
 endTime: string | null;
 startingCash: number;
 endingCashActual: number | null;
 status: string;
 notes: string | null;
 user: { fullName: string };
 branch: { name: string } | null;
}

export default function ShiftsPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const [shifts, setShifts] = useState<Shift[]>([]);
 const [showModal, setShowModal] = useState(false);
 const [loading, setLoading] = useState(true);
 const [form, setForm] = useState({ startCash: '', notes: '' });
 const [toast, setToast] = useState('');
 const [closingShift, setClosingShift] = useState<Shift | null>(null);
 const [closeForm, setCloseForm] = useState({ endCash: '', notes: '' });

 async function fetchData() {
 const token = localStorage.getItem('token');
 try {
 const res = await fetch('/api/shifts', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) setShifts(await res.json());
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 finally { setLoading(false); }
 };

 useEffect(() => {
 fetchData();
 }, []);

 const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
 const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

 const handleOpenShift = async () => {
 const token = localStorage.getItem('token');
 const user = JSON.parse(localStorage.getItem('user') || '{}');
 try {
 const res = await fetch('/api/shifts', {
 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ userId: user.id, startCash: form.startCash, notes: form.notes }),
 });
 if (res.ok) {
 showToast(t('sys.str_1400'));
 setShowModal(false);
 setForm({ startCash: '', notes: '' });
 fetchData();
 } else {
 const d = await res.json();
 showToast(`❌ ${d.error || t('sys.str_1401')}`);
 }
 } catch {
 showToast(t('sys.str_1402'));
 }
 };

 const handleCloseShift = async () => {
 if (!closingShift) return;
 const token = localStorage.getItem('token');
 try {
 const res = await fetch('/api/shifts', {
 method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ id: closingShift.id, endCash: closeForm.endCash, notes: closeForm.notes, status: 'closed' }),
 });
 if (res.ok) {
 showToast(t('sys.str_1403'));
 setClosingShift(null);
 setCloseForm({ endCash: '', notes: '' });
 fetchData();
 } else {
 const d = await res.json();
 showToast(`❌ ${d.error || t('sys.str_1404')}`);
 }
 } catch {
 showToast(t('sys.str_1402'));
 }
 };

 const deleteShift = async (s: Shift) => {
 if (!confirm(t('sys.str_1405'))) return;
 const token = localStorage.getItem('token');
 try {
 const res = await fetch(`/api/shifts?id=${s.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { showToast(t('sys.str_1406')); fetchData(); }
 else showToast(t('sys.str_1407'));
 } catch { showToast(t('sys.str_592')); }
 }

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">{t('sys.str_1383')}</h1>
 <div className="page-actions">
 <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t('sys.str_1384')}</button>
 </div>
 </div>

 <div className="page-content animate-fade-in">
 <div className="table-container">
 <table className="table">
 <thead>
 <tr>
 <th>{t('sys.str_379')}</th>
 <th>{t('hr.str_556')}</th>
 <th>{t('sys.str_1385')}</th>
 <th>{t('sys.str_1386')}</th>
 <th>{t('sys.str_1387')}</th>
 <th>{t('sys.str_1388')}</th>
 <th>{t('fin.str_227')}</th>
 <th>{t('sys.str_435')}</th>
 </tr>
 </thead>
 <tbody>
 {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
 : shifts.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">🕒</div><div className="empty-state-text">{t('sys.str_1389')}</div></div></td></tr>
 : shifts.map(s => (
 <tr key={s.id}>
 <td style={{ fontWeight: 'bold' }}>{s.user?.fullName || t('sys.str_963')}</td>
 <td><span className="badge badge-outline">{s.branch?.name || t('sys.str_1408')}</span></td>
 <td style={{ direction: 'ltr', textAlign: 'right' }}>{new Date(s.startTime).toLocaleString('en-GB')}</td>
 <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--text-muted)' }}>{s.endTime ? new Date(s.endTime).toLocaleString('en-GB') : '-'}</td>
 <td style={{ color: 'var(--primary)' }}>{fmt(s.startingCash)} {t('sys.str_68')}</td>
 <td style={{ color: s.endingCashActual ? 'var(--success)' : 'var(--text-muted)' }}>{s.endingCashActual !== null ? `${fmt(s.endingCashActual)} ر.س` : '-'}</td>
 <td>
 <span className={`badge ${s.status === 'open' ? 'badge-warning' : 'badge-success'}`}>
 {s.status === 'open' ? t('sys.str_1409') : t('sys.str_1410')}
 </span>
 </td>
 <td style={{ display: 'flex', gap: '4px' }}>
 {s.status === 'open' && (
 <button className="btn btn-ghost btn-sm" onClick={() => { setClosingShift(s); setCloseForm({ endCash: String(s.startingCash), notes: s.notes || '' }) }} style={{ color: 'var(--danger)', fontSize: '13px', background: 'var(--danger-light)' }}>
 {t('sys.str_1390')}</button>
 )}
 <button className="btn btn-ghost btn-sm" onClick={() => deleteShift(s)} style={{ color: 'var(--danger)', fontSize: '12px' }}>🗑️</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal for Opening Shift */}
 {showModal && (
 <div className="modal-overlay" onClick={() => setShowModal(false)}>
 <div className="modal" onClick={e => e.stopPropagation()}>
 <div className="modal-header"><div className="modal-title">{t('sys.str_1391')}</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1392')}</label>
 <input className="input" type="text" inputMode="decimal" value={form.startCash} onChange={e => setForm({ ...form, startCash: e.target.value })} placeholder={t('sys.str_659')} dir="ltr" />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_955')}</label>
 <textarea className="input" value={form.notes} onInput={e => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })} rows={3} dir="rtl" />
 </div>
 <div className="modal-footer">
 <button className="btn btn-primary" onClick={handleOpenShift}>{t('sys.str_1393')}</button>
 <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
 </div>
 </div>
 </div>
 )}

 {/* Modal for Closing Shift */}
 {closingShift && (
 <div className="modal-overlay" onClick={() => setClosingShift(null)}>
 <div className="modal" onClick={e => e.stopPropagation()}>
 <div className="modal-header"><div className="modal-title">{t('sys.str_1394')}{closingShift.user?.fullName})</div><button className="modal-close" onClick={() => setClosingShift(null)}>✕</button></div>
 <div className="input-group" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
 <span>{t('sys.str_1395')}</span>
 <span style={{ fontWeight: 'bold' }}>{fmt(closingShift.startingCash)} {t('sys.str_68')}</span>
 </div>
 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
 {t('sys.str_1396')}</div>
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1397')}</label>
 <input className="input" type="text" inputMode="decimal" value={closeForm.endCash} onChange={e => setCloseForm({ ...closeForm, endCash: e.target.value })} placeholder={t('sys.str_1411')} dir="ltr" />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1398')}</label>
 <textarea className="input" value={closeForm.notes} onInput={e => setCloseForm({ ...closeForm, notes: (e.target as HTMLTextAreaElement).value })} rows={3} dir="rtl" placeholder={t('sys.str_1412')} />
 </div>
 <div className="modal-footer">
 <button className="btn btn-primary" onClick={handleCloseShift} style={{ background: 'var(--danger)', color: 'white', border: 'none' }}>{t('sys.str_1399')}</button>
 <button className="btn btn-ghost" onClick={() => setClosingShift(null)}>{t('fin.str_206')}</button>
 </div>
 </div>
 </div>
 )}

 {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
 </>
 );
}
