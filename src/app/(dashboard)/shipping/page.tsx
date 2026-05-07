import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const statusColors: Record<string,string> = { CREATED:'#9E9E9E', PICKED_UP:'#FF9800', IN_TRANSIT:'#2196F3', DELIVERED:'#4CAF50' };
const CARRIERS = ['ARAMEX','SMSA','SPL','FETCHR'];

export default function ShippingPage() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const isAr = lang === 'ar';
    const [tab, setTab] = useState<'shipments'|'carriers'|'estimate'>('shipments');
    const [shipments, setShipments] = useState<any[]>([]);
    const [carriers, setCarriers] = useState<any[]>([]);
    const [estForm, setEstForm] = useState({ carrier:'ARAMEX', weight:'1', destination:'Riyadh' });
    const [estimate, setEstimate] = useState<any>(null);

    useEffect(() => {
        fetch('/api/shipping?view=shipments').then(r=>r.json()).then(d=>setShipments(Array.isArray(d)?d:[])).catch(()=>{});
        fetch('/api/shipping').then(r=>r.json()).then(d=>setCarriers(Array.isArray(d)?d:[])).catch(()=>{});
    }, []);

    const calcEstimate = () => {
        fetch('/api/shipping', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'estimate', ...estForm, weight:parseFloat(estForm.weight) }) })
            .then(r=>r.json()).then(setEstimate);
    };

    return (
        <div style={{ padding:24, direction:isAr?'rtl':'ltr' }}>
            <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>{isAr?'📦 إدارة الشحن':'📦 Shipping Management'}</h1>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {[{k:'shipments' as const, l:isAr?'الشحنات':'Shipments', c:'#2196F3'}, {k:'carriers' as const, l:isAr?'شركات الشحن':'Carriers', c:'#673AB7'}, {k:'estimate' as const, l:isAr?'تقدير التكلفة':'Cost Estimate', c:'#FF9800'}].map(t=>(
                    <button key={t.k} onClick={()=>setTab(t.k)} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:tab===t.k?t.c:'#e8e8e8', color:tab===t.k?'#fff':'#555', cursor:'pointer', fontWeight:600 }}>{t.l}</button>
                ))}
            </div>
            <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden', padding: tab==='estimate'?20:0 }}>
                {tab==='shipments' && (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr style={{background:'#E3F2FD'}}>
                            <th style={{padding:10}}>{_t('AWB', 'AWB')}</th><th style={{padding:10}}>{isAr?'الطلب':'Order'}</th>
                            <th style={{padding:10}}>{isAr?'الحالة':'Status'}</th><th style={{padding:10}}>{isAr?'التكلفة':'Cost'}</th>
                        </tr></thead>
                        <tbody>{shipments.length>0?shipments.map(s=>(
                            <tr key={s.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                                <td style={{padding:10,fontWeight:600,fontFamily:'monospace'}}>{s.awbNumber||'-'}</td>
                                <td style={{padding:10}}>#{s.orderId}</td>
                                <td style={{padding:10,textAlign:'center'}}><span style={{background:(statusColors[s.status]||'#999')+'20',color:statusColors[s.status],padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:600}}>{s.status}</span></td>
                                <td style={{padding:10,textAlign:'center'}}>{s.cost?`${s.cost} SAR`:'-'}</td>
                            </tr>
                        )):<tr><td colSpan={4} style={{padding:40,textAlign:'center',color:'#ccc'}}>{isAr?'لا توجد شحنات':'No shipments'}</td></tr>}</tbody>
                    </table>
                )}
                {tab==='carriers' && (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr style={{background:'#EDE7F6'}}>
                            <th style={{padding:10}}>{isAr?'الشركة':'Carrier'}</th><th style={{padding:10}}>{isAr?'الحالة':'Status'}</th>
                        </tr></thead>
                        <tbody>{carriers.length>0?carriers.map(c=>(
                            <tr key={c.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                                <td style={{padding:10,fontWeight:600}}>{c.name}</td>
                                <td style={{padding:10,textAlign:'center'}}><span style={{background:c.isActive?'#E8F5E9':'#FFEBEE',color:c.isActive?'#4CAF50':'#F44336',padding:'3px 10px',borderRadius:6,fontSize:12}}>{c.isActive?(isAr?'مفعل':'Active'):(isAr?'معطل':'Inactive')}</span></td>
                            </tr>
                        )):<tr><td colSpan={2} style={{padding:40,textAlign:'center',color:'#ccc'}}>{isAr?'لا توجد شركات':'No carriers configured'}</td></tr>}</tbody>
                    </table>
                )}
                {tab==='estimate' && (
                    <div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, marginBottom:16 }}>
                            <div>
                                <label style={{fontSize:12,color:'#888'}}>{isAr?'الشركة':'Carrier'}</label>
                                <select value={estForm.carrier} onChange={e=>setEstForm({...estForm,carrier:e.target.value})} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}}>
                                    {CARRIERS.map(c=><option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{fontSize:12,color:'#888'}}>{isAr?'الوزن (كجم)':'Weight (kg)'}</label>
                                <input value={estForm.weight} onChange={e=>setEstForm({...estForm,weight:e.target.value})} type="number" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}} />
                            </div>
                            <div>
                                <label style={{fontSize:12,color:'#888'}}>{isAr?'الوجهة':'Destination'}</label>
                                <input value={estForm.destination} onChange={e=>setEstForm({...estForm,destination:e.target.value})} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ddd'}} />
                            </div>
                            <div style={{display:'flex',alignItems:'flex-end'}}>
                                <button onClick={calcEstimate} style={{padding:'8px 20px',borderRadius:8,background:'#FF9800',color:'#fff',border:'none',cursor:'pointer',fontWeight:700}}>⚡ {isAr?'حساب':'Calculate'}</button>
                            </div>
                        </div>
                        {estimate && (
                            <div style={{ background:'#FFF3E0', borderRadius:10, padding:20, textAlign:'center' }}>
                                <div style={{ fontSize:12, color:'#888' }}>{isAr?'التكلفة التقديرية':'Estimated Cost'}</div>
                                <div style={{ fontSize:32, fontWeight:700, color:'#FF9800' }}>{estimate.estimatedCost} SAR</div>
                                <div style={{ fontSize:13, color:'#888' }}>{estimate.carrier} • {estimate.weight}kg → {estimate.destination}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
