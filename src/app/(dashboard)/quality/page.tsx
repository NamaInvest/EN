'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, ClipboardCheck, AlertTriangle, FileWarning, Target, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function QualityDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ inspections: 0, passRate: 0, ncrs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/quality/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) setStats(await r.json());
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const kpis = [
    { l: _t('إجمالي الفحوصات', 'Total Inspections'), v: stats.inspections, c: '#14B8A6', ic: Target },
    { l: _t('معدل النجاح (FPY)', 'First-Pass Yield'), v: `${stats.passRate}%`, c: '#22C55E', ic: CheckCircle2 },
    { l: _t('تقارير عدم مطابقة مفتوحة', 'Open NCRs'), v: stats.ncrs, c: stats.ncrs > 0 ? '#EF4444' : '#9CA3AF', ic: AlertTriangle },
  ];

  const modules = [
    { href: '/quality/inspections', icon: ClipboardCheck, c: '#14B8A6', title: _t('فحوصات الجودة', 'Quality Inspections'), desc: _t('فحص وارد (GRN) وأثناء الإنتاج ونهائي. تسجيل معايير الاختبار', 'Perform incoming, in-process, and final quality checks'), link: _t('عرض الفحوصات', 'View Inspections') },
    { href: '/quality/ncrs', icon: FileWarning, c: '#EF4444', title: _t('عدم المطابقة (NCR)', 'Non-Conformance (NCR)'), desc: _t('إدارة تقارير العيوب والإجراءات التصحيحية وتحليل الأسباب الجذرية', 'Manage defect reports, MRB dispositions, and root cause analysis'), link: _t('إدارة NCRs', 'Manage NCRs') },
    { href: '#', icon: Target, c: '#3B82F6', title: _t('مواصفات الجودة', 'Quality Specs'), desc: _t('تعريف معايير الجودة وحدود القبول وخطط أخذ العينات', 'Define quality parameters, acceptable limits, and AQL sampling plans'), link: _t('عرض المواصفات', 'View Specifications') },
  ];

  const extras = [
    { icon: AlertTriangle, title: _t('سير عمل CAPA', 'CAPA Workflow'), desc: _t('الإجراءات التصحيحية والوقائية. فرض امتثال ISO/FDA', 'Corrective and Preventive Actions. Enforce ISO/FDA compliance') },
    { icon: ShieldCheck, title: _t('المعايرة والتدقيق', 'Calibration & Audits'), desc: _t('تتبع معايرة الأجهزة وجدولة تدقيقات جودة الموردين', 'Track gauge calibrations and schedule supplier quality audits') },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#14B8A6" /> {_t('إدارة الجودة (QMS)', 'Quality Management (QMS)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('إدارة الفحوصات والمواصفات وتقارير عدم المطابقة', 'Manage inspections, specifications, and NCRs')}</p>
        </div>
        <Link href="/quality/inspections"><button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ClipboardCheck size={16} /> {_t('فحص جديد', 'New Inspection')}</button></Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: typeof c.v === 'number' && c.c === '#EF4444' && (c.v as number) > 0 ? '#EF4444' : undefined }}>{loading ? '...' : c.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {modules.map((m, i) => (
          <Link key={i} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '24px', cursor: 'pointer', borderTop: `3px solid ${m.c}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: m.c, marginBottom: '12px' }}><m.icon size={22} /> {m.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>{m.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: m.c }}>{m.link} <ArrowRight size={14} /></div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
        {extras.map((m, i) => (
          <div key={i} className="card" style={{ padding: '24px', background: 'var(--bg-secondary, #f8fafc)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><m.icon size={20} color="var(--text-muted)" /> {m.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
