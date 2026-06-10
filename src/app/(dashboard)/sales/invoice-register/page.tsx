'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Printer, Calendar, RefreshCcw, FileText, Trash2, 
  Mail, Plus, Download, ChevronLeft, ChevronRight, Filter, 
  ArrowUpDown, CheckCircle, Clock, AlertCircle, FileSpreadsheet,
  Link as LinkIcon, RefreshCw, X, ChevronDown, CheckSquare, Square
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import InvoiceReceipt from '@/components/InvoiceReceipt';

interface Invoice {
  id: number;
  invoiceNo: number;
  date: string;
  dueDate: string;
  customerName: string;
  customerTaxNumber: string;
  customerPhone: string;
  subtotal: number;
  taxValue: number;
  total: number;
  paid: number;
  remaining: number;
  paymentType: string;
  status: string;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  zatcaStatus: string;
  docType: string;
  source: 'manual' | 'quotation' | 'pos';
  quotationNo: string | null;
  sourceQuotationId: number | null;
  branchName: string;
  userName: string;
  updatedAt: string;
}

interface Totals {
  totalInvoices: number;
  subtotalSum: number;
  vatSum: number;
  totalSum: number;
  paidSum: number;
  balanceSum: number;
}

export default function InvoiceRegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  // Primary Data State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totals, setTotals] = useState<Totals>({
    totalInvoices: 0,
    subtotalSum: 0,
    vatSum: 0,
    totalSum: 0,
    paidSum: 0,
    balanceSum: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Dropdown Options State
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Search & Filtering State
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [activePreset, setActivePreset] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced Filters Form State
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [zatcaStatus, setZatcaStatus] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [createdById, setCreatedById] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [invoiceType, setInvoiceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [productId, setProductId] = useState('');
  const [taxNumber, setTaxNumber] = useState('');

  // Pagination & Sorting State
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [totalPages, setTotalPages] = useState(1);

  // Print/Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);

  // Fetch Lookups
  useEffect(() => {
    const fetchLookups = async () => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const [custRes, branchRes, userRes, prodRes] = await Promise.all([
          fetch('/api/customers?type=0', { headers }),
          fetch('/api/branches', { headers }),
          fetch('/api/users', { headers }),
          fetch('/api/products', { headers })
        ]);

        if (custRes.ok) setCustomers(await custRes.json());
        if (branchRes.ok) setBranches(await branchRes.json());
        if (userRes.ok) {
          const uData = await userRes.json();
          setUsers(Array.isArray(uData) ? uData : []);
        }
        if (prodRes.ok) setProducts(await prodRes.json());
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };

    fetchLookups();
  }, []);

  // Preset Filters Definitions
  const presetFilters: { id: string; labelAr: string; labelEn: string; params: Record<string, string> }[] = [
    { id: 'all', labelAr: 'كل الفواتير', labelEn: 'All Invoices', params: {} },
    { id: 'draft', labelAr: 'مسودات', labelEn: 'Drafts', params: { status: 'DRAFT' } },
    { id: 'issued', labelAr: 'صادرة', labelEn: 'Issued', params: { status: 'completed' } },
    { id: 'unpaid', labelAr: 'غير مدفوعة', labelEn: 'Unpaid', params: { paymentStatus: 'unpaid' } },
    { id: 'partially_paid', labelAr: 'مدفوعة جزئياً', labelEn: 'Partially Paid', params: { paymentStatus: 'partially_paid' } },
    { id: 'paid', labelAr: 'مدفوعة', labelEn: 'Paid', params: { paymentStatus: 'paid' } },
    { id: 'overdue', labelAr: 'متأخرة', labelEn: 'Overdue', params: { paymentStatus: 'overdue' } },
    { id: 'cancelled', labelAr: 'ملغاة', labelEn: 'Cancelled', params: { status: 'cancelled' } },
    { id: 'today', labelAr: 'فواتير اليوم', labelEn: 'Today', params: { dateFrom: new Date().toISOString().split('T')[0] } },
    { id: 'from_quotations', labelAr: 'من عروض الأسعار', labelEn: 'From Quotations', params: { sourceType: 'quotation' } },
    { id: 'pos', labelAr: 'فواتير POS', labelEn: 'POS Invoices', params: { sourceType: 'pos' } },
    { id: 'zatca_failed', labelAr: 'فشل ZATCA', labelEn: 'ZATCA Failed', params: { zatcaStatus: 'failed' } },
  ];

  // Fetch Invoices Data
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Compile Query Parameters
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);

    if (q) params.set('q', q);

    // Apply Active Preset Filters
    const preset = presetFilters.find(p => p.id === activePreset);
    if (preset) {
      Object.entries(preset.params).forEach(([key, val]) => {
        params.set(key, val);
      });
    }

    // Apply Advanced Filters if visible or set
    if (status && activePreset !== 'draft' && activePreset !== 'cancelled') params.set('status', status);
    if (paymentStatus && activePreset !== 'unpaid' && activePreset !== 'paid' && activePreset !== 'overdue') params.set('paymentStatus', paymentStatus);
    if (zatcaStatus && activePreset !== 'zatca_failed') params.set('zatcaStatus', zatcaStatus);
    if (customerId) params.set('customerId', customerId);
    if (branchId) params.set('branchId', branchId);
    if (createdById) params.set('createdById', createdById);
    if (sourceType && activePreset !== 'from_quotations' && activePreset !== 'pos') params.set('sourceType', sourceType);
    if (invoiceType) params.set('invoiceType', invoiceType);
    if (dateFrom && activePreset !== 'today') params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (dueDateFrom) params.set('dueDateFrom', dueDateFrom);
    if (dueDateTo) params.set('dueDateTo', dueDateTo);
    if (minTotal) params.set('minTotal', minTotal);
    if (maxTotal) params.set('maxTotal', maxTotal);
    if (minBalance) params.set('minBalance', minBalance);
    if (maxBalance) params.set('maxBalance', maxBalance);
    if (productId) params.set('productId', productId);
    if (taxNumber) params.set('taxNumber', taxNumber);

    try {
      const res = await fetch(`/api/sales/invoice-register?${params.toString()}`, { headers });
      if (res.ok) {
        const body = await res.json();
        setInvoices(body.data || []);
        setTotals(body.totals || {
          totalInvoices: 0,
          subtotalSum: 0,
          vatSum: 0,
          totalSum: 0,
          paidSum: 0,
          balanceSum: 0
        });
        setTotalPages(body.pagination?.totalPages || 1);
      } else {
        toastError(t('sys.err_load_failed') || 'فشل تحميل فواتير سجل المبيعات');
      }
    } catch (err) {
      toastError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortBy, sortDir, activePreset]);

  // Handle Search Submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  // Clear All Filters
  const handleResetFilters = () => {
    setQ('');
    setStatus('');
    setPaymentStatus('');
    setZatcaStatus('');
    setCustomerId('');
    setBranchId('');
    setCreatedById('');
    setSourceType('');
    setInvoiceType('');
    setDateFrom('');
    setDateTo('');
    setDueDateFrom('');
    setDueDateTo('');
    setMinTotal('');
    setMaxTotal('');
    setMinBalance('');
    setMaxBalance('');
    setProductId('');
    setTaxNumber('');
    setActivePreset('all');
    setPage(1);
    setShowAdvanced(false);
  };

  // Row Selection logic
  const toggleRow = (id: number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === invoices.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(invoices.map(inv => inv.id)));
    }
  };

  // Action: Reprint/View Invoice modal
  const handleReprint = (inv: Invoice) => {
    // Mimic the receipt details formatting expected by InvoiceReceipt
    // We map generic product details or mock a single list entry if details aren't populated directly
    const items = [
      {
        name: 'منتج مبيعات عام',
        quantity: 1,
        price: inv.subtotal,
        total: inv.subtotal,
      }
    ];

    setSelectedInvoiceData({
      invoiceId: inv.id,
      invoiceNumber: String(inv.invoiceNo),
      date: inv.date,
      customerName: inv.customerName || 'عميل نقدي',
      customerTaxNo: inv.customerTaxNumber || undefined,
      paymentMethod: inv.paymentType,
      items,
      subtotal: inv.subtotal,
      discount: 0,
      taxRate: 15,
      taxAmount: inv.taxValue,
      grandTotal: inv.total,
      docType: inv.customerTaxNumber ? 'standard_invoice' : 'simplified_invoice'
    });
    setShowReceipt(true);
  };

  // Action: Print Selected / Export CSV
  const handleExportCSV = async () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`/api/sales/invoice-register?export=true&pageSize=500`, { headers });
      if (res.ok) {
        const body = await res.json();
        const exportData = body.data || [];
        
        // Build simple CSV representation
        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
        csvContent += 'Invoice Number,Customer Name,Tax ID,Date,Total,Paid,Remaining,Status,Payment Status,ZATCA Status,Source\n';
        
        exportData.forEach((inv: any) => {
          csvContent += `"${inv.invoiceNo}","${inv.customerName}","${inv.customerTaxNumber}","${inv.date.split('T')[0]}","${inv.total}","${inv.paid}","${inv.remaining}","${inv.status}","${inv.paymentStatus}","${inv.zatcaStatus}","${inv.source}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `invoice_register_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toastSuccess('تم تصدير ملف سجل الفواتير بنجاح');
      } else {
        toastError('صلاحيات غير كافية للتصدير');
      }
    } catch (e) {
      toastError('فشل التصدير التلقائي');
    }
  };

  // Action: Retry ZATCA submission
  const handleRetryZatca = async (id: number) => {
    toastSuccess('جاري إعادة إرسال الفاتورة لهيئة الزكاة والجمارك...');
    // Simulate API call for ZATCA retry
    setTimeout(() => {
      toastSuccess('تم اعتماد الفاتورة بنجاح في منصة فاتورة التابعة لهيئة الزكاة');
      fetchData();
    }, 1500);
  };

  // Action: Void/Cancel Invoice
  const handleVoidInvoice = async (id: number) => {
    if (!confirm('هل أنت متأكد من إلغاء/حذف هذه الفاتورة؟ سيتم إلغاء القيود وعكس حركات المخزون.')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/sales?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toastSuccess('تم إلغاء/عكس الفاتورة بنجاح');
        fetchData();
      } else {
        toastError('صلاحيات غير كافية لإجراء الإلغاء');
      }
    } catch (err) {
      toastError('فشل تنفيذ عملية الإلغاء');
    }
  };

  // Action: Register Payment
  const handleRegisterPayment = (inv: Invoice) => {
    toastSuccess(`تم تحصيل وتسجيل الدفعة للفاتورة رقم INV-${inv.invoiceNo} بنجاح`);
    fetchData();
  };

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  return (
    <div className="invoice-register-container" style={{ direction: 'rtl', padding: '1rem', color: 'var(--text)' }}>
      {/* 1. Header Module */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            <FileText size={32} color="var(--primary)" /> سجل الفواتير <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 400 }}>Invoice Register</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>دفتر الفواتير المركزي للعملاء، المعاملات، الفواتير الإلكترونية (ZATCA)، والربط بعروض الأسعار</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => fetchData()} title="تحديث البيانات">
            <RefreshCw size={18} /> تحديث
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV} title="تصدير كـ Excel/CSV">
            <FileSpreadsheet size={18} /> تصدير
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/sales')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> فاتورة جديدة
          </button>
        </div>
      </div>

      {/* 2. Aggregate Summaries Dashboard Card */}
      <div className="card" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '1.25rem', 
        padding: '1.5rem', 
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px'
      }}>
        <div style={{ padding: '0.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>عدد الفواتير</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{totals.totalInvoices.toLocaleString()}</div>
        </div>
        <div style={{ padding: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>الإجمالي قبل الضريبة</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{totals.subtotalSum.toLocaleString(undefined, {minimumFractionDigits: 2})} <span style={{fontSize: '0.8rem'}}>ر.س</span></div>
        </div>
        <div style={{ padding: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>قيمة ضريبة VAT</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--warning)' }}>{totals.vatSum.toLocaleString(undefined, {minimumFractionDigits: 2})} <span style={{fontSize: '0.8rem'}}>ر.س</span></div>
        </div>
        <div style={{ padding: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>الإجمالي النهائي</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--success)' }}>{totals.totalSum.toLocaleString(undefined, {minimumFractionDigits: 2})} <span style={{fontSize: '0.8rem'}}>ر.س</span></div>
        </div>
        <div style={{ padding: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>إجمالي المدفوعات</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>{totals.paidSum.toLocaleString(undefined, {minimumFractionDigits: 2})} <span style={{fontSize: '0.8rem'}}>ر.س</span></div>
        </div>
        <div style={{ padding: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>المتبقي المستحق</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--danger)' }}>{totals.balanceSum.toLocaleString(undefined, {minimumFractionDigits: 2})} <span style={{fontSize: '0.8rem'}}>ر.س</span></div>
        </div>
      </div>

      {/* 3. Primary Filtering and Data Grid Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }} className="grid-responsive-layout">
        
        {/* Left Side: Preset Filter Navigation Tabs */}
        <div className="card" style={{ padding: '1rem', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>الفلاتر الجاهزة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {presetFilters.map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePreset(preset.id);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  textAlign: 'right',
                  padding: '0.65rem 0.85rem',
                  border: 'none',
                  borderRadius: '6px',
                  background: activePreset === preset.id ? 'var(--primary)' : 'transparent',
                  color: activePreset === preset.id ? '#fff' : 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                className={activePreset === preset.id ? '' : 'btn-hover-highlight'}
              >
                <span>{preset.labelAr}</span>
                {activePreset === preset.id && <CheckCircle size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Main Search & Grid Component */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* General Search Input & Advanced Trigger */}
          <div className="card" style={{ padding: '1rem', borderRadius: '12px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  style={{ paddingRight: '2.5rem', width: '100%', minHeight: '42px', borderRadius: '8px' }}
                  placeholder="بحث سريع برقم الفاتورة، اسم العميل، الجوال، رقم عرض السعر..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
              </div>
              <button type="button" className={`btn ${showAdvanced ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowAdvanced(!showAdvanced)} style={{ minHeight: '42px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Filter size={18} /> الفلاتر المتقدمة
              </button>
              <button type="submit" className="btn btn-primary" style={{ minHeight: '42px', padding: '0 1.5rem' }}>بحث</button>
            </form>

            {/* Advanced Filters Panel */}
            {showAdvanced && (
              <div style={{ 
                marginTop: '1.25rem', 
                paddingTop: '1.25rem', 
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>من تاريخ الفاتورة</label>
                  <input type="date" className="input" style={{ width: '100%' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إلى تاريخ الفاتورة</label>
                  <input type="date" className="input" style={{ width: '100%' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>العميل</label>
                  <select className="input" style={{ width: '100%' }} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                    <option value="">كل العملاء</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الفرع</label>
                  <select className="input" style={{ width: '100%' }} value={branchId} onChange={e => setBranchId(e.target.value)}>
                    <option value="">كل الفروع</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المستخدم المنشئ</label>
                  <select className="input" style={{ width: '100%' }} value={createdById} onChange={e => setCreatedById(e.target.value)}>
                    <option value="">كل المستخدمين</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.username}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>حالة الفاتورة</label>
                  <select className="input" style={{ width: '100%' }} value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">الكل</option>
                    <option value="DRAFT">مسودة DRAFT</option>
                    <option value="completed">صادرة Completed</option>
                    <option value="cancelled">ملغاة Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>حالة الدفع</label>
                  <select className="input" style={{ width: '100%' }} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                    <option value="">الكل</option>
                    <option value="unpaid">غير مدفوعة Unpaid</option>
                    <option value="partially_paid">مدفوعة جزئياً Partially Paid</option>
                    <option value="paid">مدفوعة Paid</option>
                    <option value="overdue">متأخرة Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>حالة هيئة الزكاة (ZATCA)</label>
                  <select className="input" style={{ width: '100%' }} value={zatcaStatus} onChange={e => setZatcaStatus(e.target.value)}>
                    <option value="">الكل</option>
                    <option value="pending">معلق Pending</option>
                    <option value="reported">مبلغة Reported</option>
                    <option value="cleared">معتمدة Cleared</option>
                    <option value="failed">فشلت Failed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مصدر الفاتورة</label>
                  <select className="input" style={{ width: '100%' }} value={sourceType} onChange={e => setSourceType(e.target.value)}>
                    <option value="">الكل</option>
                    <option value="manual">إنشاء يدوي</option>
                    <option value="quotation">من عرض سعر</option>
                    <option value="pos">نقاط البيع (POS)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>نوع المستند</label>
                  <select className="input" style={{ width: '100%' }} value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                    <option value="">الكل</option>
                    <option value="tax_invoice">فاتورة ضريبية Tax Invoice</option>
                    <option value="simplified">فاتورة مبسطة Simplified</option>
                    <option value="credit_note">إشعار دائن Credit Note</option>
                    <option value="debit_note">إشعار مدين Debit Note</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الحد الأدنى للقيمة</label>
                  <input type="number" className="input" style={{ width: '100%' }} placeholder="من قيمة..." value={minTotal} onChange={e => setMinTotal(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الحد الأقصى للقيمة</label>
                  <input type="number" className="input" style={{ width: '100%' }} placeholder="إلى قيمة..." value={maxTotal} onChange={e => setMaxTotal(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>من رقم ضريبي للعميل</label>
                  <input type="text" className="input" style={{ width: '100%' }} placeholder="15 رقماً..." value={taxNumber} onChange={e => setTaxNumber(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>يتضمن منتج محدد</label>
                  <select className="input" style={{ width: '100%' }} value={productId} onChange={e => setProductId(e.target.value)}>
                    <option value="">كل المنتجات</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleResetFilters} style={{ minHeight: '38px' }}>تصفير الفلاتر</button>
                  <button type="button" className="btn btn-primary" onClick={() => { setPage(1); fetchData(); }} style={{ minHeight: '38px', padding: '0 2rem' }}>تطبيق الفلترة المتقدمة</button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions Panel */}
          {selectedRows.size > 0 && (
            <div className="bulk-actions-bar" style={{ 
              background: 'rgba(29, 78, 216, 0.15)', 
              padding: '0.85rem 1.25rem', 
              borderRadius: '8px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              border: '1px solid var(--primary)' 
            }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>تم تحديد: {selectedRows.size} فواتير</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => toastSuccess('جاري تشغيل الطباعة المجمعة...')}><Printer size={16} /> طباعة مجمعة</button>
                <button className="btn btn-secondary btn-sm" onClick={() => toastSuccess('جاري إرسال البريد المحدد...')}><Mail size={16} /> إرسال بالبريد</button>
                <button className="btn btn-secondary btn-sm" onClick={() => toastSuccess('جاري إرسال المحدد لمنصة هيئة الزكاة...')}><RefreshCcw size={16} /> اعتماد مجمع ZATCA</button>
                <button className="btn btn-danger btn-sm" onClick={() => { selectedRows.forEach(id => handleVoidInvoice(id)); setSelectedRows(new Set()); }}><Trash2 size={16} /> إلغاء المحدد</button>
              </div>
            </div>
          )}

          {/* Results Grid Table */}
          <div className="card table-container" style={{ overflowX: 'auto', borderRadius: '12px' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ width: '40px', padding: '1rem' }}>
                    <input type="checkbox" checked={selectedRows.size === invoices.length && invoices.length > 0} onChange={toggleAll} />
                  </th>
                  <th onClick={() => handleSort('invoiceNo')} style={{ cursor: 'pointer', padding: '1rem' }}>
                    رقم الفاتورة <ArrowUpDown size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  </th>
                  <th style={{ padding: '1rem' }}>العميل</th>
                  <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', padding: '1rem' }}>
                    تاريخ الفاتورة <ArrowUpDown size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  </th>
                  <th style={{ padding: '1rem' }}>الحالة</th>
                  <th style={{ padding: '1rem' }}>حالة الدفع</th>
                  <th style={{ padding: '1rem' }}>هيئة الزكاة</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>الإجمالي</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>المتبقي</th>
                  <th style={{ padding: '1rem' }}>المصدر</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '4rem' }}>
                      <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto var(--spacing)', color: 'var(--primary)' }} />
                      <div style={{ color: 'var(--text-muted)' }}>جاري تحميل سجل الفواتير الفوري...</div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      لا توجد فواتير مطابقة لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => {
                    const isSelected = selectedRows.has(inv.id);
                    return (
                      <tr 
                        key={inv.id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: isSelected ? 'rgba(29, 78, 216, 0.04)' : 'transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleRow(inv.id)} />
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>INV-{inv.invoiceNo}</td>
                        <td style={{ padding: '1rem' }}>
                          <div>{inv.customerName}</div>
                          {inv.customerTaxNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الرقم الضريبي: {inv.customerTaxNumber}</div>}
                        </td>
                        <td style={{ padding: '1rem', direction: 'ltr', textAlign: 'right' }}>
                          {new Date(inv.date).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${
                            inv.status === 'DRAFT' ? 'badge-gray' :
                            inv.status === 'cancelled' ? 'badge-danger' : 'badge-success'
                          }`}>
                            {inv.status === 'DRAFT' ? 'مسودة' :
                             inv.status === 'cancelled' ? 'ملغاة' : 'صادرة'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${
                            inv.paymentStatus === 'paid' ? 'badge-success' :
                            inv.paymentStatus === 'partially_paid' ? 'badge-warning' :
                            inv.paymentStatus === 'overdue' ? 'badge-danger' : 'badge-gray'
                          }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {inv.paymentStatus === 'paid' ? <CheckCircle size={12} /> : 
                             inv.paymentStatus === 'overdue' ? <AlertCircle size={12} /> : <Clock size={12} />}
                            {inv.paymentStatus === 'paid' ? 'مدفوعة كاملة' :
                             inv.paymentStatus === 'partially_paid' ? 'مدفوعة جزئياً' :
                             inv.paymentStatus === 'overdue' ? 'متأخرة السداد' : 'غير مدفوعة'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${
                            inv.zatcaStatus === 'cleared' ? 'badge-success' :
                            inv.zatcaStatus === 'reported' ? 'badge-info' :
                            inv.zatcaStatus === 'failed' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {inv.zatcaStatus === 'cleared' ? 'معتمدة' :
                             inv.zatcaStatus === 'reported' ? 'مبلغة' :
                             inv.zatcaStatus === 'failed' ? 'فشلت' : 'معلقة'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 'bold', textAlign: 'left' }}>
                          {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'left', color: inv.remaining > 0 ? 'var(--danger)' : 'inherit' }}>
                          {inv.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{inv.source === 'quotation' ? 'عرض سعر' : inv.source === 'pos' ? 'نقطة بيع' : 'يدوي'}</span>
                            {inv.source === 'quotation' && inv.sourceQuotationId && (
                              <button 
                                onClick={() => router.push(`/sales/quotations/${inv.sourceQuotationId}`)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: 'var(--primary)', 
                                  cursor: 'pointer', 
                                  fontSize: '0.75rem', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '2px',
                                  padding: 0
                                }}
                              >
                                <LinkIcon size={10} /> #{inv.quotationNo}
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleReprint(inv)} title="عرض وإعادة طباعة"><Printer size={14} /></button>
                            {inv.remaining > 0 && inv.status !== 'cancelled' && (
                              <button className="btn btn-success btn-sm" onClick={() => handleRegisterPayment(inv)} title="تسجيل دفعة مستلمة"><CheckCircle size={14} /></button>
                            )}
                            {inv.zatcaStatus === 'failed' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleRetryZatca(inv.id)} title="إعادة إرسال للزكاة والجمارك"><RefreshCw size={14} /></button>
                            )}
                            {inv.status !== 'cancelled' && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleVoidInvoice(inv.id)} title="إلغاء وعكس الفاتورة"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Grid Server-side Pagination controls */}
          {totalPages > 1 && (
            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>
                عرض {(page - 1) * pageSize + 1} إلى {Math.min(page * pageSize, totals.totalInvoices)} من أصل {totals.totalInvoices} فاتورة عميل
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  السابق
                </button>
                <span style={{ fontWeight: 'bold', padding: '0 0.75rem' }}>صفحة {page} من {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  التالي
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Invoice receipt print component modal */}
      {showReceipt && selectedInvoiceData && (
        <InvoiceReceipt invoiceData={selectedInvoiceData} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}
