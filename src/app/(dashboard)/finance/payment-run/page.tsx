'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Play, CheckCircle, Clock, AlertTriangle, Banknote, FileText, Filter } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface PaymentRunItem {
 id: number;
 supplierId: number;
 supplierName: string;
 invoiceNumber: string;
 invoiceAmount: number;
 dueDate: string;
 daysOverdue: number;
 selected: boolean;
}

export default function PaymentRunPage() {
 const { t } = useTranslation();
 const { success, error } = useToast();
 const [proposals, setProposals] = useState<PaymentRunItem[]>([]);
 const [runs, setRuns] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [executing, setExecuting] = useState(false);
 const [proposing, setProposing] = useState(false);
 const [filterDays, setFilterDays] = useState(30);
 const [activeTab, setActiveTab] = useState<'propose' | 'history'>('propose');

 useEffect(() => { loadRuns(); }, []);

 async function loadRuns() {
 setLoading(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/payment-run', {
 headers: { Authorization: `Bearer ${token}` }
 });
 const d = await res.json();
 if (res.ok) setRuns(d.runs || []);
 } catch (e) { console.error(e); }
 setLoading(false);
 }

 async function runProposal() {
 setProposing(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/payment-run', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ action: 'propose', dueDays: filterDays })
 });
 const d = await res.json();
 if (res.ok) {
 setProposals((d.proposals || []).map((p: any) => ({ ...p, selected: true })));
 success('تم توليد مقترح الدفع بنجاح');
 } else {
 error(d.error || 'فشل في التوليد');
 }
 } catch (e) { console.error(e); }
 setProposing(false);
 }

 async function executePayments() {
 const selectedIds = proposals.filter(p => p.selected).map(p => p.id);
 if (selectedIds.length === 0) { error('اختر فاتورة واحدة على الأقل'); return; }
 setExecuting(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/payment-run', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ action: 'execute', lineIds: selectedIds })
 });
 const d = await res.json();
 if (res.ok) {
 success(`تم تنفيذ الدفعة لعدد ${selectedIds.length} فاتورة`);
 setProposals([]);
 loadRuns();
 } else {
 error(d.error || 'فشل في التنفيذ');
 }
 } catch (e) { console.error(e); }
 setExecuting(false);
 }

 const toggleAll = (checked: boolean) => {
 setProposals(proposals.map(p => ({ ...p, selected: checked })));
 };

 const toggleOne = (id: number) => {
 setProposals(proposals.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
 };

 const totalSelected = proposals.filter(p => p.selected).reduce((sum, p) => sum + p.invoiceAmount, 0);

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">تشغيل الدفعات المجمعة (Payment Run - SAP F110)</h1>
 </div>

 <div className="page-content animate-fade-in">
 {/* Tabs */}
 <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
 <button
 className={`btn ${activeTab === 'propose' ? 'btn-primary' : 'btn-outline'}`}
 onClick={() => setActiveTab('propose')}
 >
 <Play size={16} style={{ marginLeft: '5px' }} /> اقتراح دفعات جديدة
 </button>
 <button
 className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
 onClick={() => setActiveTab('history')}
 >
 <FileText size={16} style={{ marginLeft: '5px' }} /> سجل العمليات السابقة
 </button>
 </div>

 {activeTab === 'propose' && (
 <>
 {/* Control Bar */}
 <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <Filter size={16} />
 <label>الاستحقاق خلال</label>
 <select
 value={filterDays}
 onChange={e => setFilterDays(parseInt(e.target.value))}
 className="form-select"
 style={{ width: '120px' }}
 >
 <option value={7}>7 أيام</option>
 <option value={14}>14 يوم</option>
 <option value={30}>30 يوم</option>
 <option value={60}>60 يوم</option>
 <option value={90}>90 يوم</option>
 </select>
 </div>
 <button className="btn btn-primary" onClick={runProposal} disabled={proposing}>
 {proposing ? 'جاري التحليل...' : 'توليد مقترح الدفع (Propose)'}
 </button>
 </div>
 </div>

 {/* Summary Cards */}
 {proposals.length > 0 && (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
 <div style={{ color: '#6b7280', marginBottom: '5px' }}>إجمالي الفواتير المقترحة</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{proposals.length}</div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
 <div style={{ color: '#6b7280', marginBottom: '5px' }}>المحدد للدفع</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
 {totalSelected.toLocaleString()} ر.س
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
 <div style={{ color: '#6b7280', marginBottom: '5px' }}>عدد الموردين</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
 {new Set(proposals.map(p => p.supplierId)).size}
 </div>
 </div>
 </div>
 )}

 {/* Proposals Table */}
 {proposals.length > 0 && (
 <div className="card" style={{ padding: '20px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
 <h2 style={{ fontSize: '18px', margin: 0 }}>مقترح الدفع</h2>
 <button className="btn btn-primary" onClick={executePayments} disabled={executing || proposals.filter(p => p.selected).length === 0}>
 <Banknote size={16} style={{ marginLeft: '5px' }} />
 {executing ? 'جاري التنفيذ...' : `تنفيذ الدفعة (${proposals.filter(p => p.selected).length} فاتورة)`}
 </button>
 </div>
 <table className="table" style={{ width: '100%' }}>
 <thead>
 <tr>
 <th><input type="checkbox" checked={proposals.every(p => p.selected)} onChange={e => toggleAll(e.target.checked)} /></th>
 <th>المورد</th>
 <th>رقم الفاتورة</th>
 <th>المبلغ</th>
 <th>تاريخ الاستحقاق</th>
 <th>أيام التأخير</th>
 </tr>
 </thead>
 <tbody>
 {proposals.map(p => (
 <tr key={p.id} style={{ opacity: p.selected ? 1 : 0.5 }}>
 <td><input type="checkbox" checked={p.selected} onChange={() => toggleOne(p.id)} /></td>
 <td>{p.supplierName}</td>
 <td>{p.invoiceNumber}</td>
 <td style={{ fontWeight: 'bold' }}>{p.invoiceAmount.toLocaleString()} ر.س</td>
 <td>{new Date(p.dueDate).toLocaleDateString('ar-SA')}</td>
 <td>
 <span className={`badge ${p.daysOverdue > 30 ? 'badge-danger' : p.daysOverdue > 0 ? 'badge-warning' : 'badge-success'}`}>
 {p.daysOverdue > 0 ? `متأخر ${p.daysOverdue} يوم` : 'لم يحل'}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {proposals.length === 0 && !proposing && (
 <div className="card" style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
 <Banknote size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
 <p>اضغط "توليد مقترح الدفع" لتحليل الفواتير المستحقة واقتراح الدفعات للموردين</p>
 </div>
 )}
 </>
 )}

 {activeTab === 'history' && (
 <div className="card" style={{ padding: '20px' }}>
 <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>سجل عمليات الدفع المنفذة</h2>
 {runs.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>لا توجد عمليات سابقة</div>
 ) : (
 <table className="table" style={{ width: '100%' }}>
 <thead>
 <tr>
 <th>رقم العملية</th>
 <th>التاريخ</th>
 <th>الحالة</th>
 <th>عدد الفواتير</th>
 <th>المبلغ الإجمالي</th>
 </tr>
 </thead>
 <tbody>
 {runs.map((r: any) => (
 <tr key={r.id}>
 <td>PR-{r.id}</td>
 <td>{new Date(r.createdAt).toLocaleDateString('ar-SA')}</td>
 <td>
 <span className={`badge ${r.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
 {r.status === 'COMPLETED' ? <><CheckCircle size={12} style={{ display: 'inline', marginRight: '3px' }} /> مكتمل</> : <><Clock size={12} style={{ display: 'inline', marginRight: '3px' }} /> قيد التنفيذ</>}
 </span>
 </td>
 <td>{r.lineCount || 0}</td>
 <td style={{ fontWeight: 'bold' }}>{(r.totalAmount || 0).toLocaleString()} ر.س</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 )}
 </div>
 </>
 );
}
