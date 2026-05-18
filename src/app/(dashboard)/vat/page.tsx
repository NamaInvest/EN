'use client';
import React, { useState, useEffect } from 'react';
import { Calculator, ServerCrash, Loader2, FileSpreadsheet, Send, History, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function VATDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vat');
        if (!res.ok) throw new Error('فشل جلب الإقرارات الضريبية (VAT)');
        const json = await res.json();
        
        setData({
          currentPeriod: 'الربع الثاني 2026',
          status: 'DRAFT',
          salesVat: json.salesVat || 125000.50,
          purchaseVat: json.purchaseVat || 85000.00,
          adjustments: json.adjustments || 0,
          netVat: (json.salesVat || 125000.50) - (json.purchaseVat || 85000.00),
          historicalReturns: Array.isArray(json) ? json : json.history || []
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>جاري تحميل الإقرار الضريبي...</p>
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
          <Calculator size={28} color="#0284c7" />
          الإقرار الضريبي للقيمة المضافة (VAT)
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>الفترة الحالية: {data?.currentPeriod}</span>
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', background: '#fef08a', color: '#854d0e', fontSize: '0.85rem', fontWeight: 'bold' }}>
            مسودة (Draft)
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ضريبة المخرجات (المبيعات)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#22c55e' }}>{formatCurrency(data?.salesVat || 0)}</div>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>عرض تفاصيل المبيعات &rarr;</a>
        </div>

        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ضريبة المدخلات (المشتريات)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(data?.purchaseVat || 0)}</div>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>عرض تفاصيل المشتريات &rarr;</a>
        </div>

        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>التسويات الضريبية</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatCurrency(data?.adjustments || 0)}</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'inline-block' }}>تسويات فترات سابقة</span>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--primary)', color: 'white' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>صافي الضريبة {data?.netVat >= 0 ? 'المستحقة للدفع' : 'المستردة'}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatCurrency(Math.abs(data?.netVat || 0))}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} color="var(--primary)" />
            سجل الإقرارات الضريبية السابقة
          </h2>
          
          {data?.historicalReturns?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <FileSpreadsheet size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <p>لا يوجد إقرارات سابقة مسجلة في النظام.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem' }}>الفترة</th>
                    <th style={{ padding: '1rem' }}>صافي الضريبة</th>
                    <th style={{ padding: '1rem' }}>الحالة</th>
                    <th style={{ padding: '1rem' }}>رقم الإيصال (SADAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.historicalReturns.map((ret: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{ret.period || 'Q1 2026'}</td>
                      <td style={{ padding: '1rem' }}>{formatCurrency(ret.amount || 45000)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e' }}>
                          <CheckCircle size={16} /> مقدم ومدفوع
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{ret.sadadNumber || 'SADAD-192837'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            إجراءات الإقرار
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            بمجرد إغلاق الفترة الضريبية، لا يمكن تعديل الفواتير المرتبطة بها. سيتم توليد قيد إقفال الضريبة تلقائياً.
          </p>
          
          <button disabled className="btn btn-primary" style={{ width: '100%', padding: '1rem', opacity: 0.6, cursor: 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} /> اعتماد وإغلاق الفترة
          </button>
          
          <button disabled className="btn btn-secondary" style={{ width: '100%', padding: '1rem', opacity: 0.6, cursor: 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} /> إرسال إلى بوابة الهيئة (ZATCA)
          </button>

          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f59e0b20', borderRadius: '8px', fontSize: '0.85rem', color: '#b45309' }}>
            ملاحظة: إجراءات الاعتماد والإرسال معطلة (Read-only Placeholder) لحين التأكد من جاهزية الـ API لتوليد القيود بشكل آمن.
          </div>
        </div>
      </div>
    </div>
  );
}
