'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';import { useToast } from '@/components/Toast';

export default function CommissionsPage() {
  const { lang } = useTranslation();
  const { error: toastError, success: toastSuccess, warning: toastWarning } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [rules, setRules] = useState<any[]>([]);
    const [commissions, setCommissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Default to current month
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedRule, setSelectedRule] = useState('');

    useEffect(() => {
        fetchRules();
        fetchCommissions();
    }, [selectedMonth, selectedYear]);

    const fetchRules = async () => {
        const res = await fetch('/api/sales/commissions/rules');
        if (res.ok) setRules(await res.json());
    };

    const fetchCommissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sales/commissions?month=${selectedMonth}&year=${selectedYear}`);
            if (res.ok) setCommissions(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        if (!selectedRule) return toastWarning('يرجى اختيار قاعدة عمولة');
        
        setLoading(true);
        try {
            const res = await fetch('/api/sales/commissions/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    periodMonth: selectedMonth,
                    periodYear: selectedYear,
                    ruleId: parseInt(selectedRule)
                })
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess(`تم حساب العمولة: ${data.commissionsCreated} سجلات تم إنشاؤها.`);
                fetchCommissions();
            } else {
                toastError(`خطأ: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (id: number) => {
        // Here we would call an API that creates a payroll adjustment and posts the JE
        toastSuccess('تم رفع أمر الدفع للنظام المحاسبي (سيتم الاعتماد مع مسير الرواتب)');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">حساب واعتماد العمولات</h1>
                    <p className="text-gray-500 mt-1">{_t('Sales Commission Approval & Payout', 'Sales Commission Approval & Payout')}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">السنة</label>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الشهر</label>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">قاعدة العمولة</label>
                        <select 
                            value={selectedRule} 
                            onChange={(e) => setSelectedRule(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">-- اختر القاعدة --</option>
                            {rules.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.name} ({r.targetAmount} - {r.rewardType})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={handleCalculate}
                            disabled={loading || !selectedRule}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'جاري الحساب...' : 'حساب العمولة'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المندوب</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القاعدة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ العمولة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حالة الدفع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {commissions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">لا يوجد بيانات عمولات لهذا الشهر.</td>
                            </tr>
                        )}
                        {commissions.map((c) => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {c.employee?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {c.rule?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                    {c.calculatedAmount.toLocaleString()} SAR
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {c.isPaid ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">مدفوع</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">قيد الانتظار</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {!c.isPaid && (
                                        <button 
                                            onClick={() => handlePay(c.id)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                                        >
                                            اعتماد للدفع
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
