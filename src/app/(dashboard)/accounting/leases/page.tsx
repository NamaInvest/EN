import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { Briefcase, Building, FileSignature, DollarSign, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function LeasesDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ rou: 0, liability: 0, contracts: 0, monthly: 0 });
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/accounting/leases', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) {
          const d = await r.json();
          if (d.stats) setStats(d.stats);
          setLeases(d.leases || d.data || d || []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const STATUS_COLORS: Record<string, string> = { ACTIVE: '#22C55E', EXPIRED: '#9CA3AF', TERMINATED: '#EF4444' };
  const cards = [
    { l: _t('أصول حق الاستخدام', 'Total ROU Assets'), v: `${fmt(stats.rou)} ${_t('ر.س', 'SAR')}`, s: _t('صافي القيمة الدفترية', 'Net book value'), c: '#3B82F6', ic: Building },
    { l: _t('التزامات الإيجار', 'Lease Liabilities'), v: `${fmt(stats.liability)} ${_t('ر.س', 'SAR')}`, s: _t('جارية + غير جارية', 'Current + Non-current'), c: '#EF4444', ic: Briefcase },
    { l: _t('عقود نشطة', 'Active Contracts'), v: stats.contracts, s: 'IFRS 16', c: '#22C55E', ic: FileSignature },
    { l: _t('أقساط شهرية مستحقة', 'Monthly Payments Due'), v: `${fmt(stats.monthly)} ${_t('ر.س', 'SAR')}`, s: _t('خلال 30 يوماً', 'Next 30 days'), c: '#F97316', ic: DollarSign },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={28} color="var(--primary)" /> {_t('محاسبة الإيجارات (IFRS 16)', 'Lease Accounting (IFRS 16)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>{_t('إدارة أصول حق الاستخدام والتزامات الإيجار', 'Manage right-of-use (ROU) assets and lease liabilities')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileSignature size={16} /> {_t('إضافة عقد', 'Add Lease')}</button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16} /> {_t('ترحيل القيود الشهرية', 'Post Monthly Entries')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800' }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.s}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('عقود الإيجار الأخيرة', 'Recent Lease Contracts')}</h3>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>{_t('جاري التحميل...', 'Loading...')}</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>{_t('رقم العقد', 'Lease ID')}</th>
                <th>{_t('الوصف', 'Description')}</th>
                <th>{_t('التصنيف', 'Class')}</th>
                <th>{_t('المؤجر', 'Lessor')}</th>
                <th style={{ textAlign: 'center' }}>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {leases.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{_t('لا توجد عقود إيجار', 'No active leases')}</td></tr>
              ) : leases.map((l: any) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{l.contractNumber}</td>
                  <td>{l.assetDescription}</td>
                  <td>{l.leaseClass}</td>
                  <td>{l.lessor}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: (STATUS_COLORS[l.status] || '#9CA3AF') + '20', color: STATUS_COLORS[l.status] || '#9CA3AF' }}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
