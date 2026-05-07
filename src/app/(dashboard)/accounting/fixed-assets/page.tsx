import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { Box, Calculator, Settings, ArrowRightLeft, Plus, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function FixedAssetsDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ gross: 0, dep: 0, nbv: 0, hfs: 0 });
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/accounting/fixed-assets', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) {
          const d = await r.json();
          if (d.stats) setStats(d.stats);
          setAssets(d.assets || d.data || d || []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const cards = [
    { l: _t('إجمالي الأصول', 'Total Assets Value'), v: `${fmt(stats.gross)} ${_t('ر.س', 'SAR')}`, s: _t('القيمة الدفترية الإجمالية', 'Gross book value'), c: '#3B82F6', ic: Box },
    { l: _t('الاستهلاك المتراكم', 'Accumulated Depr.'), v: `${fmt(stats.dep)} ${_t('ر.س', 'SAR')}`, s: _t('منذ البداية', 'Life to date'), c: '#F97316', ic: Calculator },
    { l: _t('صافي القيمة الدفترية', 'Net Book Value'), v: `${fmt(stats.nbv)} ${_t('ر.س', 'SAR')}`, s: _t('القيمة الحالية', 'Current NBV'), c: '#22C55E', ic: Settings },
    { l: _t('معروضة للبيع', 'Held for Sale'), v: stats.hfs, s: _t('أصول قيد التحويل', 'Pending transfers'), c: '#8B5CF6', ic: ArrowRightLeft },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box size={28} color="var(--primary)" /> {_t('سجل الأصول الثابتة', 'Fixed Assets Register')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>{_t('إدارة دورة حياة الأصول والاستهلاك', 'Manage asset lifecycle, depreciation, and impairments')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16} /> {_t('إضافة أصل', 'Add Asset')}</button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calculator size={16} /> {_t('تشغيل الاستهلاك', 'Run Depreciation')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('آخر الأصول المضافة', 'Recent Asset Acquisitions')}</h3>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>{_t('جاري التحميل...', 'Loading...')}</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>{_t('رقم الأصل', 'Asset ID')}</th>
                <th>{_t('الوصف', 'Description')}</th>
                <th>{_t('الفئة', 'Category')}</th>
                <th>{_t('تاريخ الاقتناء', 'Acquisition Date')}</th>
                <th>{_t('القيمة', 'Value')}</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{_t('لا توجد أصول', 'No assets found')}</td></tr>
              ) : assets.map((a: any) => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{a.assetNumber}</td>
                  <td style={{ fontWeight: '600' }}>{a.name}</td>
                  <td>{a.category?.nameEn || a.category?.name || '—'}</td>
                  <td>{a.acquisitionDate?.slice?.(0, 10) || '—'}</td>
                  <td style={{ fontWeight: '600' }}>{Number(a.acquisitionCost || 0).toLocaleString()} {_t('ر.س', 'SAR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
