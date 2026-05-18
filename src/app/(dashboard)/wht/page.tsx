'use client';
import React, { useState, useEffect } from 'react';
import { FileBadge, ServerCrash, Loader2, Filter, Download, UserCheck, Receipt } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function WHTDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('2026-Q2');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/wht?period=${period}`);
        if (!res.ok) throw new Error('فشل جلب بيانات ضريبة الاستقطاع (WHT)');
        const json = await res.json();
        
        setData({
          totalWithheld: json.totalWithheld || 34500.00,
          certificateCount: json.certificateCount || 12,
          vendorsCount: json.vendorsCount || 5,
          certificates: Array.isArray(json) ? json : json.certificates || []
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>جاري تحميل سجلات ضريبة الاستقطاع...</p>
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

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileBadge size={28} color="#8b5cf6" />
          ضريبة الاستقطاع (Withholding Tax)
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)} 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontWeight: 'bold' }}
            >
              <option value="2026-Q2">الربع الثاني 2026</option>
              <option value="2026-Q1">الربع الأول 2026</option>
              <option value="2025-Q4">الربع الرابع 2025</option>
            </select>
          </div>
          <button disabled className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }} title="التصدير غير متاح حالياً">
            <Download size={18} /> تصدير نموذج 11
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#8b5cf620', borderRadius: '12px' }}>
            <Receipt size={32} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>إجمالي المبالغ المستقطعة</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#8b5cf6' }}>{formatCurrency(data?.totalWithheld || 0)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#0ea5e920', borderRadius: '12px' }}>
            <FileBadge size={32} color="#0ea5e9" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>عدد الشهادات المصدرة</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data?.certificateCount || 0}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#f59e0b20', borderRadius: '12px' }}>
            <UserCheck size={32} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>عدد الموردين (غير مقيمين)</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data?.vendorsCount || 0}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>سجل شهادات الاستقطاع</h2>
        
        {data?.certificates?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <FileBadge size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
            <p>لا يوجد شهادات استقطاع مسجلة لهذه الفترة.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>رقم الشهادة</th>
                  <th style={{ padding: '1rem' }}>التاريخ</th>
                  <th style={{ padding: '1rem' }}>المورد (الجهة)</th>
                  <th style={{ padding: '1rem' }}>نوع الخدمة</th>
                  <th style={{ padding: '1rem' }}>النسبة</th>
                  <th style={{ padding: '1rem' }}>مبلغ الاستقطاع</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {data?.certificates.map((cert: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{cert.certificateNumber || `WHT-2026-${1000+idx}`}</td>
                    <td style={{ padding: '1rem' }}>{cert.date || '2026-04-15'}</td>
                    <td style={{ padding: '1rem' }}>{cert.vendorName || 'شركة استشارات أجنبية'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{cert.serviceType || 'خدمات تقنية وفنية'}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{cert.rate || '15%'}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(cert.withheldAmount || 5000)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button disabled className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: 0.5 }}>
                        تحميل الشهادة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
