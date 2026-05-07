'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Store, Plus, Edit3, Globe, Settings } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function EcommerceStores() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError, success: toastSuccess } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ name: '', slug: '', domain: '', theme: 'default' });

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try { const r = await fetch('/api/ecommerce/stores', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); if (r.ok) setStores(await r.json()); }
    catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await fetch('/api/ecommerce/stores', { method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(form) }); if (r.ok) { toastSuccess('تم الحفظ'); setShowModal(false); load(); } }
    catch (e: any) { toastError(e?.message); }
  };

  const statusColors: any = { ACTIVE: '#22C55E', MAINTENANCE: '#EAB308', DISABLED: '#EF4444' };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Store size={28} color="var(--primary)" /> المتاجر الإلكترونية</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>إدارة المتاجر والنطاقات</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', slug: '', domain: '', theme: 'default' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> متجر جديد</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {stores.map(s => (
            <div key={s.id} className="card" style={{ padding: '20px', borderRight: `4px solid ${statusColors[s.status] || '#94A3B8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{s.name}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => { setForm(s); setShowModal(true); }}><Edit3 size={14} /></button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'monospace' }}>/{s.slug}</div>
              {s.domain && <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', marginBottom: '8px' }}><Globe size={12} /> {s.domain}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '10px', background: 'var(--bg-body)', borderRadius: '8px' }}>
                <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (statusColors[s.status] || '#94A3B8') + '20', color: statusColors[s.status] }}>{s.status}</span>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>{s._count?.orders || 0} طلب</span>
              </div>
            </div>
          ))}
          {stores.length === 0 && <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>لا توجد متاجر</div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-header"><h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{form.id ? 'تعديل المتجر' : 'متجر جديد'}</h2><button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="modal-body"><form onSubmit={save}>
            <div className="grid-2">
              <div className="input-group"><label className="input-label">اسم المتجر *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">Slug *</label><input className="input" required dir="ltr" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">النطاق</label><input className="input" dir="ltr" value={form.domain || ''} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="store.example.com" /></div>
              <div className="input-group"><label className="input-label">القالب</label><select className="input" value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })}><option value="default">الافتراضي</option><option value="modern">عصري</option><option value="minimal">بسيط</option></select></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button><button type="submit" className="btn btn-primary">حفظ</button></div>
          </form></div>
        </div></div>
      )}
    </div>
  );
}
