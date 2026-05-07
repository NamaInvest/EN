'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default async function BankStatementPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const params = useParams();
 const router = useRouter();
 const [bank, setBank] = useState<any>(null);
 const [transactions, setTransactions] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [saving, setSaving] = useState(false);

 const [form, setForm] = useState({
 type: 'deposit',
 amount: '',
 description: '',
 reference: '',
 linkedToTreasury: true
 });

 async function fetchData() {
 try {
 const token = localStorage.getItem('token');
 const [bankRes, txRes] = await Promise.all([
 fetch('/api/banks', { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`/api/banks/${(await params).id}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
 ]);

 if (bankRes.ok && txRes.ok) {
 const banks = await bankRes.json();
 const currentBank = banks.find((b: any) => b.id === parseInt((await params).id as string));
 if (currentBank) {
 setBank(currentBank);
 } else {
 router.push('/accounting/banks');
 }
 setTransactions(await txRes.json());
 }
 } catch (error: any) { toastError(error?.message || 'حدث خطأ'); } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, [(await params).id]);

 const handleSaveTransaction = async () => {
 if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
 alert(t('fin.str_2810'));
 return;
 }

 setSaving(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch(`/api/banks/${(await params).id}/transactions`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 type: form.type,
 amount: parseFloat(form.amount),
 description: form.description,
 reference: form.reference,
 linkedToTreasury: form.linkedToTreasury
 })
 });

 if (res.ok) {
 setShowModal(false);
 setForm({ type: 'deposit', amount: '', description: '', reference: '', linkedToTreasury: true });
 fetchData(); // Refresh statement and balance
 } else {
 const data = await res.json();
 alert(data.error || t('sys.str_961'));
 }
 } catch (error) {
 console.error(error);
 alert(t('sys.str_446'));
 } finally {
 setSaving(false);
 }
 };

 const fmtDate = (d: string) => {
 const date = new Date(d);
 return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
 };

 const fmt = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

 if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('sys.str_168')}</div>;
 if (!bank) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('fin.str_2791')}</div>;

 return (
 <div style={{ padding: '20px' }}>
 <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
 <Link href="/accounting/banks" className="btn btn-ghost" style={{ padding: '8px', fontSize: '20px' }}>
 ⬅️
 </Link>
 <div>
 <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{t('fin.str_2792')}{bank.bankName}</h1>
 <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>
 {bank.accountName} - {bank.accountNumber}
 </p>
 </div>
 </div>

 <div className="grid-3" style={{ marginBottom: '20px' }}>
 <div className="card" style={{ background: 'var(--primary-color)', color: '#fff' }}>
 <h3 style={{ fontSize: '14px', margin: '0 0 10px', opacity: 0.8 }}>{t('sys.str_674')}</h3>
 <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{fmt(bank.currentBalance)} {bank.currency}</div>
 </div>
 <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <div>
 <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--text-muted)' }}>{t('fin.str_2793')}</h3>
 <div style={{ fontSize: '16px', fontWeight: '500', direction: 'ltr', textAlign: 'right' }}>{bank.iban || '—'}</div>
 </div>
 </div>
 <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <div>
 <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--text-muted)' }}>{t('fin.str_2794')}</h3>
 <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t('fin.str_2795')}</button>
 </div>
 </div>
 </div>

 <div className="card">
 <h3 style={{ marginBottom: '15px' }}>{t('fin.str_2796')}</h3>
 <div className="table-container">
 <table className="table">
 <thead>
 <tr>
 <th>{t('fin.str_232')}</th>
 <th>{t('stock.str_2645')}</th>
 <th>{t('fin.str_212')}</th>
 <th>{t('sys.str_1492')}</th>
 <th>{t('fin.str_2797')}</th>
 <th>{t('fin.str_2798')}</th>
 <th>{t('fin.str_2799')}</th>
 </tr>
 </thead>
 <tbody>
 {transactions.length === 0 ? (
 <tr>
 <td colSpan={7}>
 <div className="empty-state">
 <div className="empty-state-icon">📝</div>
 <div className="empty-state-text">{t('fin.str_2800')}</div>
 </div>
 </td>
 </tr>
 ) : transactions.map(t => (
 <tr key={t.id}>
 <td style={{ fontSize: '12px' }}>{fmtDate(t.transactionDate)}</td>
 <td>
 <span className={`badge ${t.type === 'deposit' ? 'badge-success' : 'badge-danger'}`}>
 {t.type === 'deposit' ? t('sys.str_1490') : t('fin.str_2811')}
 </span>
 </td>
 <td>{t.description || '—'}</td>
 <td dir="ltr">{t.reference || '—'}</td>
 <td style={{ fontWeight: '700', color: '#10b981' }}>
 {t.type === 'deposit' ? `+${fmt(t.amount)}` : '—'}
 </td>
 <td style={{ fontWeight: '700', color: '#ef4444' }}>
 {t.type !== 'deposit' ? `-${fmt(t.amount)}` : '—'}
 </td>
 <td>
 {t.isReconciled ? <span style={{ color: '#10b981' }}>{t('fin.str_2801')}</span> : <span style={{ color: '#f59e0b' }}>{t('fin.str_2802')}</span>}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {showModal && (
 <div className="modal-overlay" onClick={() => setShowModal(false)}>
 <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
 <div className="modal-header">
 <h3>{t('fin.str_2803')}</h3>
 <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
 </div>
 <div className="modal-body">
 <div className="input-group">
 <label className="input-label">{t('stock.str_2645')}</label>
 <div style={{ display: 'flex', gap: '10px' }}>
 <button 
 className={`btn ${form.type === 'deposit' ? 'btn-success' : 'btn-ghost'}`} 
 style={{ flex: 1 }}
 onClick={() => setForm({ ...form, type: 'deposit' })}>
 {t('fin.str_2804')}</button>
 <button 
 className={`btn ${form.type === 'withdrawal' ? 'btn-danger' : 'btn-ghost'}`} 
 style={{ flex: 1 }}
 onClick={() => setForm({ ...form, type: 'withdrawal' })}>
 {t('fin.str_2805')}</button>
 </div>
 </div>
 
 <div className="input-group">
 <label className="input-label">{t('fin.str_2806')}{bank.currency}) *</label>
 <input className="input" type="number" dir="ltr" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
 </div>

 <div className="input-group">
 <label className="input-label">{t('fin.str_2807')}</label>
 <textarea className="input" placeholder={t('fin.str_2812')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ height: '80px', resize: 'vertical' }} />
 </div>

 <div className="input-group">
 <label className="input-label">{t('fin.str_2808')}</label>
 <input className="input" dir="ltr" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
 </div>

 <div className="input-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '20px', padding: '15px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
 <input type="checkbox" id="linkedToTreasury" checked={form.linkedToTreasury} onChange={e => setForm({ ...form, linkedToTreasury: e.target.checked })} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
 <div>
 <label htmlFor="linkedToTreasury" style={{ fontWeight: '600', cursor: 'pointer', display: 'block', marginBottom: '4px' }}>{t('fin.str_2809')}</label>
 <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
 {form.type === 'deposit' ? t('fin.str_2813') : t('fin.str_2814')}
 </p>
 </div>
 </div>
 </div>
 <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
 <button className="btn btn-primary" onClick={handleSaveTransaction} disabled={saving}>
 {saving ? t('sys.str_454') : t('fin.str_2815')}
 </button>
 <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
