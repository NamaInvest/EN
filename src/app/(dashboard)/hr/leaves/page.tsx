'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Plus, RefreshCcw, Plane, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

const LEAVE_TYPES = [
 { value: 'ANNUAL', ar: 'سنوية', en: 'Annual' },
 { value: 'SICK', ar: 'مرضية', en: 'Sick' },
 { value: 'MATERNITY', ar: 'أمومة', en: 'Maternity' },
 { value: 'PATERNITY', ar: 'أبوة', en: 'Paternity' },
 { value: 'MARRIAGE', ar: 'زواج', en: 'Marriage' },
 { value: 'BEREAVEMENT', ar: 'وفاة', en: 'Bereavement' },
 { value: 'HAJJ', ar: 'حج', en: 'Hajj' },
 { value: 'UNPAID', ar: 'بدون راتب', en: 'Unpaid' },
 { value: 'COMPENSATORY', ar: 'تعويضية', en: 'Compensatory' },
 { value: 'EXAM', ar: 'امتحانات', en: 'Exam' },
];

const STATUS_BADGES: Record<string, { color: string; arLabel: string; enLabel: string }> = {
 PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', arLabel: 'معلق', enLabel: 'Pending' },
 APPROVED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', arLabel: 'معتمد', enLabel: 'Approved' },
 REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', arLabel: 'مرفوض', enLabel: 'Rejected' },
};

