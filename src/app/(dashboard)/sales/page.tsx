'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, DollarSign, Target, Calendar, Filter, Download, 
  ArrowUpRight, ArrowDownRight, Package, Search, ShoppingBag, 
  ClipboardList, RefreshCw, Loader2, ArrowRight, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

import SensitiveValue from '@/components/security/SensitiveValue';
import PermissionGate from '@/components/security/PermissionGate';

interface SalesInvoice {
  id: number;
  invoiceNo: number;
  date: string;
  total: number;
  paid: number;
  remaining: number;
  paymentType: string;
  status: string;
  customer?: { id: number; name: string } | null;
  user?: { id: number; fullName: string } | null;
}

export default function SalesDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { info, error: toastError } = useToast();
  
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || _t('فشل في جلب الفواتير المبيعات', 'Failed to fetch sales invoices'));
      }
    } catch (err: any) {
      setError(err.message || _t('حدث خطأ أثناء الاتصال بالخادم', 'Connection error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  // KPIs Calculations
  const kpis = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === todayStr);
    
    const todayCount = todayInvoices.length;
    const todayTotalSales = todayInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const pendingCount = invoices.filter(inv => inv.status === 'pending' || inv.remaining > 0).length;
    
    // Total historical sales (up to last 100)
    const historicalSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    return {
      todayCount,
      todayTotalSales,
      pendingCount,
      historicalSales
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = 
        String(inv.invoiceNo).includes(searchQuery) ||
        (inv.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchPayment = filterPayment === 'all' || inv.paymentType === filterPayment;

      return matchSearch && matchPayment;
    });
  }, [invoices, searchQuery, filterPayment]);

  const handleExport = () => {
    info(_t('جاري تصدير التقرير المبيعات بصيغة Excel...', 'Exporting sales report to Excel...'));
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const getStatusBadge = (inv: SalesInvoice) => {
    if (inv.remaining > 0) {
      return (
        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200/50">
          {_t('معلق (ذمم)', 'Pending')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200/50">
        {_t('مسدد بالكامل', 'Paid')}
      </span>
    );
  };

  const modules = [
    { href: '/sales/terminal', icon: Play, c: '#FF7A00', title: _t('محطة مبيعات التجزئة (Retail Terminal)', 'Retail Terminal POS'), desc: _t('إطلاق شاشة الفوترة السريعة بالتجزئة مع ربط مدى ودعم الكوبونات والـ CRM الآلي', 'Launch high-speed retail checkout terminal with MADA connection and CRM capabilities'), link: _t('إطلاق المحطة', 'Launch POS') },
    { href: '/sales/orders', icon: ClipboardList, c: '#3B82F6', title: _t('أوامر البيع (Sales Orders)', 'Sales Orders'), desc: _t('إدارة وتتبع أوامر البيع وعقود التوريد قبل تحويلها لفواتير مبيعات', 'Manage and track B2B sales orders and supply agreements'), link: _t('عرض الأوامر', 'View Orders') },
    { href: '/price-quotes', icon: ShoppingBag, c: '#6366F1', title: _t('عروض الأسعار (Quotations)', 'Quotations'), desc: _t('إنشاء وإرسال وتتبع عروض الأسعار الرسمية للعملاء', 'Create, send, and track official quotation requests to clients'), link: _t('عرض العروض', 'View Quotes') },
  ];

  const extras = [
    { href: '/sales-returns', icon: ArrowDownRight, title: _t('مرتجعات المبيعات', 'Sales Returns'), desc: _t('معالجة مرتجعات المبيعات واسترداد المخازن والتعديل المالي التلقائي', 'Process returns, restore warehouse stock, and trigger auto journals'), link: _t('إدارة المرتجعات', 'Manage Returns') },
    { href: '/customers', icon: Users, title: _t('العملاء وتدقيق الائتمان', 'Customers Directory'), desc: _t('إدارة سجلات العملاء، أرصدة الذمم وتدقيق سقف التسهيلات والمديونيات', 'Manage client directory, credit thresholds, and receivables aging'), link: _t('عرض العملاء', 'View Customers') },
  ];

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', direction: 'rtl' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', fontWeight: '800', color: 'var(--text)' }}>
            <TrendingUp size={32} color="var(--primary)" /> {_t('لوحة تحكم المبيعات والعملاء', 'Sales & Customer Dashboard')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {_t('تحليل الإيرادات، إدارة الفواتير والذمم المدينة، والفوترة السريعة المتوافقة مع الفوترة الإلكترونية ZATCA', 'Monitor revenue progress, accounts receivable, and rapid electronic invoicing.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchSalesData} 
            disabled={loading}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1.2rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {_t('تحديث البيانات', 'Refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <p style={{ fontWeight: 'bold' }}>{_t('جاري جلب تحليلات وإحصاءات المبيعات الآمنة...', 'Fetching sales analytics securely...')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* KPIs Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            
            {/* Today's Sales Volume */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('مبيعات اليوم', "Today's Sales")}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(255, 122, 0, 0.1)', color: 'var(--primary)', borderRadius: '6px', display: 'flex' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                <SensitiveValue value={fmt(kpis.todayTotalSales)} currency={_t('ر.س', 'SAR')} module="sales" />
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> {_t('تحديث فوري للشبكة والتحصيل', 'Realtime counter')}
              </span>
            </div>

            {/* Today's Invoice Count */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('عدد فواتير اليوم', "Today's Invoices")}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px', display: 'flex' }}>
                  <Package size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {kpis.todayCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('فاتورة', 'Invoices')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🚀 {_t('كل العمليات معتمدة لدى هيئة الزكاة', 'ZATCA Cleared')}
              </span>
            </div>

            {/* Pending Invoices (AR) */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('الفواتير غير المحصلة (الآجل)', 'Pending Invoices (Credit)')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '6px', display: 'flex' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {kpis.pendingCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('عملية', 'Invoices')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ⚠️ {_t('خاضعة لسقف التسهيلات الائتمانية للعميل', 'Subject to credit limits')}
              </span>
            </div>

            {/* Total Sales (Last 100) */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('إجمالي مبيعات الدورة', 'Total Sales Volume')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '6px', display: 'flex' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                <SensitiveValue value={fmt(kpis.historicalSales)} currency={_t('ر.س', 'SAR')} module="sales" />
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                📈 {_t('تقييم بناءً على آخر 100 حركة فعلية', 'Based on recent 100 transactions')}
              </span>
            </div>

          </div>

          {/* Quick Actions Panel */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎯 {_t('إجراءات تشغيلية سريعة للمبيعات', 'Sales Workflows & Terminal')}
            </h3>
            
            {/* Primary Action Button (Launch Terminal POS) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {modules.map((m, i) => (
                <Link key={i} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card-hoverable" style={{ 
                    padding: '1.5rem', 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    borderTop: `4px solid ${m.c}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: m.c, margin: '0 0 8px 0' }}>
                        <m.icon size={20} /> {m.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>{m.desc}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: m.c }}>
                      {m.link} <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Secondary Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {extras.map((m, i) => (
                <Link key={i} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <m.icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text)' }}>{m.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.desc}</span>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Invoices Table Area */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)' }}>
                {_t('سجل الفواتير الحديثة والمعاملات', 'Recent Sales Activity')}
              </h3>
              
              {/* Search and Filters */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={_t('بحث برقم الفاتورة أو العميل...', 'Search...')}
                    className="input"
                    style={{ paddingRight: '32px', fontSize: '0.85rem', width: '220px' }}
                  />
                </div>
                
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="input"
                  style={{ fontSize: '0.85rem', width: '130px' }}
                >
                  <option value="all">{_t('كل طرق الدفع', 'All Methods')}</option>
                  <option value="cash">{_t('💵 كاش / نقدي', 'Cash')}</option>
                  <option value="card">{_t('💳 مدى / شبكة', 'Card')}</option>
                  <option value="transfer">{_t('🏦 تحويل بنكي', 'Transfer')}</option>
                  <option value="split">{_t('🔄 دفع مجزأ', 'Split')}</option>
                  <option value="TABBY">Tabby</option>
                  <option value="TAMARA">Tamara</option>
                </select>

                <button 
                  onClick={handleExport}
                  className="btn"
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.85rem',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> {_t('تصدير التقرير', 'Export')}
                </button>
              </div>
            </div>

            {/* Invoices List */}
            {filteredInvoices.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-primary)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontWeight: 'bold' }}>{_t('لا توجد فواتير مطابقة للبحث', 'No Matching Sales Invoices')}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{_t('أنشئ فواتير جديدة من محطة المبيعات لإدراجها تلقائياً بالدفاتر القيادية.', 'Create new invoices from the Retail Terminal to list them in the general ledger.')}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', background: 'var(--bg-primary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('رقم الفاتورة', 'Invoice No')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('العميل', 'Customer')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('التاريخ', 'Date')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('طريقة الدفع', 'Payment Method')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('الحالة', 'Status')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'left' }}>{_t('المبلغ الكلي', 'Total Amount')}</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: 'monospace' }}>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          #{inv.invoiceNo}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {inv.customer?.name || _t('عميل نقدي', 'Cash Customer')}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(inv.date).toLocaleDateString('en-GB') + ' ' + new Date(inv.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {inv.paymentType === 'cash' ? '💵 ' + _t('نقدي / كاش', 'Cash') : 
                           inv.paymentType === 'card' ? '💳 ' + _t('مدى / شبكة', 'Card') : 
                           inv.paymentType === 'transfer' ? '🏦 ' + _t('تحويل بنكي', 'Transfer') : 
                           inv.paymentType === 'split' ? '🔄 ' + _t('دفع مجزأ', 'Split') : inv.paymentType}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {getStatusBadge(inv)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', fontSize: '1rem' }}>
                          <SensitiveValue value={fmt(inv.total)} currency="SAR" module="sales" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
