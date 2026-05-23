'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ServerCrash, Loader2, Search, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function FXDashboardPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/fx');
        if (!res.ok) throw new Error('فشل جلب أسعار صرف العملات');
        const json = await res.json();
        
        // Mock data if generic
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const lastMonth = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
        
        const rates = Array.isArray(json) && json.length > 0 ? json : [
          { currency: 'USD', name: 'الدولار الأمريكي', rate: 3.7500, date: today, isPegged: true, trend: 'stable' },
          { currency: 'EUR', name: 'اليورو الأوروبي', rate: 4.1250, date: today, isPegged: false, trend: 'up' },
          { currency: 'GBP', name: 'الجنيه الإسترليني', rate: 4.8520, date: yesterday, isPegged: false, trend: 'down' },
          { currency: 'AED', name: 'الدرهم الإماراتي', rate: 1.0210, date: today, isPegged: true, trend: 'stable' },
          { currency: 'KWD', name: 'الدينار الكويتي', rate: 12.2450, date: lastMonth, isPegged: false, trend: 'stale' }
        ];
        setData(rates);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const staleRates = data.filter(r => r.trend === 'stale');
  
  const filteredData = data.filter(r => 
    !searchQuery || 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>جاري تحميل أسعار الصرف...</p>
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
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ArrowLeftRight size={28} color="#8b5cf6" />
          {_t('أسعار صرف العملات (FX معدلات)', 'أسعار صرف العملات (FX Rates)')}</h1>
        <button disabled className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }} title="التحديث التلقائي يحتاج تكوين API الخارجي (SAMA/Fixer)">
          <RefreshCw size={18} /> تحديث الأسعار
        </button>
      </div>

      {staleRates.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#ef444415', border: '1px solid #ef444440', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <AlertTriangle size={24} color="#b91c1c" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '1.1rem' }}>تحذير: أسعار صرف غير محدثة</h3>
            <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.95rem', lineHeight: 1.5 }}>
              يوجد {staleRates.length} عملة ذات أسعار صرف قديمة جداً. الاعتماد عليها في تسويات البنوك أو تقييم الأرصدة (FX Revaluation) قد يسبب فروقات محاسبية. يرجى التحديث.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>العملة الأساسية (Functional)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>SAR</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>الريال السعودي</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>عدد العملات المعرفة</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            className="input" 
            style={{ flex: 1 }} 
            placeholder="ابحث برمز العملة أو اسمها..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>الرمز</th>
              <th style={{ padding: '1rem' }}>اسم العملة</th>
              <th style={{ padding: '1rem' }}>سعر الصرف (مقابل SAR)</th>
              <th style={{ padding: '1rem' }}>تاريخ التحديث</th>
              <th style={{ padding: '1rem' }}>النوع</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((rate: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>{rate.currency}</td>
                <td style={{ padding: '1rem' }}>{rate.name}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {rate.rate.toFixed(4)}
                  {rate.trend === 'up' && <TrendingUp size={14} color="#22c55e" style={{ marginRight: '0.5rem', display: 'inline' }} />}
                </td>
                <td style={{ padding: '1rem', color: rate.trend === 'stale' ? '#ef4444' : 'inherit', fontWeight: rate.trend === 'stale' ? 'bold' : 'normal' }}>
                  {rate.date}
                </td>
                <td style={{ padding: '1rem' }}>
                  {rate.isPegged ? (
                    <span style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#4b5563' }}>ثابت (Pegged)</span>
                  ) : (
                    <span style={{ background: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#0369a1' }}>متغير (Floating)</span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'left' }}>
                  <button disabled className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: 0.5, cursor: 'not-allowed' }}>
                    تعديل السعر
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
