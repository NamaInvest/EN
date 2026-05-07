'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Edit3, Trash2, BarChart3, ArrowUpDown, Layers } from 'lucide-react';
import { useToast } from '@/components/Toast';

const statusColors: any = { ACTIVE: '#22C55E', DRAFT: '#94A3B8', ARCHIVED: '#6B7280' };

export default function BudgetScenarios() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ name: '', description: '', baseYear: new Date().getFullYear(), growthRate: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const t = localStorage.getItem('token');
      const r = await fetch('/api/budgets/scenarios', { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setItems(await r.json());
    } catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = localStorage.getItem('token');
    try {
      const r = await fetch('/api/budgets/scenarios', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(form)
      });
      if (r.ok) { toastSuccess('تم الحفظ'); setShowModal(false); load(); }
    } catch (e: any) { toastError(e?.message); }
  };

  const del = async (id: number) => {
    if (!confirm('حذف؟')) return;
    await fetch(`/api/budgets/scenarios?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    load();
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Layers size={28} color="var(--primary)" /> سيناريوهات الميزانية</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>تحليل What-If للميزانيات (Best/Worst/Most Likely)</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '', baseYear: new Date().getFullYear(), growthRate: '' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> سيناريو جديد</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: Layers, label: 'إجمالي السيناريوهات', value: items.length, color: '#3B82F6' },
          { icon: TrendingUp, label: 'النشطة', value: items.filter(i => i.status === 'ACTIVE').length, color: '#22C55E' },
          { icon: BarChart3, label: 'إجمالي البنود', value: items.reduce((a, c) => a + (c._count?.lines || 0), 0), color: '#8B5CF6' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ padding: '10px', background: k.color + '15', color: k.color, borderRadius: '12px' }}><k.icon size={22} /></div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{k.label}</span>
            </div>
            <span style={{ fontSize: '26px', fontWeight: '900' }}>{k.value}</span>
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {items.map(s => (
            <div key={s.id} className="card" style={{ padding: '20px', borderTop: `4px solid ${statusColors[s.status] || '#94A3B8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '4px' }}>{s.name}</h3>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: (statusColors[s.status] || '#94A3B8') + '20', color: statusColors[s.status], fontWeight: '700' }}>{s.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setForm(s); setShowModal(true); }}><Edit3 size={15} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(s.id)}><Trash2 size={15} /></button>
                </div>
              </div>
              {s.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{s.description}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', background: 'var(--bg-body)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '16px', fontWeight: '800' }}>{s.baseYear}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>السنة الأساس</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '16px', fontWeight: '800', color: (s.growthRate || 0) >= 0 ? '#22C55E' : '#EF4444' }}>{s.growthRate || 0}%</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>معدل النمو</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '16px', fontWeight: '800' }}>{s._count?.lines || 0}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>بند</div></div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>لا توجد سيناريوهات بعد</div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '500px', animation: 'slideUp 0.3s ease' }}>
          <div className="modal-header"><h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{form.id ? 'تعديل' : 'سيناريو جديد'}</h2><button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="modal-body"><form onSubmit={save}>
            <div className="grid-2">
              <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">اسم السيناريو *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">السنة الأساس</label><input className="input" type="number" dir="ltr" value={form.baseYear} onChange={e => setForm({ ...form, baseYear: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">معدل النمو %</label><input className="input" type="number" step="0.1" dir="ltr" value={form.growthRate || ''} onChange={e => setForm({ ...form, growthRate: e.target.value })} /></div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">الوصف</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
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
