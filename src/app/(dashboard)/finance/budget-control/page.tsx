'use client';
import React, { useState, useEffect } from 'react';
import { Wallet, Search, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function BudgetControlDashboard() {
    const { lang } = useTranslation();
    const { success } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [checkResult, setCheckResult] = useState<any>(null);
    const [checkAccountId, setCheckAccountId] = useState('');
    const [checkAmount, setCheckAmount] = useState('');
    const [variance, setVariance] = useState<any>(null);
    const headers = { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/budget-control?year=${year}`, { headers });
            if (res.ok) setBudgets((await res.json()).budgets || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const checkAvailability = async () => {
        if (!checkAccountId || !checkAmount) return;
        try {
            const res = await fetch('/api/finance/budget-control', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ action: 'check', accountId: parseInt(checkAccountId), amount: parseFloat(checkAmount) })
            });
            if (res.ok) setCheckResult((await res.json()).result);
        } catch (e) { console.error(e); }
    };

    const getVariance = async () => {
        try {
            const res = await fetch('/api/finance/budget-control', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ action: 'variance' })
            });
            if (res.ok) setVariance((await res.json()).variance);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, [year]);
    const fmt = (n: number) => Number(n || 0).toLocaleString();

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Wallet className="w-8 h-8 mr-3 text-emerald-600" />
                        {_t('الرقابة على الميزانية', 'Budget Control')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('مراقبة الصرف وتحليل الانحرافات والارتباطات', 'Spending control, variance analysis & encumbrance tracking')}</p>
                </div>
                <div className="flex gap-2">
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-3 py-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={getVariance} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />{_t('تحليل الانحرافات', 'Variance Analysis')}
                    </button>
                </div>
            </div>

            {/* Budget Check Widget */}
            <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{_t('فحص التوفر', 'Budget Availability Check')}</h2>
                <div className="flex gap-3 items-end">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">{_t('رقم الحساب', 'Account ID')}</label>
                        <input type="number" value={checkAccountId} onChange={e => setCheckAccountId(e.target.value)} className="px-3 py-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="5100" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">{_t('المبلغ', 'Amount')}</label>
                        <input type="number" value={checkAmount} onChange={e => setCheckAmount(e.target.value)} className="px-3 py-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="10000" />
                    </div>
                    <button onClick={checkAvailability} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                        <Search className="w-4 h-4 mr-2" />{_t('فحص', 'Check')}
                    </button>
                </div>
                {checkResult && (
                    <div className={`mt-4 p-4 rounded-lg border ${checkResult.allowed ? 'bg-green-50 border-green-300 dark:bg-green-900/20' : 'bg-red-50 border-red-300 dark:bg-red-900/20'}`}>
                        <p className="font-bold text-sm">{checkResult.allowed ? '✅ ' + _t('مسموح — الرصيد كافي', 'Allowed — Budget available') : '❌ ' + _t('مرفوض — تجاوز الميزانية', 'Rejected — Budget exceeded')}</p>
                        <p className="text-sm mt-1">{_t('المتاح:', 'Available:')} <strong className="font-mono">{fmt(checkResult.available)}</strong></p>
                    </div>
                )}
            </div>

            {/* Budgets Table */}
            <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{_t('الميزانيات', 'Budgets')} — {year}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead><tr>
                            {[_t('الاسم','Name'),_t('السنة','Year'),_t('الحالة','Status'),_t('البنود','Lines')].map(h=>
                                <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading?<tr><td colSpan={4} className="text-center py-10 text-gray-500">{_t('جاري التحميل...','Loading...')}</td></tr>:
                            budgets.length===0?<tr><td colSpan={4} className="text-center py-10 text-gray-500">{_t('لا توجد ميزانيات','No budgets')}</td></tr>:
                            budgets.map((b:any)=>(
                                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{b.name}</td>
                                    <td className="px-6 py-4 text-sm">{b.year}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${b.status==='APPROVED'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>{b.status}</span></td>
                                    <td className="px-6 py-4 text-sm font-mono">{b.lines?.length || 0}</td>
                                </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
