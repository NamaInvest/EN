'use client';
import { useState, useEffect } from 'react';
import { Factory, Cog, ClipboardList, TrendingUp, AlertTriangle, Hammer, ArrowRight, Activity, Percent, Ban } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface Stats {
  orders?: {
    total: number;
    wip: number;
    completed: number;
    cancelled: number;
    planned: number;
  };
  completionRate?: number;
  onTimeRate?: number | null;
  yieldRate?: number | null;
  scrapRate?: number | null;
  activeWorkCenters?: number;
  topRecipes?: Array<{ recipeId: string | number; moCount: number }>;
}

export default function ManufacturingDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const r = await fetch('/api/manufacturing/stats', { headers });
        if (r.ok) {
          const d = await r.json();
          setStats(d);
        } else {
          setError(_t('فشل في تحميل الإحصائيات من الخادم', 'Failed to fetch statistics from the server'));
        }
      } catch (e: any) {
        setError(e?.message || _t('حدث خطأ غير متوقع', 'An unexpected error occurred'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalOrders = stats?.orders?.total ?? 0;
  const wipOrders = stats?.orders?.wip ?? 0;
  const completedOrders = stats?.orders?.completed ?? 0;
  const cancelledOrders = stats?.orders?.cancelled ?? 0;
  const plannedOrders = stats?.orders?.planned ?? 0;

  const kpis = [
    { l: _t('أوامر تشغيل نشطة', 'Active Work Orders'), v: wipOrders, s: _t('قيد التنفيذ حالياً', 'Currently in progress'), c: '#D97706', ic: Cog },
    { l: _t('أوامر الإنتاج المخططة', 'Planned Orders'), v: plannedOrders, s: _t('بانتظار بدء التشغيل', 'Awaiting production start'), c: '#6366F1', ic: ClipboardList },
    { l: _t('نسبة إتمام الإنتاج', 'Completion Rate'), v: `${stats?.completionRate ?? 0}%`, s: _t('من إجمالي أوامر التشغيل', 'Of total work orders'), c: '#10B981', ic: Percent },
    { l: _t('مراكز العمل النشطة', 'Active Work Centers'), v: stats?.activeWorkCenters ?? 0, s: _t('خطوط الإنتاج المجهزة', 'Configured production lines'), c: '#3B82F6', ic: Factory },
  ];

  const modules = [
    { href: '/manufacturing/orders', icon: Hammer, c: '#D97706', title: _t('أوامر التشغيل (MO)', 'Work Orders (MO)'), desc: _t('تتبع تقدم الإنتاج وتسجيل الأوقات الفعلية والمواد المصروفة', 'Track production progress, record actual times and materials issued'), link: _t('عرض أوامر التشغيل', 'View Work Orders') },
    { href: '/manufacturing/boms', icon: ClipboardList, c: '#6366F1', title: _t('قائمة المواد (BOM)', 'Bill of Materials'), desc: _t('إدارة الوصفات متعددة المستويات وعمليات التوجيه والتغييرات الهندسية', 'Manage multi-level recipes, routing operations, and engineering changes'), link: _t('إدارة BOMs', 'Manage BOMs') },
    { href: '#', icon: TrendingUp, c: '#9CA3AF', title: _t('توجيه خط الإنتاج', 'Shop Floor Routing'), desc: _t('تعريف مراكز العمل وسعات الآلات ونوبات المشغلين بالتوجيه الذكي', 'Define Work Centers, machine capacities, and operator shifts'), link: _t('يتطلب تهيئة', 'Configuration Required'), disabled: true },
  ];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: '#D97706', borderRadius: '50%', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>{_t('جاري تحميل إحصائيات الإنتاج والتصنيع...', 'Loading production and manufacturing stats...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '32px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#991B1B', marginBottom: '8px' }}>{_t('فشل تحميل لوحة التحكم', 'Failed to load Dashboard')}</h3>
          <p style={{ color: '#B91C1C', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>{_t('إعادة المحاولة', 'Retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Factory size={28} color="#D97706" /> {_t('إدارة التصنيع والإنتاج (MRP)', 'Manufacturing & Production (MRP)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('متابعة خطوط الإنتاج وأوامر التشغيل والوصفات ومراقبة الهالك والجودة', 'Monitor production lines, work orders, BOMs, scrap rate, and quality')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/manufacturing/boms"><button className="btn btn-outline">{_t('إدارة BOMs', 'Manage BOMs')}</button></Link>
          <Link href="/manufacturing/orders"><button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hammer size={16} /> {_t('أوامر التشغيل', 'Work Orders')}</button></Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `4px solid ${c.c}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.l}</span>
              <c.ic size={20} color={c.c} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0' }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} color={c.c} /> {c.s}
            </div>
          </div>
        ))}
      </div>

      {/* Lower Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Quality and scrap statistics */}
        <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <TrendingUp size={20} color="#10B981" /> {_t('مؤشرات الجودة وهالك الإنتاج (آخر 30 يوم)', 'Quality & Production Yield (Last 30 Days)')}
          </h3>
          
          {stats?.yieldRate !== null && stats?.yieldRate !== undefined ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #D1FAE5' }}>
                <span style={{ fontSize: '13px', color: '#065F46', fontWeight: '600' }}>{_t('نسبة اجتياز فحوصات الجودة (Yield)', 'Quality Pass Rate (Yield)')}</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#047857', marginTop: '6px' }}>{stats.yieldRate}%</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                <span style={{ fontSize: '13px', color: '#991B1B', fontWeight: '600' }}>{_t('نسبة الهالك والإنتاج المعيب (Scrap)', 'Scrap & Defect Rate (Scrap)')}</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#B91C1C', marginTop: '6px' }}>{stats.scrapRate}%</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              <Ban size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{_t('لم يتم إجراء أي فحوصات جودة أو تسجيل هالك في الـ 30 يوماً الأخيرة.', 'No quality inspections or scrap logs recorded in the last 30 days.')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Operations Modules */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{_t('العمليات الأساسية للإنتاج', 'Core Production Operations')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {modules.map((m, i) => (
          <Link key={i} href={m.href} style={{ textDecoration: 'none', color: 'inherit', pointerEvents: m.disabled ? 'none' : 'auto' }}>
            <div className="card" style={{ padding: '24px', cursor: m.disabled ? 'default' : 'pointer', borderTop: `4px solid ${m.c}`, opacity: m.disabled ? 0.65 : 1, transition: 'transform 0.2s', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: m.c, marginBottom: '12px' }}><m.icon size={22} /> {m.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px', minHeight: '40px' }}>{m.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: m.c }}>{m.link} {!m.disabled && <ArrowRight size={14} />}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
