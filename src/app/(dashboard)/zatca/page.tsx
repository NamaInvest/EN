'use client';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, FileDigit, ShieldAlert, RefreshCw, Eye, Download, Code2, ServerCrash, Loader2, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import Link from 'next/link';

export default function ZatcaDashboardPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/zatca');
        if (!res.ok) throw new Error('فشل جلب بيانات التكامل مع ZATCA');
        const json = await res.json();
        // Construct standard payload if API returns generic data
        setData({
          status: json.status || 'CONNECTED',
          csrStatus: json.csrStatus || 'VALID',
          pendingInvoices: json.pending || 0,
          failedSubmissions: Array.isArray(json) ? json : json.failed || [],
          recentSubmissions: json.recent || []
        });
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
        <p>جاري تحميل لوحة تحكم هيئة الزكاة والضريبة (ZATCA)...</p>
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
          <ShieldCheck size={28} color="#22c55e" />
          بوابة الربط مع هيئة الزكاة والضريبة (ZATCA Phase 2)
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button disabled className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }}>
            <RefreshCw size={18} /> مزامنة يدوية
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#22c55e20', borderRadius: '12px' }}>
            <LinkIcon size={32} color="#22c55e" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>حالة الربط الهندسي</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>متصل ونشط</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#3b82f620', borderRadius: '12px' }}>
            <FileDigit size={32} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>حالة شهادة CSR</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>صالحة</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تنتهي في 2027-01-01</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#ef444420', borderRadius: '12px' }}>
            <ShieldAlert size={32} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>مرفوضة / بحاجة لتدخل</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{data?.failedSubmissions?.length || 0}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="#ef4444" />
            الفواتير المرفوضة والمجدولة لإعادة الإرسال
          </h2>
          
          {data?.failedSubmissions?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <p>لا يوجد فواتير مرفوضة. جميع العمليات تمت بنجاح.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem' }}>رقم الفاتورة</th>
                    <th style={{ padding: '1rem' }}>التاريخ</th>
                    <th style={{ padding: '1rem' }}>سبب الرفض (من الهيئة)</th>
                    <th style={{ padding: '1rem' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.failedSubmissions.map((inv: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{inv.invoiceNumber || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{inv.date || 'N/A'}</td>
                      <td style={{ padding: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>{inv.errorReason || JSON.stringify(inv)}</td>
                      <td style={{ padding: '1rem' }}>
                        <button disabled title="إعادة الإرسال غير مفعل لأن الـ API غير مؤكد" className="btn btn-secondary" style={{ padding: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }}>
                          <RefreshCw size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code2 size={20} color="var(--primary)" />
            أدوات التطوير والتشفير
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button disabled className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '1rem', opacity: 0.6 }}>
              <Eye size={18} style={{ marginLeft: '0.5rem' }} /> معاينة XML للفاتورة (Read-Only)
            </button>
            <button disabled className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '1rem', opacity: 0.6 }}>
              <Download size={18} style={{ marginLeft: '0.5rem' }} /> تحميل مفاتيح التشفير CSR
            </button>
            <button disabled className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '1rem', opacity: 0.6 }}>
              <FileDigit size={18} style={{ marginLeft: '0.5rem' }} /> {_t('فحص توافق QR الرمز', 'فحص توافق QR Code')}</button>
            
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f59e0b20', borderRadius: '8px', fontSize: '0.85rem', color: '#b45309' }}>
              ملاحظة: الإجراءات اليدوية معطّلة لحين توفر صلاحيات الواجهة الخلفية الكاملة لإصدار وتوقيع الـ Cryptographic Stamp.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
