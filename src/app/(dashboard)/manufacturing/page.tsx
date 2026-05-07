import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { Factory, Cog, ClipboardList, TrendingUp, AlertTriangle, Hammer, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function ManufacturingDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ orders: 0, active: 0, recipes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/manufacturing/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) { const d = await r.json(); setStats(d); }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const cards = [
    { l: _t('أوامر تشغيل نشطة', 'Active Work Orders'), v: stats.active, c: '#D97706', ic: Cog },
    { l: _t('إجمالي أوامر التشغيل', 'Total Work Orders'), v: stats.orders, c: '#6B7280', ic: ClipboardList },
    { l: _t('وصفات / BOMs نشطة', 'Active BOMs / Recipes'), v: stats.recipes, c: '#6366F1', ic: TrendingUp },
  ];

  const modules = [
    { href: '/manufacturing/orders', icon: Hammer, c: '#D97706', title: _t('أوامر التشغيل (MO)', 'Work Orders (MO)'), desc: _t('تتبع تقدم الإنتاج وتسجيل الأوقات الفعلية والمواد المصروفة', 'Track production progress, record actual times and materials issued'), link: _t('عرض أوامر التشغيل', 'View Work Orders') },
    { href: '/manufacturing/boms', icon: ClipboardList, c: '#6366F1', title: _t('قائمة المواد (BOM)', 'Bill of Materials'), desc: _t('إدارة الوصفات متعددة المستويات وعمليات التوجيه والتغييرات الهندسية', 'Manage multi-level recipes, routing operations, and engineering changes'), link: _t('إدارة BOMs', 'Manage BOMs') },
    { href: '#', icon: TrendingUp, c: '#9CA3AF', title: _t('اقتراحات MRP', 'MRP Suggestions'), desc: _t('حساب صافي الاحتياجات وتحديد نقص المواد الخام وإنشاء طلبات شراء تلقائية', 'Calculate net requirements and auto-generate Purchase Requisitions'), link: _t('يتطلب إعداد', 'Configuration Required'), disabled: true },
  ];

  const extras = [
    { icon: Cog, title: _t('توجيه خط الإنتاج', 'Shop Floor Routing'), desc: _t('تعريف مراكز العمل وسعات الآلات ونوبات المشغلين', 'Define Work Centers, machine capacities, and operator shifts') },
    { icon: AlertTriangle, title: _t('فحوصات الجودة (QC)', 'Quality Checks (QC)'), desc: _t('فحوصات جودة أثناء الإنتاج وتقارير عدم المطابقة', 'In-process quality inspections and Non-Conformance Reports') },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Factory size={28} color="#D97706" /> {_t('التصنيع (MRP والإنتاج)', 'Manufacturing (MRP & Production)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('إدارة أوامر التشغيل وقوائم المواد وعمليات خط الإنتاج', 'Manage Work Orders, BOM, and Shop Floor Operations')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/manufacturing/boms"><button className="btn btn-outline">{_t('إدارة BOMs', 'Manage BOMs')}</button></Link>
          <Link href="/manufacturing/orders"><button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hammer size={16} /> {_t('أوامر التشغيل', 'Work Orders')}</button></Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{loading ? '...' : c.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {modules.map((m, i) => (
          <Link key={i} href={m.href} style={{ textDecoration: 'none', color: 'inherit', pointerEvents: m.disabled ? 'none' : 'auto' }}>
            <div className="card" style={{ padding: '24px', cursor: m.disabled ? 'default' : 'pointer', borderTop: `3px solid ${m.c}`, opacity: m.disabled ? 0.6 : 1 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: m.c, marginBottom: '12px' }}><m.icon size={22} /> {m.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>{m.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: m.c }}>{m.link} {!m.disabled && <ArrowRight size={14} />}</div>
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
