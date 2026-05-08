'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Download, UploadCloud, AlertCircle, CheckCircle, ShieldCheck, RefreshCw, Search, Eye, XCircle, Building2, Users, CreditCard, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const BANKS: Record<string,string> = {
 RJHI:'مصرف الراجحي', ALBI:'بنك الإنماء', SABB:'ساب', SNB:'البنك الأهلي السعودي',
 BSFR:'بنك البلاد', RIBL:'بنك الرياض', ARNB:'البنك العربي الوطني', BJAZ:'بنك الجزيرة'
};

const formSchema = z.object({
  payrollRunId: z.string().min(1, 'رقم مسير الرواتب مطلوب'),
  bankCode: z.string().min(1, 'البنك مطلوب'),
  employerId: z.string().min(10, 'السجل التجاري يجب أن يكون 10 أرقام').max(10, 'السجل التجاري يجب ألا يزيد عن 10 أرقام'),
  employerName: z.string().min(2, 'اسم المنشأة مطلوب'),
  molId: z.string().min(1, 'رقم المنشأة في وزارة العمل مطلوب')
});

type FormValues = z.infer<typeof formSchema>;

export default function WPSDashboard() {
 const { lang } = useTranslation();
 const { success, info, error: showError } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [tab, setTab] = useState<'generate'|'batches'|'validate'|'compliance'>('generate');
 const [generating, setGenerating] = useState(false);
 const [validating, setValidating] = useState(false);
 const [valResult, setValResult] = useState<any>(null);
 const [selectedBatch, setSelectedBatch] = useState<any>(null);

 const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { payrollRunId: '', bankCode: 'RJHI', employerId: '', employerName: '', molId: '' }
 });

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/hr/wps', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
 if (res.ok) setData(await res.json());
 } catch (e) { console.error(e); }
 setLoading(false);
 };
 useEffect(() => { fetchData(); }, []);

 const onSubmitSif = async (formData: FormValues) => {
 setGenerating(true);
 try {
 const res = await fetch('/api/hr/wps', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action: 'generate', ...formData, payrollRunId: parseInt(formData.payrollRunId) })
 });
 const d = await res.json();
 if (res.ok) { success(_t('تم توليد ملف SIF v3 بنجاح','SIF v3 file generated successfully')); fetchData(); setTab('batches'); }
 else showError(d.error || 'Error');
 } catch (e) { console.error(e); }
 setGenerating(false);
 };

 const validateIbans = async () => {
 setValidating(true);
 try {
 const res = await fetch('/api/hr/wps', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action: 'validate_ibans' })
 });
 const d = await res.json();
 if (res.ok) setValResult(d);
 } catch (e) { console.error(e); }
 setValidating(false);
 };

 const submitToBank = async (batchId: number) => {
 try {
 const res = await fetch('/api/hr/wps', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action: 'submit', batchId })
 });
 if (res.ok) { success(_t('تم رفع الملف للبنك بنجاح','File submitted to bank successfully')); fetchData(); }
 } catch (e) { console.error(e); }
 };

 const downloadSif = (batch: any) => {
 const blob = new Blob([batch.fileContent], { type: 'text/plain' });
 const url = window.URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = `${batch.batchNumber}.sif`; a.click();
 };

 const s = data?.summary || { totalBatches:0, acceptedCount:0, pendingCount:0, uploadedCount:0, rejectedCount:0, complianceRate:'0', ibanErrors:0, totalActiveEmployees:0 };
 const batches = data?.batches || [];

 const statusBadge = (status: string) => {
 const map: Record<string,{cls:string,label:string}> = {
 GENERATED: { cls:'badge-warning', label:_t('تم التوليد','Generated') },
 UPLOADED: { cls:'badge-info', label:_t('تم الرفع','Uploaded') },
 ACCEPTED: { cls:'badge-success', label:_t('مقبول من مدد','Accepted') },
 REJECTED: { cls:'badge-danger', label:_t('مرفوض','Rejected') },
 };
 const m = map[status] || { cls:'badge-outline', label:status };
 return <span className={`badge ${m.cls}`}>{m.label}</span>;
 };

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">
 <ShieldCheck size={28} style={{ display:'inline', marginLeft:'8px', color:'#3b82f6' }} />
 {_t('نظام حماية الأجور (WPS) - مدد 2026','Wage Protection System (WPS) - Mudad 2026')}
 </h1>
 <p style={{ color:'#6b7280', fontSize:'14px', marginTop:'4px' }}>
 {_t('توليد ملفات SIF v3 • التحقق من IBAN • التوافق مع مدد وقوى والتأمينات','SIF v3 Generation • IBAN Validation • Mudad, Qiwa & GOSI Compliance')}
 </p>
 </div>

 <div className="page-content animate-fade-in">
 {/* KPI Cards */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'14px', marginBottom:'24px' }}>
 {[
 { label:_t('إجمالي الدفعات','Total Batches'), val:s.totalBatches, icon:<FileText size={22}/>, color:'#3b82f6', border:'#3b82f6' },
 { label:_t('مقبول من مدد','Accepted'), val:s.acceptedCount, icon:<CheckCircle size={22}/>, color:'#10b981', border:'#10b981' },
 { label:_t('قيد الرفع','Pending'), val:s.pendingCount, icon:<UploadCloud size={22}/>, color:'#f59e0b', border:'#f59e0b' },
 { label:_t('نسبة الامتثال','Compliance'), val:`${s.complianceRate}%`, icon:<ShieldCheck size={22}/>, color:'#6366f1', border:'#6366f1' },
 { label:_t('أخطاء IBAN','IBAN Errors'), val:s.ibanErrors, icon:<AlertCircle size={22}/>, color:'#ef4444', border:'#ef4444' },
 { label:_t('الموظفين النشطين','Active Employees'), val:s.totalActiveEmployees, icon:<Users size={22}/>, color:'#8b5cf6', border:'#8b5cf6' },
 ].map((c,i) => (
 <div key={i} className="card" style={{ padding:'16px', borderLeft:`4px solid ${c.border}` }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <div>
 <div style={{ color:'#6b7280', fontSize:'12px', marginBottom:'4px' }}>{c.label}</div>
 <div style={{ fontSize:'24px', fontWeight:'bold', color:c.color }}>{c.val}</div>
 </div>
 <div style={{ color:c.color, opacity:0.4 }}>{c.icon}</div>
 </div>
 </div>
 ))}
 </div>

 {/* Tabs */}
 <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
 {([
 { key:'generate', label:_t('توليد ملف SIF','Generate SIF'), icon:<FileText size={14}/> },
 { key:'batches', label:_t('سجل الدفعات','Batch History'), icon:<CreditCard size={14}/> },
 { key:'validate', label:_t('فحص IBAN','IBAN Check'), icon:<Search size={14}/> },
 { key:'compliance', label:_t('لوحة الامتثال','Compliance'), icon:<ShieldCheck size={14}/> },
 ] as const).map(t => (
 <button key={t.key} className={`btn ${tab===t.key?'btn-primary':'btn-outline'}`} onClick={()=>setTab(t.key)} style={{ fontSize:'13px' }}>
 {t.icon} <span style={{ marginRight:'6px' }}>{t.label}</span>
 </button>
 ))}
 </div>

 {/* Generate Tab */}
 {tab === 'generate' && (
 <div className="card" style={{ padding:'24px' }}>
 <h2 style={{ fontSize:'18px', marginBottom:'20px' }}>{_t('توليد ملف SIF v3 (مدد 2026)','Generate SIF v3 File (Mudad 2026)')}</h2>
 <form onSubmit={handleSubmit(onSubmitSif)}>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px' }}>
 <div>
 <label style={{ display:'block', marginBottom:'4px', fontSize:'13px', color:'#6b7280' }}>{_t('رقم مسير الرواتب','Payroll Run ID')}</label>
 <input className={`form-input ${errors.payrollRunId ? 'border-red-500' : ''}`} type="number" {...register('payrollRunId')} placeholder="1" />
 {errors.payrollRunId && <span className="text-red-500 text-xs mt-1">{errors.payrollRunId.message}</span>}
 </div>
 <div>
 <label style={{ display:'block', marginBottom:'4px', fontSize:'13px', color:'#6b7280' }}>{_t('البنك','Bank')}</label>
 <select className={`form-select ${errors.bankCode ? 'border-red-500' : ''}`} {...register('bankCode')}>
 {Object.entries(BANKS).map(([k,v])=><option key={k} value={k}>{v} ({k})</option>)}
 </select>
 {errors.bankCode && <span className="text-red-500 text-xs mt-1">{errors.bankCode.message}</span>}
 </div>
 <div>
 <label style={{ display:'block', marginBottom:'4px', fontSize:'13px', color:'#6b7280' }}>{_t('رقم المنشأة (وزارة العمل)','Employer MOL ID')}</label>
 <input className={`form-input ${errors.molId ? 'border-red-500' : ''}`} {...register('molId')} placeholder="7001234567" />
 {errors.molId && <span className="text-red-500 text-xs mt-1">{errors.molId.message}</span>}
 </div>
 <div>
 <label style={{ display:'block', marginBottom:'4px', fontSize:'13px', color:'#6b7280' }}>{_t('السجل التجاري','Employer ID (CR)')}</label>
 <input className={`form-input ${errors.employerId ? 'border-red-500' : ''}`} {...register('employerId')} placeholder="1010123456" />
 {errors.employerId && <span className="text-red-500 text-xs mt-1">{errors.employerId.message}</span>}
 </div>
 <div>
 <label style={{ display:'block', marginBottom:'4px', fontSize:'13px', color:'#6b7280' }}>{_t('اسم المنشأة','Employer Name')}</label>
 <input className={`form-input ${errors.employerName ? 'border-red-500' : ''}`} {...register('employerName')} placeholder="شركة نما" />
 {errors.employerName && <span className="text-red-500 text-xs mt-1">{errors.employerName.message}</span>}
 </div>
 </div>
 <div style={{ marginTop:'20px', display:'flex', gap:'10px' }}>
 <button type="submit" className="btn btn-primary" disabled={generating}>
 <FileText size={16} style={{ marginLeft:'5px' }} />
 {generating ? _t('جاري التوليد...','Generating...') : _t('توليد ملف SIF v3','Generate SIF v3')}
 </button>
 </div>
 </form>
 <div style={{ marginTop:'16px', padding:'12px', background:'#f0f9ff', borderRadius:'8px', fontSize:'13px', color:'#1e40af' }}>
 <strong>{_t('ملاحظة:','Note:')}</strong> {_t('يتم التوليد بصيغة SIF v3 المعتمدة من مدد 2026، تشمل: الراتب الأساسي، بدل السكن، بدل النقل، البدلات الأخرى، الاستقطاعات (GOSI)، صافي الراتب، نوع العقد، والجنسية.','Generated in SIF v3 format approved by Mudad 2026, includes: Basic salary, Housing, Transport, Other allowances, Deductions (GOSI), Net salary, Contract type, and Nationality.')}
 </div>
 </div>
 )}

 {/* Batches Tab */}
 {tab === 'batches' && (
 <div className="card" style={{ padding:'20px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
 <h2 style={{ fontSize:'18px', margin:0 }}>{_t('سجل دفعات WPS','WPS Batch History')}</h2>
 <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={14} style={{ marginLeft:'4px' }}/> {_t('تحديث','Refresh')}</button>
 </div>
 {batches.length === 0 ? (
 <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>{_t('لا توجد دفعات','No batches yet')}</div>
 ) : (
 <div style={{ overflowX:'auto' }}>
 <table className="table" style={{ width:'100%' }}>
 <thead><tr>
 <th>{_t('رقم الدفعة','Batch #')}</th>
 <th>{_t('الشهر','Period')}</th>
 <th>{_t('البنك','Bank')}</th>
 <th>{_t('الموظفين','Employees')}</th>
 <th>{_t('الإجمالي','Total')}</th>
 <th>{_t('الصيغة','Format')}</th>
 <th>{_t('الحالة','Status')}</th>
 <th>{_t('الإجراءات','Actions')}</th>
 </tr></thead>
 <tbody>
 {batches.map((b: any) => (
 <tr key={b.id}>
 <td style={{ fontWeight:'500', color:'#3b82f6' }}>{b.batchNumber}</td>
 <td>{b.payrollRun?.periodMonth}/{b.payrollRun?.periodYear}</td>
 <td><span className="badge badge-outline">{b.bankCode}</span></td>
 <td style={{ textAlign:'center' }}>{b.totalEmployees}</td>
 <td style={{ fontWeight:'bold', fontFamily:'monospace' }}>{Number(b.totalAmount).toLocaleString()} ر.س</td>
 <td><span className="badge badge-outline">{b.fileFormat}</span></td>
 <td>{statusBadge(b.status)}</td>
 <td>
 <div style={{ display:'flex', gap:'6px' }}>
 <button className="btn btn-outline" style={{ fontSize:'11px', padding:'3px 8px' }} onClick={()=>downloadSif(b)}>
 <Download size={12}/>
 </button>
 {b.status === 'GENERATED' && (
 <button className="btn btn-primary" style={{ fontSize:'11px', padding:'3px 8px' }} onClick={()=>submitToBank(b.id)}>
 <UploadCloud size={12}/> {_t('رفع','Submit')}
 </button>
 )}
 <button className="btn btn-outline" style={{ fontSize:'11px', padding:'3px 8px' }} onClick={()=>setSelectedBatch(b)}>
 <Eye size={12}/>
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* Validate Tab */}
 {tab === 'validate' && (
 <div className="card" style={{ padding:'20px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
 <h2 style={{ fontSize:'18px', margin:0 }}>{_t('فحص أرقام IBAN للموظفين','Employee IBAN Validation')}</h2>
 <button className="btn btn-primary" onClick={validateIbans} disabled={validating}>
 <Search size={14} style={{ marginLeft:'4px' }}/> {validating ? '...' : _t('بدء الفحص','Start Check')}
 </button>
 </div>
 {valResult ? (
 <>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'12px', marginBottom:'16px' }}>
 <div className="card" style={{ padding:'14px', borderLeft:'3px solid #10b981', textAlign:'center' }}>
 <div style={{ fontSize:'24px', fontWeight:'bold', color:'#10b981' }}>{valResult.valid}</div>
 <div style={{ fontSize:'12px', color:'#6b7280' }}>{_t('صالح','Valid')}</div>
 </div>
 <div className="card" style={{ padding:'14px', borderLeft:'3px solid #ef4444', textAlign:'center' }}>
 <div style={{ fontSize:'24px', fontWeight:'bold', color:'#ef4444' }}>{valResult.invalid}</div>
 <div style={{ fontSize:'12px', color:'#6b7280' }}>{_t('غير صالح','Invalid')}</div>
 </div>
 <div className="card" style={{ padding:'14px', borderLeft:'3px solid #f59e0b', textAlign:'center' }}>
 <div style={{ fontSize:'24px', fontWeight:'bold', color:'#f59e0b' }}>{valResult.warnings}</div>
 <div style={{ fontSize:'12px', color:'#6b7280' }}>{_t('تحذيرات','Warnings')}</div>
 </div>
 </div>
 {valResult.errors?.length > 0 && (
 <table className="table" style={{ width:'100%' }}>
 <thead><tr><th>{_t('الموظف','Employee')}</th><th>{_t('الحقل','Field')}</th><th>{_t('المشكلة','Issue')}</th><th>{_t('الخطورة','Severity')}</th></tr></thead>
 <tbody>
 {valResult.errors.map((e: any, i: number) => (
 <tr key={i}>
 <td>{e.employeeName}</td>
 <td><span className="badge badge-outline">{e.field}</span></td>
 <td style={{ fontSize:'13px' }}>{e.message}</td>
 <td>{e.severity === 'ERROR' ? <span className="badge badge-danger">خطأ</span> : <span className="badge badge-warning">تحذير</span>}</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </>
 ) : (
 <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>
 <CreditCard size={48} style={{ marginBottom:'16px', opacity:0.3 }} />
 <p>{_t('اضغط "بدء الفحص" للتحقق من صحة أرقام IBAN وبيانات الهوية','Click "Start Check" to validate IBAN numbers and ID data')}</p>
 </div>
 )}
 </div>
 )}

 {/* Compliance Tab */}
 {tab === 'compliance' && (
 <div className="card" style={{ padding:'20px' }}>
 <h2 style={{ fontSize:'18px', marginBottom:'16px' }}>{_t('لوحة الامتثال - مدد / قوى / GOSI','Compliance Dashboard - Mudad / Qiwa / GOSI')}</h2>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
 <div style={{ background:'#f0fdf4', padding:'20px', borderRadius:'8px', border:'1px solid #bbf7d0' }}>
 <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
 <CheckCircle size={20} style={{ color:'#10b981' }} />
 <strong style={{ color:'#065f46' }}>{_t('متطلبات مدد 2026','Mudad 2026 Requirements')}</strong>
 </div>
 <ul style={{ fontSize:'13px', color:'#047857', margin:0, paddingRight:'20px', lineHeight:'2' }}>
 <li>{_t('✅ صيغة SIF v3 معتمدة','✅ SIF v3 format approved')}</li>
 <li>{_t('✅ الدفع الإلكتروني فقط (بدون نقد)','✅ Electronic payment only (no cash)')}</li>
 <li>{_t('✅ العملة بالريال السعودي','✅ SAR currency only')}</li>
 <li>{_t('✅ فصل البدلات (سكن/نقل/أخرى)','✅ Allowance breakdown (Housing/Transport/Other)')}</li>
 <li>{_t('✅ استقطاعات GOSI مفصلة','✅ GOSI deduction detail')}</li>
 <li>{_t('✅ نوع العقد والجنسية','✅ Contract type & Nationality')}</li>
 </ul>
 </div>
 <div style={{ background:'#fefce8', padding:'20px', borderRadius:'8px', border:'1px solid #fde68a' }}>
 <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
 <AlertTriangle size={20} style={{ color:'#f59e0b' }} />
 <strong style={{ color:'#92400e' }}>{_t('عقوبات عدم الامتثال','Non-Compliance Penalties')}</strong>
 </div>
 <ul style={{ fontSize:'13px', color:'#a16207', margin:0, paddingRight:'20px', lineHeight:'2' }}>
 <li>{_t('⚠️ إيقاف خدمات قوى ومقيم','⚠️ Qiwa & Muqeem services suspended')}</li>
 <li>{_t('⚠️ منع إصدار وتجديد التأشيرات','⚠️ Visa issuance/renewal blocked')}</li>
 <li>{_t('⚠️ غرامات مالية كبيرة','⚠️ Heavy financial fines')}</li>
 <li>{_t('⚠️ نقل الموظف بدون موافقة بعد 3 أشهر','⚠️ Employee transfer without consent after 3 months')}</li>
 </ul>
 </div>
 </div>
 <div style={{ marginTop:'16px', padding:'16px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
 <strong>{_t('حالة الامتثال الحالية:','Current Compliance Status:')}</strong>
 <div style={{ display:'flex', alignItems:'center', gap:'12px', marginTop:'8px' }}>
 <div style={{ flex:1, background:'#e5e7eb', borderRadius:'999px', height:'12px', overflow:'hidden' }}>
 <div style={{ width:`${s.complianceRate}%`, height:'100%', background: Number(s.complianceRate) >= 90 ? '#10b981' : Number(s.complianceRate) >= 70 ? '#f59e0b' : '#ef4444', borderRadius:'999px', transition:'width 0.5s' }} />
 </div>
 <span style={{ fontWeight:'bold', fontSize:'18px', color: Number(s.complianceRate) >= 90 ? '#10b981' : '#f59e0b' }}>{s.complianceRate}%</span>
 </div>
 </div>
 </div>
 )}

 {/* Batch Detail Modal */}
 {selectedBatch && (
 <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setSelectedBatch(null)}>
 <div className="card" style={{ maxWidth:'700px', width:'90%', maxHeight:'80vh', overflow:'auto', padding:'24px' }} onClick={e=>e.stopPropagation()}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
 <h2 style={{ fontSize:'18px', margin:0 }}>{_t('تفاصيل الدفعة','Batch Details')} - {selectedBatch.batchNumber}</h2>
 <button className="btn btn-outline" onClick={()=>setSelectedBatch(null)}><XCircle size={16}/></button>
 </div>
 <pre style={{ background:'#1e293b', color:'#e2e8f0', padding:'16px', borderRadius:'8px', fontSize:'11px', overflow:'auto', maxHeight:'400px', direction:'ltr', textAlign:'left' }}>
 {selectedBatch.fileContent}
 </pre>
 </div>
 </div>
 )}
 </div>
 </>
 );
}
