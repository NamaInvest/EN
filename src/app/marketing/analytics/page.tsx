'use client';
import { useState, useEffect } from 'react';

export default function MarketingAnalyticsPage() {
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    useEffect(() => { setTimeout(() => setLoading(false), 500); }, [period]);

    const campaigns = [
        { name: 'عرض رمضان 2026', type: 'خصم', spend: 12000, revenue: 87500, leads: 342, conv: 28, status: 'active' },
        { name: 'حملة العيد', type: 'كوبون', spend: 8500, revenue: 54200, leads: 218, conv: 31, status: 'active' },
        { name: 'اليوم الوطني 95', type: 'ترويج', spend: 15000, revenue: 63000, leads: 510, conv: 19, status: 'ended' },
        { name: 'إطلاق منتج جديد', type: 'B2B', spend: 5000, revenue: 41000, leads: 87, conv: 42, status: 'ended' },
    ];

    const channels = [
        { name: 'واتساب', visits: 4200, orders: 310, rate: 7.4, color: 'bg-emerald-500' },
        { name: 'انستغرام', visits: 8900, orders: 420, rate: 4.7, color: 'bg-pink-500' },
        { name: 'بحث جوجل', visits: 6100, orders: 280, rate: 4.6, color: 'bg-blue-500' },
        { name: 'تويتر X', visits: 2300, orders: 95, rate: 4.1, color: 'bg-gray-400' },
        { name: 'مباشر', visits: 3800, orders: 390, rate: 10.3, color: 'bg-amber-500' },
    ];

    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const overallROI = ((totalRevenue - totalSpend) / totalSpend * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📣 تحليلات التسويق</h1>
                    <p className="text-gray-400 text-sm mt-1">أداء الحملات + قنوات الاكتساب + ROI</p>
                </div>
                <div className="flex gap-2">
                    {[['month','الشهر'],['quarter','الربع'],['year','السنة']].map(([k,l]) => (
                        <button key={k} onClick={() => setPeriod(k)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${period===k?'bg-blue-500 text-white':'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                    ))}
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'إجمالي الإنفاق', value: `${totalSpend.toLocaleString()} ر.س`, icon: '💸', color: 'red' },
                    { label: 'الإيرادات المُولَّدة', value: `${totalRevenue.toLocaleString()} ر.س`, icon: '💰', color: 'emerald' },
                    { label: 'العائد على الإنفاق (ROAS)', value: `${(totalRevenue/totalSpend).toFixed(1)}x`, icon: '📈', color: 'blue' },
                    { label: 'ROI الإجمالي', value: `${overallROI}%`, icon: '🎯', color: 'purple' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color==='red'?'bg-red-500/10 border-red-500/20':
                        k.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':
                        k.color==='blue'?'bg-blue-500/10 border-blue-500/20':
                        'bg-purple-500/10 border-purple-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mb-4">
                {/* Campaigns Table */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800">
                        <h3 className="font-semibold">🎯 الحملات التسويقية</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-gray-800 text-gray-400 text-xs">
                                <th className="text-right p-3">الحملة</th>
                                <th className="text-right p-3">الإنفاق</th>
                                <th className="text-right p-3">الإيراد</th>
                                <th className="text-right p-3">ROI</th>
                                <th className="text-right p-3">الحالة</th>
                            </tr></thead>
                            <tbody>
                                {campaigns.map((c,i) => {
                                    const roi = ((c.revenue-c.spend)/c.spend*100).toFixed(0);
                                    return (
                                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                            <td className="p-3">
                                                <p className="font-medium text-white">{c.name}</p>
                                                <p className="text-xs text-gray-500">{c.type} • {c.conv}% تحويل</p>
                                            </td>
                                            <td className="p-3 text-red-400">{c.spend.toLocaleString()}</td>
                                            <td className="p-3 text-emerald-400">{c.revenue.toLocaleString()}</td>
                                            <td className={`p-3 font-bold ${parseInt(roi)>300?'text-emerald-400':parseInt(roi)>100?'text-blue-400':'text-amber-400'}`}>{roi}%</td>
                                            <td className="p-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status==='active'?'bg-emerald-500/20 text-emerald-400':'bg-gray-500/20 text-gray-400'}`}>
                                                    {c.status==='active'?'🟢 نشطة':'⚫ منتهية'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Channels */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                    <h3 className="font-semibold mb-4">📡 قنوات الاكتساب</h3>
                    <div className="space-y-4">
                        {channels.map(ch => (
                            <div key={ch.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-300">{ch.name}</span>
                                    <div className="flex gap-3 text-xs text-gray-400">
                                        <span>{ch.visits.toLocaleString()} زيارة</span>
                                        <span className="text-emerald-400">{ch.orders} طلب</span>
                                        <span className="text-blue-400 font-bold">{ch.rate}%</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full">
                                    <div className={`h-full rounded-full ${ch.color}`} style={{ width: `${(ch.visits/8900)*100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 font-medium text-sm mb-3">💡 توصيات الذكاء الاصطناعي</p>
                <div className="grid md:grid-cols-3 gap-3 text-xs text-gray-300">
                    <div className="bg-gray-900 rounded-lg p-3">🎯 حملة واتساب مباشر تحقق أعلى معدل تحويل (10.3%) — ضاعف الميزانية</div>
                    <div className="bg-gray-900 rounded-lg p-3">📉 تكلفة اليوم الوطني مرتفعة نسبياً — راجع استراتيجية B2C للعام القادم</div>
                    <div className="bg-gray-900 rounded-lg p-3">🏆 أفضل وقت للإطلاق: الثلاثاء-الخميس 6-9م بناءً على بيانات التحويل</div>
                </div>
            </div>
        </div>
    );
}
