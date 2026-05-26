'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Users, Search, Landmark, TrendingUp, HelpCircle, ArrowRight, Activity, DollarSign, Percent, AlertTriangle, Ban, ShieldCheck, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string | null;
  phone: string | null;
  source: string;
  expectedRevenue: number;
  status: string;
  score: number;
}

interface Opportunity {
  id: number;
  name: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  stage?: {
    code: string;
    name: string;
    isWon?: boolean;
    isLost?: boolean;
  } | null;
}

interface SupportTicket {
  id: number;
  ticketNo: string;
  subject: string;
  priority: string;
  status: string;
  category: string | null;
}

export default function CrmDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
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

        const [leadsRes, oppsRes, ticketsRes] = await Promise.all([
          fetch('/api/crm/leads', { headers }),
          fetch('/api/crm/opportunities', { headers }),
          fetch('/api/crm/tickets', { headers })
        ]);

        if (leadsRes.ok) {
          const l = await leadsRes.json();
          setLeads(l.data || []);
        }
        if (oppsRes.ok) {
          const o = await oppsRes.json();
          setOpportunities(o.data?.opportunities || []);
        }
        if (ticketsRes.ok) {
          setTickets(await ticketsRes.json());
        }

      } catch (e: any) {
        setError(e?.message || _t('حدث خطأ أثناء تحميل بيانات العملاء والدعم', 'Failed to fetch CRM and support data'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2 });

  // Calculation of KPIs
  const totalLeads = leads.length;
  const expectedRevenueTotal = leads.reduce((sum, item) => sum + item.expectedRevenue, 0);
  const openOpps = opportunities.filter(o => !o.stage?.isWon && !o.stage?.isLost).length;
  const openTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

  const kpis = [
    { l: _t('إجمالي العملاء المحتملين', 'Total Leads'), v: totalLeads, s: _t('عملاء مضافين للأنظمة', 'Headcount of crm leads'), c: '#4F46E5', ic: Users },
    { l: _t('الإيرادات المتوقعة للفرص', 'Expected Revenue'), v: `${fmt(expectedRevenueTotal)} ${_t('ر.س', 'SAR')}`, s: _t('إجمالي قيمة صفقات Leads', 'Combined value of open leads'), c: '#10B981', ic: DollarSign },
    { l: _t('الفرص النشطة بالقمع', 'Active Opportunities'), v: openOpps, s: _t('صفقات قيد التفاوض والمناقشة', 'Deals currently in negotiation'), c: '#F59E0B', ic: TrendingUp },
    { l: _t('تذاكر الدعم المفتوحة', 'Open Support Tickets'), v: openTickets, s: _t('طلبات خدمة بانتظار الحل', 'Service tickets awaiting resolution'), c: '#EF4444', ic: HelpCircle },
  ];

  const quickActions = [
    { href: '/crm/leads', label: _t('إدارة العملاء المحتملين', 'Leads Management'), desc: _t('تتبع العملاء الجدد والفرز الذكي وتوزيع النقاط', 'Track leads, score them, and convert them to pipeline'), c: '#4F46E5' },
    { href: '/crm/opportunities', label: _t('قمع وخط المبيعات', 'Pipeline Kanban'), desc: _t('متابعة مراحل الصفقات والفرص البيعية وتوقعات الأرباح', 'Track deals visually and inspect closing probabilities'), c: '#10B981' },
    { href: '/crm/tickets', label: _t('تذاكر الدعم والخدمة', 'Helpdesk Tickets'), desc: _t('مراقبة استجابة تذاكر الدعم واتفاقيات مستوى الخدمة SLA', 'Monitor ticket resolution queues and SLA compliance'), c: '#EF4444' },
    { href: '/crm/campaigns', label: _t('الحملات التسويقية', 'Marketing Campaigns'), desc: _t('إطلاق حملات البريد الإلكتروني والرسائل وتتبع فعاليتها', 'Run marketing newsletters and monitor conversion rates'), c: '#6366F1' }
  ];

  const topLeads = [...leads]
    .sort((a, b) => b.expectedRevenue - a.expectedRevenue)
    .slice(0, 5);

  const pendingTicketsList = tickets
    .filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED')
    .slice(0, 5);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: '#4F46E5', borderRadius: '50%', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>{_t('جاري جلب بيانات علاقات العملاء والدعم الفني...', 'Loading CRM and customer support statistics...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '32px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#991B1B', marginBottom: '8px' }}>{_t('فشل تحميل لوحة تحكم علاقات العملاء', 'Failed to load CRM Dashboard')}</h3>
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
            <TrendingUp size={28} color="#4F46E5" /> {_t('إدارة علاقات العملاء والدعم (CRM)', 'Customer Relations & CRM Dashboard')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('متابعة خط الصفقات والفرص البيعية، تقييم العملاء المحتملين، وإدارة تذاكر الدعم والخدمة', 'Track sales pipeline, score crm leads, and resolve customer support tickets')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/crm/leads"><button className="btn btn-outline">{_t('عملاء محتملون جديد', 'New Lead')}</button></Link>
          <Link href="/crm/tickets"><button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={16} /> {_t('تذاكر الدعم', 'Support Tickets')}</button></Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `4px solid ${c.c}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.l}</span>
              <c.ic size={20} color={c.c} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.s}</div>
          </div>
        ))}
      </div>

      {/* Grid: High Value Deals & Ticket queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* High Expected Revenue Leads */}
        <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="#10B981" /> {_t('الصفقات ذات القيمة العالية (High-value Leads)', 'High Value Opportunities')}
            </h3>
            <Link href="/crm/leads"><button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('عرض كل العملاء', 'View All Leads')}</button></Link>
          </div>
          {topLeads.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('الشركة', 'Company')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('المسؤول', 'Contact Person')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{_t('الإيراد المتوقع', 'Expected Revenue')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>{_t('نقاط العميل (Score)', 'Score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px' }}>{l.companyName}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{l.contactPerson}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#047857', textAlign: 'left', fontWeight: '800', fontFamily: 'monospace' }} dir="ltr">{fmt(l.expectedRevenue)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '20px', background: l.score > 50 ? '#ECFDF5' : '#FFFBEB', color: l.score > 50 ? '#047857' : '#B45309', fontWeight: 'bold' }}>
                          {l.score} {_t('نقطة', 'pts')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Ban size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p>{_t('لا يوجد صفقات أو عملاء محتملون نشطون حالياً.', 'No open leads found.')}</p>
            </div>
          )}
        </div>

        {/* Support Tickets Queue */}
        <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} color="#EF4444" /> {_t('تذاكر الدعم بانتظار المعالجة', 'Support Tickets Queue')}
            </h3>
            <Link href="/crm/tickets"><button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('عرض كل التذاكر', 'View Tickets Queue')}</button></Link>
          </div>
          {pendingTicketsList.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('رقم التذكرة', 'Ticket No')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('موضوع التذكرة', 'Subject')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>{_t('الأهمية', 'Priority')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>{_t('الحالة', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTicketsList.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '800', fontSize: '13px', fontFamily: 'monospace' }}>{t.ticketNo}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: '500' }}>{t.subject}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: t.priority === 'HIGH' || t.priority === 'CRITICAL' ? '#FEF2F2' : '#EFF6FF', color: t.priority === 'HIGH' || t.priority === 'CRITICAL' ? '#EF4444' : '#1D4ED8', fontWeight: 'bold' }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#FFFBEB', color: '#B45309', fontWeight: 'bold' }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Ban size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p>{_t('جميع تذاكر الدعم والخدمة محلولة ومغلقة بنجاح.', 'All tickets are successfully resolved.')}</p>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="card" style={{ borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {_t('بوابات ومسارات علاقات العملاء السريعة', 'CRM Operations & Actions')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {quickActions.map((q, i) => (
              <Link key={i} href={q.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s', height: '100%', boxSizing: 'border-box' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: q.c, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {q.label} <ArrowRight size={14} />
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{q.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
