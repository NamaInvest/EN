'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { CreditCard, Plus, Users, TrendingUp, Clock, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import { useToast } from '@/components/Toast';

const cycleLabel: any = { MONTHLY: 'شهري', QUARTERLY: 'ربع سنوي', SEMI_ANNUAL: 'نصف سنوي', ANNUAL: 'سنوي' };

export default function SubscriptionPlans() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError, success: toastSuccess } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ name: '', code: '', price: '', billingCycle: 'MONTHLY', trialDays: 0, description: '' });

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try { const r = await fetch('/api/subscriptions/plans', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); if (r.ok) setPlans(await r.json()); }
    catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await fetch('/api/subscriptions/plans', { method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(form) }); if (r.ok) { toastSuccess('تم الحفظ'); setShowModal(false); load(); } }
    catch (e: any) { toastError(e?.message); }
  };

  const totalSubs = plans.reduce((a, p) => a + (p._count?.subscriptions || 0), 0);
  const totalMRR = plans.reduce((a, p) => a + (p.price * (p._count?.subscriptions || 0)), 0);

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><CreditCard size={28} color="var(--primary)" /> إدارة الاشتراكات</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>خطط الاشتراك والفوترة المتكررة</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', code: '', price: '', billingCycle: 'MONTHLY', trialDays: 0, description: '' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> خطة جديدة</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: CreditCard, label: 'الخطط', value: plans.length, color: '#3B82F6' },
          { icon: Users, label: 'المشتركين', value: totalSubs, color: '#8B5CF6' },
          { icon: TrendingUp, label: 'MRR', value: `${totalMRR.toLocaleString()} SAR`, color: '#22C55E' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}><div style={{ padding: '10px', background: k.color + '15', color: k.color, borderRadius: '12px' }}><k.icon size={22} /></div><span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{k.label}</span></div>
            <span style={{ fontSize: '26px', fontWeight: '900' }}>{k.value}</span>
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {plans.map(p => (
            <div key={p.id} className="card" style={{ padding: '24px', textAlign: 'center', borderTop: `4px solid ${p.active ? '#3B82F6' : '#94A3B8'}`, position: 'relative' }}>
              <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: '12px', left: '12px' }} onClick={() => { setForm(p); setShowModal(true); }}><Edit3 size={14} /></button>
              <div style={{ fontSize: '12px', fontWeight: '700', color: p.active ? '#22C55E' : '#EF4444', marginBottom: '8px' }}>{p.active ? '● نشطة' : '● معطلة'}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>{p.name}</h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>{p.code}</div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary)', marginBottom: '4px' }}>{p.price} <span style={{ fontSize: '14px', fontWeight: '500' }}>SAR</span></div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{cycleLabel[p.billingCycle] || p.billingCycle}</div>
              {p.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>{p.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', background: 'var(--bg-body)', padding: '12px', borderRadius: '10px' }}>
                <div><div style={{ fontSize: '18px', fontWeight: '800' }}>{p._count?.subscriptions || 0}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>مشترك</div></div>
                <div><div style={{ fontSize: '18px', fontWeight: '800' }}>{p.trialDays}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>أيام تجريبية</div></div>
                <div><div style={{ fontSize: '18px', fontWeight: '800' }}>{p.maxUsers || '∞'}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>مستخدمين</div></div>
              </div>
            </div>
          ))}
          {plans.length === 0 && <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>لا توجد خطط اشتراك</div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-header"><h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{form.id ? 'تعديل الخطة' : 'خطة جديدة'}</h2><button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="modal-body"><form onSubmit={save}>
            <div className="grid-2">
              <div className="input-group"><label className="input-label">اسم الخطة *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">الكود *</label><input className="input" required dir="ltr" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">السعر (SAR) *</label><input className="input" type="number" dir="ltr" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">دورة الفوترة</label><select className="input" value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}>{Object.entries(cycleLabel).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
              <div className="input-group"><label className="input-label">أيام تجريبية</label><input className="input" type="number" dir="ltr" value={form.trialDays || 0} onChange={e => setForm({ ...form, trialDays: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">الحد الأقصى للمستخدمين</label><input className="input" type="number" dir="ltr" value={form.maxUsers || ''} onChange={e => setForm({ ...form, maxUsers: e.target.value })} placeholder="∞" /></div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">الوصف</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button><button type="submit" className="btn btn-primary">حفظ</button></div>
          </form></div>
        </div></div>
      )}
    </div>
  );
}
