'use client';

import { useState, useEffect, useTransition } from 'react';
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
  HelpCircle
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

  const [customerId, setCustomerId] = useState<string>('1');
  const [data, setData] = useState<OpenItemsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Frontend filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ar' | 'ap'>('all');
  const [minRemaining, setMinRemaining] = useState<string>('');

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

  // Metrics Calculations
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6" style={{ direction: dir }}>
      
      {/* Premium Gradient Header block */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 border border-indigo-900/40 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Layers className="w-6 h-6 animate-pulse" />
              </span>
              <span className="px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 rounded-full uppercase tracking-wider">
                {_t('لوحة معالجة وقراءة فقط', 'Read-Only Preview Dashboard')}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
              {_t('معاينة البنود المفتوحة ومطابقة الذمم (AR/AP)', 'Open Items & Balance Matching Ledger')}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl font-light">
              {_t(
                'استعراض تفصيلي وآمن للفواتير المعلقة غير المسواة للذمم المدينة والدائنة، بالإضافة إلى المقبوضات النقدية المعلقة من بوابة الخزينة والبنوك.',
                'A secure read-only overview of outstanding sales invoices, purchase invoices, and unallocated treasury collections.'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{_t('مؤمن تحت حوكمة المحاسبة', 'Secured under Accounting Audit')}</span>
          </div>
        </div>
      </div>

      {/* KPI Card grid */}
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
          
          {/* Query submit block */}
          <div className="flex flex-wrap items-end gap-4 flex-1">
            <div className="min-w-[240px] flex-1 lg:max-w-xs">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                {_t('رقم الشريك / العميل (ID)', 'Customer / Partner ID')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors pl-10"
                />
              </div>
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

          {/* Table quick search */}
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

        {/* Dynamic Interactive Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{_t('خيارات الفرز', 'Filters')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* View Mode Filters */}
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

            {/* Minimum Outstanding Balance filter */}
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

      {/* Primary Display Logic */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-rose-800 flex items-start gap-4">
          <span className="p-2 bg-rose-100 text-rose-600 rounded-xl mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <h4 className="font-bold text-rose-950">{_t('فشل الاستعلام', 'Query Error')}</h4>
            <p className="text-sm font-light">{error}</p>
            <button 
              onClick={() => fetchOpenItems(customerId)}
              className="text-xs font-semibold text-rose-700 underline hover:text-rose-950 transition-colors mt-2 block"
            >
              {_t('إعادة المحاولة', 'Try again')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        
        /* Premium Skeleton Loading States */
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded-md" />
              <div className="space-y-2">
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
                <div className="h-8 w-full bg-slate-50 rounded-lg" />
                <div className="h-8 w-full bg-slate-50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

      ) : (
        data && (
          hasNoData ? (
            
            /* Empty State Layout */
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">{_t('لا توجد بنود مفتوحة معلقة', 'No pending open items found')}</h3>
                <p className="text-sm text-slate-500 max-w-md font-light">
                  {_t(
                    'هذا الشريك ليس لديه أي فواتير معلقة أو مبالغ متبقية للتسوية حالياً تتوافق مع محددات الفرز المستخدمة.',
                    'This partner currently has no outstanding invoices, balances, or unallocated payments matching your filters.'
                  )}
                </p>
              </div>
              {(searchQuery || minRemaining || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setMinRemaining('');
                    setFilterType('all');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-lg transition-colors"
                >
                  {_t('إلغاء فلاتر التصفية', 'Reset Filters')}
                </button>
              )}
            </div>

          ) : (

            <div className="space-y-8">
              
              {/* 1. Accounts Receivable (AR) section */}
              {(filterType === 'all' || filterType === 'ar') && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Table className="w-4 h-4" />
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {_t('فواتير المبيعات المفتوحة المعلقة (AR)', 'Outstanding Sales Invoices (AR)')}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md">
                      {filteredSalesInvoices.length} {_t('فواتير', 'invoices')}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-700 text-right">
                      <thead className="bg-slate-50/30 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5 text-right">{_t('رقم الفاتورة', 'Invoice No')}</th>
                          <th className="px-6 py-3.5 text-right">{_t('التاريخ', 'Posting Date')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('الإجمالي', 'Total Amount')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('المسدد', 'Paid Amount')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('المتبقي للتسوية', 'Outstanding Balance')}</th>
                          <th className="px-6 py-3.5 text-center">{_t('حالة الفاتورة', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSalesInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                              {_t('لا توجد فواتير مبيعات تتطابق مع البحث.', 'No sales invoices match the search filters.')}
                            </td>
                          </tr>
                        ) : (
                          filteredSalesInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-indigo-600">#{inv.invoiceNo}</td>
                              <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(inv.date)}</td>
                              <td className="px-6 py-4 font-semibold text-left font-mono">{formatCurrency(inv.total)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-left font-mono text-slate-500">{formatCurrency(inv.paid)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-left font-black font-mono text-rose-600">{formatCurrency(inv.remaining)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Accounts Payable (AP) section */}
              {(filterType === 'all' || filterType === 'ap') && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <Table className="w-4 h-4" />
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {_t('فواتير المشتريات المفتوحة المعلقة (AP)', 'Outstanding Purchase Invoices (AP)')}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-md">
                      {filteredPurchaseInvoices.length} {_t('فواتير', 'bills')}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-700 text-right">
                      <thead className="bg-slate-50/30 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5 text-right">{_t('رقم الفاتورة', 'Bill No')}</th>
                          <th className="px-6 py-3.5 text-right">{_t('التاريخ', 'Posting Date')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('الإجمالي', 'Total Amount')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('المسدد', 'Paid Amount')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('المتبقي للتسوية', 'Outstanding Balance')}</th>
                          <th className="px-6 py-3.5 text-center">{_t('حالة الفاتورة', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPurchaseInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                              {_t('لا توجد فواتير مشتريات تتطابق مع البحث.', 'No purchase invoices match the search filters.')}
                            </td>
                          </tr>
                        ) : (
                          filteredPurchaseInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-amber-600">#{inv.invoiceNo}</td>
                              <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(inv.date)}</td>
                              <td className="px-6 py-4 font-semibold text-left font-mono">{formatCurrency(inv.total)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-left font-mono text-slate-500">{formatCurrency(inv.paid)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-left font-black font-mono text-rose-600">{formatCurrency(inv.remaining)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Unallocated Collections section */}
              {filterType === 'all' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                        <Table className="w-4 h-4" />
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {_t('سندات المقبوضات معلقة التوزيع', 'Unallocated Receipts (Pending Allocation)')}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-md">
                      {filteredReceipts.length} {_t('سندات معلقة', 'receipts')}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-700 text-right">
                      <thead className="bg-slate-50/30 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5 text-right">{_t('رقم القيد الخزني', 'Treasury ID')}</th>
                          <th className="px-6 py-3.5 text-right">{_t('التاريخ', 'Posting Date')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('المبلغ الأصلي', 'Original Amount')}</th>
                          <th className="px-6 py-3.5 text-left">{_t('الرصيد غير الموزع', 'Unallocated Remaining')}</th>
                          <th className="px-6 py-3.5 text-right">{_t('البيان / الوصف', 'Description')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReceipts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                              {_t('لا توجد سندات مقبوضات تتطابق مع البحث.', 'No treasury receipts match the search filters.')}
                            </td>
                          </tr>
                        ) : (
                          filteredReceipts.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-sky-600">#TREAS-{entry.id}</td>
                              <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(entry.date)}</td>
                              <td className="px-6 py-4 font-semibold text-left font-mono">{formatCurrency(entry.amount)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-left font-black font-mono text-sky-600">{formatCurrency(entry.remaining)} {_t('ر.س', 'SAR')}</td>
                              <td className="px-6 py-4 text-right font-light text-slate-500 max-w-sm truncate" title={entry.description}>
                                {entry.description || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )
        )
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
