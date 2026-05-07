'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { FileText, Plus, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

const catColors: any = { GENERAL: '#3B82F6', SALES: '#22C55E', PURCHASE: '#F97316', EMPLOYMENT: '#8B5CF6', LEASE: '#EAB308' };

export default function ContractTemplates() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError, success: toastSuccess } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ name: '', category: 'GENERAL', content: '', active: true });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const t = localStorage.getItem('token');
      const r = await fetch('/api/contracts/templates', { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setItems(await r.json());
    } catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = localStorage.getItem('token');
    try {
      const r = await fetch('/api/contracts/templates', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(form)
      });
      if (r.ok) { toastSuccess('تم الحفظ'); setShowModal(false); load(); }
    } catch (e: any) { toastError(e?.message); }
  };

  const del = async (id: number) => {
    if (!confirm('حذف القالب وجميع البنود؟')) return;
    await fetch(`/api/contracts/templates?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    load();
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={28} color="var(--primary)" /> قوالب العقود</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>إدارة دورة حياة العقود - قوالب، بنود، تجديد</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', category: 'GENERAL', content: '', active: true }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> قالب جديد</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {Object.entries(catColors).map(([cat, color]) => {
          const count = items.filter(i => i.category === cat).length;
          return (
            <div key={cat} className="card" style={{ padding: '16px', borderRight: `4px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{cat}</div><div style={{ fontSize: '22px', fontWeight: '900' }}>{count}</div></div>
              <FileText size={24} color={color as string} style={{ opacity: 0.3 }} />
            </div>
          );
        })}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['القالب', 'التصنيف', 'عدد البنود', 'الحالة', 'الإجراء'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {items.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '700' }}>{t.name}</td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (catColors[t.category] || '#94A3B8') + '20', color: catColors[t.category] }}>{t.category}</span></td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{t._count?.clauses || 0}</td>
                  <td style={{ padding: '12px' }}>{t.active ? <CheckCircle size={18} color="#22C55E" /> : <XCircle size={18} color="#EF4444" />}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setForm(t); setShowModal(true); }}><Edit3 size={15} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(t.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد قوالب بعد</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '600px' }}>
          <div className="modal-header"><h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{form.id ? 'تعديل القالب' : 'قالب جديد'}</h2><button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="modal-body"><form onSubmit={save}>
            <div className="grid-2">
              <div className="input-group"><label className="input-label">اسم القالب *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">التصنيف</label><select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{Object.keys(catColors).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">المحتوى</label><textarea className="input" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="نص القالب / HTML..." /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              <button type="submit" className="btn btn-primary">حفظ</button>
            </div>
          </form></div>
        </div></div>
      )}
    </div>
  );
}
