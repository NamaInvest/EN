'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';

interface PrepEntry { id: number; description: string; totalAmount: number; monthlyAmount: number; remainingMonths: number; status: string; reference?: string }

export default function PrepaymentsPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const [entries, setEntries]     = useState<PrepEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [msg, setMsg]             = useState<{type:'ok'|'err'; text:string}|null>(null);
  const [form, setForm]           = useState({ description: '', totalAmount: '', months: '12', prepaidAccountId: '1510', expenseAccountId: '6100', reference: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/accounting/prepayments?tenantId=default&status=ACTIVE');
      const d = await r.json();
      setEntries(d.prepayments ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.description || !form.totalAmount) return setMsg({ type:'err', text: isAr?'أدخل الوصف والمبلغ':'Enter description and amount' });
    setLoading(true); setMsg(null);
    try {
      const now = new Date();
      const r = await fetch('/api/accounting/prepayments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default',
          period: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`,
          fiscalYearId: 1, userId: 1,
          prepayments: [{
            description:      form.description,
            totalAmount:      parseFloat(form.totalAmount),
            months:           parseInt(form.months),
            prepaidAccountId: parseInt(form.prepaidAccountId),
            expenseAccountId: parseInt(form.expenseAccountId),
            reference:        form.reference || undefined,
          }],
        }),
      });
      const d = await r.json();
      setMsg({ type: r.ok?'ok':'err', text: d.message ?? d.error });
      if (r.ok) { setShowForm(false); setForm({ description:'', totalAmount:'', months:'12', prepaidAccountId:'1510', expenseAccountId:'6100', reference:'' }); await load(); }
    } catch (e) { setMsg({ type:'err', text: String(e) }); }
    setLoading(false);
  };

  const statusColor: Record<string,string> = { ACTIVE:'#2196F3', COMPLETED:'#4CAF50', CANCELLED:'#9E9E9E' };
  const statusAr:    Record<string,string> = { ACTIVE:'نشط', COMPLETED:'مكتمل', CANCELLED:'ملغى' };

  const totalActive    = entries.filter(e=>e.status==='ACTIVE').reduce((s,e)=>s+(e.remainingMonths*e.monthlyAmount),0);
  const totalMonthly   = entries.filter(e=>e.status==='ACTIVE').reduce((s,e)=>s+e.monthlyAmount,0);

  return (
    <div style={{ padding:24, direction:dir, fontFamily:'system-ui, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>{isAr?'💳 المدفوعات المقدمة':'💳 Prepayments & Amortization'}</h1>
          <p style={{ color:'#666', fontSize:13 }}>{isAr?'جدول استهلاك المدفوعات المقدمة وتحكم يدوي في القيود':'Prepaid expense amortization schedule and manual entry'}</p>
        </div>
        <button onClick={()=>setShowForm(true)} style={{ padding:'10px 20px', borderRadius:8, background:'#2196F3', color:'#fff', border:'none', cursor:'pointer', fontWeight:700 }}>
          + {isAr?'مدفوع جديد':'New Prepayment'}
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:20 }}>
        {[
          { label: isAr?'مدفوعات نشطة':'Active Entries', value: entries.filter(e=>e.status==='ACTIVE').length, color:'#2196F3' },
          { label: isAr?'الرصيد المتبقي':'Remaining Balance', value: `${totalActive.toLocaleString('ar-SA')} ${isAr?'ر.س':'SAR'}`, color:'#FF9800' },
          { label: isAr?'الاستهلاك الشهري':'Monthly Amortization', value: `${totalMonthly.toLocaleString('ar-SA')} ${isAr?'ر.س':'SAR'}`, color:'#4CAF50' },
        ].map((c,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:10, padding:'16px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:700, color:c.color }}>{c.value}</div>
            <div style={{ fontSize:12, color:'#666', marginTop:4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {msg && <div style={{ padding:'10px 16px', background:msg.type==='ok'?'#E8F5E9':'#FFEBEE', color:msg.type==='ok'?'#2E7D32':'#C62828', borderRadius:8, marginBottom:12, fontSize:13, fontWeight:600 }}>{msg.type==='ok'?'✅':'❌'} {msg.text}</div>}

      {/* Entries table */}
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#F5F7FA' }}>
            {[isAr?'الوصف':'Description', isAr?'المبلغ الكلي':'Total', isAr?'شهري':'Monthly', isAr?'الأشهر المتبقية':'Remaining', isAr?'الحالة':'Status'].map(h=>(
              <th key={h} style={{ padding:'11px 16px', textAlign:isAr?'right':'left', fontWeight:600, color:'#555' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'#999' }}>...</td></tr>}
            {!loading && entries.map(e => (
              <tr key={e.id} style={{ borderBottom:'1px solid #F0F0F0' }}>
                <td style={{ padding:'10px 16px' }}>
                  <div style={{ fontWeight:600 }}>{e.description}</div>
                  {e.reference && <div style={{ fontSize:11, color:'#999' }}>{e.reference}</div>}
                </td>
                <td style={{ padding:'10px 16px', fontFamily:'monospace', fontWeight:600 }}>{e.totalAmount.toLocaleString('ar-SA')}</td>
                <td style={{ padding:'10px 16px', fontFamily:'monospace', color:'#FF9800', fontWeight:600 }}>{e.monthlyAmount.toLocaleString('ar-SA')}</td>
                <td style={{ padding:'10px 16px', textAlign:'center' }}>
                  <div style={{ background: e.remainingMonths<=3?'#FFEBEE':'#E3F2FD', color:e.remainingMonths<=3?'#C62828':'#1A237E', padding:'2px 10px', borderRadius:12, fontSize:12, fontWeight:700, display:'inline-block' }}>
                    {e.remainingMonths} {isAr?'شهر':'mo'}
                  </div>
                </td>
                <td style={{ padding:'10px 16px' }}>
                  <span style={{ background: statusColor[e.status]+'20', color:statusColor[e.status], padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:700 }}>
                    {isAr ? statusAr[e.status] : e.status}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && entries.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'#999' }}>{isAr?'لا توجد مدفوعات مقدمة نشطة':'No active prepayments'}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* New Prepayment Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:440, direction:dir }}>
            <h3 style={{ marginBottom:16, fontWeight:700 }}>+ {isAr?'تسجيل مدفوع مقدم جديد':'New Prepayment Entry'}</h3>
            {[
              { label: isAr?'الوصف:':'Description:', key:'description', type:'text', placeholder: isAr?'مثال: إيجار مكتب 2025':'e.g. Office Rent 2025' },
              { label: isAr?'المبلغ الكلي (ر.س):':'Total Amount (SAR):', key:'totalAmount', type:'number', placeholder:'0.00' },
              { label: isAr?'عدد الأشهر:':'Number of Months:', key:'months', type:'number', placeholder:'12' },
              { label: isAr?'ح. المدفوعات المقدمة:':'Prepaid Account ID:', key:'prepaidAccountId', type:'number', placeholder:'1510' },
              { label: isAr?'ح. المصروف:':'Expense Account ID:', key:'expenseAccountId', type:'number', placeholder:'6100' },
              { label: isAr?'المرجع:':'Reference:', key:'reference', type:'text', placeholder: isAr?'اختياري':'Optional' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:10 }}>
                <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:3 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder}
                  value={(form as any)[f.key]} onChange={e => setForm(p=>({...p, [f.key]: e.target.value}))}
                  style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', boxSizing:'border-box', fontSize:13 }} />
              </div>
            ))}
            {form.totalAmount && form.months && (
              <div style={{ background:'#E3F2FD', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:'#1A237E' }}>
                {isAr?'الاستهلاك الشهري:':'Monthly:'} <strong>{(parseFloat(form.totalAmount||'0')/parseInt(form.months||'1')).toFixed(2)} {isAr?'ر.س':'SAR'}</strong>
              </div>
            )}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={()=>setShowForm(false)} style={{ padding:'8px 20px', borderRadius:8, border:'1px solid #ddd', background:'#fff', cursor:'pointer' }}>{isAr?'إلغاء':'Cancel'}</button>
              <button onClick={submit} disabled={loading} style={{ padding:'8px 20px', borderRadius:8, background:'#2196F3', color:'#fff', border:'none', cursor:'pointer', fontWeight:700 }}>{loading?'...':isAr?'تسجيل':'Register'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
