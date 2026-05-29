'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Table, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  User, 
  RefreshCw,
  SlidersHorizontal,
  FileText,
  CheckCircle,
  HelpCircle,
  Lock,
  Play,
  ArrowLeftRight,
  Info,
  Coins,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Invoice {
  id: number;
  invoiceNo: string;
  date: string;
  total: number;
  paid: number;
  remaining: number;
  status: string;
}

interface Receipt {
  id: number;
  date: string;
  type: string;
  amount: number;
  remaining: number;
  description?: string;
}

interface OpenItemsData {
  salesInvoices: Invoice[];
  purchaseInvoices: Invoice[];
  openReceipts: Receipt[];
}

export default function OpenItemsDashboard() {
  const { lang } = useTranslation();
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const _t = (ar: string, en: string) => isAr ? ar : en;

  // Active Tab layout control
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customer-alloc' | 'supplier-alloc' | 'reversal-preview'>('dashboard');

  const [customerId, setCustomerId] = useState<string>('1');
  const [data, setData] = useState<OpenItemsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Frontend filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ar' | 'ap'>('all');
  const [minRemaining, setMinRemaining] = useState<string>('');

  // ── 1. Customer Allocation (AR) Wired States ──────────────────────────────
  const [customerAllocations, setCustomerAllocations] = useState<{ [invoiceId: number]: string }>({});
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [customerPreviewLoading, setCustomerPreviewLoading] = useState(false);
  const [customerPreviewResult, setCustomerPreviewResult] = useState<any>(null);
  const [customerPreviewError, setCustomerPreviewError] = useState<string | null>(null);

  // ── 2. Supplier Allocation (AP) Wired States ──────────────────────────────
  const [supplierAllocations, setSupplierAllocations] = useState<{ [invoiceId: number]: string }>({});
  const [selectedApReceiptId, setSelectedApReceiptId] = useState<string>('');
  const [supplierPreviewLoading, setSupplierPreviewLoading] = useState(false);
  const [supplierPreviewResult, setSupplierPreviewResult] = useState<any>(null);
  const [supplierPreviewError, setSupplierPreviewError] = useState<string | null>(null);

  // ── 3. Reversal Wired States ──────────────────────────────────────────────
  const [selectedMatchingId, setSelectedMatchingId] = useState<string>('4820');
  const [reversalReason, setReversalReason] = useState('');
  const [reversalPreviewLoading, setReversalPreviewLoading] = useState(false);
  const [reversalPreviewResult, setReversalPreviewResult] = useState<any>(null);
  const [reversalPreviewError, setReversalPreviewError] = useState<string | null>(null);

  const fetchOpenItems = async (cId: string) => {
    if (!cId || isNaN(Number(cId)) || Number(cId) <= 0) {
      setError(_t('يرجى إدخال رقم تعريف صحيح للشريك.', 'Please enter a valid Partner ID.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/open-items?customerId=${cId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || _t('فشل في جلب البيانات من الخادم.', 'Failed to fetch open items from server.'));
      }

      const json = await response.json();
      setData(json);
      // Reset wizard allocations on data reload
      setCustomerAllocations({});
      setSupplierAllocations({});
      setCustomerPreviewResult(null);
      setSupplierPreviewResult(null);
      setReversalPreviewResult(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : _t('حدث خطأ غير متوقع أثناء معالجة الطلب.', 'An unexpected error occurred.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenItems(customerId);
  }, []);

  const formatCurrency = (n: number) => {
    return Number(n || 0).toLocaleString(isAr ? 'ar-SA' : 'en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Metrics Calculations for Dashboard
  const totalOutstandingAR = data?.salesInvoices.reduce((sum, inv) => sum + inv.remaining, 0) || 0;
  const totalOutstandingAP = data?.purchaseInvoices.reduce((sum, inv) => sum + inv.remaining, 0) || 0;
  const netExposure = totalOutstandingAR - totalOutstandingAP;
  const totalUnallocated = data?.openReceipts.reduce((sum, r) => sum + r.remaining, 0) || 0;

  // Filter lists safely
  const filteredSalesInvoices = data?.salesInvoices.filter(inv => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinAmount = minRemaining ? inv.remaining >= Number(minRemaining) : true;
    return matchesSearch && matchesMinAmount;
  }) || [];

  const filteredPurchaseInvoices = data?.purchaseInvoices.filter(inv => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinAmount = minRemaining ? inv.remaining >= Number(minRemaining) : true;
    return matchesSearch && matchesMinAmount;
  }) || [];

  const filteredReceipts = data?.openReceipts.filter(r => {
    const matchesSearch = (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          `treas-${r.id}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinAmount = minRemaining ? r.remaining >= Number(minRemaining) : true;
    return matchesSearch && matchesMinAmount;
  }) || [];

  const hasNoData = filteredSalesInvoices.length === 0 && 
                    filteredPurchaseInvoices.length === 0 && 
                    filteredReceipts.length === 0;

  // ── 1. Wired Customer Allocation Preview Call ──────────────────────────────
  const handleCustomerPreview = async () => {
    setCustomerPreviewLoading(true);
    setCustomerPreviewResult(null);
    setCustomerPreviewError(null);

    const partnerId = parseInt(customerId);
    const treasuryId = parseInt(selectedReceiptId);
    
    if (isNaN(partnerId) || partnerId <= 0) {
      setCustomerPreviewError(_t('يرجى اختيار شريك صحيح للاستعلام أولاً.', 'Please select a valid partner ID first.'));
      setCustomerPreviewLoading(false);
      return;
    }
    if (isNaN(treasuryId) || treasuryId <= 0) {
      setCustomerPreviewError(_t('يرجى اختيار سند القبض معلق التوزيع لإتمام المعاينة.', 'Please select an unallocated receipt to preview.'));
      setCustomerPreviewLoading(false);
      return;
    }

    const allocationsArray = Object.entries(customerAllocations)
      .map(([invoiceId, amount]) => ({
        salesInvoiceId: parseInt(invoiceId),
        amount: parseFloat(amount)
      }))
      .filter(alloc => !isNaN(alloc.salesInvoiceId) && !isNaN(alloc.amount) && alloc.amount > 0);

    if (allocationsArray.length === 0) {
      setCustomerPreviewError(_t('يرجى إدخال قيمة تخصيص موجبة أكبر من صفر لأي فاتورة معلقة واحدة على الأقل.', 'Please enter a positive allocation amount for at least one outstanding invoice.'));
      setCustomerPreviewLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/open-items/preview/customer-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          partnerId,
          treasuryId,
          allocations: allocationsArray,
          dryRun: true
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || _t('فشلت محاكاة التخصيص من الخادم.', 'Allocation dry-run simulation failed on the server.'));
      }
      setCustomerPreviewResult(result);
    } catch (err: any) {
      setCustomerPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setCustomerPreviewLoading(false);
    }
  };

  // ── 2. Wired Supplier Allocation Preview Call ──────────────────────────────
  const handleSupplierPreview = async () => {
    setSupplierPreviewLoading(true);
    setSupplierPreviewResult(null);
    setSupplierPreviewError(null);

    const partnerId = parseInt(customerId);
    const treasuryId = parseInt(selectedApReceiptId);
    
    if (isNaN(partnerId) || partnerId <= 0) {
      setSupplierPreviewError(_t('يرجى اختيار شريك صحيح للاستعلام أولاً.', 'Please select a valid partner ID first.'));
      setSupplierPreviewLoading(false);
      return;
    }
    if (isNaN(treasuryId) || treasuryId <= 0) {
      setSupplierPreviewError(_t('يرجى اختيار سند الصرف معلق التوزيع لإتمام المعاينة.', 'Please select an unallocated payment receipt to preview.'));
      setSupplierPreviewLoading(false);
      return;
    }

    const allocationsArray = Object.entries(supplierAllocations)
      .map(([invoiceId, amount]) => ({
        purchaseInvoiceId: parseInt(invoiceId),
        amount: parseFloat(amount)
      }))
      .filter(alloc => !isNaN(alloc.purchaseInvoiceId) && !isNaN(alloc.amount) && alloc.amount > 0);

    if (allocationsArray.length === 0) {
      setSupplierPreviewError(_t('يرجى إدخال قيمة تخصيص موجبة أكبر من صفر لأي فاتورة مشتريات واحدة على الأقل.', 'Please enter a positive allocation amount for at least one purchase invoice.'));
      setSupplierPreviewLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/open-items/preview/supplier-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          partnerId,
          treasuryId,
          allocations: allocationsArray,
          dryRun: true
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || _t('فشلت محاكاة التخصيص للمورد.', 'Supplier allocation dry-run failed on server.'));
      }
      setSupplierPreviewResult(result);
    } catch (err: any) {
      setSupplierPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setSupplierPreviewLoading(false);
    }
  };

  // ── 3. Wired Reversal Preview Call ──────────────────────────────────────────
  const handleReversalPreview = async () => {
    setReversalPreviewLoading(true);
    setReversalPreviewResult(null);
    setReversalPreviewError(null);

    const matchingId = parseInt(selectedMatchingId);
    if (isNaN(matchingId) || matchingId <= 0) {
      setReversalPreviewError(_t('يرجى إدخال رقم تسوية/مطابقة صحيح ومكتوب بالأرقام.', 'Please enter a valid matching/reconciliation ID.'));
      setReversalPreviewLoading(false);
      return;
    }

    if (reversalReason.length < 10) {
      setReversalPreviewError(_t('يجب كتابة مبرر الإلغاء تفصيلياً بما لا يقل عن 10 أحرف للتدقيق المالي.', 'Audit requirements strictly dictate a detailed reversal reason of minimum 10 characters.'));
      setReversalPreviewLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/open-items/preview/reversal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          matchingId,
          reason: reversalReason,
          dryRun: true
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || _t('فشلت محاكاة تراجع وإبطال التسوية.', 'Reversal dry-run simulation failed on the server.'));
      }
      setReversalPreviewResult(result);
    } catch (err: any) {
      setReversalPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setReversalPreviewLoading(false);
    }
  };

  const calculateTotalProposedCustomer = () => {
    return Object.values(customerAllocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const calculateTotalProposedSupplier = () => {
    return Object.values(supplierAllocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6" style={{ direction: dir }}>
      
      {/* Premium Gradient Header block */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 border border-indigo-900/40 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Layers className="w-6 h-6 animate-pulse" />
              </span>
              <span className="px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 rounded-full uppercase tracking-wider">
                {_t('بوابة محاكاة مطابقات الأرصدة (AR/AP)', 'Balance Reconciliation & Allocation Simulator')}
              </span>
              <span className="px-3 py-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" />
                {_t('محرك معالجة جافة مفعل وحي', 'Live Dry-Run Preview Active')}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
              {_t('مطابقة البنود المفتوحة وتوزيع المدفوعات', 'Open Items Allocation & Matching Ledger')}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl font-light">
              {_t(
                'شاشة تفاعلية معزولة تتيح للمحاسبين محاكاة تسوية أرصدة العملاء والموردين وتوزيع سندات التحصيل على الفواتير مع فحص الفترات المقفلة وقواعد الحسابات قبل الحفظ الفعلي.',
                'A secure simulator enabling accountants to dry-run customer collections and supplier allocations on open invoices prior to database mutations.'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{_t('معاينة جافة فقط | Dry-Run Simulation', 'Simulation Dry-Run Only')}</span>
          </div>
        </div>
      </div>

      {/* Modern Dashboard/Wizard Tabs system */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-2xl border border-slate-200/40">
        {[
          { id: 'dashboard', label: _t('لوحة التحكم (قراءة فقط)', 'Ledger View (Read-Only)'), icon: Table },
          { id: 'customer-alloc', label: _t('معاين تسوية عميل (AR)', 'Customer Preview (AR)'), icon: Coins },
          { id: 'supplier-alloc', label: _t('معاين تسوية مورد (AP)', 'Supplier Preview (AP)'), icon: DollarSign },
          { id: 'reversal-preview', label: _t('معاين إبطال مطابقة', 'Reversal Preview'), icon: ArrowLeftRight }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex-1 justify-center ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTAINER CONTENT */}
      {activeTab === 'dashboard' && (
        <>
          {/* Dashboard Metrics Cards */}
          {data && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              
              {/* Card 1: Outstanding Receivables */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">{_t('ذمم مدينة مفتوحة (AR)', 'Outstanding Receivables (AR)')}</span>
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="text-3xl font-black text-indigo-950 font-mono">
                    {formatCurrency(totalOutstandingAR)} <span className="text-xs font-normal text-slate-500">{_t('ر.س', 'SAR')}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <span>{data.salesInvoices.length}</span>
                    <span>{_t('فواتير معلقة', 'outstanding invoices')}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Outstanding Payables */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">{_t('ذمم دائنة مفتوحة (AP)', 'Outstanding Payables (AP)')}</span>
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <TrendingDown className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="text-3xl font-black text-amber-950 font-mono">
                    {formatCurrency(totalOutstandingAP)} <span className="text-xs font-normal text-slate-500">{_t('ر.س', 'SAR')}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <span>{data.purchaseInvoices.length}</span>
                    <span>{_t('فواتير غير مسددة', 'outstanding bills')}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Net Exposure */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">{_t('صافي رصيد الشريك', 'Net Partner Balance')}</span>
                  <span className={`p-2 rounded-lg ${netExposure >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <DollarSign className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className={`text-3xl font-black font-mono ${netExposure >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(Math.abs(netExposure))} <span className="text-xs font-normal text-slate-500">{_t('ر.س', 'SAR')}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {netExposure >= 0 
                      ? _t('رصيد دائن لصالح المنشأة (مطلوب تحصيله)', 'Net Receivable (To Collect)')
                      : _t('رصيد مدين مستحق للمورد (مطلوب دفعه)', 'Net Payable (To Pay)')
                    }
                  </div>
                </div>
              </div>

              {/* Card 4: Unallocated Payments */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">{_t('المقبوضات غير الموزعة', 'Unallocated Collections')}</span>
                  <span className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="text-3xl font-black text-sky-950 font-mono">
                    {formatCurrency(totalUnallocated)} <span className="text-xs font-normal text-slate-500">{_t('ر.س', 'SAR')}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <span>{data.openReceipts.length}</span>
                    <span>{_t('سندات معلقة التوزيع', 'unallocated receipts')}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Query Filters Control Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex flex-wrap items-end gap-4 flex-1">
                <div className="min-w-[240px] flex-1 lg:max-w-xs">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    {_t('رقم الشريك / العميل (ID)', 'Customer / Partner ID')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors pl-10"
                  />
                </div>
                
                <button
                  onClick={() => fetchOpenItems(customerId)}
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-colors duration-200 h-[42px]"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {_t('استعراض وتحديث', 'Query Open Items')}
                </button>
              </div>

              <div className="min-w-[240px] lg:max-w-xs flex-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  {_t('بحث سريع في الجداول', 'Quick Search in Tables')}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 ${isAr ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-400`}>
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={_t('رقم الفاتورة، البيان...', 'Search by invoice no, details...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{_t('خيارات الفرز', 'Filters')}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {[
                    { type: 'all', label: _t('عرض الكل', 'Show All') },
                    { type: 'ar', label: _t('الذمم المدينة (AR) فقط', 'AR Only') },
                    { type: 'ap', label: _t('الذمم الدائنة (AP) فقط', 'AP Only') }
                  ].map(tab => (
                    <button
                      key={tab.type}
                      onClick={() => setFilterType(tab.type as any)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        filterType === tab.type 
                          ? 'bg-white text-indigo-950 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 whitespace-nowrap">{_t('الحد الأدنى للرصيد المعلق:', 'Min Balance:')}</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={minRemaining}
                    onChange={(e) => setMinRemaining(e.target.value)}
                    className="w-24 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs font-semibold font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Primary Display Tables */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-rose-800 flex items-start gap-4">
              <span className="p-2 bg-rose-100 text-rose-600 rounded-xl mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-950">{_t('فشل الاستعلام', 'Query Error')}</h4>
                <p className="text-sm font-light">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
                  <div className="h-6 w-48 bg-slate-200 rounded-md" />
                  <div className="h-10 w-full bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            data && (
              hasNoData ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{_t('لا توجد بنود مفتوحة معلقة', 'No pending open items found')}</h3>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* AR Sales Invoices */}
                  {(filterType === 'all' || filterType === 'ar') && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-base">{_t('فواتير المبيعات المفتوحة المعلقة (AR)', 'Outstanding Sales Invoices (AR)')}</h3>
                        <span className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md">{filteredSalesInvoices.length}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-slate-700 text-right">
                          <thead className="bg-slate-50/30 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-3.5 text-right">{_t('رقم الفاتورة', 'Invoice No')}</th>
                              <th className="px-6 py-3.5 text-right">{_t('التاريخ', 'Posting Date')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('الإجمالي', 'Total Amount')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('المسدد', 'Paid Amount')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('المتبقي للتسوية', 'Outstanding Balance')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSalesInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-bold text-indigo-600">#{inv.invoiceNo}</td>
                                <td className="px-6 py-4 text-slate-500">{formatDate(inv.date)}</td>
                                <td className="px-6 py-4 text-left font-mono">{formatCurrency(inv.total)}</td>
                                <td className="px-6 py-4 text-left font-mono">{formatCurrency(inv.paid)}</td>
                                <td className="px-6 py-4 text-left font-black font-mono text-rose-600">{formatCurrency(inv.remaining)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* AP Purchase Invoices */}
                  {(filterType === 'all' || filterType === 'ap') && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-base">{_t('فواتير المشتريات المفتوحة المعلقة (AP)', 'Outstanding Purchase Invoices (AP)')}</h3>
                        <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-md">{filteredPurchaseInvoices.length}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-slate-700 text-right">
                          <thead className="bg-slate-50/30 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-3.5 text-right">{_t('رقم الفاتورة', 'Bill No')}</th>
                              <th className="px-6 py-3.5 text-right">{_t('التاريخ', 'Posting Date')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('الإجمالي', 'Total Amount')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('المسدد', 'Paid Amount')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('المتبقي للتسوية', 'Outstanding Balance')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredPurchaseInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-bold text-amber-600">#{inv.invoiceNo}</td>
                                <td className="px-6 py-4 text-slate-500">{formatDate(inv.date)}</td>
                                <td className="px-6 py-4 text-left font-mono">{formatCurrency(inv.total)}</td>
                                <td className="px-6 py-4 text-left font-mono">{formatCurrency(inv.paid)}</td>
                                <td className="px-6 py-4 text-left font-black font-mono text-rose-600">{formatCurrency(inv.remaining)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Treasury Receipts */}
                  {filterType === 'all' && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-base">{_t('سندات المقبوضات معلقة التوزيع', 'Unallocated Receipts (Pending Allocation)')}</h3>
                        <span className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 rounded-md">{filteredReceipts.length}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-slate-700 text-right">
                          <thead className="bg-slate-50/30 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-3.5 text-right">{_t('رقم القيد الخزني', 'Treasury ID')}</th>
                              <th className="px-6 py-3.5 text-right">{_t('التاريخ', 'Posting Date')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('المبلغ الأصلي', 'Original Amount')}</th>
                              <th className="px-6 py-3.5 text-left">{_t('الرصيد غير الموزع', 'Unallocated Remaining')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredReceipts.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-bold text-sky-600">#TREAS-{entry.id}</td>
                                <td className="px-6 py-4 text-slate-500">{formatDate(entry.date)}</td>
                                <td className="px-6 py-4 text-left font-mono">{formatCurrency(entry.amount)}</td>
                                <td className="px-6 py-4 text-left font-black font-mono text-sky-600">{formatCurrency(entry.remaining)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            )
          )}
        </>
      )}

      {/* TAB: CUSTOMER ALLOCATION WIZARD (AR) */}
      {activeTab === 'customer-alloc' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-indigo-950">{_t('معالج تسوية أرصدة العملاء (AR Wizard)', 'Customer Allocation Preview Wizard (AR)')}</h2>
              <p className="text-xs text-slate-500 mt-1">{_t('قم بمحاكاة تخصيص سندات القبض مع فواتير المبيعات معزولاً ومحميّاً بالكامل باستخدام المحرك الحي.', 'Dry-run sales invoice allocation with unallocated receipts using the live preview engine.')}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
              {_t('وضع المعاينة الجافة | Preview Mode', 'Simulation Preview')}
            </span>
          </div>

          {!data || data.salesInvoices.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm font-semibold">
              {_t('يرجى استعلام البنود المفتوحة للشريك أولاً من لوحة التحكم لعرض فواتيره المفتوحة وسنداته المعلقة.', 'Please query open items for a partner from the Ledger View first to load outstanding invoices and unallocated receipts.')}
            </div>
          ) : (
            <>
              {/* Form selectors using real fetched data */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">{_t('الشريك المستهدف (مستعلم حالياً)', 'Target Partner (Active)')}</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>{_t(`العميل النشط - معرف ح/ ${customerId}`, `Active Partner - ID: ${customerId}`)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">{_t('اختر سند القبض معلق التوزيع (من الدفاتر الحية)', 'Select Unallocated Receipt (Live)')}</label>
                  <select
                    value={selectedReceiptId}
                    onChange={(e) => setSelectedReceiptId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800"
                  >
                    <option value="">{_t('── اختر سند قبض معلق ──', '── Select Pending Receipt ──')}</option>
                    {data.openReceipts.map(receipt => (
                      <option key={receipt.id} value={receipt.id}>
                        {_t(`سند #TREAS-${receipt.id} - رصيد: ${formatCurrency(receipt.remaining)} ر.س`, `Receipt TREAS-${receipt.id} - Bal: ${formatCurrency(receipt.remaining)} SAR`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Allocations Table */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-indigo-600" />
                  {_t('فواتير المبيعات المفتوحة الحية والتخصيص المقترح', 'Live Open Invoices & Proposed Allocation')}
                </h4>

                <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                  <table className="w-full text-sm text-slate-700 text-right">
                    <thead className="bg-slate-50/40 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-right">{_t('رقم الفاتورة', 'Invoice No')}</th>
                        <th className="px-4 py-3 text-right">{_t('التاريخ', 'Date')}</th>
                        <th className="px-4 py-3 text-left">{_t('المبلغ المتبقي المعلق', 'Outstanding Balance')}</th>
                        <th className="px-4 py-3 text-left w-36">{_t('مبلغ التوزيع المقترح', 'Allocation Amount')}</th>
                        <th className="px-4 py-3 text-left">{_t('المتبقي المتوقع بعد المعاينة', 'Preview Remaining')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.salesInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3.5 font-bold text-indigo-600">#{inv.invoiceNo}</td>
                          <td className="px-4 py-3.5 text-slate-500">{formatDate(inv.date)}</td>
                          <td className="px-4 py-3.5 font-mono text-left">{formatCurrency(inv.remaining)} ر.س</td>
                          <td className="px-4 py-3.5 text-left">
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={customerAllocations[inv.id] || ''}
                              onChange={(e) => {
                                setCustomerAllocations({
                                  ...customerAllocations,
                                  [inv.id]: e.target.value
                                });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-left font-mono font-bold"
                            />
                          </td>
                          <td className="px-4 py-3.5 font-mono text-left text-emerald-600 font-extrabold">
                            {formatCurrency(Math.max(0, inv.remaining - (parseFloat(customerAllocations[inv.id]) || 0)))} ر.س
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculations summaries */}
                <div className="grid gap-4 md:grid-cols-3 pt-2">
                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">{_t('قيمة السند المحدد', 'Receipt Value')}</span>
                    <span className="text-base font-extrabold text-indigo-950 font-mono">
                      {formatCurrency(data.openReceipts.find(r => r.id === parseInt(selectedReceiptId))?.remaining || 0)} ر.س
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">{_t('إجمالي التخصيص المقترح', 'Total Proposed Allocation')}</span>
                    <span className="text-base font-extrabold text-indigo-600 font-mono">
                      {formatCurrency(calculateTotalProposedCustomer())} ر.س
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">{_t('الرصيد المتبقي غير الموزع', 'Remaining Unallocated')}</span>
                    <span className="text-base font-extrabold text-amber-600 font-mono">
                      {formatCurrency(Math.max(0, (data.openReceipts.find(r => r.id === parseInt(selectedReceiptId))?.remaining || 0) - calculateTotalProposedCustomer()))} ر.س
                    </span>
                  </div>
                </div>
              </div>

              {/* SIMULATION TRIGGER BUTTONS AND RESULTS */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={handleCustomerPreview}
                    disabled={customerPreviewLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Play className={`w-4 h-4 ${customerPreviewLoading ? 'animate-spin' : ''}`} />
                    {_t('معاينة ومحاكاة تخصيص الأرصدة (Dry-Run)', 'Run Allocation Simulation')}
                  </button>

                  <button
                    disabled
                    className="px-6 py-3 bg-slate-100 text-slate-400 cursor-not-allowed font-bold text-sm rounded-xl border border-slate-200/60 flex items-center gap-2 group relative"
                  >
                    <Lock className="w-4 h-4 text-rose-500" />
                    {_t('إثبات وحفظ التسوية فعلياً', 'Save Actual Allocation')}
                  </button>
                </div>

                <span className="text-xs text-slate-500 flex items-center gap-1.5 font-light">
                  <Info className="w-4 h-4 text-indigo-500" />
                  {_t('لن يتم إجراء أي كتابة أو تعديل على دفاتر الحسابات العام والخزينة.', 'No database write or mutation will be performed.')}
                </span>
              </div>

              {/* FAILURE RESPONSE PANEL */}
              {customerPreviewError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <h4 className="font-extrabold">{_t('فشل فحص التسوية المالي (أخطاء مانعة)', 'Validation Blocking Errors')}</h4>
                  </div>
                  <p className="text-xs text-rose-950 font-semibold">{customerPreviewError}</p>
                </div>
              )}

              {/* SUCCESS DTO RESULT PANEL */}
              {customerPreviewResult && (
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-5 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-extrabold">{_t('نجاح محاكاة التخصيص والمطابقة محاسبياً', 'Allocation Dry-Run Simulation Succeeded')}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded">
                      {_t('الوضع الجاف: نشط', 'dryRun: true')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2">
                    <p>{_t('تم حساب العملية بنجاح. القيد المحاسبي المولد للمعاينة يطابق القواعد المالية الحالية:', 'Calculation finalized. Preview matching matches structural financial validation rules:')}</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li>{_t('القدرة على المضي قدماً (canProceed): ', 'Can Proceed: ')} <span className="font-bold text-emerald-700">{String(customerPreviewResult.canProceed)}</span></li>
                      <li>{_t('إجمالي التسوية المقترحة: ', 'Total Proposed: ')} <span className="font-bold text-slate-800 font-mono">{formatCurrency(customerPreviewResult.totalAllocatedAmount)} ر.س</span></li>
                      <li>{_t('رصيد السند المعلق المتبقي: ', 'Unallocated Remainder: ')} <span className="font-bold text-slate-800 font-mono">{formatCurrency(customerPreviewResult.unallocatedAmount)} ر.س</span></li>
                    </ul>
                  </div>

                  {/* Table details */}
                  <div className="bg-white rounded-lg border border-slate-100 overflow-hidden text-[11px]">
                    <table className="w-full text-slate-700 text-right">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-right">{_t('الفاتورة', 'Invoice')}</th>
                          <th className="px-3 py-2 text-left">{_t('المدفوع حالياً', 'Current Paid')}</th>
                          <th className="px-3 py-2 text-left">{_t('المتبقي حالياً', 'Current Rem.')}</th>
                          <th className="px-3 py-2 text-left">{_t('المدفوع بالمعاينة', 'Preview Paid')}</th>
                          <th className="px-3 py-2 text-left">{_t('المتبقي بالمعاينة', 'Preview Rem.')}</th>
                          <th className="px-3 py-2 text-center">{_t('الحالة المتوقعة', 'Preview Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {customerPreviewResult.affectedInvoices.map((inv: any) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-bold text-indigo-600 text-right font-sans">#{inv.invoiceNo}</td>
                            <td className="px-3 py-2 text-left">{formatCurrency(inv.currentPaid)}</td>
                            <td className="px-3 py-2 text-left">{formatCurrency(inv.currentRemaining)}</td>
                            <td className="px-3 py-2 text-left text-indigo-600 font-bold">{formatCurrency(inv.previewPaid)}</td>
                            <td className="px-3 py-2 text-left text-emerald-600 font-black">{formatCurrency(inv.previewRemaining)}</td>
                            <td className="px-3 py-2 text-center font-sans">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB: SUPPLIER ALLOCATION WIZARD (AP) */}
      {activeTab === 'supplier-alloc' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-amber-950">{_t('معالج تسوية أرصدة الموردين (AP Wizard)', 'Supplier Allocation Preview Wizard (AP)')}</h2>
              <p className="text-xs text-slate-500 mt-1">{_t('قم بمحاكاة تخصيص سندات الصرف مع فواتير المشتريات المفتوحة للموردين بشكل معزول ومحمي.', 'Dry-run bills and purchase allocations with supplier payments safely.')}</p>
            </div>
            <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-full">
              {_t('وضع المعاينة الجافة | Preview Mode', 'Simulation Preview')}
            </span>
          </div>

          {!data || data.purchaseInvoices.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm font-semibold">
              {_t('يرجى استعلام البنود المفتوحة للشريك أولاً من لوحة التحكم لعرض فواتيره المفتوحة وسنداته المعلقة.', 'Please query open items for a partner from the Ledger View first to load outstanding invoices and unallocated receipts.')}
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">{_t('المورد النشط (مستعلم حالياً)', 'Target Partner (Active)')}</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>{_t(`المورد النشط - معرف ح/ ${customerId}`, `Active Partner - ID: ${customerId}`)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">{_t('اختر سند الدفع/الصرف معلق التوزيع (من الدفاتر الحية)', 'Select Unallocated Payment (Live)')}</label>
                  <select
                    value={selectedApReceiptId}
                    onChange={(e) => setSelectedApReceiptId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800"
                  >
                    <option value="">{_t('── اختر سند صرف معلق ──', '── Select Pending Payment ──')}</option>
                    {data.openReceipts.map(receipt => (
                      <option key={receipt.id} value={receipt.id}>
                        {_t(`سند #TREAS-${receipt.id} - رصيد: ${formatCurrency(receipt.remaining)} ر.س`, `Payment TREAS-${receipt.id} - Bal: ${formatCurrency(receipt.remaining)} SAR`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AP Preview Table */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-amber-600" />
                  {_t('فواتير المشتريات المعلقة للمورد والتخصيص المقترح', 'Purchase Invoices & Proposed Allocation')}
                </h4>

                <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                  <table className="w-full text-sm text-slate-700 text-right">
                    <thead className="bg-slate-50/40 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-right">{_t('رقم الفاتورة', 'Bill No')}</th>
                        <th className="px-4 py-3 text-right">{_t('التاريخ', 'Date')}</th>
                        <th className="px-4 py-3 text-left">{_t('المبلغ المتبقي المعلق', 'Outstanding Balance')}</th>
                        <th className="px-4 py-3 text-left w-36">{_t('مبلغ التوزيع المقترح', 'Allocation Amount')}</th>
                        <th className="px-4 py-3 text-left">{_t('المتبقي المتوقع بعد المعاينة', 'Preview Remaining')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.purchaseInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3.5 font-bold text-amber-600">#{inv.invoiceNo}</td>
                          <td className="px-4 py-3.5 text-slate-500">{formatDate(inv.date)}</td>
                          <td className="px-4 py-3.5 font-mono text-left">{formatCurrency(inv.remaining)} ر.س</td>
                          <td className="px-4 py-3.5 text-left">
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={supplierAllocations[inv.id] || ''}
                              onChange={(e) => {
                                setSupplierAllocations({
                                  ...supplierAllocations,
                                  [inv.id]: e.target.value
                                });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg px-2 py-1 text-xs text-left font-mono font-bold"
                            />
                          </td>
                          <td className="px-4 py-3.5 font-mono text-left text-emerald-600 font-extrabold">
                            {formatCurrency(Math.max(0, inv.remaining - (parseFloat(supplierAllocations[inv.id]) || 0)))} ر.س
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculations summaries */}
                <div className="grid gap-4 md:grid-cols-3 pt-2">
                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">{_t('قيمة السند المحدد', 'Payment Value')}</span>
                    <span className="text-base font-extrabold text-indigo-950 font-mono">
                      {formatCurrency(data.openReceipts.find(r => r.id === parseInt(selectedApReceiptId))?.remaining || 0)} ر.س
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">{_t('إجمالي التخصيص المقترح', 'Total Proposed Allocation')}</span>
                    <span className="text-base font-extrabold text-indigo-600 font-mono">
                      {formatCurrency(calculateTotalProposedSupplier())} ر.س
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">{_t('الرصيد المتبقي غير الموزع', 'Remaining Unallocated')}</span>
                    <span className="text-base font-extrabold text-amber-600 font-mono">
                      {formatCurrency(Math.max(0, (data.openReceipts.find(r => r.id === parseInt(selectedApReceiptId))?.remaining || 0) - calculateTotalProposedSupplier()))} ر.س
                    </span>
                  </div>
                </div>
              </div>

              {/* SIMULATION TRIGGER */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={handleSupplierPreview}
                    disabled={supplierPreviewLoading}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Play className={`w-4 h-4 ${supplierPreviewLoading ? 'animate-spin' : ''}`} />
                    {_t('معاينة ومحاكاة تسوية الموردين (Dry-Run)', 'Run Supplier Simulation')}
                  </button>

                  <button
                    disabled
                    className="px-6 py-3 bg-slate-100 text-slate-400 cursor-not-allowed font-bold text-sm rounded-xl border border-slate-200/60 flex items-center gap-2 group relative"
                  >
                    <Lock className="w-4 h-4 text-rose-500" />
                    {_t('ترحيل وحفظ الدفع الفعلي', 'Post Supplier Payment')}
                  </button>
                </div>
              </div>

              {/* FAILURE AP RESPONSE */}
              {supplierPreviewError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <h4 className="font-extrabold">{_t('فشل فحص التسوية ماليّاً للمورد', 'Validation Blocking Errors')}</h4>
                  </div>
                  <p className="text-xs text-rose-955 font-semibold">{supplierPreviewError}</p>
                </div>
              )}

              {/* SUCCESS AP DTO RESULT */}
              {supplierPreviewResult && (
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-5 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800">
                      <CheckCircle className="w-5 h-5 text-amber-600" />
                      <h4 className="font-extrabold">{_t('نجاح محاكاة تسوية المورد محاسبياً', 'Supplier Dry-Run Simulation Succeeded')}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold rounded">
                      {_t('الوضع الجاف: نشط', 'dryRun: true')}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-100 overflow-hidden text-[11px]">
                    <table className="w-full text-slate-700 text-right">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-right">{_t('الفاتورة', 'Bill')}</th>
                          <th className="px-3 py-2 text-left">{_t('المدفوع حالياً', 'Current Paid')}</th>
                          <th className="px-3 py-2 text-left">{_t('المتبقي حالياً', 'Current Rem.')}</th>
                          <th className="px-3 py-2 text-left">{_t('المدفوع بالمعاينة', 'Preview Paid')}</th>
                          <th className="px-3 py-2 text-left">{_t('المتبقي بالمعاينة', 'Preview Rem.')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {supplierPreviewResult.affectedInvoices.map((inv: any) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-bold text-amber-600 text-right font-sans">#{inv.invoiceNo}</td>
                            <td className="px-3 py-2 text-left">{formatCurrency(inv.currentPaid)}</td>
                            <td className="px-3 py-2 text-left">{formatCurrency(inv.currentRemaining)}</td>
                            <td className="px-3 py-2 text-left text-amber-600 font-bold">{formatCurrency(inv.previewPaid)}</td>
                            <td className="px-3 py-2 text-left text-emerald-600 font-black">{formatCurrency(inv.previewRemaining)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB: REVERSAL PREVIEW MODAL / SKELETON */}
      {activeTab === 'reversal-preview' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-rose-950">{_t('معاين إبطال وإلغاء المطابقات السابقة (Reversal Wizard)', 'Allocation Reversal Preview Wizard')}</h2>
              <p className="text-xs text-slate-500 mt-1">{_t('قم بمحاكاة التراجع عن تسويات قديمة واستعراض أثر عودة الأرصدة المعلقة وحماية الفترات المقفلة.', 'Dry-run voiding old allocations and review outstanding balance rollback impact.')}</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-full">
              {_t('وضع المعاينة الجافة | Preview Mode', 'Simulation Preview')}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">{_t('رقم حركة المطابقة السابقة (Matching ID)', 'Enter Matching ID (Numeric)')}</label>
              <input
                type="number"
                min="1"
                value={selectedMatchingId}
                onChange={(e) => setSelectedMatchingId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">{_t('مبرر إلغاء وإبطال المطابقة (يطلب الخادم حداً أدنى 10 أحرف للتدقيق)', 'Detailed Reversal Reason (Minimum 10 chars)')}</label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder={_t('اكتب مبرراً تفصيلياً لإلغاء هذه المطابقة لتدوين سجلات التدقيق المالي...', 'Provide a clear auditing reason for voiding this match...')}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* SIMULATION ACTION */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={handleReversalPreview}
                disabled={reversalPreviewLoading}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Play className={`w-4 h-4 ${reversalPreviewLoading ? 'animate-spin' : ''}`} />
                {_t('معاينة أثر إلغاء المطابقة (Dry-Run Reversal)', 'Preview Reversal Impact')}
              </button>

              <button
                disabled
                className="px-6 py-3 bg-slate-100 text-slate-400 cursor-not-allowed font-bold text-sm rounded-xl border border-slate-200/60 flex items-center gap-2 group relative"
              >
                <Lock className="w-4 h-4 text-rose-500" />
                {_t('تنفيذ الإلغاء وعكس التسوية فعلياً', 'Execute Actual Reversal')}
              </button>
            </div>
          </div>

          {/* FAILURE REVERSAL RESPONSE */}
          {reversalPreviewError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h4 className="font-extrabold">{_t('فشل فحص إلغاء المطابقة (أخطاء مانعة)', 'Reversal Validation Blocking Errors')}</h4>
              </div>
              <p className="text-xs text-rose-955 font-semibold">{reversalPreviewError}</p>
            </div>
          )}

          {/* SUCCESS REVERSAL DTO RESULT */}
          {reversalPreviewResult && (
            <div className="bg-rose-50/40 border border-rose-200/60 rounded-xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h4 className="font-extrabold">{_t('توقعات أثر التراجع المالي على الأرصدة', 'Reversal Balance Impact Preview')}</h4>
                </div>
                <span className="px-2 py-0.5 bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-bold rounded">
                  {_t('وضع المحاكاة الجافة: نشط', 'dryRun: true')}
                </span>
              </div>

              <div className="text-xs text-rose-950 font-light leading-relaxed font-semibold">
                {_t('في حال اعتماد التراجع الفعلي لاحقاً، ستتأثر المستندات كالتالي وتعود لمستحقات المنشأة مع إلغاء ربطها التام:', 'Upon execution, historically settled sales/purchase documents will revert back as follows:')}
              </div>

              <div className="bg-white rounded-lg border border-slate-100 overflow-hidden text-[11px]">
                <table className="w-full text-slate-700 text-right">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-right">{_t('المستند المتأثر', 'Affected Doc')}</th>
                      <th className="px-3 py-2 text-left">{_t('المدفوع حالياً (المغلق)', 'Current Paid')}</th>
                      <th className="px-3 py-2 text-left">{_t('المتبقي حالياً', 'Current Rem.')}</th>
                      <th className="px-3 py-2 text-left">{_t('المدفوع المتوقع بعد الإلغاء', 'Preview Paid')}</th>
                      <th className="px-3 py-2 text-left">{_t('المتبقي المتوقع بعد الإلغاء', 'Preview Rem.')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {reversalPreviewResult.affectedInvoices.map((inv: any) => (
                      <tr key={inv.invoiceId} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-bold text-rose-600 text-right font-sans">#{inv.invoiceNo}</td>
                        <td className="px-3 py-2 text-left">{formatCurrency(inv.currentPaid)}</td>
                        <td className="px-3 py-2 text-left">{formatCurrency(inv.currentRemaining)}</td>
                        <td className="px-3 py-2 text-left text-slate-600 font-bold">{formatCurrency(inv.previewPaid)}</td>
                        <td className="px-3 py-2 text-left text-rose-600 font-black">{formatCurrency(inv.previewRemaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety info footer alert banner */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex gap-3 text-slate-600 text-xs items-center">
        <HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <p className="font-light leading-relaxed">
          {_t(
            'هذه الشاشة تمثل طبقة حماية للمعاينة فقط. لتطبيق تسويات فعلية أو ربط سندات القبض والدفع بالفواتير بنظام FIFO أو يدويًا، يرجى انتظار توجيهات محاسب النظام في المراحل القادمة.',
            'This UI is strictly for read-only preview. Action allocation, matching edits, and fiscal reconciliation features will be unlocked under authorized workflows in the next phase.'
          )}
        </p>
      </div>

    </div>
  );
}
