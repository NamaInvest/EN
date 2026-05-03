'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Shield, AlertTriangle, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ECLPage() {
 const { t } = useTranslation();
 const { success, error } = useToast();
 const [assessments, setAssessments] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [running, setRunning] = useState(false);

 useEffect(() => { loadData(); }, []);

 async function loadData() {
 setLoading(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/ecl', {
 headers: { Authorization: `Bearer ${token}` }
 });
 const d = await res.json();
 if (res.ok) setAssessments(d.assessments || []);
 } catch (e) { console.error(e); }
 setLoading(false);
 }

 async function runECL() {
 setRunning(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/ecl', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ action: 'run_assessment' })
 });
 const d = await res.json();
 if (res.ok) {
 success('تم تشغيل تقييم خسائر الائتمان المتوقعة بنجاح');
 loadData();
 } else {
 error(d.error || 'فشل في التقييم');
 }
 } catch (e) { console.error(e); }
 setRunning(false);
 }

 const stage1 = assessments.filter(a => a.stage === 1);
 const stage2 = assessments.filter(a => a.stage === 2);
 const stage3 = assessments.filter(a => a.stage === 3);
 const totalProvision = assessments.reduce((sum, a) => sum + (a.eclAmount || 0), 0);

 if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">خسائر الائتمان المتوقعة (IFRS 9 - ECL)</h1>
 </div>

 <div className="page-content animate-fade-in">
 {/* Summary Cards */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>المرحلة 1 (منخفض الخطورة)</div>
 <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stage1.length}</div>
 </div>
 <Shield size={28} style={{ color: '#10b981', opacity: 0.5 }} />
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>المرحلة 2 (متوسط الخطورة)</div>
 <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{stage2.length}</div>
 </div>
 <AlertTriangle size={28} style={{ color: '#f59e0b', opacity: 0.5 }} />
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>المرحلة 3 (عالي الخطورة)</div>
 <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stage3.length}</div>
 </div>
 <TrendingUp size={28} style={{ color: '#ef4444', opacity: 0.5 }} />
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>إجمالي المخصص المطلوب</div>
 <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>{totalProvision.toLocaleString()} ر.س</div>
 </div>
 <BarChart3 size={28} style={{ color: '#6366f1', opacity: 0.5 }} />
 </div>
 </div>
 </div>

 {/* Table */}
 <div className="card" style={{ padding: '20px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
 <h2 style={{ fontSize: '18px', margin: 0 }}>تقييمات العملاء</h2>
 <button className="btn btn-primary" onClick={runECL} disabled={running}>
 {running ? 'جاري التقييم...' : 'تشغيل تقييم ECL'}
 </button>
 </div>
 {assessments.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
 <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
 <p>لا توجد تقييمات. اضغط &ldquo;تشغيل تقييم ECL&rdquo; لتحليل ديون العملاء</p>
 </div>
 ) : (
 <table className="table" style={{ width: '100%' }}>
 <thead>
 <tr>
 <th>العميل</th>
 <th>إجمالي المستحق (EAD)</th>
 <th>المرحلة</th>
 <th>احتمالية التعثر (PD)</th>
 <th>الخسارة المتوقعة (LGD)</th>
 <th>مبلغ المخصص (ECL)</th>
 </tr>
 </thead>
 <tbody>
 {assessments.map((a: any) => (
 <tr key={a.id}>
 <td style={{ fontWeight: '500' }}>{a.customerName}</td>
 <td>{(a.ead || 0).toLocaleString()} ر.س</td>
 <td>
 <span className={`badge ${a.stage === 1 ? 'badge-success' : a.stage === 2 ? 'badge-warning' : 'badge-danger'}`}>
 Stage {a.stage}
 </span>
 </td>
 <td>{((a.pd || 0) * 100).toFixed(1)}%</td>
 <td>{((a.lgd || 0) * 100).toFixed(1)}%</td>
 <td style={{ fontWeight: 'bold', color: a.eclAmount > 0 ? '#ef4444' : '#10b981' }}>
 {(a.eclAmount || 0).toLocaleString()} ر.س
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>
 </>
 );
}
