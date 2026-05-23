'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

type Widget = { id: string; type: string; title: string; titleAr: string; x: number; y: number; w: number; h: number; dataSource: string; measure: string; color?: string };

export default function DashboardBuilderPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/system/dashboard-builder?view=defaults').then(r => r.json()).then(d => {
      setWidgets(d.widgets || []);
      loadData(d.widgets || []);
    }).catch(() => setLoading(false));
  }, []);

  const loadData = async (w: Widget[]) => {
    try {
      const res = await fetch('/api/system/dashboard-builder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'all_widgets', widgets: w }),
      });
      setWidgetData(await res.json());
    } catch { } finally { setLoading(false); }
  };

  const removeWidget = (id: string) => setWidgets(widgets.filter(w => w.id !== id));

  const renderWidget = (w: Widget) => {
    const data = widgetData[w.id];
    if (w.type === 'kpi') {
      return (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: `4px solid ${w.color || '#2196F3'}`, position: 'relative' }}>
          <button onClick={() => removeWidget(w.id)} style={{ position: 'absolute', top: 8, left: isAr ? 8 : 'auto', right: isAr ? 'auto' : 8, background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16 }}>×</button>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{isAr ? w.titleAr : w.title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: w.color || '#333' }}>{data?.value?.toLocaleString() || '0'}</div>
        </div>
      );
    }
    if (w.type === 'bar_chart' || w.type === 'line_chart') {
      const labels = data?.labels || [];
      const values = data?.values || [];
      const max = Math.max(...values, 1);
      return (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', gridColumn: `span ${Math.min(w.w, 2)}`, position: 'relative' }}>
          <button onClick={() => removeWidget(w.id)} style={{ position: 'absolute', top: 8, left: isAr ? 8 : 'auto', right: isAr ? 'auto' : 8, background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>×</button>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{isAr ? w.titleAr : w.title}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
            {values.slice(0, 12).map((v: number, i: number) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', background: '#2196F3', borderRadius: '4px 4px 0 0', height: `${(v / max) * 100}px`, minHeight: 2, transition: 'height 0.3s' }} />
                <div style={{ fontSize: 9, color: '#999', marginTop: 2, overflow: 'hidden', maxWidth: 40 }}>{labels[i]?.slice(0, 6)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (w.type === 'table') {
      const rows = Array.isArray(data) ? data : [];
      return (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', gridColumn: `span ${Math.min(w.w, 2)}`, position: 'relative' }}>
          <button onClick={() => removeWidget(w.id)} style={{ position: 'absolute', top: 8, left: isAr ? 8 : 'auto', right: isAr ? 'auto' : 8, background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>×</button>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{isAr ? w.titleAr : w.title}</div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9f9f9' }}><th style={{ padding: 6, textAlign: isAr ? 'right' : 'left' }}>#</th><th style={{ padding: 6 }}>{_t('المعرف', 'ID')}</th><th style={{ padding: 6 }}>{isAr ? 'القيمة' : 'Value'}</th></tr></thead>
            <tbody>{rows.slice(0, 8).map((r: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ padding: 6 }}>{i + 1}</td><td style={{ padding: 6 }}>{r.id}</td><td style={{ padding: 6 }}>{r[w.measure]?.toLocaleString?.() || '—'}</td></tr>
            ))}</tbody>
          </table>
        </div>
      );
    }
    return <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 20 }}>{w.type}</div>;
  };

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{isAr ? '📊 لوحة التحكم المخصصة' : '📊 Custom Dashboard'}</h1>
        <button onClick={() => loadData(widgets)} style={{ padding: '8px 20px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {isAr ? '🔄 تحديث' : '🔄 Refresh'}
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {widgets.map(w => <div key={w.id}>{renderWidget(w)}</div>)}
        </div>
      )}
    </div>
  );
}
