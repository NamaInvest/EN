'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const CATS = ['TRAVEL','FOOD','TRANSPORT','ACCOMMODATION','OTHER'];
const catLabels: Record<string,Record<string,string>> = {
    ar: { TRAVEL:'سفر', FOOD:'طعام', TRANSPORT:'مواصلات', ACCOMMODATION:'إقامة', OTHER:'أخرى' },
    en: { TRAVEL:'Travel', FOOD:'Food', TRANSPORT:'Transport', ACCOMMODATION:'Accommodation', OTHER:'Other' },
};
const statusColors: Record<string,string> = { DRAFT:'#9E9E9E', SUBMITTED:'#FF9800', APPROVED:'#4CAF50', REJECTED:'#F44336', PAID:'#2196F3' };

export default function ExpenseReportsPage() {
    const { lang } = useTranslation();
    const isAr = lang === 'ar';
    const [reports, setReports] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [lines, setLines] = useState([{ date: new Date().toISOString().slice(0,10), category: 'OTHER', description: '', amount: '', vendor: '' }]);

    useEffect(() => { fetch('/api/hr/expense-reports').then(r=>r.json()).then(d=> setReports(Array.isArray(d)?d:[])).catch(()=>{}); }, []);

    const addLine = () => setLines([...lines, { date: new Date().toISOString().slice(0,10), category: 'OTHER', description: '', amount: '', vendor: '' }]);
    const removeLine = (i: number) => setLines(lines.filter((_,idx)=>idx!==i));
    const updateLine = (i: number, field: string, val: string) => { const n = [...lines]; (n[i] as any)[field] = val; setLines(n); };

    const submit = () => {
        fetch('/api/hr/expense-reports', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ employeeId: 1, title, lines }) })
            .then(r=>r.json()).then(r => { setReports([r, ...reports]); setShowForm(false); setTitle(''); setLines([{ date: new Date().toISOString().slice(0,10), category:'OTHER', description:'', amount:'', vendor:'' }]); });
    };
    const doAction = (id: number, action: string) => {
        fetch('/api/hr/expense-reports', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, id }) })
            .then(r=>r.json()).then(() => { setReports(reports.map(r => r.id===id ? {...r, status: action==='submit'?'SUBMITTED':action==='approve'?'APPROVED':'REJECTED'} : r)); });
    };
    const total = lines.reduce((s,l) => s + (parseFloat(l.amount)||0), 0);

    return (
        <div style={{ padding: 24, direction: isAr?'rtl':'ltr' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>{isAr ? '💸 تقارير المصروفات' : '💸 Expense Reports'}</h1>
                <button onClick={()=>setShowForm(!showForm)} style={{ padding:'10px 24px', borderRadius:10, background:'#2196F3', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:14 }}>
                    {showForm ? '✕' : '+'} {isAr ? 'تقرير جديد' : 'New Report'}
                </button>
            </div>
            {showForm && (
                <div style={{ background:'#fff', borderRadius:12, padding:20, marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', border:'1px solid #e0e0e0' }}>
                    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={isAr?'عنوان التقرير...':'Report title...'} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #ddd', marginBottom:12, fontSize:14 }} />
                    <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:12 }}>
                        <thead><tr style={{ background:'#f5f5f5' }}>
                            <th style={{ padding:8 }}>{isAr?'التاريخ':'Date'}</th>
                            <th style={{ padding:8 }}>{isAr?'الفئة':'Category'}</th>
                            <th style={{ padding:8 }}>{isAr?'الوصف':'Description'}</th>
                            <th style={{ padding:8 }}>{isAr?'المورد':'Vendor'}</th>
                            <th style={{ padding:8 }}>{isAr?'المبلغ':'Amount'}</th>
                            <th style={{ padding:8, width:40 }}></th>
                        </tr></thead>
                        <tbody>{lines.map((l,i)=>(
                            <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                                <td style={{padding:4}}><input type="date" value={l.date} onChange={e=>updateLine(i,'date',e.target.value)} style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd',width:'100%'}} /></td>
                                <td style={{padding:4}}><select value={l.category} onChange={e=>updateLine(i,'category',e.target.value)} style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd',width:'100%'}}>{CATS.map(c=><option key={c} value={c}>{(catLabels[lang]||catLabels.en)[c]}</option>)}</select></td>
                                <td style={{padding:4}}><input value={l.description} onChange={e=>updateLine(i,'description',e.target.value)} style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd',width:'100%'}} /></td>
                                <td style={{padding:4}}><input value={l.vendor} onChange={e=>updateLine(i,'vendor',e.target.value)} style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd',width:'100%'}} /></td>
                                <td style={{padding:4}}><input type="number" value={l.amount} onChange={e=>updateLine(i,'amount',e.target.value)} style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd',width:100}} /></td>
                                <td style={{padding:4}}><button onClick={()=>removeLine(i)} style={{background:'#F44336',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',padding:'4px 8px'}}>✕</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <button onClick={addLine} style={{ padding:'6px 16px', borderRadius:8, background:'#E3F2FD', color:'#2196F3', border:'none', cursor:'pointer', fontWeight:600 }}>+ {isAr?'إضافة سطر':'Add Line'}</button>
                        <div style={{ fontWeight:700, fontSize:16 }}>{isAr?'الإجمالي':'Total'}: {total.toLocaleString()} SAR</div>
                        <button onClick={submit} disabled={!title || lines.length===0} style={{ padding:'10px 28px', borderRadius:8, background:'#4CAF50', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, opacity:(!title?0.5:1) }}>💾 {isAr?'حفظ':'Save'}</button>
                    </div>
                </div>
            )}
            <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#FAFAFA' }}>
                        <th style={{padding:12,textAlign:isAr?'right':'left'}}>#</th>
                        <th style={{padding:12,textAlign:isAr?'right':'left'}}>{isAr?'العنوان':'Title'}</th>
                        <th style={{padding:12}}>{isAr?'المبلغ':'Amount'}</th>
                        <th style={{padding:12}}>{isAr?'الحالة':'Status'}</th>
                        <th style={{padding:12}}>{isAr?'إجراءات':'Actions'}</th>
                    </tr></thead>
                    <tbody>{reports.length>0 ? reports.map(r=>(
                        <tr key={r.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                            <td style={{padding:12}}>{r.id}</td>
                            <td style={{padding:12,fontWeight:600}}>{r.title}</td>
                            <td style={{padding:12,textAlign:'center',fontWeight:700}}>{(r.totalAmount||0).toLocaleString()} SAR</td>
                            <td style={{padding:12,textAlign:'center'}}><span style={{background:(statusColors[r.status]||'#999')+'20',color:statusColors[r.status],padding:'4px 12px',borderRadius:8,fontSize:12,fontWeight:600}}>{r.status}</span></td>
                            <td style={{padding:12,textAlign:'center',display:'flex',gap:4,justifyContent:'center'}}>
                                {r.status==='DRAFT' && <button onClick={()=>doAction(r.id,'submit')} style={{padding:'4px 12px',borderRadius:6,background:'#FF9800',color:'#fff',border:'none',cursor:'pointer',fontSize:11}}>📤 {isAr?'إرسال':'Submit'}</button>}
                                {r.status==='SUBMITTED' && <>
                                    <button onClick={()=>doAction(r.id,'approve')} style={{padding:'4px 12px',borderRadius:6,background:'#4CAF50',color:'#fff',border:'none',cursor:'pointer',fontSize:11}}>✅ {isAr?'موافقة':'Approve'}</button>
                                    <button onClick={()=>doAction(r.id,'reject')} style={{padding:'4px 12px',borderRadius:6,background:'#F44336',color:'#fff',border:'none',cursor:'pointer',fontSize:11}}>❌ {isAr?'رفض':'Reject'}</button>
                                </>}
                            </td>
                        </tr>
                    )) : <tr><td colSpan={5} style={{padding:40,textAlign:'center',color:'#ccc'}}>{isAr?'لا توجد تقارير':'No reports'}</td></tr>}</tbody>
                </table>
            </div>
        </div>
    );
}
