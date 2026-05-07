'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Headphones, Plus, AlertTriangle, Clock, CheckCircle, XCircle, Edit3, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/Toast';

const prioColors: any = { LOW: '#94A3B8', MEDIUM: '#3B82F6', HIGH: '#EAB308', URGENT: '#EF4444' };
const statusColors: any = { OPEN: '#3B82F6', IN_PROGRESS: '#8B5CF6', WAITING: '#EAB308', RESOLVED: '#22C55E', CLOSED: '#94A3B8' };

export default function SupportTickets() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError, success: toastSuccess } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<any>({ subject: '', description: '', priority: 'MEDIUM', category: 'GENERAL' });

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const t = localStorage.getItem('token');
      const q = filter ? `?status=${filter}` : '';
      const r = await fetch(`/api/crm/tickets${q}`, { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setTickets(await r.json());
    } catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = localStorage.getItem('token');
    try {
      const r = await fetch('/api/crm/tickets', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(form)
      });
      if (r.ok) { toastSuccess('تم الحفظ'); setShowModal(false); load(); }
    } catch (e: any) { toastError(e?.message); }
  };

  const changeStatus = async (id: number, status: string) => {
    const t = localStorage.getItem('token');
    await fetch('/api/crm/tickets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id, status })
    });
    load();
  };

  const open = tickets.filter(t => t.status === 'OPEN').length;
  const inProg = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolved = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Headphones size={28} color="var(--primary)" /> تذاكر الدعم الفني</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>إدارة طلبات الدعم وتتبع SLA</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ subject: '', description: '', priority: 'MEDIUM', category: 'GENERAL' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> تذكرة جديدة</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: AlertTriangle, label: 'مفتوحة', value: open, color: '#3B82F6' },
          { icon: Clock, label: 'قيد المعالجة', value: inProg, color: '#8B5CF6' },
          { icon: CheckCircle, label: 'تم الحل', value: resolved, color: '#22C55E' },
          { icon: Headphones, label: 'الإجمالي', value: tickets.length, color: '#EAB308' }
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '18px', cursor: 'pointer', border: filter === (['OPEN','IN_PROGRESS','RESOLVED',''][i]) ? `2px solid ${k.color}` : undefined }} onClick={() => setFilter(filter === ['OPEN','IN_PROGRESS','RESOLVED',''][i] ? '' : ['OPEN','IN_PROGRESS','RESOLVED',''][i])}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: k.color+'15', color: k.color, borderRadius: '10px' }}><k.icon size={20} /></div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{k.label}</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '900' }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Tickets Table */}
      {loading ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['#', 'الموضوع', 'الأولوية', 'الحالة', 'الفئة', 'SLA', 'التاريخ', 'الإجراء'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {tickets.map(tk => (
                <tr key={tk.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '700', fontFamily: 'monospace', fontSize: '13px' }}>{tk.ticketNo}</td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{tk.subject}</td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (prioColors[tk.priority]||'#94A3B8')+'20', color: prioColors[tk.priority] }}>{tk.priority}</span></td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (statusColors[tk.status]||'#94A3B8')+'20', color: statusColors[tk.status] }}>{tk.status}</span></td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>{tk.category || '-'}</td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{tk.sla ? `${tk.sla.responseHours}h / ${tk.sla.resolutionHours}h` : '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(tk.createdAt).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {tk.status === 'OPEN' && <button className="btn btn-ghost btn-sm" title="بدء المعالجة" onClick={() => changeStatus(tk.id, 'IN_PROGRESS')} style={{ color: '#8B5CF6' }}><Clock size={15} /></button>}
                      {tk.status === 'IN_PROGRESS' && <button className="btn btn-ghost btn-sm" title="تم الحل" onClick={() => changeStatus(tk.id, 'RESOLVED')} style={{ color: '#22C55E' }}><CheckCircle size={15} /></button>}
                      {tk.status === 'RESOLVED' && <button className="btn btn-ghost btn-sm" title="إغلاق" onClick={() => changeStatus(tk.id, 'CLOSED')} style={{ color: '#94A3B8' }}><XCircle size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tickets.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد تذاكر</div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '550px', animation: 'slideUp 0.3s ease' }}>
          <div className="modal-header"><h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>تذكرة جديدة</h2><button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="modal-body"><form onSubmit={save}>
            <div className="grid-2">
              <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">الموضوع *</label><input className="input" required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
              <div className="input-group"><label className="input-label">الأولوية</label><select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option value="LOW">منخفضة</option><option value="MEDIUM">متوسطة</option><option value="HIGH">عالية</option><option value="URGENT">عاجلة</option></select></div>
              <div className="input-group"><label className="input-label">الفئة</label><select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="GENERAL">عام</option><option value="TECHNICAL">تقني</option><option value="BILLING">مالي</option><option value="FEATURE_REQUEST">طلب ميزة</option></select></div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}><label className="input-label">الوصف</label><textarea className="input" rows={3} value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              <button type="submit" className="btn btn-primary">إنشاء التذكرة</button>
            </div>
          </form></div>
        </div></div>
      )}
    </div>
  );
}
