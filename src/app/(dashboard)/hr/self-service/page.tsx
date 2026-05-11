'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { User, Calendar, DollarSign, Clock, FileText, CheckCircle, Search, Filter, Plus, X, Download, AlertCircle, CalendarDays, Receipt } from 'lucide-react';

export default function SelfServicePage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState('overview');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveDays, setLeaveDays] = useState('1');

  // Dummy requests
  const [requests, setRequests] = useState([
    { id: 'REQ-1001', type: _t('إجازة سنوية', 'Annual Leave'), date: '2026-05-15', days: 2, status: 'APPROVED' },
    { id: 'REQ-1002', type: _t('مطالبة مالية (وقود)', 'Expense (Fuel)'), date: '2026-05-10', days: '-', status: 'PENDING' },
  ]);

  const renderStatus = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3.5 h-3.5"/> {_t('معتمد', 'Approved')}</span>;
      case 'PENDING': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5"/> {_t('قيد المراجعة', 'Pending')}</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">{status}</span>;
    }
  };

  const handleLeaveSubmit = () => {
    setRequests([{ id: 'REQ-' + Math.floor(Math.random() * 10000), type: leaveType === 'annual' ? _t('إجازة سنوية', 'Annual Leave') : _t('إجازة مرضية', 'Sick Leave'), date: new Date().toISOString().split('T')[0], days: Number(leaveDays), status: 'PENDING' }, ...requests]);
    setShowLeaveModal(false);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <User className="w-6 h-6" />
            </span>
            {_t('بوابة الخدمة الذاتية للموظف (ESS)', 'Employee Self-Service (ESS)')}
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            {_t('إدارة البيانات الشخصية، الإجازات، كشوف الرواتب، والمطالبات المالية في مكان واحد.', 'Manage personal data, leaves, payslips, and expense claims all in one place.')}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setShowExpenseModal(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Receipt className="w-4 h-4" /> {_t('مطالبة مالية', 'Expense Claim')}
          </button>
          <button onClick={() => setShowLeaveModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> {_t('طلب إجازة', 'Request Leave')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        {[
          { id: 'overview', label: _t('نظرة عامة', 'Overview'), icon: <FileText className="w-4 h-4" /> },
          { id: 'requests', label: _t('طلباتي', 'My Requests'), icon: <CheckCircle className="w-4 h-4" /> },
          { id: 'payslips', label: _t('الرواتب', 'Payslips'), icon: <DollarSign className="w-4 h-4" /> },
          { id: 'attendance', label: _t('الحضور', 'Attendance'), icon: <Clock className="w-4 h-4" /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-blue-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('رصيد الإجازات السنوية', 'Annual Leave Balance')}</div>
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-blue-600 font-mono">18 <span className="text-sm text-slate-400 font-sans">{_t('يوم', 'Days')}</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-emerald-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('آخر راتب محول', 'Last Transferred Salary')}</div>
              <DollarSign className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 font-mono">8,500 <span className="text-sm text-slate-400 font-sans">SAR</span></div>
            <div className="text-xs text-slate-400 mt-2">{_t('أبريل 2026', 'April 2026')}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-amber-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('طلبات معلقة', 'Pending Requests')}</div>
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 font-mono">{requests.filter(r => r.status === 'PENDING').length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border-r-4 border-r-purple-500 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-500 text-sm font-bold">{_t('حضور اليوم', 'Today\'s Attendance')}</div>
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-xl font-black text-purple-600">{_t('تم تسجيل الدخول', 'Checked In')}</div>
            <div className="text-xs text-slate-400 mt-2 font-mono">08:02 AM</div>
          </div>
        </div>
      )}

      {/* Requests Data Table (PROTOCOL X GRID) */}
      {(activeTab === 'overview' || activeTab === 'requests') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {_t('سجل الطلبات', 'Requests History')}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
               <div className="relative">
                  <Filter className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                  <select className="w-full sm:w-40 pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-300 shadow-sm bg-white appearance-none">
                    <option value="">{_t('جميع الحالات', 'All Statuses')}</option>
                    <option value="PENDING">{_t('قيد المراجعة', 'Pending')}</option>
                    <option value="APPROVED">{_t('معتمد', 'Approved')}</option>
                  </select>
               </div>
               <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={_t('بحث برقم الطلب...', 'Search ID...')} 
                    className="w-full pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-300 shadow-sm" 
                  />
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">{_t('رقم الطلب', 'Req ID')}</th>
                  <th className="px-6 py-4">{_t('نوع الطلب', 'Type')}</th>
                  <th className="px-6 py-4">{_t('تاريخ التقديم', 'Date')}</th>
                  <th className="px-6 py-4">{_t('المدة/القيمة', 'Duration/Amount')}</th>
                  <th className="px-6 py-4">{_t('الحالة', 'Status')}</th>
                  <th className="px-6 py-4 text-center">{_t('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.filter(r => r.id.includes(searchQuery)).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{row.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.type}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{row.date}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">{row.days} {_t('يوم', 'days')}</td>
                    <td className="px-6 py-4">{renderStatus(row.status)}</td>
                    <td className="px-6 py-4 text-center">
                       <button className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">
                         {_t('عرض التفاصيل', 'View Details')}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslips Tab */}
      {activeTab === 'payslips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['2026-04', '2026-03', '2026-02'].map((m) => (
            <div key={m} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{_t('راتب شهر', 'Salary')} {m}</h3>
                <p className="text-sm text-slate-500 font-mono mt-1">8,500.00 SAR</p>
              </div>
              <button className="mt-2 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> {_t('تحميل كشف الراتب', 'Download Payslip')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modals for Protocol X */}
      
      {/* 1. Request Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-500"/> {_t('تقديم طلب إجازة', 'Request Leave')}</h3>
               <button onClick={() => setShowLeaveModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('نوع الإجازة', 'Leave Type')}</label>
                  <select value={leaveType} onChange={e=>setLeaveType(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option value="annual">{_t('إجازة سنوية', 'Annual Leave')}</option>
                    <option value="sick">{_t('إجازة مرضية', 'Sick Leave')}</option>
                    <option value="unpaid">{_t('بدون راتب', 'Unpaid Leave')}</option>
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('تاريخ البدء', 'Start Date')}</label>
                    <input type="date" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('عدد الأيام', 'Days')}</label>
                    <input type="number" value={leaveDays} onChange={e=>setLeaveDays(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('ملاحظات', 'Notes')}</label>
                  <textarea rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"></textarea>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
               <button onClick={() => setShowLeaveModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors">{_t('إلغاء', 'Cancel')}</button>
               <button onClick={handleLeaveSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">{_t('إرسال الطلب', 'Submit Request')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Expense Claim Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-amber-500"/> {_t('مطالبة مالية جديدة', 'New Expense Claim')}</h3>
               <button onClick={() => setShowExpenseModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('نوع المصروف', 'Expense Type')}</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    <option>{_t('وقود سيارة', 'Fuel')}</option>
                    <option>{_t('تذاكر سفر', 'Flight Tickets')}</option>
                    <option>{_t('نثريات مكتبية', 'Office Supplies')}</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('المبلغ', 'Amount')}</label>
                  <input type="number" placeholder="0.00" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{_t('المرفقات (الفاتورة)', 'Attachments (Invoice)')}</label>
                  <input type="file" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
               <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors">{_t('إلغاء', 'Cancel')}</button>
               <button onClick={() => setShowExpenseModal(false)} className="px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-sm">{_t('رفع المطالبة', 'Submit Claim')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
