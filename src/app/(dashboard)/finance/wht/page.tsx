'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function WithholdingTaxPage() {
 const { t } = useTranslation();
 const { success, error } = useToast();
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 const [selectedTxs, setSelectedTxs] = useState<number[]>([]);
 const [certNo, setCertNo] = useState('');

 useEffect(() => { loadData(); }, []);

 async function loadData() {
 setLoading(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/wht', {
 headers: { Authorization: `Bearer ${token}` }
 });
 const d = await res.json();
 if (res.ok) setData(d);
 else error(d.error || 'فشل في الجلب');
 } catch (e) { console.error(e); }
 setLoading(false);
 }

 const toggleSelection = (id: number) => {
 if (selectedTxs.includes(id)) {
 setSelectedTxs(selectedTxs.filter(x => x !== id));
 } else {
 setSelectedTxs([...selectedTxs, id]);
 }
 };

 const markAsPaid = async () => {
 if (selectedTxs.length === 0) return error('اختر حركة واحدة على الأقل');
 
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/wht', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 action: 'mark_paid',
 transactionIds: selectedTxs,
 certificateNumber: certNo || undefined
 })
 });
 const result = await res.json();
 if (res.ok) {
 success('تم تسجيل السداد وإصدار الشهادات بنجاح');
 setSelectedTxs([]);
 setCertNo('');
 loadData();
 } else {
 error(result.error || 'فشل في السداد');
 }
 } catch (e) { console.error(e); }
 };

 if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;
 if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>فشل في جلب البيانات</div>;

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">إدارة ضريبة الاستقطاع (Withholding Tax - WHT)</h1>
 </div>

 <div className="page-content animate-fade-in">
 {/* Summary Cards */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
 <div style={{ color: '#6b7280', marginBottom: '5px' }}>مبالغ الاستقطاع المعلقة (ZATCA Payable)</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>
 {data.totalAmount.toLocaleString()} ر.س
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
 <div style={{ color: '#6b7280', marginBottom: '5px' }}>عدد الفواتير الخاضعة</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>
 {data.pendingCount} فاتورة
 </div>
 </div>
 </div>

 <div className="card" style={{ padding: '20px', marginBottom: '30px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
 <h2 style={{ fontSize: '18px', margin: 0 }}>الفواتير المعلقة بانتظار السداد للزكاة والدخل</h2>
 <div style={{ display: 'flex', gap: '10px' }}>
 <input 
 type="text" 
 className="input" 
 placeholder="رقم الشهادة (اختياري)" 
 value={certNo} 
 onChange={e => setCertNo(e.target.value)}
 style={{ margin: 0 }}
 />
 <button className="btn btn-primary" onClick={markAsPaid} disabled={selectedTxs.length === 0}>
 <CheckCircle size={16} style={{display:'inline', marginRight:'5px'}}/> سداد للمحدد ({selectedTxs.length})
 </button>
 </div>
 </div>

 {data.transactions.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>لا توجد مبالغ استقطاع معلقة.</div>
 ) : (
 <div style={{ overflowX: 'auto' }}>
 <table className="table" style={{ width: '100%' }}>
 <thead>
 <tr>
 <th style={{ width: '40px' }}>
 <input 
 type="checkbox" 
 onChange={e => {
 if (e.target.checked) setSelectedTxs(data.transactions.map((t:any) => t.id));
 else setSelectedTxs([]);
 }}
 checked={selectedTxs.length === data.transactions.length && data.transactions.length > 0}
 />
 </th>
 <th>المورد</th>
 <th>رقم الفاتورة</th>
 <th>نوع الخدمة</th>
 <th>المبلغ الأساسي</th>
 <th>نسبة الاستقطاع</th>
 <th>مبلغ الاستقطاع</th>
 </tr>
 </thead>
 <tbody>
 {data.transactions.map((t: any) => (
 <tr key={t.id}>
 <td>
 <input 
 type="checkbox" 
 checked={selectedTxs.includes(t.id)} 
 onChange={() => toggleSelection(t.id)}
 />
 </td>
 <td>{t.vendor.name} <br/><small style={{color:'#6b7280'}}>{t.vendor.taxNumber}</small></td>
 <td>{t.invoice?.invoiceNo}</td>
 <td>{t.rule.serviceType}</td>
 <td>{t.baseAmount.toLocaleString()}</td>
 <td>{t.whtRate}%</td>
 <td style={{ fontWeight: 'bold', color: '#ef4444' }}>{t.whtAmount.toLocaleString()}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 </>
 );
}
