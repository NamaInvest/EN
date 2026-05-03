'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { ClipboardCheck, AlertOctagon, Wrench, CheckCircle, XCircle, Plus, Eye } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function QualityManagementPage() {
 const { t } = useTranslation();
 const { success, error } = useToast();
 const [inspections, setInspections] = useState<any[]>([]);
 const [ncrs, setNcrs] = useState<any[]>([]);
 const [capas, setCapas] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<'inspections' | 'ncr' | 'capa'>('inspections');

 useEffect(() => { loadData(); }, []);

 async function loadData() {
 setLoading(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/manufacturing/quality-management', {
 headers: { Authorization: `Bearer ${token}` }
 });
 const d = await res.json();
 if (res.ok) {
 setInspections(d.inspections || []);
 setNcrs(d.ncrs || []);
 setCapas(d.capas || []);
 }
 } catch (e) { console.error(e); }
 setLoading(false);
 }

 const passRate = inspections.length > 0 ? ((inspections.filter(i => i.status === 'PASS').length / inspections.length) * 100).toFixed(1) : '0';

 if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">إدارة الجودة الشاملة (QM / CAPA / NCR)</h1>
 </div>

 <div className="page-content animate-fade-in">
 {/* Summary */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>عمليات الفحص</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{inspections.length}</div>
 </div>
 <ClipboardCheck size={28} style={{ color: '#3b82f6', opacity: 0.5 }} />
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>نسبة النجاح (First-Pass Yield)</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{passRate}%</div>
 </div>
 <CheckCircle size={28} style={{ color: '#10b981', opacity: 0.5 }} />
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>تقارير عدم المطابقة (NCR)</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{ncrs.length}</div>
 </div>
 <AlertOctagon size={28} style={{ color: '#ef4444', opacity: 0.5 }} />
 </div>
 </div>
 <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>إجراءات تصحيحية مفتوحة</div>
 <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{capas.filter(c => c.status === 'OPEN').length}</div>
 </div>
 <Wrench size={28} style={{ color: '#f59e0b', opacity: 0.5 }} />
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
 {(['inspections', 'ncr', 'capa'] as const).map(tab => (
 <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(tab)}>
 {tab === 'inspections' ? 'عمليات الفحص' : tab === 'ncr' ? 'تقارير عدم المطابقة' : 'الإجراءات التصحيحية'}
 </button>
 ))}
 </div>

 {/* Inspections Tab */}
 {activeTab === 'inspections' && (
 <div className="card" style={{ padding: '20px' }}>
 <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>سجل عمليات الفحص</h2>
 {inspections.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>لا توجد عمليات فحص مسجلة</div>
 ) : (
 <table className="table" style={{ width: '100%' }}>
 <thead><tr><th>رقم الفحص</th><th>المصدر</th><th>المنتج</th><th>الكمية</th><th>النتيجة</th><th>التاريخ</th></tr></thead>
 <tbody>
 {inspections.map((i: any) => (
 <tr key={i.id}>
 <td>QI-{i.id}</td>
 <td><span className="badge badge-outline">{i.sourceDocType || i.referenceNumber}</span></td>
 <td>{i.productName || i.productId}</td>
 <td>{i.inspectedQty}</td>
 <td>
 <span className={`badge ${i.status === 'PASS' ? 'badge-success' : i.status === 'FAIL' ? 'badge-danger' : 'badge-warning'}`}>
 {i.status === 'PASS' ? <><CheckCircle size={12} style={{ display: 'inline', marginRight: '3px' }} />ناجح</> :
 i.status === 'FAIL' ? <><XCircle size={12} style={{ display: 'inline', marginRight: '3px' }} />فاشل</> : 'إعادة تصنيع'}
 </span>
 </td>
 <td>{new Date(i.inspectedAt || i.inspectionDate).toLocaleDateString('ar-SA')}</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 )}

 {/* NCR Tab */}
 {activeTab === 'ncr' && (
 <div className="card" style={{ padding: '20px' }}>
 <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>تقارير عدم المطابقة (NCR)</h2>
 {ncrs.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>لا توجد تقارير عدم مطابقة</div>
 ) : (
 <table className="table" style={{ width: '100%' }}>
 <thead><tr><th>رقم التقرير</th><th>الخطورة</th><th>الوصف</th><th>القرار</th><th>تأثير التكلفة</th></tr></thead>
 <tbody>
 {ncrs.map((n: any) => (
 <tr key={n.id}>
 <td>NCR-{n.id}</td>
 <td>
 <span className={`badge ${n.severity === 'CRITICAL' ? 'badge-danger' : n.severity === 'HIGH' ? 'badge-warning' : 'badge-outline'}`}>
 {n.severity}
 </span>
 </td>
 <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.description}</td>
 <td><span className="badge badge-outline">{n.dispositionType}</span></td>
 <td style={{ fontWeight: 'bold', color: '#ef4444' }}>{(n.costImpact || 0).toLocaleString()} ر.س</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 )}

 {/* CAPA Tab */}
 {activeTab === 'capa' && (
 <div className="card" style={{ padding: '20px' }}>
 <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>الإجراءات التصحيحية والوقائية (CAPA)</h2>
 {capas.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>لا توجد إجراءات تصحيحية</div>
 ) : (
 <table className="table" style={{ width: '100%' }}>
 <thead><tr><th>رقم</th><th>السبب الجذري</th><th>الإجراء</th><th>المسؤول</th><th>الموعد</th><th>الحالة</th></tr></thead>
 <tbody>
 {capas.map((c: any) => (
 <tr key={c.id}>
 <td>CAPA-{c.id}</td>
 <td>{c.rootCause}</td>
 <td>{c.action}</td>
 <td>{c.owner}</td>
 <td>{new Date(c.dueDate).toLocaleDateString('ar-SA')}</td>
 <td>
 <span className={`badge ${c.status === 'CLOSED' ? 'badge-success' : c.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-danger'}`}>
 {c.status === 'CLOSED' ? 'مغلق' : c.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'مفتوح'}
 </span>
 </td>
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
