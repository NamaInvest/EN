'use client';
import { useState } from 'react';

const tabs = [['overview','📊 نظرة عامة'],['sfda','🏛️ تقارير SFDA'],['alerts','🔔 التنبيهات']];

export default function PharmacyManagerPage() {
    const [tab, setTab] = useState('overview');

    const sfda = [
        { type: 'تقرير الأدوية المنتهية الصلاحية', period: 'يومي', lastSent: '2026-04-29', status: 'ok' },
        { type: 'تقرير الأدوية المخدرة المصروفة', period: 'يومي', lastSent: '2026-04-29', status: 'ok' },
        { type: 'تقرير حركة المخزون الشهري', period: 'شهري', lastSent: '2026-04-01', status: 'pending' },
        { type: 'تقرير سحب الدواء (Drug Recall)', period: 'فوري', lastSent: '2026-04-15', status: 'ok' },
    ];

    const alerts = [
        { msg: 'أموكسيسيلين 500مج — ينتهي خلال 12 يوم (دفعة LOT-2024-08)', sev: 'high' },
        { msg: 'باراسيتامول 500مج — مخزون منخفض (18 قطعة)', sev: 'medium' },
        { msg: 'لا توجد سحوبات نشطة من SFDA', sev: 'ok' },
        { msg: 'ترامادول — صُرف 12 جرعة اليوم — ضمن الحد المسموح', sev: 'ok' },
    ];

    const kpis = [
        { label: 'وصفات اليوم', value: 47, icon: '📋' },
        { label: 'وصفات Wasfaty', value: 31, icon: '📱' },
        { label: 'مطالبات تأمين', value: 18, icon: '🏥' },
        { label: 'مبيعات اليوم', value: '3,240 ر.س', icon: '💰' },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">💊 لوحة مدير الصيدلية</h1>
                    <p className="text-gray-400 text-sm mt-1">امتثال SFDA + تقارير + تنبيهات</p>
                </div>
                <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">✅ متوافق مع SFDA</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {kpis.map(k => (
                    <div key={k.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-2xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-5">
                {tabs.map(([k,l]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === k ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                ))}
            </div>

            {tab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                        <h3 className="font-semibold mb-4">📈 صرف الوصفات اليوم</h3>
                        {[['وصفات Wasfaty',31,47,'bg-blue-500'],['وصفات ورقية',16,47,'bg-purple-500'],['أدوية OTC',24,47,'bg-emerald-500'],['أدوية مخدرة',3,47,'bg-red-500']].map(([l,v,m,c]) => (
                            <div key={l as string} className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">{l}</span>
                                    <span className="text-white font-bold">{v}</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full">
                                    <div className={`h-full rounded-full ${c}`} style={{ width: `${((v as number)/(m as number))*100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                        <h3 className="font-semibold mb-4">💰 مطالبات التأمين اليوم</h3>
                        {[['بوبا',7,1240],['التعاونية',5,890],['ميدغلف',4,720],['ملكية',2,390]].map(([c,n,a]) => (
                            <div key={c as string} className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-gray-300 text-sm">{c}</span>
                                <div className="flex gap-3 text-sm">
                                    <span className="text-blue-400">{n} مطالبة</span>
                                    <span className="text-emerald-400">{(a as number).toLocaleString()} ر.س</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'sfda' && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-800 text-gray-400 text-xs">
                            <th className="text-right p-3">نوع التقرير</th>
                            <th className="text-right p-3">الدورية</th>
                            <th className="text-right p-3">آخر إرسال</th>
                            <th className="text-right p-3">الحالة</th>
                            <th className="text-right p-3">إجراء</th>
                        </tr></thead>
                        <tbody>
                            {sfda.map((r,i) => (
                                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="p-3 font-medium">{r.type}</td>
                                    <td className="p-3 text-gray-400">{r.period}</td>
                                    <td className="p-3 text-gray-400">{r.lastSent}</td>
                                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${r.status==='ok'?'bg-emerald-500/20 text-emerald-400':'bg-amber-500/20 text-amber-400'}`}>{r.status==='ok'?'✅ مُرسَل':'⏳ معلق'}</span></td>
                                    <td className="p-3"><button className="text-xs text-blue-400 hover:text-blue-300">📤 إرسال الآن</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'alerts' && (
                <div className="space-y-3">
                    {alerts.map((a,i) => (
                        <div key={i} className={`flex gap-3 p-4 rounded-xl border ${a.sev==='high'?'bg-red-500/10 border-red-500/20':a.sev==='medium'?'bg-amber-500/10 border-amber-500/20':'bg-emerald-500/10 border-emerald-500/20'}`}>
                            <span className="text-xl">{a.sev==='high'?'🚨':a.sev==='medium'?'⚠️':'✅'}</span>
                            <p className="text-sm text-gray-300">{a.msg}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
