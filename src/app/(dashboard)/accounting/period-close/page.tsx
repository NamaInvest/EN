'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Calculator, ArrowRightLeft, Calendar } from 'lucide-react';

export default function PeriodCloseDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth() + 1);

    const handleAction = async (action: string, payload: any = {}) => {
        setLoading(true);
        setMessage('Processing...');
        try {
            const res = await fetch('/api/accounting/period-close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, year, month, ...payload })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setMessage(`Success: ${JSON.stringify(data.data)}`);
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Lock className="w-8 h-8 text-blue-600" />{_t('محرك إغلاق الفترة', 'Period Close Engine')}</h1>
            <p className="text-gray-500">{_t('تشغيل الإهلاك الشهري، وإعادة تقييم العملات الأجنبية، وتأمين الفترات المحاسبية.', 'Run monthly depreciation, FX revaluation, and lock accounting periods.')}</p>

            <div className="flex gap-4 p-4 bg-gray-50 border rounded-lg">
                <div>
                    <label className="block text-sm font-medium">{_t('سنة', 'Year')}</label>
                    <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="p-2 border rounded w-24" />
                </div>
                <div>
                    <label className="block text-sm font-medium">{_t('شهر', 'Month')}</label>
                    <input type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="p-2 border rounded w-24" />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded font-semibold ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4 border-t-4 border-t-orange-400">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><ArrowRightLeft className="text-orange-500" /> 1. FX Revaluation</h2>
                    <p className="text-sm text-gray-500">Revalues foreign currency AP/AR accounts and generates unrealized gain/loss JEs.</p>
                    <Button onClick={() => handleAction('fx_reval', { exchangeRate: 3.75, currencyId: 2 })} disabled={loading} variant="outline" className="w-full">{_t('تشغيل إعادة تقييم العملات الأجنبية', 'Run FX Revaluation')}</Button>
                </Card>

                <Card className="p-6 space-y-4 border-t-4 border-t-indigo-400">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Calculator className="text-indigo-500" /> 2. Asset Depreciation</h2>
                    <p className="text-sm text-gray-500">{_t('حساب الإهلاك القسط الثابت لكافة الأصول الثابتة النشطة لهذا الشهر.', 'Calculates straight-line depreciation for all active fixed assets for this month.')}</p>
                    <Button onClick={() => handleAction('depreciation')} disabled={loading} variant="outline" className="w-full">{_t('تشغيل الإهلاك الشهري', 'Run Monthly Depreciation')}</Button>
                </Card>

                <Card className="p-6 space-y-4 md:col-span-2 border-t-4 border-t-red-500 bg-red-50">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-red-700"><Lock className="text-red-600" /> 3. Lock Fiscal Period</h2>
                    <p className="text-sm text-red-600">{_t('إغلاق الشهر المحدد. ولا يمكن نشر أو تعديل أي إدخالات دفتر يومية أخرى في هذه الفترة.', 'Closes the selected month. No further journal entries can be posted or modified in this period.')}</p>
                    <Button onClick={() => handleAction('close_period')} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                        {_t('قفل فترة', 'Lock Period')}{month}/{year}
                    </Button>
                </Card>

                <Card className="p-6 space-y-4 md:col-span-2 border-t-4 border-t-slate-800 bg-slate-50">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800"><Calendar className="text-slate-800" /> {_t('4. سنة-End إغلاق', '4. Year-End Close')}</h2>
                    <p className="text-sm text-slate-600">Closes all 12 months, transfers Revenue/Expenses to Retained Earnings, and locks the year.</p>
                    <Button onClick={() => handleAction('close_year')} disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                        Close Fiscal Year {year}
                    </Button>
                </Card>
            </div>
        </div>
    );
}
