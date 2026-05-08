'use client';
import { useState, useEffect } from 'react';
import { Shield, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n';

export default function ComplianceDashboard() {
  const { error: toastError, success: toastSuccess } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ title: '', category: 'OPERATIONAL', likelihood: 3, impact: 3, owner: '', mitigationPlan: '', status: 'OPEN' });

  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const r = await fetch('/api/compliance/risks', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); if (r.ok) setRisks(await r.json()); } catch {} finally { setLoading(false); } };
  const save = async (e: React.FormEvent) => { e.preventDefault(); try { const r = await fetch('/api/compliance/risks', { method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(form) }); if (r.ok) { toastSuccess(_t('تم الحفظ','Saved')); setShowModal(false); load(); } } catch (e: any) { toastError(e?.message); } };

  const heatmapColors = (score: number) => score >= 16 ? '#EF4444' : score >= 9 ? '#F97316' : score >= 4 ? '#EAB308' : '#22C55E';
  const stats = { total: risks.length, critical: risks.filter(r => r.riskScore >= 16).length, high: risks.filter(r => r.riskScore >= 9 && r.riskScore < 16).length, open: risks.filter(r => r.status === 'OPEN').length };
  const catLabels: any = { OPERATIONAL: _t('تشغيلي','Operational'), FINANCIAL: _t('مالي','Financial'), STRATEGIC: _t('استراتيجي','Strategic'), COMPLIANCE: _t('امتثال','Compliance'), CYBER: _t('سيبراني','Cyber') };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div><h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Shield size={28} color="var(--primary)" /> {_t('الحوكمة والمخاطر والامتثال','Governance, Risk & Compliance')}</h1><p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>{_t('GRC - إدارة المخاطر المؤسسية','GRC - Enterprise Risk Management')}</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ title: '', category: 'OPERATIONAL', likelihood: 3, impact: 3, owner: '', mitigationPlan: '', status: 'OPEN' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> {_t('إضافة خطر','Add Risk')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[{ label: _t('إجمالي المخاطر','Total Risks'), value: stats.total, icon: <Shield size={20} />, color: '#6366F1' }, { label: _t('حرجة','Critical'), value: stats.critical, icon: <XCircle size={20} />, color: '#EF4444' }, { label: _t('عالية','High'), value: stats.high, icon: <AlertTriangle size={20} />, color: '#F97316' }, { label: _t('مفتوحة','Open'), value: stats.open, icon: <CheckCircle size={20} />, color: '#22C55E' }].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${s.color}` }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.label}</span><span style={{ color: s.color }}>{s.icon}</span></div><div style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px', color: s.color }}>{s.value}</div></div>
        ))}
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>{_t('مصفوفة المخاطر (Risk Heatmap)','Risk Heatmap Matrix')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: '4px', maxWidth: '500px' }}>
          <div></div>{[1,2,3,4,5].map(i => <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', padding: '4px' }}>{_t('أثر','Impact')} {i}</div>)}
          {[5,4,3,2,1].map(l => (<>{[0,1,2,3,4,5].map(i => i === 0 ? <div key={`l${l}`} style={{ fontSize: '11px', fontWeight: '600', padding: '4px', display: 'flex', alignItems: 'center' }}>{_t('احتمال','Likelihood')} {l}</div> : <div key={`${l}-${i}`} style={{ background: heatmapColors(l * i) + '30', border: `2px solid ${heatmapColors(l * i)}`, borderRadius: '6px', padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: heatmapColors(l * i), minHeight: '36px' }}>{risks.filter(r => r.likelihood === l && r.impact === i).length || ''}</div>)}</>))}
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{_t('جاري التحميل...','Loading...')}</div> : (
        <div className="card" style={{ overflow: 'auto' }}><table className="table"><thead><tr><th>{_t('الخطر','Risk')}</th><th>{_t('الفئة','Category')}</th><th>{_t('الاحتمال','Likelihood')}</th><th>{_t('الأثر','Impact')}</th><th>{_t('النتيجة','Score')}</th><th>{_t('المسؤول','Owner')}</th><th>{_t('الحالة','Status')}</th><th></th></tr></thead><tbody>
          {risks.map(r => (<tr key={r.id}><td style={{ fontWeight: '600' }}>{r.title}</td><td>{catLabels[r.category]||r.category}</td><td>{r.likelihood}</td><td>{r.impact}</td><td><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', background: heatmapColors(r.riskScore) + '20', color: heatmapColors(r.riskScore) }}>{r.riskScore}</span></td><td>{r.owner || '-'}</td><td>{r.status}</td><td><button className="btn btn-ghost btn-sm" onClick={() => { setForm(r); setShowModal(true); }}>✏️</button></td></tr>))}
          {risks.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{_t('لا توجد مخاطر مسجلة','No risks registered')}</td></tr>}
        </tbody></table></div>
      )}

      {showModal && (<div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '600px' }}><div className="modal-header"><h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{form.id ? _t('تعديل الخطر','Edit Risk') : _t('خطر جديد','New Risk')}</h2><button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button></div><div className="modal-body"><form onSubmit={save}><div className="grid-2">
        <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">{_t('عنوان الخطر','Risk Title')} *</label><input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">{_t('الفئة','Category')}</label><select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="OPERATIONAL">{_t('تشغيلي','Operational')}</option><option value="FINANCIAL">{_t('مالي','Financial')}</option><option value="STRATEGIC">{_t('استراتيجي','Strategic')}</option><option value="COMPLIANCE">{_t('امتثال','Compliance')}</option><option value="CYBER">{_t('سيبراني','Cyber')}</option></select></div>
        <div className="input-group"><label className="input-label">{_t('المسؤول','Owner')}</label><input className="input" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">{_t('الاحتمال','Likelihood')} (1-5)</label><input className="input" type="number" min="1" max="5" value={form.likelihood} onChange={e => setForm({ ...form, likelihood: parseInt(e.target.value) })} /></div>
        <div className="input-group"><label className="input-label">{_t('الأثر','Impact')} (1-5)</label><input className="input" type="number" min="1" max="5" value={form.impact} onChange={e => setForm({ ...form, impact: parseInt(e.target.value) })} /></div>
        <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">{_t('خطة التخفيف','Mitigation Plan')}</label><textarea className="input" rows={3} value={form.mitigationPlan || ''} onChange={e => setForm({ ...form, mitigationPlan: e.target.value })} /></div>
      </div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{_t('إلغاء','Cancel')}</button><button type="submit" className="btn btn-primary">{_t('حفظ','Save')}</button></div></form></div></div></div>)}
    </div>
  );
}
