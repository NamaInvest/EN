'use client';
import React, { useState, useEffect } from 'react';
import { CalendarDays, ServerCrash, Loader2, Lock, Unlock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function FiscalPeriodsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/fiscal-periods');
        if (!res.ok) throw new Error('فشل جلب الفترات المالية');
        const json = await res.json();
        
        // Mock data if generic
        const periods = Array.isArray(json) && json.length > 0 ? json : [
          { id: 1, name: 'يناير 2026', startDate: '2026-01-01', endDate: '2026-01-31', status: 'HARD_LOCKED' },
          { id: 2, name: 'فبراير 2026', startDate: '2026-02-01', endDate: '2026-02-28', status: 'HARD_LOCKED' },
          { id: 3, name: 'مارس 2026', startDate: '2026-03-01', endDate: '2026-03-31', status: 'SOFT_LOCKED' },
          { id: 4, name: 'أبريل 2026', startDate: '2026-04-01', endDate: '2026-04-30', status: 'OPEN' },
          { id: 5, name: 'مايو 2026', startDate: '2026-05-01', endDate: '2026-05-31', status: 'OPEN' }
        ];
        setData(periods);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>جاري تحميل الفترات المالية...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem', color: '#ef4444', direction: 'rtl' }}>
        <ServerCrash size={64} opacity={0.5} style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ marginBottom: '1rem' }}>فشل الاتصال</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ marginTop: '2rem' }}>إعادة المحاولة</button>
      </div>
    );
  }

  const renderBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: '#22c55e20', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}><Unlock size={14} /> مفتوحة</span>;
      case 'SOFT_LOCKED':
        return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: '#f59e0b20', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}><Lock size={14} /> إغلاق مبدئي (Soft)</span>;
      case 'HARD_LOCKED':
        return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: '#ef444420', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}><ShieldCheck size={14} /> مغلقة نهائياً (Hard)</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarDays size={28} color="var(--primary)" />
          الفترات المالية (Fiscal Periods)
        </h1>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#b45309', fontSize: '1.1rem' }}>إغلاق الفترات المالية</h3>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.95rem', lineHeight: 1.5 }}>
            الفترات المغلقة (Hard Locked) تمنع بشكل قاطع أي إدخالات أو تعديلات محاسبية بأثر رجعي. الفترات ذات الإغلاق المبدئي (Soft Locked) تسمح بالتعديل للمشرفين الماليين فقط وتُسجَّل في سجلات التدقيق.
          </p>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>اسم الفترة</th>
              <th style={{ padding: '1rem' }}>تاريخ البداية</th>
              <th style={{ padding: '1rem' }}>تاريخ النهاية</th>
              <th style={{ padding: '1rem' }}>الحالة (Governance Status)</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {data.map((period: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{period.name}</td>
                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{period.startDate}</td>
                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{period.endDate}</td>
                <td style={{ padding: '1rem' }}>{renderBadge(period.status)}</td>
                <td style={{ padding: '1rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button disabled title="العملية معطلة (واجهة عرض فقط)" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: 0.5, cursor: 'not-allowed' }}>
                      إغلاق مبدئي
                    </button>
                    <button disabled title="العملية معطلة (واجهة عرض فقط)" className="btn" style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: 0.5, border: 'none', cursor: 'not-allowed' }}>
                      إغلاق نهائي
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
