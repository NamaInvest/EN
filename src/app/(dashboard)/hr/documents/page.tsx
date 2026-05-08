'use client';

import React, { useState, useEffect } from 'react';
import { FileWarning, AlertTriangle, AlertOctagon, Bell, CheckCircle2, RefreshCcw, Calendar, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

const DOC_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
 IQAMA: { ar: 'إقامة', en: 'Iqama' },
 WORK_PERMIT: { ar: 'رخصة عمل', en: 'Work Permit' },
 PASSPORT: { ar: 'جواز سفر', en: 'Passport' },
 DRIVING_LICENSE: { ar: 'رخصة قيادة', en: 'Driving License' },
 MEDICAL_INSURANCE: { ar: 'تأمين طبي', en: 'Medical Insurance' },
 CR: { ar: 'سجل تجاري', en: 'Commercial Registration' },
 MUNICIPALITY: { ar: 'رخصة بلدية', en: 'Municipality License' },
 FIRE_SAFETY: { ar: 'شهادة سلامة', en: 'Fire Safety' },
 SAUDIZATION_CERT: { ar: 'شهادة سعودة', en: 'Saudization Certificate' },
 VISA: { ar: 'تأشيرة', en: 'Visa' },
 CONTRACT: { ar: 'عقد عمل', en: 'Employment Contract' },
 OTHER: { ar: 'أخرى', en: 'Other' },
};

const SEVERITY_CONFIG: Record<string, { color: string; icon: any; arLabel: string; enLabel: string }> = {
 EXPIRED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', icon: AlertOctagon, arLabel: 'منتهية', enLabel: 'Expired' },
 CRITICAL: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800', icon: AlertTriangle, arLabel: 'حرجة', enLabel: 'Critical' },
 WARNING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: Bell, arLabel: 'تنبيه', enLabel: 'Warning' },
 INFO: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: Calendar, arLabel: 'قادمة', enLabel: 'Upcoming' },
};