export default function LeaveManagementPage() {
 const { lang } = useTranslation();
 const { success, error: toastError } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [requests, setRequests] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [statusFilter, setStatusFilter] = useState('');
 const [form, setForm] = useState({ employeeId: '', leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
 const [accrualRunning, setAccrualRunning] = useState(false);

 const fetchRequests = async () => {
 setLoading(true);
 try {
 const params = new URLSearchParams();
 if (statusFilter) params.set('status', statusFilter);
 const res = await fetch(`/api/hr/leaves?${params}`, {
 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
 });
 if (res.ok) {
 const data = await res.json();
 setRequests(data.requests || []);
 }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { fetchRequests(); }, [statusFilter]);

 const submitLeaveRequest = async () => {
 try {
 const res = await fetch('/api/hr/leaves', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify(form),
 });
 if (res.ok) {
 success(_t('تم إنشاء طلب الإجازة بنجاح', 'Leave request created successfully'));
 setShowForm(false);
 setForm({ employeeId: '', leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
 fetchRequests();
 } else {
 const data = await res.json();
 toastError(data.error || _t('خطأ في إنشاء الطلب', 'Error creating request'));
 }
 } catch (e) {
 console.error(e);
 }
 };

 const handleAction = async (id: number, action: string, rejectionReason?: string) => {
 try {
 const res = await fetch(`/api/hr/leaves/${id}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action, rejectionReason }),
 });
 if (res.ok) {
 success(action === 'approve' ? _t('تم الموافقة', 'Approved') : _t('تم الرفض', 'Rejected'));
 fetchRequests();
 }
 } catch (e) {
 console.error(e);
 }
 };

 const runAccrual = async () => {
 setAccrualRunning(true);
 try {
 const res = await fetch('/api/hr/leaves/accrual', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({}),
 });
 if (res.ok) {
 const data = await res.json();
 success(_t(`تم تجميع الإجازات لـ ${data.processed} موظف`, `Accrual processed for ${data.processed} employees`));
 }
 } catch (e) {
 console.error(e);
 } finally {
 setAccrualRunning(false);
 }
 };

 const pendingCount = requests.filter(r => r.status === 'PENDING').length;
 const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
 const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

 return (
 <div className="p-6 space-y-6">
 {/* Header */}
 <div className="flex justify-between items-center border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
 <Plane className="w-8 h-8 mr-3 text-blue-600" />
 {_t('إدارة الإجازات', 'Leave Management')}
 </h1>
 <p className="text-slate-500 mt-1 text-sm">{_t('وفقاً لنظام العمل السعودي — المواد 109-116', 'Per Saudi Labor Law — Articles 109-116')}</p>
 </div>
 <div className="flex gap-2">
 <button onClick={runAccrual} disabled={accrualRunning}
 className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center disabled:opacity-50">
 <RefreshCcw className={`w-4 h-4 mr-2 ${accrualRunning ? 'animate-spin' : ''}`} />
 {_t('تجميع شهري', 'Monthly Accrual')}
 </button>
 <button onClick={() => setShowForm(!showForm)}
 className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
 <Plus className="w-4 h-4 mr-2" />
 {_t('طلب إجازة جديد', 'New Leave Request')}
 </button>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <p className="text-sm font-medium text-slate-500 mb-1">{_t('إجمالي الطلبات', 'Total Requests')}</p>
 <h3 className="text-2xl font-bold text-slate-900 font-mono">{requests.length}</h3>
 </div>
 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm">
 <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">{_t('معلقة', 'Pending')}</p>
 <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 font-mono">{pendingCount}</h3>
 </div>
 <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
 <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">{_t('معتمدة', 'Approved')}</p>
 <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 font-mono">{approvedCount}</h3>
 </div>
 <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
 <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">{_t('مرفوضة', 'Rejected')}</p>
 <h3 className="text-2xl font-bold text-red-800 dark:text-red-300 font-mono">{rejectedCount}</h3>
 </div>
 </div>

 {/* New Request Form */}
 {showForm && (
 <div className="bg-white border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-sm">
 <h2 className="text-lg font-semibold mb-4 text-slate-900 ">{_t('طلب إجازة جديد', 'New Leave Request')}</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('رقم الموظف', 'Employee ID')}</label>
 <input type="number" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 "/>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('نوع الإجازة', 'Leave Type')}</label>
 <select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 ">
 {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{_t(lt.ar, lt.en)}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('من تاريخ', 'Start Date')}</label>
 <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 "/>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('إلى تاريخ', 'End Date')}</label>
 <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 "/>
 </div>
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('السبب', 'Reason')}</label>
 <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 "/>
 </div>
 </div>
 <div className="flex gap-2 mt-4">
 <button onClick={submitLeaveRequest}
 className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
 {_t('إرسال الطلب', 'Submit Request')}
 </button>
 <button onClick={() => setShowForm(false)}
 className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-gray-700 text-sm">
 {_t('إلغاء', 'Cancel')}
 </button>
 </div>
 </div>
 )}

 {/* Filter & Table */}
 <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
 <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 ">
 <h2 className="text-lg font-medium text-slate-900 ">{_t('طلبات الإجازات', 'Leave Requests')}</h2>
 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
 className="px-3 py-1 border border-slate-300 rounded-md text-sm bg-white ">
 <option value="">{_t('الكل', 'All')}</option>
 <option value="PENDING">{_t('معلق', 'Pending')}</option>
 <option value="APPROVED">{_t('معتمد', 'Approved')}</option>
 <option value="REJECTED">{_t('مرفوض', 'Rejected')}</option>
 </select>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead className="bg-white ">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{_t('الموظف', 'Employee')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('النوع', 'Type')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('من', 'From')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('إلى', 'To')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('الأيام', 'Days')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('الحالة', 'Status')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('إجراءات', 'Actions')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
 {loading ? (
 <tr><td colSpan={7} className="text-center py-10 text-slate-500">{_t('جاري التحميل...', 'Loading...')}</td></tr>
 ) : requests.length === 0 ? (
 <tr><td colSpan={7} className="text-center py-10 text-slate-500">{_t('لا توجد طلبات', 'No requests found')}</td></tr>
 ) : requests.map((r: any) => {
 const badge = STATUS_BADGES[r.status] || STATUS_BADGES.PENDING;
 const leaveLabel = LEAVE_TYPES.find(lt => lt.value === r.leaveType);
 return (
 <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 text-sm font-medium text-slate-900 ">{r.employee?.name || r.employee?.fullName || `#${r.employeeId}`}</td>
 <td className="px-6 py-4 text-sm text-center text-slate-500">{leaveLabel ? _t(leaveLabel.ar, leaveLabel.en) : r.leaveType}</td>
 <td className="px-6 py-4 text-sm text-center text-slate-500 font-mono">{new Date(r.startDate).toLocaleDateString()}</td>
 <td className="px-6 py-4 text-sm text-center text-slate-500 font-mono">{new Date(r.endDate).toLocaleDateString()}</td>
 <td className="px-6 py-4 text-sm text-center font-bold text-slate-700 ">{r.days}</td>
 <td className="px-6 py-4 text-center">
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
 {_t(badge.arLabel, badge.enLabel)}
 </span>
 </td>
 <td className="px-6 py-4 text-center">
 {r.status === 'PENDING' && (
 <div className="flex gap-1 justify-center">
 <button onClick={() => handleAction(r.id, 'approve')}
 className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
 <CheckCircle className="w-3 h-3 inline mr-1" />{_t('موافقة', 'Approve')}
 </button>
 <button onClick={() => handleAction(r.id, 'reject', 'سبب إداري')}
 className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
 <XCircle className="w-3 h-3 inline mr-1" />{_t('رفض', 'Reject')}
 </button>
 </div>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
