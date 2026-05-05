'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function ECLCalculatorPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchECL();
    }, []);

    const fetchECL = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/ecl');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostJE = async () => {
        if (!data || !data.portfolioECL) return;
        setLoading(true);
        try {
            const res = await fetch('/api/finance/ecl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ totalECL: data.portfolioECL.totalECL })
            });
            const result = await res.json();
            if (res.ok) {
                alert(result.message);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="p-8 text-blue-600">جاري حساب مخصصات الخسائر الائتمانية (ECL)...</div>;
    if (!data) return <div className="p-8 text-red-600">خطأ في جلب البيانات</div>;

    const { portfolioECL, customerECLDetails, parameters } = data;

    // Prepare chart data
    const chartData = [
        { name: '0-30 يوم', EAD: portfolioECL['0-30'] / parameters.PD_RATES['0-30'] / parameters.DEFAULT_LGD, ECL: portfolioECL['0-30'] },
        { name: '31-60 يوم', EAD: portfolioECL['31-60'] / parameters.PD_RATES['31-60'] / parameters.DEFAULT_LGD, ECL: portfolioECL['31-60'] },
        { name: '61-90 يوم', EAD: portfolioECL['61-90'] / parameters.PD_RATES['61-90'] / parameters.DEFAULT_LGD, ECL: portfolioECL['61-90'] },
        { name: '91-180 يوم', EAD: portfolioECL['91-180'] / parameters.PD_RATES['91-180'] / parameters.DEFAULT_LGD, ECL: portfolioECL['91-180'] },
        { name: '181-365 يوم', EAD: portfolioECL['181-365'] / parameters.PD_RATES['181-365'] / parameters.DEFAULT_LGD, ECL: portfolioECL['181-365'] },
        { name: 'أكثر من سنة', EAD: portfolioECL['>365'] / parameters.PD_RATES['>365'] / parameters.DEFAULT_LGD, ECL: portfolioECL['>365'] }
    ];

    // Clean up EAD values (divide by zero fallback)
    chartData.forEach(d => {
        if (isNaN(d.EAD) || !isFinite(d.EAD)) d.EAD = 0;
    });

    const averageECLRate = portfolioECL.totalEAD > 0 ? (portfolioECL.totalECL / portfolioECL.totalEAD) * 100 : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-b-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">حاسبة الخسائر الائتمانية المتوقعة (IFRS 9 ECL)</h1>
                    <p className="text-gray-500 mt-1">حساب مخصصات الديون المشكوك في تحصيلها بناءً على أعمار الذمم ومعادلة ECL = PD × LGD × EAD</p>
                </div>
                <button 
                    onClick={handlePostJE}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-bold"
                    disabled={loading || portfolioECL.totalECL === 0}
                >
                    إنشاء قيد المخصص (Post JE)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center border-l-4 border-blue-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">إجمالي الانكشاف (Total EAD)</h3>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{Number(portfolioECL.totalEAD).toLocaleString()} SAR</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
                    <h3 className="text-red-700 dark:text-red-300 font-bold mb-2">إجمالي الخسارة المتوقعة (Total ECL)</h3>
                    <p className="text-3xl font-black text-red-600">{Number(portfolioECL.totalECL).toLocaleString(undefined, {maximumFractionDigits: 2})} SAR</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">متوسط نسبة المخصص</h3>
                    <p className="text-3xl font-black text-yellow-600">{averageECLRate.toFixed(2)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">تحليل ECL و EAD حسب أعمار الذمم</h3>
                    <div className="h-80 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip formatter={(val: any) => val.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' SAR'} />
                                <Legend />
                                <Bar dataKey="EAD" fill="#93c5fd" name="الانكشاف (EAD)" />
                                <Bar dataKey="ECL" fill="#ef4444" name="الخسارة المتوقعة (ECL)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-fit border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">محددات النموذج (Model Parameters)</h3>
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">نسبة الخسارة (LGD)</span>
                            <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">{(parameters.DEFAULT_LGD * 100).toFixed(0)}%</span>
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 border-b pb-1 dark:border-gray-700">احتمالية التعثر (PD) حسب الفئة:</h4>
                            <ul className="space-y-2">
                                {Object.entries(parameters.PD_RATES).map(([bucket, rate]) => (
                                    <li key={bucket} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">{bucket} يوم</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-800 dark:text-gray-200">
                                            {((rate as number) * 100).toFixed(1)}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                            ملاحظة: تعتمد هذه النسب على المعيار الأساسي لـ IFRS 9 ويمكن تعديلها لاحقاً لتناسب الصناعة.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold dark:text-white">تفصيل الـ ECL لكل عميل (Top Contributors)</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم العميل</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الرصيد الإجمالي</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">0-60 يوم</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-orange-500">61-180 يوم</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-red-500">{'>'}180 يوم</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-red-50 dark:bg-red-900/20 text-red-700">مخصص ECL المطلوب</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {customerECLDetails.slice(0, 50).map((c: any) => {
                            const bucket1 = c.aging['0-30'] + c.aging['31-60'];
                            const bucket2 = c.aging['61-90'] + c.aging['91-180'];
                            const bucket3 = c.aging['181-365'] + c.aging['>365'];

                            return (
                                <tr key={c.customerId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        {c.customerName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                        {Number(c.balance).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                        {bucket1 > 0 ? Number(bucket1).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-500 font-medium">
                                        {bucket2 > 0 ? Number(bucket2).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-500 font-bold">
                                        {bucket3 > 0 ? Number(bucket3).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-black text-red-600 bg-red-50 dark:bg-red-900/10">
                                        {Number(c.totalCustomerECL).toLocaleString(undefined, {maximumFractionDigits: 2})} SAR
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
