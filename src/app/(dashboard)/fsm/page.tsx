'use client';
import { useState, useEffect } from 'react';
import { Activity, Wrench, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function FSMDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/fsm/tickets', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) { const d = await r.json(); setTickets(d.tickets || d.data || d || []); }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const openCount = tickets.filter(t => t.status === 'open').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;

  const kpis = [
    { l: _t('إجمالي التذاكر', 'Total Tickets'), v: tickets.length, c: '#3B82F6', ic: Activity },
    { l: _t('تذاكر مفتوحة', 'Open Tickets'), v: openCount, c: '#F97316', ic: Clock },
    { l: _t('تذاكر مكتملة', 'Completed'), v: completedCount, c: '#22C55E', ic: CheckCircle },
  ];

  const PRIORITY_COLORS: Record<string, string> = { high: '#EF4444', urgent: '#EF4444', medium: '#F59E0B', low: '#3B82F6' };
  const STATUS_COLORS: Record<string, string> = { completed: '#22C55E', open: '#F97316', in_progress: '#3B82F6' };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={28} color="var(--primary)" /> {_t('لوحة الخدمة الميدانية', 'Field Service Dashboard')}
          </h1>
        </div>
        <Link href="/fsm/dispatch"><button className="btn btn-primary">{_t('لوحة الإرسال', 'Dispatch Board')}</button></Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{loading ? '...' : c.v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('آخر التذاكر', 'Recent Tickets')}</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{_t('رقم التذكرة', 'Ticket #')}</th>
              <th>{_t('الوصف', 'Description')}</th>
              <th style={{ textAlign: 'center' }}>{_t('الأولوية', 'Priority')}</th>
              <th style={{ textAlign: 'center' }}>{_t('الحالة', 'Status')}</th>
              <th>{_t('الفني', 'Technician')}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.slice(0, 10).map((t: any) => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>#{t.ticketNo}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', background: (PRIORITY_COLORS[t.priority] || '#3B82F6') + '20', color: PRIORITY_COLORS[t.priority] || '#3B82F6' }}>{t.priority}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', background: (STATUS_COLORS[t.status] || '#F97316') + '20', color: STATUS_COLORS[t.status] || '#F97316' }}>{t.status}</span>
                </td>
                <td>{t.technicianId ? `Tech #${t.technicianId}` : _t('غير معين', 'Unassigned')}</td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{_t('لا توجد تذاكر', 'No tickets found')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
