'use client';
import { useState } from 'react';

// محلل أداء المبيعات — Sales BI & Analytics
export default function SalesAnalyticsPage() {
    const [period, setPeriod] = useState('month');
    const [view, setView] = useState('overview');

    const teams = [
        { name: 'فريق الشمال', target: 80000, actual: 71200, reps: 4, topRep: 'أحمد العمري', growth: 8 },
        { name: 'فريق الجنوب', target: 60000, actual: 63400, reps: 3, topRep: 'سارة المطيري', growth: 22 },
        { name: 'فريق B2B', target: 120000, actual: 88000, reps: 5, topRep: 'خالد الزهراني', growth: -8 },
        { name: 'فريق الرياض', target: 90000, actual: 95000, reps: 4, topRep: 'نورة الشمري', growth: 15 },
    ];

    const reps = [
        { name: 'أحمد العمري', team: 'الشمال', sales: 28400, target: 25000, invoices: 47, avgTicket: 604, trend: 'up', conv: 34 },
        { name: 'سارة المطيري', team: 'الجنوب', sales: 31200, target: 28000, invoices: 62, avgTicket: 503, trend: 'up', conv: 41 },
        { name: 'خالد الزهراني', team: 'B2B', sales: 19800, target: 30000, invoices: 18, avgTicket: 1100, trend: 'down', conv: 22 },
        { name: 'نورة الشمري', team: 'الرياض', sales: 33600, target: 28000, invoices: 55, avgTicket: 611, trend: 'up', conv: 38 },
        { name: 'محمد الغامدي', team: 'B2B', sales: 15200, target: 25000, invoices: 14, avgTicket: 1086, trend: 'down', conv: 18 },
    ].sort((a, b) => b.sales - a.sales);

    const products = [
        { name: 'قهوة سعودية 250جم', units: 840, revenue: 42000, margin: 38 },
        { name: 'قهوة مضبوطة 500جم', units: 520, revenue: 52000, margin: 42 },
        { name: 'هيل مطحون 200جم', units: 1200, revenue: 24000, margin: 55 },
        { name: 'قهوة هيل خاصة 250جم', units: 380, revenue: 28500, margin: 48 },
    ];

    const totalActual = teams.reduce((s, t) => s + t.actual, 0);
    const totalTarget = teams.reduce((s, t) => s + t.target, 0);
    const attainment = Math.round((totalActual / totalTarget) * 100);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📈 تحليلات أداء المبيعات (BI)</h1>
                    <p className="text-gray-400 text-sm mt-1">مؤشرات المبيعات + الفرق + المندوبون + المنتجات</p>
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
                    { label: 'إجمالي المبيعات', value: `${totalActual.toLocaleString()} ر.س`, icon: '💰', color: 'emerald' },
                    { label: 'الهدف الكلي', value: `${totalTarget.toLocaleString()} ر.س`, icon: '🎯', color: 'blue' },
                    { label: 'نسبة الإنجاز', value: `${attainment}%`, icon: '📊', color: attainment >= 100 ? 'emerald' : attainment >= 80 ? 'amber' : 'red' },
                    { label: 'أفضل فريق', value: 'فريق الرياض', icon: '🏆', color: 'purple' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${k.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':k.color==='blue'?'bg-blue-500/10 border-blue-500/20':k.color==='amber'?'bg-amber-500/10 border-amber-500/20':k.color==='red'?'bg-red-500/10 border-red-500/20':'bg-purple-500/10 border-purple-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {[['overview','📊 الفرق'],['reps','👤 المندوبون'],['products','📦 المنتجات']].map(([k,l]) => (
                    <button key={k} onClick={() => setView(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${view===k?'bg-blue-500 text-white':'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                ))}
            </div>

            {view === 'overview' && (
                <div className="space-y-3">
                    {teams.map(t => {
                        const pct = Math.min(Math.round((t.actual / t.target) * 100), 100);
                        const overTarget = t.actual > t.target;
                        return (
                            <div key={t.name} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-white">{t.name}</h3>
                                        <p className="text-xs text-gray-500">أفضل مندوب: {t.topRep} • {t.reps} مندوبين</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-white">{t.actual.toLocaleString()} ر.س</p>
                                        <p className={`text-xs font-bold ${t.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.growth >= 0 ? '↑' : '↓'} {Math.abs(t.growth)}%</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>الهدف: {t.target.toLocaleString()}</span>
                                    <span className={`font-bold ${overTarget ? 'text-emerald-400' : pct >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full">
                                    <div className={`h-full rounded-full ${overTarget ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {view === 'reps' && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-800 text-gray-400 text-xs">
                            <th className="text-right p-3">الترتيب</th><th className="text-right p-3">المندوب</th>
                            <th className="text-right p-3">المبيعات</th><th className="text-right p-3">الإنجاز</th>
                            <th className="text-right p-3">الفواتير</th><th className="text-right p-3">متوسط الفاتورة</th>
                            <th className="text-right p-3">الاتجاه</th>
                        </tr></thead>
                        <tbody>
                            {reps.map((r, i) => (
                                <tr key={r.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="p-3 font-bold text-center">
                                        <span className={i===0?'text-amber-400':i===1?'text-gray-300':i===2?'text-amber-700':'text-gray-500'}>{i+1}</span>
                                    </td>
                                    <td className="p-3"><p className="font-medium">{r.name}</p><p className="text-xs text-gray-500">{r.team}</p></td>
                                    <td className="p-3 text-emerald-400 font-bold">{r.sales.toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`text-xs font-bold ${r.sales >= r.target ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {Math.round((r.sales/r.target)*100)}%
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-300">{r.invoices}</td>
                                    <td className="p-3 text-gray-300">{r.avgTicket.toLocaleString()}</td>
                                    <td className="p-3 text-xl">{r.trend === 'up' ? '📈' : '📉'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'products' && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-800 text-gray-400 text-xs">
                            <th className="text-right p-3">المنتج</th><th className="text-right p-3">الوحدات</th>
                            <th className="text-right p-3">الإيراد</th><th className="text-right p-3">هامش الربح</th>
                        </tr></thead>
                        <tbody>
                            {products.map((p, i) => (
                                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="p-3 font-medium">{p.name}</td>
                                    <td className="p-3 text-gray-300">{p.units.toLocaleString()}</td>
                                    <td className="p-3 text-emerald-400 font-bold">{p.revenue.toLocaleString()} ر.س</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 bg-gray-800 rounded-full w-16">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.margin}%` }} />
                                            </div>
                                            <span className="text-blue-400 text-xs font-bold">{p.margin}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
