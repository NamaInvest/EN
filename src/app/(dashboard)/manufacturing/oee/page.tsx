'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line
} from 'recharts';

export default function OEEDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMachine, setSelectedMachine] = useState<string>('');

    useEffect(() => {
        fetchOEEData();
    }, [selectedMachine]);

    const fetchOEEData = async () => {
        setLoading(true);
        try {
            const url = selectedMachine ? `/api/manufacturing/oee?machineId=${selectedMachine}` : '/api/manufacturing/oee';
            const res = await fetch(url);
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

    if (loading && !data) return <div className="p-8 text-blue-600">جاري تحميل لوحة تحكم OEE...</div>;
    if (!data) return <div className="p-8 text-red-600">تعذر تحميل البيانات.</div>;

    const { aggregate, machines } = data;

    // Prepare Pareto Data for Downtime
    let downtimeReasons: Record<string, number> = {};
    machines.forEach((m: any) => {
        Object.entries(m.downtimeReasons || {}).forEach(([reason, minutes]) => {
            downtimeReasons[reason] = (downtimeReasons[reason] || 0) + (minutes as number);
        });
    });

    const paretoData = Object.entries(downtimeReasons)
        .map(([reason, minutes]) => ({ name: reason, value: minutes }))
        .sort((a, b) => b.value - a.value);

    let cumulative = 0;
    const totalDowntime = paretoData.reduce((sum, item) => sum + item.value, 0);
    paretoData.forEach(item => {
        cumulative += item.value;
        (item as any).cumulativePercent = totalDowntime > 0 ? (cumulative / totalDowntime) * 100 : 0;
    });

    const getOEEColor = (value: number) => {
        if (value >= 85) return 'text-green-600';
        if (value >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overall Equipment Effectiveness (OEE)</h1>
                    <p className="text-gray-500 mt-1">مؤشرات الكفاءة الشاملة للآلات والمعدات (آخر 30 يوم)</p>
                </div>
                <div>
                    <select 
                        className="border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 dark:text-white font-bold"
                        value={selectedMachine}
                        onChange={e => setSelectedMachine(e.target.value)}
                    >
                        <option value="">جميع الآلات</option>
                        {machines.map((m: any) => (
                            <option key={m.machineId} value={m.machineId}>{m.machineName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Aggregate KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center border-b-4 border-indigo-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">OEE الشامل</h3>
                    <div className={`text-4xl font-black ${getOEEColor(aggregate.oee)}`}>
                        {aggregate.oee.toFixed(1)}%
                    </div>
                    {aggregate.oee < 60 && <span className="text-xs text-red-500 font-bold mt-2 block">يتطلب تدخل إداري (تحت 60%)</span>}
                    {aggregate.oee >= 85 && <span className="text-xs text-green-500 font-bold mt-2 block">مستوى عالمي (World-Class)</span>}
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center border-b-4 border-blue-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">الإتاحة (Availability)</h3>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">
                        {aggregate.availability.toFixed(1)}%
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center border-b-4 border-yellow-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">الأداء (Performance)</h3>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">
                        {aggregate.performance.toFixed(1)}%
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center border-b-4 border-green-500">
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2">الجودة (Quality)</h3>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">
                        {aggregate.quality.toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* OEE per Machine Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">مؤشرات OEE لكل آلة</h3>
                    <div className="h-80 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={machines} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="machineName" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="availability" stackId="a" fill="#3b82f6" name="Availability" />
                                <Bar dataKey="performance" stackId="a" fill="#eab308" name="Performance" />
                                <Bar dataKey="quality" stackId="a" fill="#22c55e" name="Quality" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Downtime Pareto Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">تحليل أسباب التوقف (Downtime Pareto)</h3>
                    {paretoData.length > 0 ? (
                        <div className="h-80 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={paretoData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="value" fill="#ef4444" name="Downtime (Minutes)" barSize={20} />
                                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" stroke="#f97316" name="Cumulative %" strokeWidth={3} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-500">لا توجد سجلات توقف (Downtime) لهذه الفترة.</div>
                    )}
                </div>
            </div>

            {/* Detailed Machine List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">اسم الآلة</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">Availability</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">Performance</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">Quality</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">OEE</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {machines.map((m: any) => (
                            <tr key={m.machineId}>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{m.machineName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">{m.availability.toFixed(1)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">{m.performance.toFixed(1)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">{m.quality.toFixed(1)}%</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-center font-bold ${getOEEColor(m.oee)}`}>
                                    {m.oee.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
