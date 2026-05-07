import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { Layers, FileSearch, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function OpenItemsDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ ap: 0, ar: 0, unapplied: 0 });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/accounting/open-items', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) {
          const d = await r.json();
          if (d.stats) setStats(d.stats);
          setItems(d.items || d.data || d || []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const cards = [
    { l: _t('ذمم موردين مفتوحة', 'Open AP (Vendors)'), v: `${fmt(stats.ap)} ${_t('ر.س', 'SAR')}`, c: '#F97316', ic: ArrowRightLeft },
    { l: _t('ذمم عملاء مفتوحة', 'Open AR (Customers)'), v: `${fmt(stats.ar)} ${_t('ر.س', 'SAR')}`, c: '#22C55E', ic: ArrowRightLeft },
    { l: _t('مدفوعات غير مطبقة', 'Unapplied Payments'), v: `${fmt(stats.unapplied)} ${_t('ر.س', 'SAR')}`, c: '#3B82F6', ic: Layers },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={28} color="var(--primary)" /> {_t('تصفية البنود المفتوحة', 'Open Items Clearing')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>{_t('مطابقة وتصفية فواتير AP/AR مع المدفوعات', 'Match and clear open AP/AR invoices against payments')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileSearch size={16} /> {_t('بحث عن مطابقات', 'Find Matches')}</button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={16} /> {_t('تصفية تلقائية', 'Auto-Clear')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800' }}>{c.v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('البنود المفتوحة (قيد التصفية)', 'Open Items (Pending Clearance)')}</h3>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>{_t('جاري التحميل...', 'Loading...')}</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>{_t('نوع الطرف', 'Party Type')}</th>
                <th>{_t('نوع المستند', 'Doc Type')}</th>
                <th>{_t('رقم المستند', 'Doc Number')}</th>
                <th>{_t('التاريخ', 'Date')}</th>
                <th>{_t('المبلغ المفتوح', 'Open Amount')}</th>
                <th style={{ textAlign: 'center' }}>{_t('إجراء', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{_t('لا توجد بنود مفتوحة', 'No open items')}</td></tr>
              ) : items.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ textTransform: 'capitalize', fontWeight: '500' }}>{item.partyType === 'vendor' ? _t('مورد', 'Vendor') : _t('عميل', 'Customer')}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.documentType?.replace('_', ' ')}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{item.documentNumber}</td>
                  <td>{item.documentDate?.slice?.(0, 10) || '—'}</td>
                  <td style={{ fontWeight: '600' }}>{Number(item.openAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {_t('ر.س', 'SAR')}</td>
                  <td style={{ textAlign: 'center' }}><button className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('تصفية', 'Clear')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
