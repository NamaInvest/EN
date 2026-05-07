'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const REASON_CODES = [
    'SETUP_LOSS',
    'MATERIAL_DEFECT',
    'MACHINE_BREAKDOWN',
    'OPERATOR_ERROR',
    'DESIGN_ISSUE',
    'OTHER'
];

export default function ScrapTrackingPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [wastages, setWastages] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form states
    const [moId, setMoId] = useState('');
    const [rawProductId, setRawProductId] = useState('');
    const [lostQuantity, setLostQuantity] = useState('');
    const [reason, setReason] = useState(REASON_CODES[0]);

    useEffect(() => {
        fetchWastages();
    }, []);

    const fetchWastages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/scrap');
            const result = await res.json();
            if (result.success) {
                setWastages(result.data.wastages);
                setStats(result.data.stats);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/scrap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moId,
                    rawProductId,
                    lostQuantity,
                    reason
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('تم تسجيل الهالك بنجاح وتوليد قيد التسوية.');
                setIsModalOpen(false);
                setMoId(''); setRawProductId(''); setLostQuantity('');
                fetchWastages();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return <div className="p-8 text-blue-600">جاري تحميل البيانات...</div>;

    // Prepare pie chart data
    const pieData = stats ? Object.entries(stats.reasonsCount).map(([name, value]) => ({ name, value })) : [];
    const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#64748b'];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-b-4 border-red-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تتبع الهالك والتوالف (Scrap Tracking)</h1>
                    <p className="text-gray-500 mt-1">سجل التوالف للإنتاج مع إنشاء القيود المحاسبية الآلية (Dr 5910 / Cr 1310)</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-bold"
                >
                    + تسجيل هالك جديد
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col justify-center items-center">
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">إجمالي التكلفة المهدرة (Wasted Cost)</h3>
                        <p className="text-5xl font-black text-red-600">{Number(stats.totalWastedCost).toLocaleString()} SAR</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">تحليل أسباب الهالك (Reason Codes)</h3>
                        <div className="h-64 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">رقم أمر التصنيع</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">المنتج الخام</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">الكمية المهدرة</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">التكلفة المهدرة</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">السبب (Reason)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {wastages.map((w: any) => (
                            <tr key={w.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(w.reportedAt).toLocaleDateString('ar-SA')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                    MO-{w.order?.orderNumber || w.manufacturingOrderId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {w.rawProduct?.name || `Product ID ${w.rawProductId}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-red-600">
                                    {w.lostQuantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white font-bold">
                                    {Number(w.wastedCost).toLocaleString()} SAR
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-300 text-xs">
                                        {w.reason}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl border-t-4 border-red-600">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">تسجيل هالك / توالف</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم أمر التصنيع (MO ID)</label>
                                <input 
                                    type="number" required 
                                    value={moId} onChange={e => setMoId(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم المنتج الخام (Raw Product ID)</label>
                                <input 
                                    type="number" required 
                                    value={rawProductId} onChange={e => setRawProductId(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكمية المهدرة (Lost Qty)</label>
                                <input 
                                    type="number" step="0.01" required 
                                    value={lostQuantity} onChange={e => setLostQuantity(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سبب الهالك (Reason Code)</label>
                                <select 
                                    value={reason} onChange={e => setReason(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white font-bold"
                                >
                                    {REASON_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-md font-bold hover:bg-red-700" disabled={loading}>
                                    اعتماد وترحيل محاسبياً
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
