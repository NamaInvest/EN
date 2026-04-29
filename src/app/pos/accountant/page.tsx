'use client';
import { useState } from 'react';

// محاسب نقطة البيع — مراجعة الفروقات اليومية ومطابقة الخزينة
const MOCK_SESSIONS = [
    { id: 1, cashier: 'أحمد العمري', register: 'كاشير 1', date: '2026-04-29', openCash: 500, closeCash: 2540, expectedCash: 2580, totalSales: 3420, totalCard: 1320, invoices: 18, diff: -40, status: 'pending' },
    { id: 2, cashier: 'سارة المطيري', register: 'كاشير 2', date: '2026-04-29', openCash: 500, closeCash: 1480, expectedCash: 1480, totalSales: 2180, totalCard: 1200, invoices: 12, diff: 0, status: 'approved' },
    { id: 3, cashier: 'خالد الزهراني', register: 'كاشير 3', date: '2026-04-28', openCash: 500, closeCash: 2270, expectedCash: 2250, totalSales: 1750, totalCard: 0, invoices: 9, diff: +20, status: 'approved' },
    { id: 4, cashier: 'نورة الشمري', register: 'كاشير 4', date: '2026-04-28', openCash: 500, closeCash: 850, expectedCash: 900, totalSales: 890, totalCard: 490, invoices: 5, diff: -50, status: 'flagged' },
];

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    pending: { label: '⏳ بانتظار المراجعة', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    approved: { label: '✅ معتمد', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    flagged: { label: '🚨 فروق مشبوهة', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function POSAccountantPage() {
    const [selected, setSelected] = useState<number | null>(null);
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? MOCK_SESSIONS : MOCK_SESSIONS.filter(s => s.status === filter);
    const selectedSession = MOCK_SESSIONS.find(s => s.id === selected);

    const totalDiff = MOCK_SESSIONS.reduce((s, m) => s + m.diff, 0);
    const flagged = MOCK_SESSIONS.filter(m => m.status === 'flagged').length;
    const pending = MOCK_SESSIONS.filter(m => m.status === 'pending').length;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🧾 محاسب نقطة البيع</h1>
                    <p className="text-gray-400 text-sm mt-1">مراجعة الفروقات اليومية ومطابقة خزائن الكاشير</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium">📤 تصدير تقرير</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'بانتظار المراجعة', value: pending, icon: '⏳', color: 'amber' },
                    { label: 'فروق مشبوهة', value: flagged, icon: '🚨', color: flagged > 0 ? 'red' : 'emerald' },
                    { label: 'صافي الفروقات اليوم', value: `${totalDiff > 0 ? '+' : ''}${totalDiff} ر.س`, icon: '⚖️', color: totalDiff === 0 ? 'emerald' : 'red' },
                    { label: 'مناوبات مطابقة', value: MOCK_SESSIONS.filter(m => m.diff === 0).length, icon: '✅', color: 'emerald' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
                        k.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                        'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-5">
                {[['all','الكل'],['pending','معلق'],['flagged','مشبوه'],['approved','معتمد']].map(([k,l]) => (
                    <button key={k} onClick={() => setFilter(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'bg-blue-500 text-white':'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                    {filtered.map(session => (
                        <button key={session.id} onClick={() => setSelected(session.id === selected ? null : session.id)}
                            className={`w-full text-right p-4 rounded-xl border transition-all ${selected === session.id ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CFG[session.status]?.color}`}>{STATUS_CFG[session.status]?.label}</span>
                                    </div>
                                    <h3 className="font-semibold text-white">{session.cashier}</h3>
                                    <p className="text-xs text-gray-500">{session.register} • {session.date}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-lg font-bold text-white">{session.totalSales.toLocaleString()} ر.س</p>
                                    <p className={`text-sm font-bold ${session.diff === 0 ? 'text-emerald-400' : session.diff > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {session.diff === 0 ? '✅ مطابق' : `${session.diff > 0 ? '+' : ''}${session.diff} ر.س`}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mt-2">
                                <span>فواتير: {session.invoices}</span>
                                <span>نقد: {session.closeCash.toLocaleString()}</span>
                                <span>شبكة: {session.totalCard.toLocaleString()}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 h-fit">
                    {selectedSession ? (
                        <>
                            <h3 className="font-semibold mb-4">🔍 تفاصيل المطابقة</h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { label: 'رصيد فتح الخزينة', value: `${selectedSession.openCash} ر.س`, color: 'text-gray-300' },
                                    { label: 'المبيعات الكلية', value: `${selectedSession.totalSales.toLocaleString()} ر.س`, color: 'text-white' },
                                    { label: 'منها دفع شبكة', value: `${selectedSession.totalCard.toLocaleString()} ر.س`, color: 'text-blue-400' },
                                    { label: 'النقد المتوقع', value: `${selectedSession.expectedCash.toLocaleString()} ر.س`, color: 'text-emerald-400' },
                                    { label: 'النقد الفعلي', value: `${selectedSession.closeCash.toLocaleString()} ر.س`, color: 'text-white font-bold' },
                                    { label: 'الفرق', value: `${selectedSession.diff >= 0 ? '+' : ''}${selectedSession.diff} ر.س`, color: selectedSession.diff === 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold' },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between py-2 border-b border-gray-800/50">
                                        <span className="text-gray-400">{r.label}</span>
                                        <span className={r.color}>{r.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2">
                                {selectedSession.status === 'pending' && (
                                    <>
                                        <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm transition-colors">✅ اعتماد وإغلاق</button>
                                        {selectedSession.diff !== 0 && (
                                            <button className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors">🚨 إحالة للتحقيق</button>
                                        )}
                                    </>
                                )}
                                <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">🖨️ طباعة تقرير المناوبة</button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <div className="text-4xl mb-3">🧾</div>
                            <p className="text-sm">اختر مناوبة للمراجعة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
