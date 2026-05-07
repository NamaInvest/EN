'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function CashFlowForecastPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [weeks, setWeeks] = useState(12);

    useEffect(() => {
        fetchForecast();
    }, [weeks]);

    const fetchForecast = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/cash-flow/forecast?weeks=${weeks}`);
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

    const handleSaveSnapshot = async () => {
        if (!data) return;
        setLoading(true);
        
        const totalInflows = data.buckets.reduce((acc: number, b: any) => acc + b.inflows, 0);
        const totalOutflows = data.buckets.reduce((acc: number, b: any) => acc + b.outflows, 0);

        try {
            const res = await fetch('/api/finance/cash-flow/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    period: `${weeks}_WEEKS`,
                    buckets: data.buckets,
                    alerts: data.alerts,
                    opening: data.currentCash,
                    closing: data.buckets[data.buckets.length - 1].closing,
                    inflows: totalInflows,
                    outflows: totalOutflows
                })
            });
            if (res.ok) {
                alert('تم حفظ لقطة (Snapshot) للتوقعات بنجاح للرجوع إليها لاحقاً.');
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="p-8 text-blue-600">جاري تحليل البيانات النقدية وبناء التوقعات...</div>;
    if (!data) return <div className="p-8 text-red-600">خطأ في جلب البيانات</div>;

    const minThreshold = 100000;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-b-4 border-emerald-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">توقعات التدفقات النقدية (Cash Flow Forecast)</h1>
                    <p className="text-gray-500 mt-1">تنبؤ بالسيولة بناءً على أعمار الذمم (AR/AP) والمصروفات الثابتة.</p>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <select 
                        value={weeks} 
                        onChange={e => setWeeks(Number(e.target.value))}
                        className="border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 dark:text-white font-bold"
                    >
                        <option value={4}>4 أسابيع</option>
                        <option value={12}>12 أسبوع</option>
                        <option value={24}>24 أسبوع</option>
                    </select>
                    <button 
                        onClick={handleSaveSnapshot}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 font-bold"
                    >
                        حفظ لقطة (Save Snapshot)
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {data.alerts.map((alert: any, i: number) => (
                <div key={i} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-red-500 text-xl">⚠️</span>
                        </div>
                        <div className="ml-3 rtl:mr-3 rtl:ml-0">
                            <p className="text-sm font-bold text-red-800">{alert.message}</p>
                        </div>
                    </div>
                </div>
            ))}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col items-center border-b-2 border-blue-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">النقد المتاح حالياً (Current Cash)</h3>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{Number(data.currentCash).toLocaleString()} SAR</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col items-center border-b-2 border-green-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">إجمالي ذمم مدينة (Total AR)</h3>
                    <p className="text-3xl font-black text-green-600">{Number(data.totalAR).toLocaleString()} SAR</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col items-center border-b-2 border-red-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">إجمالي ذمم دائنة (Total AP)</h3>
                    <p className="text-3xl font-black text-red-600">{Number(data.totalAP).toLocaleString()} SAR</p>
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 dark:text-white">مؤشر السيولة المجمعة وتدفقات الفترات</h3>
                <div className="h-96 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data.buckets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="week" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip formatter={(val: any) => (val ? val.toLocaleString() : '0') + ' SAR'} />
                            <Legend />
                            
                            {/* Bars for periodic inflows/outflows */}
                            <Bar dataKey="inflows" fill="#10b981" name="تدفقات داخلة (+)" barSize={20} />
                            <Bar dataKey="outflows" fill="#ef4444" name="تدفقات خارجة (-)" barSize={20} />
                            
                            {/* Line for cumulative cash balance */}
                            <Line type="monotone" dataKey="closing" stroke="#3b82f6" strokeWidth={4} name="رصيد السيولة (Closing)" />
                            
                            {/* Threshold Line */}
                            <ReferenceLine y={minThreshold} stroke="#f59e0b" strokeDasharray="3 3" label="الحد الأدنى للسيولة" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفترة</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">رصيد افتتاحي</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-green-600">تدفقات داخلة</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-red-600">تدفقات خارجة</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">صافي الحركة</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase text-blue-600">رصيد ختامي</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {data.buckets.map((b: any, i: number) => (
                            <tr key={i} className={b.closing < minThreshold ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                    {b.week}
                                    <span className="block text-xs text-gray-500 font-normal">{new Date(b.date).toLocaleDateString('ar-SA')}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                    {Number(b.opening).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-600">
                                    +{Number(b.inflows).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-red-600">
                                    -{Number(b.outflows).toLocaleString()}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${b.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {b.netPosition > 0 ? '+' : ''}{Number(b.netPosition).toLocaleString()}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-black ${b.closing < minThreshold ? 'text-red-600' : 'text-blue-600'}`}>
                                    {Number(b.closing).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
