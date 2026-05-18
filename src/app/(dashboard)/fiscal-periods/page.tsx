'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, ServerCrash, Loader2, Lock, Unlock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function FiscalPeriodsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fiscal-periods');
      if (!res.ok) throw new Error('فشل جلب الفترات المالية');
      const json = await res.json();
      
      const periods = json.periods || (Array.isArray(json) ? json : []);
      setData(periods);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (year: number, month: number, action: 'close' | 'reopen') => {
    const actionText = action === 'close' ? 'إغلاق' : 'إعادة فتح';
    if (!window.confirm(`هل أنت متأكد من رغبتك في ${actionText} الفترة المالية ${month}/${year}؟ (هذا الإجراء سيتم تسجيله في سجل التدقيق)`)) {
      return;
    }

    setIsMutating(true);
    try {
      const res = await fetch('/api/fiscal-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, action })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `فشل في ${actionText} الفترة`);
      }
      // Re-fetch after successful mutation
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsMutating(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>جاري تحميل الفترات المالية...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
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
    const s = String(status).toUpperCase();
    if (s === 'OPEN') {
      return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: '#22c55e20', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}><Unlock size={14} /> مفتوحة</span>;
    }
    if (s === 'SOFT_LOCKED') {
      return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: '#f59e0b20', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}><Lock size={14} /> إغلاق مبدئي (Soft)</span>;
    }
    if (s === 'CLOSED' || s === 'HARD_LOCKED') {
      return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: '#ef444420', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}><ShieldCheck size={14} /> مغلقة نهائياً (Hard)</span>;
    }
    return <span>{status}</span>;
  };

  const padMonth = (m: number | string) => String(m).padStart(2, '0');

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarDays size={28} color="var(--primary)" />
          إدارة الفترات المالية
        </h1>
        {isMutating && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Loader2 className="animate-spin" size={16} /> جاري المعالجة...
          </span>
        )}
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#b45309', fontSize: '1.1rem' }}>إغلاق الفترات المالية</h3>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.95rem', lineHeight: 1.5 }}>
            الفترات المغلقة (Closed/Hard Locked) تمنع بشكل قاطع أي إدخالات أو تعديلات محاسبية بأثر رجعي لحفظ نزاهة القوائم المالية. إعادة الفتح مخصصة لصلاحيات (Admin) فقط.
          </p>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>السنة</th>
              <th style={{ padding: '1rem' }}>الشهر</th>
              <th style={{ padding: '1rem' }}>تاريخ البداية</th>
              <th style={{ padding: '1rem' }}>تاريخ النهاية</th>
              <th style={{ padding: '1rem' }}>الحالة (Governance Status)</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {data.map((period: any, idx: number) => {
              const year = period.year || 2026;
              const month = period.month || (idx + 1);
              const status = String(period.status).toUpperCase();
              const isOpen = status === 'OPEN';

              return (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{year}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{padMonth(month)}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{period.startDate || `${year}-${padMonth(month)}-01`}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{period.endDate || `${year}-${padMonth(month)}-28`}</td>
                  <td style={{ padding: '1rem' }}>{renderBadge(status)}</td>
                  <td style={{ padding: '1rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {isOpen ? (
                        <button 
                          onClick={() => handleAction(year, month, 'close')}
                          disabled={isMutating}
                          className="btn" 
                          style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: 'none', cursor: isMutating ? 'not-allowed' : 'pointer' }}
                        >
                          إغلاق الفترة
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAction(year, month, 'reopen')}
                          disabled={isMutating}
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: isMutating ? 'not-allowed' : 'pointer' }}
                        >
                          إعادة فتح
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
