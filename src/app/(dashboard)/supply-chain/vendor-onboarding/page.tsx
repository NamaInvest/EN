'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { UserCheck, RefreshCw, FileText, ShieldAlert, Activity, CheckCircle, XCircle, Clock, Search, Filter, Plus, FileSpreadsheet, Send, X, MoreHorizontal } from 'lucide-react';

interface VendorComplianceDoc {
  docType: string;
  isUploaded: boolean;
  isValid: boolean;
  expiryDate?: string;
}

interface VendorScoring {
  vendorId: string;
  vendorName: string;
  category: string;
  yearsInBusiness: number;
  financialScore: number;
  qualityScore: number;
  docs: VendorComplianceDoc[];
  overallRiskScore: number;
  approvalStatus: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'PROBATION';
}

interface VendorOnboardingData {
  asOfDate: string;
  vendors: VendorScoring[];
  summary: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    highRiskVendors: number;
  };
}

export default function VendorOnboardingPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [data, setData] = useState<VendorOnboardingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('');

  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supply-chain/vendor-onboarding`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        // Fallback demo data
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
       summary: { totalPending: 3, totalApproved: 45, totalRejected: 12, highRiskVendors: 2 },
       vendors: [
          { vendorId: 'VND-001', vendorName: 'شركة التقنية الحديثة', category: 'IT Services', yearsInBusiness: 5, financialScore: 85, qualityScore: 90, docs: [{ docType: 'CR', isUploaded: true, isValid: true }, { docType: 'ZATCA_CERT', isUploaded: true, isValid: true }], overallRiskScore: 15, approvalStatus: 'PENDING_REVIEW' },
          { vendorId: 'VND-002', vendorName: 'مؤسسة التوريدات السريعة', category: 'Logistics', yearsInBusiness: 2, financialScore: 45, qualityScore: 60, docs: [{ docType: 'CR', isUploaded: true, isValid: true }, { docType: 'MUDAD', isUploaded: true, isValid: false }], overallRiskScore: 80, approvalStatus: 'PROBATION' },
       ]
    });
  };

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const getDocLabel = (type: string) => {
    const map: Record<string, string> = {
      'CR': _t('سجل تجاري', 'CR'),
      'ZATCA_CERT': _t('شهادة الزكاة', 'ZATCA'),
      'GOSI': _t('تأمينات', 'GOSI'),
      'MUDAD': _t('مدد', 'MUDAD'),
      'BANK_LETTER': _t('آيبان', 'IBAN')
    };
    return map[type] || type;
  };

  const renderStatus = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3.5 h-3.5"/> {_t('معتمد', 'Approved')}</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle className="w-3.5 h-3.5"/> {_t('مرفوض', 'Rejected')}</span>;
      case 'PROBATION': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Activity className="w-3.5 h-3.5"/> {_t('فترة تجربة', 'Probation')}</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5"/> {_t('قيد المراجعة', 'Pending')}</span>;
    }
  };

  const filteredVendors = data?.vendors.filter(v => 
    (v.vendorName.includes(searchQuery) || v.vendorId.includes(searchQuery)) &&
    (statusFilter ? v.approvalStatus === statusFilter : true)
  ) || [];

  const handleSendLink = () => {
    if(!data) return;
    const newVnd: VendorScoring = {
      vendorId: 'REQ-' + Math.floor(Math.random() * 1000),
      vendorName: newVendorName,
      category: newVendorCategory || 'General',
      yearsInBusiness: 0,
      financialScore: 0,
      qualityScore: 0,
      docs: [],
      overallRiskScore: 100,
      approvalStatus: 'PENDING_REVIEW'
    };
    setData({
      ...data,
      summary: { ...data.summary, totalPending: data.summary.totalPending + 1 },
      vendors: [newVnd, ...data.vendors]
    });
    setShowAddModal(false);
    setNewVendorName('');
    setNewVendorEmail('');
  };

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    if(!data) return;
    const updated = data.vendors.map(v => {
      if(v.vendorId === id) {
         return { ...v, approvalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } as VendorScoring;
      }
      return v;
    });
    setData({ ...data, vendors: updated });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <UserCheck className="w-6 h-6" />
            </span>
            {_t('بوابة تأهيل الموردين', 'Vendor Onboarding Portal')}
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            {_t('محرك ذكي لتقييم الموردين واعتمادهم بناءً على امتثال الوثائق الرسمية (الزكاة، مدد، التأمينات) وتحليل المخاطر.', 'Smart vendor evaluation engine. Approves based on compliance docs (ZATCA, MUDAD, GOSI) and risk analysis.')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> {_t('تصدير', 'Export')}
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> {_t('دعوة مورد جديد', 'Invite Vendor')}
          </button>
          <button onClick={fetchVendorData} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {_t('تحديث', 'Refresh')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-emerald-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('موردون معتمدون', 'Approved Vendors')}</div>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 font-mono">{data.summary.totalApproved}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-amber-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('قيد المراجعة', 'Pending Review')}</div>
              <Activity className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 font-mono">{data.summary.totalPending}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-red-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('طلبات مرفوضة', 'Rejected')}</div>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-3xl font-black text-red-600 font-mono">{data.summary.totalRejected}</div>
          </div>

          <div className="bg-linear-to-br from-red-500 to-red-700 p-6 rounded-2xl text-white shadow-md shadow-red-500/20">
            <div className="flex justify-between items-center mb-4">
              <div className="text-white/90 text-sm font-bold">{_t('عالي المخاطر', 'High Risk')}</div>
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-black font-mono">{data.summary.highRiskVendors}</div>
          </div>
        </div>
      )}

      {/* Details Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            {_t('قائمة الموردين المتقدمين', 'Vendor Applicant List')}
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <div className="relative">
                <Filter className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-40 pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-300 shadow-sm bg-white appearance-none">
                  <option value="">{_t('جميع الحالات', 'All Statuses')}</option>
                  <option value="PENDING_REVIEW">{_t('قيد المراجعة', 'Pending')}</option>
                  <option value="APPROVED">{_t('معتمد', 'Approved')}</option>
                  <option value="REJECTED">{_t('مرفوض', 'Rejected')}</option>
                </select>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={_t('بحث باسم المورد...', 'Search vendor name...')} 
                  className="w-full pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-300 shadow-sm" 
                />
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{_t('المورد', 'Vendor')}</th>
                <th className="px-6 py-4">{_t('التصنيف', 'Category')}</th>
                <th className="px-6 py-4">{_t('نقاط القوة', 'Scores (Fin/QA)')}</th>
                <th className="px-6 py-4">{_t('وثائق الامتثال', 'Docs')}</th>
                <th className="px-6 py-4 border-r border-l border-slate-100">{_t('مؤشر الخطر', 'Risk Score')}</th>
                <th className="px-6 py-4">{_t('الحالة', 'Status')}</th>
                <th className="px-6 py-4 text-center">{_t('إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <div>{_t('جاري جلب وفحص المستندات...', 'Fetching documents...')}</div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <div>{_t('لا يوجد موردين', 'No vendors found')}</div>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {row.vendorName}
                      <div className="text-xs text-slate-400 mt-1 font-mono">{row.vendorId} • تأسس: {row.yearsInBusiness} سنوات</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{row.category}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-400 w-6">Fin:</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${row.financialScore > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${row.financialScore}%` }}></div>
                        </div>
                        <span className="font-bold">{row.financialScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 w-6">QA:</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${row.qualityScore > 70 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${row.qualityScore}%` }}></div>
                        </div>
                        <span className="font-bold">{row.qualityScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {row.docs.length === 0 ? <span className="text-xs text-slate-400">لا يوجد وثائق</span> : row.docs.map((doc, dIdx) => (
                          <span key={dIdx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${doc.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 line-through'}`}>
                            {getDocLabel(doc.docType)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center border-l border-r border-slate-100">
                      <div className={`text-xl font-black font-mono ${row.overallRiskScore < 30 ? 'text-emerald-500' : (row.overallRiskScore < 75 ? 'text-amber-500' : 'text-red-500')}`}>
                        {row.overallRiskScore}
                      </div>
                      <div className="text-[10px] text-slate-400">/ 100</div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStatus(row.approvalStatus)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       {row.approvalStatus === 'PENDING_REVIEW' ? (
                         <div className="flex justify-center gap-2">
                           <button onClick={() => handleAction(row.vendorId, 'APPROVE')} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title={_t('اعتماد', 'Approve')}>
                             <CheckCircle className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleAction(row.vendorId, 'REJECT')} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title={_t('رفض', 'Reject')}>
                             <XCircle className="w-4 h-4" />
                           </button>
                         </div>
                       ) : (
                         <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                           <MoreHorizontal className="w-4 h-4" />
                         </button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg">{_t('دعوة مورد جديد', 'Invite New Vendor')}</h3>
               <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('اسم المورد / الشركة', 'Vendor / Company Name')}</label>
                  <input type="text" value={newVendorName} onChange={e => setNewVendorName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="مثال: شركة مسار الأفق" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('البريد الإلكتروني', 'Email')}</label>
                  <input type="email" value={newVendorEmail} onChange={e => setNewVendorEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="vendor@example.com" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('التصنيف', 'Category')}</label>
                  <select value={newVendorCategory} onChange={e => setNewVendorCategory(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                     <option value="IT Services">IT Services (خدمات تقنية)</option>
                     <option value="Logistics">Logistics (خدمات لوجستية)</option>
                     <option value="Raw Materials">Raw Materials (مواد خام)</option>
                     <option value="Maintenance">{_t('صيانة (صيانة)', 'Maintenance (صيانة)')}</option>
                  </select>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
               <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors">{_t('إلغاء', 'Cancel')}</button>
               <button onClick={handleSendLink} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
                 <Send className="w-4 h-4" /> {_t('إرسال رابط التأهيل', 'Send Link')}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
