'use client';
import { useState, useEffect } from 'react';

export default function CFODashboard() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, [period]);

    const kpis = [
        { label: 'الإيرادات', value: 850000, icon: '📈', color: 'emerald', trend: '+12%' },
        { label: 'المصروفات', value: 785000, icon: '📉', color: 'red', trend: '+5%' },
        { label: 'صافي الربح', value: 65000, icon: '💰', color: 'blue', trend: '+18%' },
        { label: 'الذمم المدينة', value: 142000, icon: '⏳', color: 'amber', trend: '-3%' },
        { label: 'الذمم الدائنة', value: 88000, icon: '🏦', color: 'purple', trend: '+1%' },
        { label: 'النقد المتاح', value: 320000, icon: '💵', color: 'cyan', trend: '+8%' },
    ];

    const colorMap: Record<string, string> = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    };

    const plRows = [
        { label: 'المبيعات الإجمالية', val: 850000, indent: 0 },
        { label: 'تكلفة المبيعات', val: -510000, indent: 0 },
        { label: 'مجمل الربح', val: 340000, indent: 0, bold: true },
        { label: 'مصاريف التشغيل', val: -180000, indent: 1 },
        { label: 'مصاريف الرواتب', val: -95000, indent: 1 },
        { label: 'صافي الربح', val: 65000, indent: 0, bold: true, highlight: true },
    ];

    const ratios = [
        { label: 'هامش الربح الإجمالي', value: '40%', target: '45%', pct: 89 },
        { label: 'هامش صافي الربح', value: '7.6%', target: '10%', pct: 76 },
        { label: 'نسبة السيولة الجارية', value: '2.1', target: '2.0', pct: 100 },
        { label: 'دوران المخزون', value: '8.2x', target: '10x', pct: 82 },
        { label: 'معدل تحصيل الذمم', value: '32 يوم', target: '30 يوم', pct: 94 },
    ];

    const alerts = [
        { icon: '⚠️', msg: 'ذمم متأخرة أكثر من 90 يوم: 3 عملاء', color: 'red' },
        { icon: '📊', msg: 'ميزانية التسويق تجاوزت 85% هذا الشهر', color: 'amber' },
        { icon: '✅', msg: 'تدفق نقدي إيجابي للشهر الثالث على التوالي', color: 'emerald' },
        { icon: '🔔', msg: 'موعد دفع GOSI خلال 5 أيام', color: 'blue' },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📊 لوحة تحكم المدير المالي (CFO)</h1>
                    <p className="text-gray-400 text-sm mt-1">نظرة شاملة على الأداء المالي للمنشأة</p>
                </div>
                <div className="flex gap-2">
                    {[['month','هذا الشهر'],['quarter','الربع'],['year','السنة']].map(([k,l]) => (
                        <button key={k} onClick={() => setPeriod(k)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${period === k ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'}`}>{l}</button>
                    ))}
                </div>
            </div>

            {loading ? <div className="text-center py-20 text-gray-500">جارٍ التحميل...</div> : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                        {kpis.map(k => (
                            <div key={k.label} className={`rounded-2xl border p-4 ${colorMap[k.color]}`}>
                                <div className="text-2xl mb-2">{k.icon}</div>
                                <div className="text-xl font-bold">{k.value.toLocaleString()}</div>
                                <div className="text-xs opacity-70 mt-1">{k.label}</div>
                                <div className={`text-xs mt-1 font-medium ${k.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{k.trend}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                            <h3 className="font-semibold mb-4">📋 قائمة الدخل (P&L)</h3>
                            <div className="space-y-2">
                                {plRows.map(row => (
                                    <div key={row.label} className={`flex justify-between py-2 ${row.highlight ? 'border-t border-gray-700' : ''}`}
                                        style={{ paddingRight: row.indent * 12 }}>
                                        <span className={`text-sm ${row.bold ? 'font-bold text-white' : 'text-gray-400'}`}>{row.label}</span>
                                        <span className={`text-sm font-mono ${row.bold ? 'font-bold' : ''} ${row.val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {row.val.toLocaleString()} ر.س
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                            <h3 className="font-semibold mb-4">📐 المؤشرات المالية</h3>
                            <div className="space-y-4">
                                {ratios.map(r => (
                                    <div key={r.label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">{r.label}</span>
                                            <span className="font-bold text-white">{r.value}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full">
                                            <div className={`h-full rounded-full ${r.pct >= 95 ? 'bg-emerald-500' : r.pct >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                style={{ width: `${Math.min(r.pct, 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                        <h3 className="font-semibold mb-4">🚨 تنبيهات مالية</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                            {alerts.map((a, i) => (
                                <div key={i} className={`flex gap-3 p-3 rounded-xl border ${
                                    a.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                                    a.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
                                    a.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                    'bg-blue-500/10 border-blue-500/20'}`}>
                                    <span className="text-lg">{a.icon}</span>
                                    <p className="text-sm text-gray-300">{a.msg}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
