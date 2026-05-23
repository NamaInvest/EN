'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';import { useToast } from '@/components/Toast';

export default function IntercompanyEliminationPage() {
  const { lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [pairs, setPairs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPairs();
    }, []);

    const fetchPairs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/consolidation/elimination');
            const data = await res.json();
            if (res.ok) {
                setPairs(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleElimination = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/consolidation/elimination', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pairs })
            });
            const data = await res.json();
            if (res.ok) {
                toastSuccess('تمت عملية الاستبعاد (Elimination) بنجاح وتم توليد القيود.');
                fetchPairs();
            } else {
                toastError(data.error);
            }
        } catch (error) {
            console.error(error);
            toastError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const updateVarianceReason = (index: number, reason: string) => {
        const newPairs = [...pairs];
        newPairs[index].varianceReason = reason;
        setPairs(newPairs);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-b-4 border-indigo-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تسويات الشركات الشقيقة (Intercompany Elimination)</h1>
                    <p className="text-gray-500 mt-1">مطابقة حسابات القبض (AR) مع حسابات الدفع (AP) بين فروع الشركة واستبعاد الأرصدة المتبادلة.</p>
                </div>
                <button 
                    onClick={handleElimination}
                    disabled={loading || pairs.length === 0}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-bold disabled:opacity-50"
                >
                    تشغيل الاستبعاد الآلي (Run Elimination)
                </button>
            </div>

            {loading && <div className="text-indigo-600 p-4">جاري تحميل تقرير المطابقة...</div>}

            {!loading && pairs.length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 text-yellow-800 dark:text-yellow-200">
                    لا توجد أرصدة لشركات شقيقة (Intercompany) تحتاج إلى تسوية في الوقت الحالي.
                    <br/><span className="text-sm mt-2 block">تأكد من تفعيل خيار <code>isIntercompany=true</code> للعملاء والموردين الشركاء.</span>
                </div>
            )}

            {!loading && pairs.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">الشركة / الفرع (AR)</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">رصيد القبض (AR)</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">الشركة / الفرع (AP)</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">رصيد الدفع (AP)</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">{_t('الفرق (الفرق)', 'الفرق (Variance)')}</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">حالة المطابقة</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">سبب الفرق</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {pairs.map((pair, index) => (
                                <tr key={pair.id} className={pair.variance > 0 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                                        {pair.customerName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-blue-600 font-bold">
                                        {Number(pair.arBalance).toLocaleString()} SAR
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                                        {pair.vendorName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-indigo-600 font-bold">
                                        {Number(pair.apBalance).toLocaleString()} SAR
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-center font-bold ${pair.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {Number(pair.variance).toLocaleString()} SAR
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {pair.variance === 0 ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">متطابق</span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">فرق أرصدة</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {pair.variance > 0 ? (
                                            <select 
                                                value={pair.varianceReason || ''} 
                                                onChange={e => updateVarianceReason(index, e.target.value)}
                                                className="border-gray-300 rounded-md shadow-sm p-1 text-sm dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="TIMING_DIFFERENCE">فروق توقيت (Timing)</option>
                                                <option value="FX_DIFFERENCE">فروق عملة (FX)</option>
                                                <option value="IN_TRANSIT">بضاعة بالطريق (In-Transit)</option>
                                                <option value="DISPUTE">خلاف جاري تسويته</option>
                                            </select>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 flex flex-col gap-2">
                <strong>💡 ماذا يحدث عند "تشغيل الاستبعاد الآلي"؟</strong>
                <ul className="list-disc list-inside space-y-1">
                    <li>يتم إغلاق أرصدة AR الدائنة مع AP المدينة للشركات الشقيقة (الأقل بينهما).</li>
                    <li>يتم توليد قيد اليومية: <code>Dr Intercompany Payable | Cr Intercompany Receivable</code>.</li>
                    <li>في حال وجود مخزون مباع داخلياً بهامش ربح (Profit in Stock)، يجب تسويته يدوياً أو تفعيل موديول الاستبعاد المعقد.</li>
                </ul>
            </div>
        </div>
    );
}
