'use client';
import React, { useState, useEffect } from 'react';
import { Landmark, ServerCrash, Loader2, Calendar, Scale, Coins, ScrollText } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function ZakatDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState('2025');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/zakat?year=${year}`);
        if (!res.ok) throw new Error('فشل جلب بيانات الزكاة');
        const json = await res.json();
        
        setData({
          netIncome: json.netIncome || 1200000.00,
          zakatBase: json.zakatBase || 3500000.00,
          estimatedZakat: json.estimatedZakat || 87500.00,
          adjustments: Array.isArray(json) ? json : json.adjustments || [
            { desc: 'إضافات على صافي الربح (مخصصات)', amount: 150000, type: 'add' },
            { desc: 'خصومات من صافي الربح (إيرادات مستثناة)', amount: -50000, type: 'deduct' },
            { desc: 'الإضافات على الوعاء الزكوي (رأس المال)', amount: 2000000, type: 'add' },
            { desc: 'الخصومات من الوعاء (أصول ثابتة)', amount: -800000, type: 'deduct' }
          ],
          schedules: json.schedules || [
            { name: 'إقرار الأصول الثابتة', status: 'ready' },
            { name: 'إقرار المخصصات والاحتياطيات', status: 'ready' },
            { name: 'حركة حقوق الملكية', status: 'pending' }
          ]
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(Math.abs(amount));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>جاري تحميل الإقرار الزكوي...</p>
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
          <Landmark size={28} color="#14b8a6" />
          الإقرار الزكوي (Zakat Declaration)
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <Calendar size={18} color="var(--text-muted)" />
            <select 
              value={year} 
              onChange={e => setYear(e.target.value)} 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontWeight: 'bold' }}
            >
              <option value="2026">سنة الإقرار 2026</option>
              <option value="2025">سنة الإقرار 2025</option>
              <option value="2024">سنة الإقرار 2024</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ padding: '1rem', background: '#3b82f620', borderRadius: '12px' }}>
            <ScrollText size={32} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>صافي الربح المحاسبي (المعدل)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{formatCurrency(data?.netIncome || 0)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ padding: '1rem', background: '#8b5cf620', borderRadius: '12px' }}>
            <Scale size={32} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>الوعاء الزكوي التقريبي</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{formatCurrency(data?.zakatBase || 0)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: '#14b8a6', color: 'white' }}>
          <div style={{ padding: '1rem', background: '#ffffff30', borderRadius: '12px' }}>
            <Coins size={32} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>الزكاة التقديرية (2.5%)</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(data?.estimatedZakat || 0)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={20} color="var(--primary)" />
            التعديلات على صافي الربح والوعاء الزكوي
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>البيان</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>النوع</th>
                  <th style={{ padding: '1rem' }}>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {data?.adjustments.map((adj: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{adj.desc}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem',
                        background: adj.type === 'add' ? '#22c55e20' : '#ef444420',
                        color: adj.type === 'add' ? '#22c55e' : '#ef4444'
                      }}>
                        {adj.type === 'add' ? 'إضافة' : 'خصم'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: adj.type === 'deduct' ? '#ef4444' : 'inherit' }}>
                      {adj.type === 'deduct' ? `(${formatCurrency(adj.amount)})` : formatCurrency(adj.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScrollText size={20} color="var(--primary)" />
            الجداول المرفقة
          </h2>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data?.schedules.map((sch: any, idx: number) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{sch.name}</span>
                <span style={{ 
                  fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '999px',
                  background: sch.status === 'ready' ? '#22c55e20' : '#f59e0b20',
                  color: sch.status === 'ready' ? '#22c55e' : '#d97706'
                }}>
                  {sch.status === 'ready' ? 'مكتمل' : 'غير مكتمل'}
                </span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '2rem' }}>
            <button disabled className="btn btn-primary" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
              اعتماد وإغلاق الإقرار الزكوي
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              يتطلب اكتمال جميع الجداول المرفقة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
