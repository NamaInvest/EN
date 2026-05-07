'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, Package, PieChart, Activity } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function BiDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const t = localStorage.getItem('token');
      const r = await fetch('/api/bi/kpis', { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setData(await r.json());
    } catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل البيانات التحليلية...</div>;
  if (!data) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد بيانات</div>;

  const f = data.financial || {};
  const o = data.operational || {};
  const charts = data.charts || {};

  const kpis = [
    { icon: DollarSign, label: 'إجمالي الإيرادات', value: `${(f.totalRevenue||0).toLocaleString()} SAR`, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    { icon: ShoppingCart, label: 'إجمالي المشتريات', value: `${(f.totalCost||0).toLocaleString()} SAR`, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    { icon: TrendingUp, label: 'صافي الربح', value: `${(f.netProfit||0).toLocaleString()} SAR`, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { icon: PieChart, label: 'هامش الربح', value: `${f.profitMargin||0}%`, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    { icon: BarChart3, label: 'عدد المبيعات', value: o.totalSales||0, color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
    { icon: Package, label: 'المنتجات النشطة', value: o.activeProducts||0, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
    { icon: Users, label: 'العملاء النشطون', value: o.activeCustomers||0, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
    { icon: Activity, label: 'متوسط الطلب', value: `${o.avgOrderValue||0} SAR`, color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' }
  ];

  const maxSale = Math.max(...(charts.monthlySales||[]).map((m: any) => m.total || 0), 1);

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 size={28} color="var(--primary)" /> ذكاء الأعمال - BI Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>تحليلات شاملة في الوقت الفعلي</p>
      </div>

      {/* Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        {kpis.map((k, i) => (
          <div key={i} className="card" style={{ padding: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', background: k.bg, color: k.color, borderRadius: '12px' }}><k.icon size={22} /></div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{k.label}</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '900' }}>{k.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Monthly Revenue Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} color="var(--primary)" /> الإيرادات الشهرية</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '200px' }}>
            {(charts.monthlySales||[]).length > 0 ? (charts.monthlySales||[]).slice(-12).map((m: any, i: number) => {
              const h = Math.max(8, (m.total / maxSale) * 180);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>{(m.total/1000).toFixed(0)}k</span>
                  <div style={{ width: '100%', maxWidth: '40px', height: `${h}px`, background: 'linear-gradient(180deg, #3B82F6, #8B5CF6)', borderRadius: '6px 6px 2px 2px', transition: 'height 0.5s ease' }} title={`${m.total?.toLocaleString()} SAR`} />
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{new Date(m.date).toLocaleDateString('en', { month: 'short' })}</span>
                </div>
              );
            }) : <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', paddingTop: '80px' }}>لا توجد بيانات مبيعات</div>}
          </div>
        </div>

        {/* Payment Type Distribution */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><PieChart size={20} color="#8B5CF6" /> طرق الدفع</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(charts.salesByPayment||[]).length > 0 ? (charts.salesByPayment||[]).map((s: any, i: number) => {
              const colors = ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6'];
              const totalAll = (charts.salesByPayment||[]).reduce((a: number, b: any) => a + (b.total||0), 0) || 1;
              const pct = ((s.total / totalAll) * 100).toFixed(1);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600' }}>{s.type || 'نقدي'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{pct}% ({s.count})</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: '4px', transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            }) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>لا توجد بيانات</div>}
          </div>
        </div>
      </div>

      {/* Profit Summary */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>ملخص الأرباح</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { label: 'الإيرادات', value: f.totalRevenue, color: '#22C55E' },
            { label: 'التكاليف', value: f.totalCost, color: '#EF4444' },
            { label: 'إجمالي الربح', value: f.grossProfit, color: '#3B82F6' },
            { label: 'المصروفات', value: f.totalExpenses || 0, color: '#F97316' },
            { label: 'صافي الربح', value: f.netProfit, color: f.netProfit >= 0 ? '#22C55E' : '#EF4444' }
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-body)', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>{item.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: item.color }}>{(item.value||0).toLocaleString()} SAR</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
