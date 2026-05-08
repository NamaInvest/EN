'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function PayrollRunPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [configReady, setConfigReady] = useState(true);
    const [alreadyProcessed, setAlreadyProcessed] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetchPreview();
    }, [month, year]);

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/hr/payroll/run?month=${month}&year=${year}`);
            const data = await res.json();
            if (data.success) {
                setPreviewData(data.data.preview);
                setConfigReady(data.data.configReady);
                setAlreadyProcessed(data.data.alreadyProcessed);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostPayroll = async () => {
        if (!confirm('هل أنت متأكد من ترحيل مسير الرواتب؟ سيتم إنشاء قيد محاسبي باستحقاق الرواتب.')) return;
        
        setPosting(true);
        try {
            const res = await fetch('/api/hr/payroll/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, year, data: previewData })
            });
            const result = await res.json();
            if (res.ok) {
                toastWarning(result.message);
                fetchPreview();
            } else {
                toastError(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setPosting(false);
        }
    };

    const totalBasic = previewData.reduce((acc, curr) => acc + curr.basic, 0);
    const totalAdditions = previewData.reduce((acc, curr) => acc + curr.additions, 0);
    const totalGosi = previewData.reduce((acc, curr) => acc + curr.gosiDeduction, 0);
    const totalNet = previewData.reduce((acc, curr) => acc + curr.netSalary, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إصدار وترحيل مسير الرواتب (Payroll Run)</h1>
                    <p className="text-gray-500 mt-1">معاينة رواتب الموظفين وترحيلها كقيود استحقاق في النظام المالي.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select 
                        value={month} onChange={(e) => setMonth(Number(e.target.value))}
                        className="border-gray-300 rounded p-2 text-sm dark:bg-gray-700 dark:text-white"
                    >
                        {Array.from({length: 12}).map((_, i) => (
                            <option key={i+1} value={i+1}>شهر {i+1}</option>
                        ))}
                    </select>
                    <select 
                        value={year} onChange={(e) => setYear(Number(e.target.value))}
                        className="border-gray-300 rounded p-2 text-sm dark:bg-gray-700 dark:text-white"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>سنة {y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!configReady && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
                    <p className="font-bold">تحذير: إعدادات الرواتب المحاسبية غير مكتملة!</p>
                    <p className="text-sm">يرجى الذهاب إلى شاشة <a href="/hr/payroll/config" className="underline">إعدادات الرواتب المحاسبية</a> لربط الحسابات قبل الترحيل.</p>
                </div>
            )}

            {alreadyProcessed && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-800 border-l-4 border-green-500 p-4 rounded-md shadow-sm flex justify-between items-center">
                    <div>
                        <p className="font-bold">✅ تم إصدار مسير الرواتب لهذا الشهر مسبقاً.</p>
                        <p className="text-sm">قيد الاستحقاق موجود في النظام المالي ولم تعد بحاجة لترحيله مرة أخرى.</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-indigo-600">جاري الحساب...</div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-500 font-bold mb-1">إجمالي الأساسي</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{totalBasic.toLocaleString(undefined, {minimumFractionDigits: 2})} SAR</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-500 font-bold mb-1">إجمالي البدلات</div>
                            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalAdditions.toLocaleString(undefined, {minimumFractionDigits: 2})} SAR</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-red-500 font-bold mb-1">استقطاعات (تأمينات)</div>
                            <div className="text-xl font-bold text-red-600 dark:text-red-400">{totalGosi.toLocaleString(undefined, {minimumFractionDigits: 2})} SAR</div>
                        </div>
                        <div className="bg-indigo-600 p-4 rounded-lg shadow text-center text-white">
                            <div className="text-xs text-indigo-200 font-bold mb-1">صافي المستحق (Net Payable)</div>
                            <div className="text-2xl font-bold">{totalNet.toLocaleString(undefined, {minimumFractionDigits: 2})} SAR</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الأساسي</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-indigo-600">البدلات (+)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-red-600">تأمينات (-)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-green-600">صافي الراتب (=)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {previewData.map(emp => (
                                    <tr key={emp.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                            {emp.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                                            {emp.basic.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-indigo-600">
                                            {emp.additions.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-red-500">
                                            {emp.gosiDeduction.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-600 dark:text-green-400">
                                            {emp.netSalary.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {previewData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            لا يوجد موظفين نشطين لإصدار رواتب لهم.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button 
                            onClick={handlePostPayroll}
                            disabled={!configReady || alreadyProcessed || posting || previewData.length === 0}
                            className="bg-green-600 text-white px-8 py-3 rounded-md font-bold hover:bg-green-700 shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {posting ? 'جاري ترحيل القيود...' : 'ترحيل مسير الرواتب (Post Journal Entry)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