export default function DocumentExpiryPage() {
 const { lang } = useTranslation();
 const { success } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [dashboard, setDashboard] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [scanning, setScanning] = useState(false);
 const [activeTab, setActiveTab] = useState<'expired' | 'critical' | 'warning' | 'upcoming'>('expired');
 const [renewModal, setRenewModal] = useState<{ show: boolean; alertId: number | null; newDate: string }>({ show: false, alertId: null, newDate: '' });

 const fetchDashboard = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/hr/documents/expiry', {
 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
 });
 if (res.ok) setDashboard(await res.json());
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 };

 useEffect(() => { fetchDashboard(); }, []);

 const runScan = async () => {
 setScanning(true);
 try {
 const res = await fetch('/api/hr/documents/expiry', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ channels: ['DASHBOARD'] }),
 });
 if (res.ok) {
 const data = await res.json();
 success(_t(`تم فحص ${data.scanned} وثيقة — ${data.alertsCreated} تنبيه جديد`, `Scanned ${data.scanned} documents — ${data.alertsCreated} new alerts`));
 fetchDashboard();
 }
 } catch (e) { console.error(e); }
 finally { setScanning(false); }
 };

 const handleRenew = async () => {
 if (!renewModal.alertId || !renewModal.newDate) return;
 try {
 const res = await fetch(`/api/hr/documents/expiry/${renewModal.alertId}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action: 'renew', newExpiryDate: renewModal.newDate }),
 });
 if (res.ok) {
 success(_t('تم التجديد بنجاح', 'Renewed successfully'));
 setRenewModal({ show: false, alertId: null, newDate: '' });
 fetchDashboard();
 }
 } catch (e) { console.error(e); }
 };

 const handleDismiss = async (alertId: number) => {
 try {
 const res = await fetch(`/api/hr/documents/expiry/${alertId}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action: 'dismiss', dismissReason: 'تم التجاهل يدوياً' }),
 });
 if (res.ok) {
 success(_t('تم التجاهل', 'Dismissed'));
 fetchDashboard();
 }
 } catch (e) { console.error(e); }
 };

 const summary = dashboard?.summary || { totalDocuments: 0, expiredCount: 0, criticalCount: 0, warningCount: 0, upcomingCount: 0, complianceRate: 100 };
 const activeAlerts = dashboard?.[activeTab] || [];

 const tabs = [
 { key: 'expired', count: summary.expiredCount, ar: 'منتهية', en: 'Expired', color: 'text-red-600' },
 { key: 'critical', count: summary.criticalCount, ar: 'حرجة (30 يوم)', en: 'Critical (30d)', color: 'text-orange-600' },
 { key: 'warning', count: summary.warningCount, ar: 'تنبيه (60 يوم)', en: 'Warning (60d)', color: 'text-yellow-600' },
 { key: 'upcoming', count: summary.upcomingCount, ar: 'قادمة (90 يوم)', en: 'Upcoming (90d)', color: 'text-blue-600' },
 ];

 return (
 <div className="p-6 space-y-6">
 {/* Header */}
 <div className="flex justify-between items-center border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
 <ShieldAlert className="w-8 h-8 mr-3 text-orange-600" />
 {_t('تنبيهات الوثائق', 'Document Expiry Alerts')}
 </h1>
 <p className="text-slate-500 mt-1 text-sm">{_t('تتبع انتهاء الإقامات والرخص والوثائق الرسمية', 'Track expiry of Iqamas, licenses, and official documents')}</p>
 </div>
 <button onClick={runScan} disabled={scanning}
 className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center text-sm font-medium disabled:opacity-50">
 <RefreshCcw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
 {_t('فحص الآن', 'Scan Now')}
 </button>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <p className="text-sm font-medium text-slate-500 mb-1">{_t('إجمالي التنبيهات', 'Total Alerts')}</p>
 <h3 className="text-2xl font-bold text-slate-900 font-mono">{summary.totalDocuments}</h3>
 </div>
 <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
 <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">{_t('منتهية', 'Expired')}</p>
 <h3 className="text-2xl font-bold text-red-800 dark:text-red-300 font-mono">{summary.expiredCount}</h3>
 </div>
 <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm">
 <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">{_t('حرجة', 'Critical')}</p>
 <h3 className="text-2xl font-bold text-orange-800 dark:text-orange-300 font-mono">{summary.criticalCount}</h3>
 </div>
 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm">
 <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">{_t('تنبيه', 'Warning')}</p>
 <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 font-mono">{summary.warningCount}</h3>
 </div>
 <div className={`p-5 rounded-lg border shadow-sm ${summary.complianceRate >= 90 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
 <p className="text-sm font-medium text-slate-600 mb-1">{_t('نسبة الامتثال', 'Compliance Rate')}</p>
 <h3 className="text-2xl font-bold font-mono">{summary.complianceRate}%</h3>
 </div>
 </div>

 {/* Tabs */}
 <div className="border-b border-slate-200 ">
 <div className="flex space-x-4 rtl:space-x-reverse">
 {tabs.map(tab => (
 <button key={tab.key}
 onClick={() => setActiveTab(tab.key as any)}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? `border-blue-600 ${tab.color}` : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
 {_t(tab.ar, tab.en)} ({tab.count})
 </button>
 ))}
 </div>
 </div>

 {/* Alerts Table */}
 <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead className="bg-slate-50 ">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{_t('الحامل', 'Holder')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('نوع الوثيقة', 'Document Type')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('الرقم', 'Number')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('تاريخ الانتهاء', 'Expiry Date')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('الأيام المتبقية', 'Days Left')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{_t('إجراءات', 'Actions')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
 {loading ? (
 <tr><td colSpan={6} className="text-center py-10 text-slate-500">{_t('جاري التحميل...', 'Loading...')}</td></tr>
 ) : activeAlerts.length === 0 ? (
 <tr><td colSpan={6} className="text-center py-10 text-slate-500">
 <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
 {_t('لا توجد تنبيهات في هذا التصنيف', 'No alerts in this category')}
 </td></tr>
 ) : activeAlerts.map((alert: any) => {
 const docLabel = DOC_TYPE_LABELS[alert.documentType] || DOC_TYPE_LABELS.OTHER;
 const sevConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
 const Icon = sevConfig.icon;
 return (
 <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 text-sm font-medium text-slate-900 ">
 <div className="flex items-center">
 <Icon className={`w-4 h-4 mr-2 ${alert.severity === 'EXPIRED' ? 'text-red-500' : alert.severity === 'CRITICAL' ? 'text-orange-500' : 'text-yellow-500'}`} />
 {alert.holderName}
 </div>
 <span className="text-xs text-slate-400">{alert.holderType === 'EMPLOYEE' ? _t('موظف', 'Employee') : _t('شركة', 'Company')}</span>
 </td>
 <td className="px-6 py-4 text-sm text-center text-slate-600 ">{_t(docLabel.ar, docLabel.en)}</td>
 <td className="px-6 py-4 text-sm text-center text-slate-500 font-mono">{alert.documentNumber}</td>
 <td className="px-6 py-4 text-sm text-center text-slate-500 font-mono">{new Date(alert.expiryDate).toLocaleDateString()}</td>
 <td className="px-6 py-4 text-center">
 <span className={`px-2 py-1 rounded-full text-xs font-bold ${alert.daysRemaining <= 0 ? 'bg-red-100 text-red-800' : alert.daysRemaining <= 30 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
 {alert.daysRemaining <= 0 ? _t('منتهية', 'Expired') : `${alert.daysRemaining} ${_t('يوم', 'days')}`}
 </span>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex gap-1 justify-center">
 <button onClick={() => setRenewModal({ show: true, alertId: alert.id, newDate: '' })}
 className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
 {_t('تجديد', 'Renew')}
 </button>
 <button onClick={() => handleDismiss(alert.id)}
 className="px-3 py-1 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-50 dark:hover:bg-gray-700">
 {_t('تجاهل', 'Dismiss')}
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Renew Modal */}
 {renewModal.show && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
 <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
 <h3 className="text-lg font-semibold text-slate-900 mb-4">{_t('تجديد الوثيقة', 'Renew Document')}</h3>
 <div>
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('تاريخ الانتهاء الجديد', 'New Expiry Date')}</label>
 <input type="date" value={renewModal.newDate} onChange={e => setRenewModal({...renewModal, newDate: e.target.value})}
 className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 "/>
 </div>
 <div className="flex gap-2 mt-4">
 <button onClick={handleRenew} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
 {_t('تأكيد التجديد', 'Confirm Renewal')}
 </button>
 <button onClick={() => setRenewModal({ show: false, alertId: null, newDate: '' })}
 className="px-6 py-2 border border-slate-300 rounded-md text-slate-700 text-sm">
 {_t('إلغاء', 'Cancel')}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
