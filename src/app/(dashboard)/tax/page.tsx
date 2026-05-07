'use client';
import { ShieldCheck, FileText, Globe, AlertTriangle, FileSpreadsheet, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function TaxDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const kpis = [
    { l: _t('تمت التصفية ZATCA', 'ZATCA Cleared'), v: '1,432', s: _t('فواتير B2B/B2C المرحلة 2', 'Phase 2 cleared B2B/B2C'), c: '#22C55E', ic: ShieldCheck },
    { l: _t('فشل ZATCA', 'ZATCA Failed'), v: 3, s: _t('تحتاج اهتمام فوري', 'Require immediate attention'), c: '#EF4444', ic: AlertTriangle },
    { l: _t('ضريبة استقطاع معلقة', 'WHT Pending'), v: `12,450 ${_t('ر.س', 'SAR')}`, s: _t('ضريبة مستحقة', 'Withholding tax payable'), c: '#3B82F6', ic: Globe },
    { l: _t('مخصص الزكاة', 'Zakat Provision'), v: `85,200 ${_t('ر.س', 'SAR')}`, s: _t('تقدير السنة الحالية', 'Estimated current fiscal year'), c: '#8B5CF6', ic: FileText },
  ];

  const vatReturns = [
    { id: 1, period: _t('الربع الأول 2026', 'Q1 2026'), status: 'DRAFT', amount: 45000, deadline: '2026-04-30' },
    { id: 2, period: _t('الربع الرابع 2025', 'Q4 2025'), status: 'SUBMITTED', amount: 42100, deadline: '2026-01-31' },
  ];

  const shortcuts = [
    { href: '/tax/zatca-onboard', icon: ShieldCheck, c: '#22C55E', title: _t('تسجيل ZATCA', 'ZATCA Onboarding'), desc: _t('إنشاء CSR والحصول على CSID و PCSID للفوترة الإلكترونية', 'Generate CSR, obtain CSID & PCSID for E-Invoicing Phase 2') },
    { href: '/tax/wht', icon: Globe, c: '#3B82F6', title: _t('إدارة ضريبة الاستقطاع', 'WHT Management'), desc: _t('حساب ضريبة الاستقطاع وإصدار شهادات للموردين الأجانب', 'Calculate WHT and issue certificates to foreign vendors') },
    { href: '/tax/zakat', icon: FileSpreadsheet, c: '#8B5CF6', title: _t('إقرار الزكاة', 'Zakat Declaration'), desc: _t('تقدير وعاء الزكاة (2.577%) بناء على البيانات المالية', 'Estimate Zakatable base (2.577%) based on financials') },
    { href: '#', icon: AlertTriangle, c: '#EF4444', title: _t('الإرسالات الفاشلة', 'Failed Submissions'), desc: _t('مراجعة وإعادة إرسال 3 فواتير ZATCA فاشلة', 'Review and retry 3 failed ZATCA invoice submissions') },
  ];

  const STATUS_COLORS: Record<string, string> = { SUBMITTED: '#22C55E', DRAFT: '#9CA3AF', FILED: '#3B82F6' };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#22C55E" /> {_t('الضريبة وامتثال ZATCA', 'Tax & ZATCA Compliance')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('إدارة ضريبة القيمة المضافة والزكاة وضريبة الاستقطاع والفوترة الإلكترونية', 'Manage VAT, Zakat, WHT, and ZATCA Phase 2 E-Invoicing')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={16} /> {_t('إعدادات ZATCA', 'ZATCA Settings')}</button>
          <Link href="/tax/vat-returns"><button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16} /> {_t('إقرار ضريبي جديد', 'New VAT Return')}</button></Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('آخر إقرارات ضريبة القيمة المضافة', 'Recent VAT Returns')}</h3>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('عرض الكل', 'View All')}</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>{_t('الفترة', 'Period')}</th>
                <th>{_t('صافي الضريبة', 'Net VAT')}</th>
                <th>{_t('الموعد النهائي', 'Deadline')}</th>
                <th style={{ textAlign: 'center' }}>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {vatReturns.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.period}</td>
                  <td style={{ fontWeight: '600' }}>{r.amount.toLocaleString()} {_t('ر.س', 'SAR')}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{r.deadline}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: (STATUS_COLORS[r.status] || '#9CA3AF') + '20', color: STATUS_COLORS[r.status] || '#9CA3AF' }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('اختصارات الامتثال', 'Compliance Shortcuts')}</h3>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {shortcuts.map((s, i) => (
              <Link key={i} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <s.icon size={24} color={s.c} style={{ marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{s.title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
