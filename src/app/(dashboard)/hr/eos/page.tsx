'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, CheckCircle, CreditCard, Clock, UserX } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

const EOS_REASONS = [
 { value: 'RESIGNATION', ar: 'استقالة', en: 'Resignation' },
 { value: 'TERMINATION', ar: 'إنهاء خدمة', en: 'Termination' },
 { value: 'TERMINATION_FOR_CAUSE', ar: 'فصل لسبب من العامل', en: 'Termination for Cause' },
 { value: 'RETIREMENT', ar: 'تقاعد', en: 'Retirement' },
 { value: 'DEATH', ar: 'وفاة', en: 'Death' },
 { value: 'FORCE_MAJEURE', ar: 'قوة قاهرة', en: 'Force Majeure' },
];

const STATUS_BADGES: Record<string, { color: string; arLabel: string; enLabel: string }> = {
 DRAFT: { color: 'bg-slate-100 text-slate-800 ', arLabel: 'مسودة', enLabel: 'Draft' },
 APPROVED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', arLabel: 'معتمدة', enLabel: 'Approved' },
 PAID: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', arLabel: 'مصروفة', enLabel: 'Paid' },
};

export default function EOSDashboard() {
 const { lang } = useTranslation();
 const { success, error: toastError } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [calculations, setCalculations] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [showCalc, setShowCalc] = useState(false);
 const [form, setForm] = useState({ employeeId: '', endDate: '', reason: 'RESIGNATION' });
 const [calcResult, setCalcResult] = useState<any>(null);

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/hr/eos', {
 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
 });
 if (res.ok) {
 const data = await res.json();
 setCalculations(data.calculations || []);
 }
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 };

 useEffect(() => { fetchData(); }, []);

 const calculate = async () => {
 try {
 const res = await fetch('/api/hr/eos', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify(form),
 });
 const data = await res.json();
 if (res.ok) {
 setCalcResult(data.calculation);
 success(_t('تم حساب مكافأة نهاية الخدمة', 'EOS calculated successfully'));
 fetchData();
 } else {
 toastError(data.error);
 }
 } catch (e) { console.error(e); }
 };

 const handleAction = async (id: number, action: string) => {
 try {
 const res = await fetch(`/api/hr/eos/${id}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action }),
 });
 if (res.ok) {
 success(action === 'approve' ? _t('تم الاعتماد', 'Approved') : _t('تم الصرف', 'Paid'));
 fetchData();
 }
 } catch (e) { console.error(e); }
 };

 const draftCount = calculations.filter(c => c.status === 'DRAFT').length;
 const approvedCount = calculations.filter(c => c.status === 'APPROVED').length;
 const paidCount = calculations.filter(c => c.status === 'PAID').length;
 const totalPaid = calculations.filter(c => c.status === 'PAID').reduce((sum, c) => sum + Number(c.netSettlement), 0);

 return (
 <div className="p-6 space-y-6">
 <div className="flex justify-between items-center border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
 <UserX className="w-8 h-8 mr-3 text-purple-600" />
 {_t('مكافأة نهاية الخدمة (EOS)', 'End of Service Benefits')}
 </h1>
 <p className="text-slate-500 mt-1 text-sm">{_t('وفقاً للمواد 84-88 من نظام العمل السعودي', 'Per Articles 84-88 of Saudi Labor Law')}</p>
 </div>
 <button onClick={() => setShowCalc(!showCalc)}
 className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center text-sm font-medium">
 <Calculator className="w-4 h-4 mr-2" />
 {_t('حاسبة نهاية الخدمة', 'EOS Calculator')}
 </button>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <p className="text-sm font-medium text-slate-500 mb-1">{_t('مسودات', 'Drafts')}</p>
 <h3 className="text-2xl font-bold text-slate-900 font-mono">{draftCount}</h3>
 </div>
 <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
 <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">{_t('معتمدة', 'Approved')}</p>
 <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 font-mono">{approvedCount}</h3>
 </div>
 <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
 <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">{_t('مصروفة', 'Paid')}</p>
 <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 font-mono">{paidCount}</h3>
 </div>
 <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm">
 <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">{_t('إجمالي المصروف', 'Total Paid')}</p>
 <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300 font-mono">{totalPaid.toLocaleString()} <span className="text-sm font-normal">{_t('ر.س', 'SAR')}</span></h3>
 </div>
 </div>

 {/* Calculator */}
 {showCalc && (
 <div className="bg-white border border-purple-200 dark:border-purple-800 rounded-lg p-6 shadow-sm">
 <h2 className="text-lg font-semibold mb-4 text-slate-900 ">{_t('حاسبة مكافأة نهاية الخدمة', 'EOS Calculator')}</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('رقم الموظف', 'Employee ID')}</label>
 <input type="number" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 "/>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('تاريخ الانتهاء', 'End Date')}</label>
 <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 "/>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('سبب الإنهاء', 'Reason')}</label>
 <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 ">
 {EOS_REASONS.map(r => <option key={r.value} value={r.value}>{_t(r.ar, r.en)}</option>)}
 </select>
 </div>
 </div>
 <button onClick={calculate} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium">
 {_t('احسب المكافأة', 'Calculate EOS')}
 </button>

 {/* Result */}
 {calcResult && (
 <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 ">
 <h3 className="text-md font-semibold text-slate-800 mb-3">{_t('نتيجة الحساب', 'Calculation Result')}</h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
 <div><span className="text-slate-500">{_t('سنوات الخدمة', 'Years of Service')}:</span> <span className="font-bold">{Number(calcResult.yearsOfService).toFixed(2)}</span></div>
 <div><span className="text-slate-500">{_t('أول 5 سنوات', 'First 5 Years')}:</span> <span className="font-bold font-mono">{Number(calcResult.firstFiveYearsAmount).toLocaleString()}</span></div>
 <div><span className="text-slate-500">{_t('بعد 5 سنوات', 'After 5 Years')}:</span> <span className="font-bold font-mono">{Number(calcResult.remainingYearsAmount).toLocaleString()}</span></div>
 <div><span className="text-slate-500">{_t('معامل الاستقالة', 'Factor')}:</span> <span className="font-bold">{(Number(calcResult.resignationFactor) * 100).toFixed(0)}%</span></div>
 </div>
 <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
 <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
 {_t('صافي التسوية', 'Net Settlement')}: {Number(calcResult.netSettlement).toLocaleString()} {_t('ر.س', 'SAR')}
 </span>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Table */}
 <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
 <div className="p-4 border-b border-slate-200 bg-slate-50 ">
 <h2 className="text-lg font-medium text-slate-900 ">{_t('سجل التسويات', 'Settlement Records')}</h2>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead>
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{_t('الموظف', 'Employee')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('السبب', 'Reason')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('سنوات الخدمة', 'Years')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('المكافأة', 'EOS Amount')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('الصافي', 'Net')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('الحالة', 'Status')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('إجراءات', 'Actions')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
 {loading ? (
 <tr><td colSpan={7} className="text-center py-10 text-slate-500">{_t('جاري التحميل...', 'Loading...')}</td></tr>
 ) : calculations.length === 0 ? (
 <tr><td colSpan={7} className="text-center py-10 text-slate-500">{_t('لا توجد تسويات', 'No settlements')}</td></tr>
 ) : calculations.map((c: any) => {
 const badge = STATUS_BADGES[c.status] || STATUS_BADGES.DRAFT;
 const reasonLabel = EOS_REASONS.find(r => r.value === c.reasonForLeaving);
 return (
 <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 text-sm font-medium text-slate-900 ">{c.employee?.name || c.employee?.fullName || `#${c.employeeId}`}</td>
 <td className="px-6 py-4 text-sm text-center text-slate-500">{reasonLabel ? _t(reasonLabel.ar, reasonLabel.en) : c.reasonForLeaving}</td>
 <td className="px-6 py-4 text-sm text-center font-mono">{Number(c.yearsOfService).toFixed(1)}</td>
 <td className="px-6 py-4 text-sm text-center font-mono font-bold">{Number(c.totalEOS).toLocaleString()}</td>
 <td className="px-6 py-4 text-sm text-center font-mono font-bold text-purple-600">{Number(c.netSettlement).toLocaleString()}</td>
 <td className="px-6 py-4 text-center">
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{_t(badge.arLabel, badge.enLabel)}</span>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex gap-1 justify-center">
 {c.status === 'DRAFT' && (
 <button onClick={() => handleAction(c.id, 'approve')}
 className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
 <CheckCircle className="w-3 h-3 inline mr-1" />{_t('اعتماد', 'Approve')}
 </button>
 )}
 {c.status === 'APPROVED' && (
 <button onClick={() => handleAction(c.id, 'pay')}
 className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
 <CreditCard className="w-3 h-3 inline mr-1" />{_t('صرف', 'Pay')}
 </button>
 )}
 </div>
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
