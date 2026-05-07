import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n';
export default function PlanningPage() {
  const { error: te, success: ts } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({employeeName:'',role:'',startTime:'',endTime:'',notes:''});
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const r = await fetch('/api/planning/slots',{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}}); if(r.ok) setSlots(await r.json()); } catch{} finally { setLoading(false); } };
  const save = async (e:React.FormEvent) => { e.preventDefault(); try { await fetch('/api/planning/slots',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('token')}`},body:JSON.stringify(form)}); ts(_t('تم','Done')); setShowModal(false); load(); } catch(e:any){te(e?.message);} };
  const employees = [...new Set(slots.map(s=>s.employeeName).filter(Boolean))];
  const today = new Date();
  return (<div style={{padding:'24px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',flexWrap:'wrap',gap:'16px'}}>
      <div><h1 style={{fontSize:'24px',fontWeight:'bold',display:'flex',alignItems:'center',gap:'10px'}}><Calendar size={28} color="var(--primary)"/> {_t('التخطيط والجدولة','Planning & Scheduling')}</h1></div>
      <button className="btn btn-primary" onClick={()=>{setForm({employeeName:'',role:'',startTime:'',endTime:'',notes:''});setShowModal(true);}}><Plus size={20}/> {_t('وردية جديدة','New Shift')}</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'16px',marginBottom:'24px'}}>
      {[{l:_t('اليوم','Today'),v:slots.filter(s=>new Date(s.startTime).toDateString()===today.toDateString()).length,c:'#3B82F6'},{l:_t('الموظفون','Employees'),v:employees.length,c:'#22C55E'},{l:_t('الإجمالي','Total'),v:slots.length,c:'#6366F1'}].map((s,i)=>(<div key={i} className="card" style={{padding:'16px',borderTop:`3px solid ${s.c}`}}><div style={{fontSize:'12px',color:'var(--text-muted)'}}>{s.l}</div><div style={{fontSize:'28px',fontWeight:'800',color:s.c,marginTop:'4px'}}>{s.v}</div></div>))}
    </div>
    {loading?<div style={{textAlign:'center',padding:'40px'}}>{_t('جاري التحميل...','Loading...')}</div>:
    <div className="card" style={{overflow:'auto'}}><table className="table"><thead><tr><th>{_t('الموظف','Employee')}</th><th>{_t('الدور','Role')}</th><th>{_t('البداية','Start')}</th><th>{_t('النهاية','End')}</th><th>{_t('ملاحظات','Notes')}</th></tr></thead><tbody>
      {slots.map(s=>(<tr key={s.id}><td style={{fontWeight:'600'}}>{s.employeeName}</td><td>{s.role||'-'}</td><td style={{fontSize:'12px'}}>{new Date(s.startTime).toLocaleString(lang==='ar'?'ar-SA':'en-US')}</td><td style={{fontSize:'12px'}}>{new Date(s.endTime).toLocaleString(lang==='ar'?'ar-SA':'en-US')}</td><td>{s.notes||'-'}</td></tr>))}
      {slots.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:'30px',color:'var(--text-muted)'}}>{_t('لا توجد ورديات','No shifts')}</td></tr>}
    </tbody></table></div>}
    {showModal&&(<div className="modal-overlay"><div className="modal-content" style={{maxWidth:'500px'}}><div className="modal-header"><h2>{_t('وردية جديدة','New Shift')}</h2><button className="btn btn-ghost" onClick={()=>setShowModal(false)}>✕</button></div><div className="modal-body"><form onSubmit={save}><div className="grid-2"><div className="input-group"><label className="input-label">{_t('الموظف','Employee')}*</label><input className="input" required value={form.employeeName} onChange={e=>setForm({...form,employeeName:e.target.value})}/></div><div className="input-group"><label className="input-label">{_t('الدور','Role')}</label><input className="input" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/></div><div className="input-group"><label className="input-label">{_t('البداية','Start')}*</label><input className="input" type="datetime-local" required value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})}/></div><div className="input-group"><label className="input-label">{_t('النهاية','End')}*</label><input className="input" type="datetime-local" required value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})}/></div></div><div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'20px'}}><button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>{_t('إلغاء','Cancel')}</button><button type="submit" className="btn btn-primary">{_t('حفظ','Save')}</button></div></form></div></div></div>)}
  </div>);
}
