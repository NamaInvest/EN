'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function DeferredRevenuePage() {
    const { lang } = useTranslation();
    const isAr = lang === 'ar';
    const [schedules, setSchedules] = useState<any[]>([]);
    const [pending, setPending] = useState<any[]>([]);
    const [tab, setTab] = useState<'schedules'|'pending'>('schedules');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ invoiceId:'', type:'REVENUE', totalAmount:'', startDate: new Date().toISOString().slice(0,10), periods:'12' });

    useEffect(() => {
        fetch('/api/accounting/deferred').then(r=>r.json()).then(d=>setSchedules(Array.isArray(d)?d:[])).catch(()=>{});
        fetch('/api/accounting/deferred?view=pending').then(r=>r.json()).then(d=>setPending(Array.isArray(d)?d:[])).catch(()=>{});
    }, []);

    const save = () => {
        fetch('/api/accounting/deferred', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...form, invoiceId: parseInt(form.invoiceId), totalAmount: parseFloat(form.totalAmount), periods: parseInt(form.periods) }) })
            .then(r=>r.json()).then(s => { setSchedules([s,...schedules]); setShowForm(false); });
    };
    const postEntry = (id: number) => {
        fetch('/api/accounting/deferred', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'post_entry', entryId: id }) })
            .then(()=> setPending(pending.filter(p=>p.id!==id)));
    };

    return (
        <div style={{ padding:24, direction:isAr?'rtl':'ltr' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h1 style={{ fontSize:24, fontWeight:700 }}>{isAr?'📆 الإيرادات والمصروفات المؤجلة':'📆 Deferred Revenue & Expenses'}</h1>
                <button onClick={()=>setShowForm(!showForm)} style={{ padding:'10px 24px', borderRadius:10, background:'#673AB7', color:'#fff', border:'none', cursor:'pointer', fontWeight:700 }}>
                    {showForm?'✕':'+'} {isAr?'جدول جديد':'New Schedule'}
                </button>
            </div>
            {showForm && (
                <div style={{ background:'#fff', borderRadius:12, padding:20, marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                    <div>
                        <label style={{fontSize:12,color:'#888'}}>{isAr?'رقم الفاتورة':'Invoice ID'}</label>
                        <input value={form.invoiceId} onChange={e=>setForm({...form,invoiceId:e.target.value})} type="number" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}} />
                    </div>
                    <div>
                        <label style={{fontSize:12,color:'#888'}}>{isAr?'النوع':'Type'}</label>
                        <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}}>
                            <option value="REVENUE">{isAr?'إيراد':'Revenue'}</option>
                            <option value="EXPENSE">{isAr?'مصروف':'Expense'}</option>
                        </select>
                    </div>
                    <div>
                        <label style={{fontSize:12,color:'#888'}}>{isAr?'المبلغ الإجمالي':'Total Amount'}</label>
                        <input value={form.totalAmount} onChange={e=>setForm({...form,totalAmount:e.target.value})} type="number" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}} />
                    </div>
                    <div>
                        <label style={{fontSize:12,color:'#888'}}>{isAr?'تاريخ البداية':'Start Date'}</label>
                        <input value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} type="date" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}} />
                    </div>
                    <div>
                        <label style={{fontSize:12,color:'#888'}}>{isAr?'عدد الفترات (شهور)':'Periods (months)'}</label>
                        <input value={form.periods} onChange={e=>setForm({...form,periods:e.target.value})} type="number" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}} />
                    </div>
                    <div style={{display:'flex',alignItems:'flex-end'}}>
                        <button onClick={save} style={{width:'100%',padding:'10px',borderRadius:8,background:'#4CAF50',color:'#fff',border:'none',cursor:'pointer',fontWeight:700}}>💾 {isAr?'إنشاء الجدول':'Create Schedule'}</button>
                    </div>
                </div>
            )}
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <button onClick={()=>setTab('schedules')} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:tab==='schedules'?'#673AB7':'#e8e8e8', color:tab==='schedules'?'#fff':'#555', cursor:'pointer', fontWeight:600 }}>📋 {isAr?'الجداول':'Schedules'} ({schedules.length})</button>
                <button onClick={()=>setTab('pending')} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:tab==='pending'?'#FF9800':'#e8e8e8', color:tab==='pending'?'#fff':'#555', cursor:'pointer', fontWeight:600 }}>⏳ {isAr?'بانتظار الترحيل':'Pending'} ({pending.length})</button>
            </div>
            <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                {tab==='schedules' ? (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr style={{background:'#EDE7F6'}}>
                            <th style={{padding:10}}>#</th><th style={{padding:10}}>{isAr?'الفاتورة':'Invoice'}</th>
                            <th style={{padding:10}}>{isAr?'النوع':'Type'}</th><th style={{padding:10}}>{isAr?'المبلغ':'Amount'}</th>
                            <th style={{padding:10}}>{isAr?'الفترات':'Periods'}</th><th style={{padding:10}}>{isAr?'شهري':'Monthly'}</th>
                        </tr></thead>
                        <tbody>{schedules.length>0?schedules.map(s=>(
                            <tr key={s.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                                <td style={{padding:10}}>{s.id}</td><td style={{padding:10}}>#{s.invoiceId}</td>
                                <td style={{padding:10,textAlign:'center'}}><span style={{background:s.type==='REVENUE'?'#E8F5E9':'#FFF3E0',color:s.type==='REVENUE'?'#4CAF50':'#FF9800',padding:'2px 10px',borderRadius:6,fontSize:12}}>{s.type}</span></td>
                                <td style={{padding:10,textAlign:'center',fontWeight:700}}>{Number(s.totalAmount||0).toLocaleString()}</td>
                                <td style={{padding:10,textAlign:'center'}}>{s.periods}</td>
                                <td style={{padding:10,textAlign:'center'}}>{(Number(s.totalAmount||0)/Number(s.periods||1)).toFixed(2)}</td>
                            </tr>
                        )):<tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#ccc'}}>{isAr?'لا توجد جداول':'No schedules'}</td></tr>}</tbody>
                    </table>
                ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr style={{background:'#FFF3E0'}}>
                            <th style={{padding:10}}>{isAr?'التاريخ':'Date'}</th><th style={{padding:10}}>{isAr?'المبلغ':'Amount'}</th>
                            <th style={{padding:10}}>{isAr?'إجراء':'Action'}</th>
                        </tr></thead>
                        <tbody>{pending.length>0?pending.map(e=>(
                            <tr key={e.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                                <td style={{padding:10}}>{new Date(e.periodDate).toLocaleDateString()}</td>
                                <td style={{padding:10,textAlign:'center',fontWeight:700}}>{Number(e.amount||0).toLocaleString()}</td>
                                <td style={{padding:10,textAlign:'center'}}><button onClick={()=>postEntry(e.id)} style={{padding:'4px 16px',borderRadius:6,background:'#4CAF50',color:'#fff',border:'none',cursor:'pointer',fontSize:12}}>✅ {isAr?'ترحيل':'Post'}</button></td>
                            </tr>
                        )):<tr><td colSpan={3} style={{padding:40,textAlign:'center',color:'#4CAF50'}}>✅ {isAr?'لا يوجد مستحق':'All posted'}</td></tr>}</tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
