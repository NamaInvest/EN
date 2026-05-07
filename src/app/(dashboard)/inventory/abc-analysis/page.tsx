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
  ResponsiveContainer
} from 'recharts';

export default function AbcAnalysisPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState('12m');

    useEffect(() => {
        fetchAnalysis();
    }, [period]);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/abc-analysis?period=${period}`);
            const data = await res.json();
            setItems(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!confirm('هل أنت متأكد من تحديث تصنيفات ABC لجميع المنتجات؟ سينعكس هذا على جدولة الجرد الدوري.')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/inventory/abc-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`تم تحديث ${data.updatedCount} منتج بنجاح`);
                fetchAnalysis();
            } else {
                alert(data.error || 'فشل التحديث');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare data for Pareto chart
    const chartData = items.slice(0, 50).map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        usageValue: item.usageValue,
        cumulativePercent: item.cumulativePercent
    }));

    const summaryCount = {
        A: items.filter(i => i.recommendedClass === 'A').length,
        B: items.filter(i => i.recommendedClass === 'B').length,
        C: items.filter(i => i.recommendedClass === 'C').length,
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تحليل ABC للمخزون (Pareto Analysis)</h1>
                    <p className="text-gray-500 mt-1">يصنف المنتجات حسب قيمة الاستهلاك السنوي (Usage Value) لتحسين سياسات الجرد</p>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <select 
                        className="border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                        value={period}
                        onChange={e => setPeriod(e.target.value)}
                    >
                        <option value="12m">آخر 12 شهر</option>
                        <option value="6m">آخر 6 أشهر</option>
                    </select>
                    <button 
                        onClick={handleApply}
                        disabled={loading || items.length === 0}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold disabled:opacity-50"
                    >
                        تطبيق على جدولة الجرد (Update Class)
                    </button>
                </div>
            </div>

            {loading && <div className="text-blue-600 text-center">جاري المعالجة والتحليل...</div>}

            {!loading && items.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* KPI Cards */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-t-4 border-red-500">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex justify-between">
                            <span>الفئة A</span>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">80% من القيمة</span>
                        </h3>
                        <p className="text-3xl font-bold mt-2 text-gray-800 dark:text-white">{summaryCount.A}</p>
                        <p className="text-sm text-gray-500 mt-1">منتجات</p>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• جرد دوري: <strong>أسبوعياً</strong></li>
                                <li>• تحكم: صارم جداً (JIT)</li>
                                <li>• طلب: كميات دقيقة</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-t-4 border-yellow-500">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex justify-between">
                            <span>الفئة B</span>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">15% من القيمة</span>
                        </h3>
                        <p className="text-3xl font-bold mt-2 text-gray-800 dark:text-white">{summaryCount.B}</p>
                        <p className="text-sm text-gray-500 mt-1">منتجات</p>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• جرد دوري: <strong>شهرياً</strong></li>
                                <li>• تحكم: معتدل (EOQ)</li>
                                <li>• طلب: كميات اقتصادية</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-t-4 border-green-500">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex justify-between">
                            <span>الفئة C</span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">5% من القيمة</span>
                        </h3>
                        <p className="text-3xl font-bold mt-2 text-gray-800 dark:text-white">{summaryCount.C}</p>
                        <p className="text-sm text-gray-500 mt-1">منتجات</p>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• جرد دوري: <strong>ربع سنوي / سنوي</strong></li>
                                <li>• تحكم: مبسط</li>
                                <li>• طلب: كميات كبيرة (Bulk)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">منحنى باريتو (Pareto Chart) للاستهلاك - أعلى 50 منتج</h3>
                        <div className="h-96 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                >
                                    <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#ff7300" domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="usageValue" name="Usage Value (SAR)" barSize={20} fill="#413ea0" />
                                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumulative %" stroke="#ff7300" strokeWidth={3} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">رقم المنتج</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">المخزون الحالي</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">تكلفة الوحدة</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">الكمية المستهلكة</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">قيمة الاستهلاك</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">التصنيف المقترح</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">التصنيف الحالي</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {items.map((item, index) => (
                                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-850'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.currentStock}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{Number(item.buyPrice).toLocaleString()} SAR</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.totalOutQty}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{Number(item.usageValue).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    item.recommendedClass === 'A' ? 'bg-red-100 text-red-800' :
                                                    item.recommendedClass === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    Class {item.recommendedClass}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                {item.abcClass ? `Class ${item.abcClass}` : 'غير محدد'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
