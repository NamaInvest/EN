'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { AlertTriangle, Clock } from 'lucide-react';

export default function ExpiryReportPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [batches, setBatches] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [days, setDays] = useState(30);

 useEffect(() => { loadData(); }, [days]);

 async function loadData() {
 setLoading(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch(`/api/batches/expiry?days=${days}`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.ok) setBatches(await res.json());
 } catch (e) { console.error(e); }
 setLoading(false);
 }

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">تقرير الصلاحيات (Expiry Report)</h1>
 </div>

 <div className="page-content animate-fade-in">
 <div className="card" style={{ marginBottom: '20px' }}>
 <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
 <Clock size={20} color="#f59e0b" />
 <strong>المنتجات التي ستنتهي صلاحيتها خلال: </strong>
 <select className="input" style={{ width: '150px' }} value={days} onChange={e => setDays(parseInt(e.target.value))}>
 <option value={7}>أسبوع (7 أيام)</option>
 <option value={30}>شهر (30 يوم)</option>
 <option value={90}>3 شهور (90 يوم)</option>
 <option value={180}>6 شهور (180 يوم)</option>
 </select>
 <button className="btn btn-outline" onClick={loadData}>تحديث</button>
 </div>
 </div>

 <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
 <table className="table" style={{ width: '100%' }}>
 <thead>
 <tr>
 <th>رمز المنتج</th>
 <th>اسم المنتج</th>
 <th>رقم الدفعة</th>
 <th>تاريخ الإنتاج</th>
 <th>تاريخ الانتهاء</th>
 <th>الكمية المتبقية</th>
 <th>الحالة</th>
 </tr>
 </thead>
 <tbody>
 {loading ? (
 <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr>
 ) : batches.length === 0 ? (
 <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#10b981' }}>لا توجد منتجات قاربت على الانتهاء ضمن هذه الفترة. ممتاز!</td></tr>
 ) : batches.map(b => {
 const exp = new Date(b.expiryDate);
 const now = new Date();
 const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
 const isExpired = daysLeft < 0;
 
 return (
 <tr key={b.id} style={{ backgroundColor: isExpired ? '#fee2e2' : daysLeft < 15 ? '#fef3c7' : 'transparent' }}>
 <td>{b.product?.barcode || '-'}</td>
 <td>{b.product?.name || 'مجهول'}</td>
 <td><strong>{b.batchNumber}</strong></td>
 <td>{b.productionDate ? new Date(b.productionDate).toLocaleDateString('ar-SA') : '-'}</td>
 <td style={{ color: isExpired ? '#ef4444' : 'inherit', fontWeight: isExpired ? 'bold' : 'normal' }}>
 {new Date(b.expiryDate).toLocaleDateString('ar-SA')}
 </td>
 <td>{b.currentQuantity}</td>
 <td>
 {isExpired ? (
 <span style={{ color: '#ef4444', fontWeight: 'bold' }}><AlertTriangle size={14} style={{display:'inline'}} /> منتهي الصلاحية ({Math.abs(daysLeft)} يوم)</span>
 ) : (
 <span style={{ color: '#d97706' }}>ينتهي بعد {daysLeft} يوم</span>
 )}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 </>
 );
}
