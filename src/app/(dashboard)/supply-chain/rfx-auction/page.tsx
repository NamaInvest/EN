'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Hammer, RefreshCw, TrendingDown, DollarSign, Clock, CheckCircle, Package, ArrowDownToLine, Search, Filter, Plus, FileSpreadsheet, Activity, PlayCircle, StopCircle, Eye, X } from 'lucide-react';

interface Bid {
  vendorName: string;
  bidAmount: number;
  deliveryDays: number;
  qualityScore: number;
  submissionTime: string;
  isWinning: boolean;
}

interface RFxAuction {
  id: string;
  itemName: string;
  quantity: number;
  targetPrice: number;
  auctionEndTime: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  bids: Bid[];
  bestBidAmount: number | null;
  savings: number;
}

interface RFxAuctionData {
  asOfDate: string;
  auctions: RFxAuction[];
  summary: {
    activeAuctionsCount: number;
    totalTargetSpend: number;
    projectedSavings: number;
    bidsReceived: number;
  };
}

export default function RFxAuctionPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [data, setData] = useState<RFxAuctionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');

  const fetchRFxData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supply-chain/rfx-auction`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setDemoData();
      }
    } catch (err) {
      console.error(err);
      setDemoData();
    } finally {
      setLoading(false);
    }
  }, []);

  const setDemoData = () => {
    setData({
       asOfDate: new Date().toISOString(),
       summary: { activeAuctionsCount: 2, totalTargetSpend: 1500000, projectedSavings: 320000, bidsReceived: 18 },
       auctions: [
          { id: 'RFX-2024-001', itemName: 'أجهزة حاسب آلي (لابتوبات)', quantity: 200, targetPrice: 800000, auctionEndTime: '2024-12-01', status: 'ACTIVE', bestBidAmount: 720000, savings: 80000, bids: [{ vendorName: 'شركة التقنية', bidAmount: 720000, deliveryDays: 14, qualityScore: 90, submissionTime: '', isWinning: true }] },
          { id: 'RFX-2024-002', itemName: 'أثاث مكتبي للمقر الجديد', quantity: 50, targetPrice: 250000, auctionEndTime: '2024-11-20', status: 'CLOSED', bestBidAmount: 210000, savings: 40000, bids: [{ vendorName: 'روائع الأثاث', bidAmount: 210000, deliveryDays: 7, qualityScore: 85, submissionTime: '', isWinning: true }] },
          { id: 'RFX-2024-003', itemName: 'سيارات نقل مبرد (دبابات)', quantity: 10, targetPrice: 1200000, auctionEndTime: '2024-12-15', status: 'ACTIVE', bestBidAmount: 1150000, savings: 50000, bids: [{ vendorName: 'الوكيل الحصري للسيارات', bidAmount: 1150000, deliveryDays: 30, qualityScore: 95, submissionTime: '', isWinning: true }] },
       ]
    });
  };

  useEffect(() => {
    fetchRFxData();
  }, [fetchRFxData]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency', currency: 'SAR', minimumFractionDigits: 0
    }).format(num);
  };

  const renderStatus = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Activity className="w-3.5 h-3.5"/> {_t('نشط (يتلقى عطاءات)', 'Active (Bidding)')}</span>;
      case 'CLOSED': return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3.5 h-3.5"/> {_t('مغلق', 'Closed')}</span>;
      default: return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5"/> {_t('مسودة', 'Draft')}</span>;
    }
  };

  const filteredAuctions = data?.auctions.filter(a => 
    (a.itemName.includes(searchQuery) || a.id.includes(searchQuery)) &&
    (statusFilter ? a.status === statusFilter : true)
  ) || [];

  const handleCreateAuction = () => {
    if(!data) return;
    const newAuction: RFxAuction = {
      id: 'RFX-' + Math.floor(Math.random() * 10000),
      itemName: newItemName,
      quantity: Number(newQuantity),
      targetPrice: Number(newTargetPrice),
      auctionEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'DRAFT',
      bids: [],
      bestBidAmount: null,
      savings: 0
    };
    setData({
      ...data,
      summary: { ...data.summary, totalTargetSpend: data.summary.totalTargetSpend + Number(newTargetPrice) },
      auctions: [newAuction, ...data.auctions]
    });
    setShowAddModal(false);
    setNewItemName('');
    setNewQuantity('');
    setNewTargetPrice('');
  };

  const toggleAuctionStatus = (id: string, currentStatus: string) => {
    if(!data) return;
    const updated = data.auctions.map(a => {
      if(a.id === id) {
         return { ...a, status: currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE' } as RFxAuction;
      }
      return a;
    });
    setData({ ...data, auctions: updated });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Hammer className="w-6 h-6" />
            </span>
            {_t('المناقصات العكسية (RFx)', 'RFx Reverse Auctions')}
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            {_t('منصة مناقصات تتيح للموردين التنافس الحي لتخفيض الأسعار (Bidding Down)، لتعظيم الوفورات المالية.', 'Live reverse bidding platform for suppliers, maximizing financial savings for strategic procurement.')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> {_t('تصدير', 'Export')}
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> {_t('طرح مناقصة جديدة', 'Create Auction')}
          </button>
          <button onClick={fetchRFxData} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {_t('تحديث', 'Refresh')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-indigo-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('المناقصات النشطة', 'Active Auctions')}</div>
              <Activity className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-indigo-600 font-mono">{data.summary.activeAuctionsCount}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-emerald-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('الوفورات المحققة', 'Projected Savings')}</div>
              <TrendingDown className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 font-mono">{formatCurrency(data.summary.projectedSavings)}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-amber-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('إجمالي العطاءات', 'Total Bids')}</div>
              <ArrowDownToLine className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 font-mono">{data.summary.bidsReceived}</div>
          </div>

          <div className="bg-linear-to-br from-slate-600 to-slate-800 p-6 rounded-2xl text-white shadow-md shadow-slate-500/20">
            <div className="flex justify-between items-center mb-4">
              <div className="text-white/90 text-sm font-bold">{_t('الميزانية المستهدفة', 'Target Spend')}</div>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-black font-mono">{formatCurrency(data.summary.totalTargetSpend)}</div>
          </div>
        </div>
      )}

      {/* Details Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            {_t('سجل المناقصات (غرفة العطاءات)', 'Auction Room')}
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <div className="relative">
                <Filter className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-40 pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-300 shadow-sm bg-white appearance-none">
                  <option value="">{_t('جميع الحالات', 'All Statuses')}</option>
                  <option value="ACTIVE">{_t('نشط', 'Active')}</option>
                  <option value="CLOSED">{_t('مغلق', 'Closed')}</option>
                  <option value="DRAFT">{_t('مسودة', 'Draft')}</option>
                </select>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={_t('بحث باسم الصنف...', 'Search item...')} 
                  className="w-full pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-300 shadow-sm" 
                />
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{_t('المناقصة / الصنف', 'Auction / Item')}</th>
                <th className="px-6 py-4">{_t('الميزانية', 'Target Price')}</th>
                <th className="px-6 py-4">{_t('أفضل عطاء', 'Best Bid')}</th>
                <th className="px-6 py-4 bg-emerald-50/50 border-r border-l border-emerald-100 text-emerald-800">{_t('التوفير المستهدف', 'Savings')}</th>
                <th className="px-6 py-4">{_t('المورد الفائز', 'Winning Vendor')}</th>
                <th className="px-6 py-4">{_t('الحالة', 'Status')}</th>
                <th className="px-6 py-4 text-center">{_t('إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <div>{_t('جاري مزامنة العطاءات الحية...', 'Syncing live bids...')}</div>
                  </td>
                </tr>
              ) : filteredAuctions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Hammer className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <div>{_t('لا توجد مناقصات', 'No auctions found')}</div>
                  </td>
                </tr>
              ) : (
                filteredAuctions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {row.itemName}
                      <div className="text-xs text-slate-400 mt-1 font-mono">{row.id} • الكمية: {row.quantity}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-500">
                      {formatCurrency(row.targetPrice)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      <span className={row.bestBidAmount && row.bestBidAmount < row.targetPrice ? 'text-emerald-600' : 'text-slate-800'}>
                        {row.bestBidAmount ? formatCurrency(row.bestBidAmount) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 bg-emerald-50/30 border-l border-r border-emerald-50">
                      <div className={`text-base font-black font-mono ${row.savings > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {row.savings > 0 ? `+${formatCurrency(row.savings)}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {row.bestBidAmount ? (
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{row.bids.find(b => b.isWinning)?.vendorName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {_t('توصيل خلال:', 'Delivery:')} {row.bids.find(b => b.isWinning)?.deliveryDays} {_t('أيام', 'days')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{_t('بانتظار العطاءات', 'Awaiting bids')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatus(row.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex justify-center gap-2">
                         <button className="p-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title={_t('مشاهدة العطاءات الحية', 'View Live Bids')}>
                           <Eye className="w-4 h-4" />
                         </button>
                         {row.status === 'ACTIVE' ? (
                           <button onClick={() => toggleAuctionStatus(row.id, row.status)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title={_t('إغلاق المناقصة', 'Close Auction')}>
                             <StopCircle className="w-4 h-4" />
                           </button>
                         ) : (
                           <button onClick={() => toggleAuctionStatus(row.id, row.status)} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title={_t('بدء المناقصة', 'Start Auction')}>
                             <PlayCircle className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Auction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg">{_t('طرح مناقصة عكسية جديدة', 'Create RFx Auction')}</h3>
               <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('وصف الصنف / المشروع', 'Item / Project')}</label>
                  <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="مثال: توريد 50 جهاز حاسب آلي" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('الكمية', 'Quantity')}</label>
                    <input type="number" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="50" />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('الميزانية المستهدفة (SAR)', 'Target Spend')}</label>
                    <input type="number" value={newTargetPrice} onChange={e => setNewTargetPrice(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="250000" />
                 </div>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
               <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors">{_t('إلغاء', 'Cancel')}</button>
               <button onClick={handleCreateAuction} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">{_t('حفظ كمسودة', 'Save Draft')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
