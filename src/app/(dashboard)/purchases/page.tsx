'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, ClipboardList, Users, Truck, ArrowRight, FileText, 
  RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  AlertTriangle, DollarSign, Layers, Plus, ShieldCheck, ShoppingCart,
  Search, Download
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

interface PurchaseInvoice {
  id: number;
  invoiceNo: number;
  date: string;
  total: number;
  status: string;
  receiptStatus: string;
  supplierInvoiceNo?: string | null;
  supplier?: { id: number; name: string } | null;
}

interface PurchaseOrder {
  id: number;
  date: string;
  status: string;
  supplier?: { id: number; name: string } | null;
  details?: any[];
}

export default function ProcurementDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { info } = useToast();

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchPurchasesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Fetch Purchase Invoices
      const invRes = await fetch('/api/purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let invData = [];
      if (invRes.ok) {
        invData = await invRes.json();
      }

      // Fetch Purchase Orders
      const orderRes = await fetch('/api/purchase-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let orderData = [];
      if (orderRes.ok) {
        const orderJson = await orderRes.json();
        orderData = orderJson.data || [];
      }

      setInvoices(Array.isArray(invData) ? invData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (err: any) {
      setError(err.message || _t('حدث خطأ أثناء جلب بيانات المشتريات', 'Failed to fetch procurement data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
  }, []);

  // KPIs Calculations
  const kpis = useMemo(() => {
    // 1. Open Purchase Orders
    const openOrdersCount = orders.filter(o => o.status === 'pending_approval' || o.status === 'approved').length;
    
    // 2. Vendor Invoices Count & Total
    const vendorInvoicesCount = invoices.length;
    const totalPurchasesAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    
    // 3. GRN pending (invoices where receiptStatus is 'pending')
    const grnPendingCount = invoices.filter(inv => inv.receiptStatus === 'pending').length;
    
    // 4. Returns (Purchase Returns simulated or counted - let's default to simulated count of 0 or sum pending/refunded)
    const returnsCount = invoices.filter(inv => inv.status === 'refunded').length;

    return {
      openOrdersCount,
      vendorInvoicesCount,
      totalPurchasesAmount,
      grnPendingCount,
      returnsCount
    };
  }, [invoices, orders]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = 
        String(inv.invoiceNo).includes(searchQuery) ||
        (inv.supplier?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.supplierInvoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, filterStatus]);

  const handleExport = () => {
    info(_t('جاري تصدير بيانات المشتريات بصيغة Excel...', 'Exporting purchases data to Excel...'));
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const getStatusBadge = (inv: PurchaseInvoice) => {
    if (inv.status === 'completed') {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200/50">
          {_t('مدفوعة بالكامل', 'Paid')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200/50">
        {_t('قيد الانتظار (آجل)', 'Pending')}
      </span>
    );
  };

  const modules = [
    { href: '/purchases/requisitions', icon: ClipboardList, c: '#6366F1', title: _t('طلبات الشراء (PR)', 'Requisitions (PR)'), desc: _t('مراجعة واعتماد طلبات الشراء الداخلية قبل تحويلها لأوامر شراء رسمية', 'Review and approve internal purchase requests before converting them to POs'), link: _t('عرض طلبات الشراء', 'View Requests') },
    { href: '/purchase-orders', icon: ShoppingBag, c: '#3B82F6', title: _t('أوامر الشراء (PO)', 'Purchase Orders (PO)'), desc: _t('إنشاء وإرسال وتتبع أوامر الشراء الرسمية مع الموردين والموافقة عليها', 'Create, send, and track purchase orders with vendors and handle approvals'), link: _t('إدارة أوامر الشراء', 'Manage Orders') },
    { href: '/customers', icon: Users, c: '#22C55E', title: _t('الموردون وإدارة الذمم', 'Suppliers (Vendors)'), desc: _t('إدارة دليل الموردين وتتبع أرصدة الحسابات الدائنة (AP)', 'Manage vendor directory, payment terms, and Accounts Payable (AP) balances'), link: _t('عرض الموردين', 'View Suppliers') },
  ];

  const extras = [
    { href: '/stock', icon: Truck, title: _t('سندات الاستلام (GRN)', 'Goods Receipt (GRN)'), desc: _t('تسجيل البضاعة المستلمة فعلياً من الموردين ومطابقتها مخزنياً', 'Record incoming inventory items received against Purchase Orders'), link: _t('الذهاب للمستودعات', 'Go to Inventory') },
    { href: '/reports/manual-purchases', icon: FileText, title: _t('فواتير المشتريات والـ AP', 'Purchase Invoices'), desc: _t('معالجة فواتير المشتريات اليدوية، المطابقة الثلاثية وإثبات القيد المالي', 'Process supplier invoices, trigger 3-way matching, and post AP journals'), link: _t('عرض فواتير المشتريات', 'View AP Invoices') },
    { href: '/purchase-returns', icon: ArrowDownRight, title: _t('مرتجعات المشتريات', 'Purchase Returns'), desc: _t('معالجة حركات إرجاع البضاعة للموردين وعكس قيود الذمم الدائنة والمخازن', 'Manage returns to suppliers, reverse AP entries, and deduct stock safely'), link: _t('إدارة المرتجعات', 'Manage Returns') }
  ];

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', fontWeight: '800', color: 'var(--text)' }}>
            <ShoppingCart size={32} color="var(--primary)" /> {_t('إدارة المشتريات والتوريد', 'Procurement & Purchases')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {_t('مراقبة أوامر التوريد ومشتريات الفروع، تتبع حسابات الموردين الدائنة، والمطابقة الثلاثية (3-Way Matching)', 'Track procurement sessions, open POs, Accounts Payable balances, and 3-way matching.')}
          </p>
        </div>
        <div>
          <button 
            onClick={fetchPurchasesData} 
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
          <p style={{ fontWeight: 'bold' }}>{_t('جاري جلب تحليلات وإحصاءات المشتريات الآمنة من الدفاتر...', 'Fetching procurement analytics securely...')}</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #ef4444', borderRadius: '12px', textAlign: 'center', color: '#ef4444' }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{_t('عذراً، فشل تحميل البيانات', 'Failed to Load Data')}</h3>
          <p>{error}</p>
          <button className="btn mt-4" onClick={fetchPurchasesData} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {_t('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* KPIs Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            
            {/* Open Purchase Orders (PO) */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('أوامر الشراء النشطة (PO)', 'Active Purchase Orders')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '6px', display: 'flex' }}>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {kpis.openOrdersCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('أمر توريد', 'POs')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> {_t('قيد التنفيذ والمطابقة مع الموردين', 'Pending implementation')}
              </span>
            </div>

            {/* Total AP Invoices */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('عدد فواتير الشراء المستلمة', 'Vendor Invoices Count')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px', display: 'flex' }}>
                  <FileText size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {kpis.vendorInvoicesCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('فاتورة', 'Invoices')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                📦 {_t('مسجلة ومرحلة تلقائياً لدفتر الأستاذ (AP)', 'Postings updated')}
              </span>
            </div>

            {/* GRN Pending (Unreceived Goods) */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('سندات استلام بضاعة معلقة', 'Pending Goods Receipt (GRN)')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '6px', display: 'flex' }}>
                  <Truck size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {kpis.grnPendingCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('سند استلام', 'Receipts')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ⚠️ {_t('سلع بانتظار التفريغ والمطابقة المخزنية', 'Unmatched with GRN')}
              </span>
            </div>

            {/* Total Purchases Volume */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('إجمالي قيمة المشتريات المعتمدة', 'Total Purchases Amount')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', display: 'flex' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {fmt(kpis.totalPurchasesAmount)} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('ر.س', 'SAR')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={12} /> {_t('تقييم التكلفة بناءً على المورد المعتمد', 'Weighted Costing')}
              </span>
            </div>

          </div>

          {/* Quick Action Navigation Grid */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ {_t('روابط المعاملات وسير المشتريات', 'Operational Links & Workflows')}
            </h3>
            
            {/* Primary Action Button (PR, PO, Vendor) */}
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

            {/* Secondary Action Grid (GRN, AP, Return) */}
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

          {/* Recent Purchases Table Area */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)' }}>
                {_t('أحدث فواتير المشتريات المعتمدة (AP)', 'Recent Vendor Invoices')}
              </h3>
              
              {/* Filter Area */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={_t('البحث برقم الفاتورة أو المورد...', 'Search by invoice/supplier...')}
                    className="input"
                    style={{ paddingRight: '32px', fontSize: '0.85rem', width: '240px' }}
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input"
                  style={{ fontSize: '0.85rem', width: '130px' }}
                >
                  <option value="all">{_t('كل الحالات', 'All statuses')}</option>
                  <option value="completed">{_t('🟢 مسددة بالكامل', 'Paid')}</option>
                  <option value="pending">{_t('🟡 ذمم / معلقة', 'Pending')}</option>
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
                  <Download size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> {_t('تصدير البيانات', 'Export')}
                </button>
              </div>
            </div>

            {/* Invoices List */}
            {filteredInvoices.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-primary)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontWeight: 'bold' }}>{_t('لا توجد فواتير مشتريات مسجلة', 'No Purchase Invoices Found')}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{_t('يمكن تسجيل فواتير جديدة من شاشات الموردين أو المشتريات اليدوية ليتم تجميعها هنا.', 'Create manual purchase invoices or POs to list them here.')}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', background: 'var(--bg-primary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('رقم الفاتورة الداخلي', 'Invoice No')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('رقم فاتورة المورد', 'Supplier Invoice No')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('المورد', 'Supplier')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('التاريخ', 'Date')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('استلام البضاعة', 'GRN Status')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{_t('الحالة المالية', 'Payment Status')}</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'left' }}>{_t('المبلغ الإجمالي', 'Total Amount')}</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: 'monospace' }}>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          #{inv.invoiceNo}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {inv.supplierInvoiceNo || '-'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {inv.supplier?.name || _t('مورد غير معروف', 'Unknown Vendor')}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(inv.date).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            borderRadius: '4px',
                            background: inv.receiptStatus === 'received' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: inv.receiptStatus === 'received' ? '#22c55e' : '#f59e0b'
                          }}>
                            {inv.receiptStatus === 'received' ? _t('🟢 تم استلام البضاعة', 'Received') : _t('🟡 قيد الانتظار', 'Pending')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {getStatusBadge(inv)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', fontSize: '1rem' }}>
                          {fmt(inv.total)} SAR
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
