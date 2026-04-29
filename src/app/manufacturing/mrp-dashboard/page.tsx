'use client';
import { useState, useEffect } from 'react';

export default function MRPDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plan');

    useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

    const plan = [
        { material: 'قهوة عربية خام', required: 500, available: 120, shortage: 380, unit: 'كجم', po: 'مطلوب', supplier: 'شركة البن العربي' },
        { material: 'عبوات بلاستيك 250جم', required: 2000, available: 800, shortage: 1200, unit: 'قطعة', po: 'مطلوب', supplier: 'مصنع التعبئة' },
        { material: 'هيل مطحون', required: 80, available: 95, shortage: 0, unit: 'كجم', po: 'كافٍ', supplier: '' },
        { material: 'أكياس كرافت', required: 5000, available: 1200, shortage: 3800, unit: 'قطعة', po: 'مطلوب', supplier: 'مورد التغليف' },
        { material: 'شرائط الحرارة', required: 1000, available: 1000, shortage: 0, unit: 'م', po: 'كافٍ', supplier: '' },
    ];

    const orders = [
        { id: 'WO-001', product: 'قهوة سعودية 250جم', qty: 500, status: 'running', progress: 65, due: '2026-04-30' },
        { id: 'WO-002', product: 'قهوة مضبوطة 500جم', qty: 200, status: 'pending', progress: 0, due: '2026-05-02' },
        { id: 'WO-003', product: 'قهوة هيل خاصة', qty: 150, status: 'done', progress: 100, due: '2026-04-28' },
    ];

    const statusConfig: Record<string, { label: string; color: string }> = {
        running: { label: '⚙️ تشغيل', color: 'text-blue-400 bg-blue-500/10' },
        pending: { label: '⏳ معلق', color: 'text-amber-400 bg-amber-500/10' },
        done: { label: '✅ منتهي', color: 'text-emerald-400 bg-emerald-500/10' },
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">⚙️ لوحة تحكم التخطيط (MRP)</h1>
                    <p className="text-gray-400 text-sm mt-1">تخطيط متطلبات الموارد وأوامر الإنتاج</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-sm">
                    ▶ تشغيل MRP
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'أوامر إنتاج نشطة', value: 2, icon: '🏭', color: 'blue' },
                    { label: 'خامات ناقصة', value: 3, icon: '⚠️', color: 'red' },
                    { label: 'طلبات شراء مقترحة', value: 3, icon: '📋', color: 'amber' },
                    { label: 'كفاءة الإنتاج', value: '87%', icon: '📊', color: 'emerald' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                        k.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                        k.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
                        'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-2xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {[['plan','📋 متطلبات المواد'],['orders','🏭 أوامر الإنتاج']].map(([k,l]) => (
                    <button key={k} onClick={() => setActiveTab(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === k ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                ))}
            </div>

            {loading ? <div className="text-center py-20 text-gray-500">جارٍ احتساب MRP...</div> : (
                activeTab === 'plan' ? (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-400 text-xs">
                                        <th className="text-right p-3">المادة الخام</th>
                                        <th className="text-right p-3">المطلوب</th>
                                        <th className="text-right p-3">المتوفر</th>
                                        <th className="text-right p-3">النقص</th>
                                        <th className="text-right p-3">الحالة</th>
                                        <th className="text-right p-3">المورد المقترح</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                            <td className="p-3 font-medium">{row.material}</td>
                                            <td className="p-3 text-gray-300">{row.required} {row.unit}</td>
                                            <td className="p-3 text-gray-300">{row.available} {row.unit}</td>
                                            <td className={`p-3 font-bold ${row.shortage > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {row.shortage > 0 ? `${row.shortage} ${row.unit}` : '—'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-xs px-2 py-1 rounded-full ${row.po === 'مطلوب' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {row.po === 'مطلوب' ? '🔴 طلب شراء' : '✅ كافٍ'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-400 text-xs">{row.supplier || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-800">
                            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors">
                                📤 إنشاء طلبات الشراء تلقائياً (3 طلبات)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(o => (
                            <div key={o.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-xs text-gray-500 font-mono">{o.id}</span>
                                        <h3 className="font-semibold text-white">{o.product}</h3>
                                        <p className="text-sm text-gray-400">الكمية: {o.qty} وحدة • موعد التسليم: {o.due}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-full ${statusConfig[o.status]?.color}`}>
                                        {statusConfig[o.status]?.label}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full">
                                    <div className={`h-full rounded-full transition-all ${o.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                        style={{ width: `${o.progress}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{o.progress}% مكتمل</p>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
