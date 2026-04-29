'use client';
import { useState } from 'react';

const NPS_DATA = [
    { customer: 'أحمد السالم', score: 9, comment: 'خدمة ممتازة والتوصيل كان سريع جداً', date: '2026-04-29', segment: 'Promoter' },
    { customer: 'سارة المطيري', score: 7, comment: 'الخدمة جيدة لكن التطبيق يحتاج تحسين', date: '2026-04-28', segment: 'Passive' },
    { customer: 'خالد العتيبي', score: 3, comment: 'تأخر الشحن كثيراً وخدمة العملاء لم تتجاوب', date: '2026-04-28', segment: 'Detractor' },
    { customer: 'نورة الزهراني', score: 10, comment: 'أفضل تجربة شراء — سأنصح جميع أصدقائي', date: '2026-04-27', segment: 'Promoter' },
    { customer: 'محمد الغامدي', score: 6, comment: 'المنتج جيد لكن السعر مرتفع نسبياً', date: '2026-04-27', segment: 'Passive' },
    { customer: 'فاطمة القحطاني', score: 2, comment: 'المنتج وصل تالفاً ولم يُستبدل', date: '2026-04-26', segment: 'Detractor' },
    { customer: 'عبدالله البشر', score: 9, comment: 'جودة عالية وتغليف احترافي', date: '2026-04-26', segment: 'Promoter' },
    { customer: 'ريم الشمري', score: 8, comment: 'راضية جداً — سأشتري مرة أخرى', date: '2026-04-25', segment: 'Promoter' },
];

const SEG_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
    Promoter: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '😍' },
    Passive: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: '😐' },
    Detractor: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '😠' },
};

export default function CXPage() {
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);

    const promoters = NPS_DATA.filter(r => r.segment === 'Promoter').length;
    const detractors = NPS_DATA.filter(r => r.segment === 'Detractor').length;
    const nps = Math.round(((promoters - detractors) / NPS_DATA.length) * 100);
    const avgScore = (NPS_DATA.reduce((s, r) => s + r.score, 0) / NPS_DATA.length).toFixed(1);

    const filtered = filter === 'all' ? NPS_DATA : NPS_DATA.filter(r => r.segment === filter);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">⭐ تجربة العميل (CX / NPS)</h1>
                    <p className="text-gray-400 text-sm mt-1">قياس رضا العملاء وصافي نقاط الترويج</p>
                </div>
                <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-sm">
                    + إرسال استبيان
                </button>
            </div>

            {/* NPS Score */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`rounded-2xl border p-5 text-center col-span-2 md:col-span-1 ${nps >= 50 ? 'bg-emerald-500/10 border-emerald-500/20' : nps >= 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className="text-gray-400 text-xs mb-1">NPS Score</p>
                    <p className={`text-5xl font-black ${nps >= 50 ? 'text-emerald-400' : nps >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{nps}</p>
                    <p className="text-xs text-gray-500 mt-2">{nps >= 50 ? '🏆 ممتاز' : nps >= 0 ? '✅ جيد' : '⚠️ يحتاج تحسين'}</p>
                </div>
                {[
                    { label: 'متوسط التقييم', value: `${avgScore}/10`, icon: '⭐', color: 'blue' },
                    { label: 'مروّجون', value: promoters, icon: '😍', color: 'emerald' },
                    { label: 'منتقدون', value: detractors, icon: '😠', color: 'red' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${k.color==='blue'?'bg-blue-500/10 border-blue-500/20':k.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':'bg-red-500/10 border-red-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-2xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Breakdown bar */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-5">
                <p className="text-sm text-gray-400 mb-3">توزيع التقييمات</p>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${(promoters/NPS_DATA.length)*100}%` }} title={`مروّجون ${promoters}`}></div>
                    <div className="bg-amber-500 transition-all" style={{ width: `${((NPS_DATA.length-promoters-detractors)/NPS_DATA.length)*100}%` }} title="محايدون"></div>
                    <div className="bg-red-500 transition-all" style={{ width: `${(detractors/NPS_DATA.length)*100}%` }} title={`منتقدون ${detractors}`}></div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span><span className="text-emerald-400">■</span> مروّجون {Math.round((promoters/NPS_DATA.length)*100)}%</span>
                    <span><span className="text-amber-400">■</span> محايدون {Math.round(((NPS_DATA.length-promoters-detractors)/NPS_DATA.length)*100)}%</span>
                    <span><span className="text-red-400">■</span> منتقدون {Math.round((detractors/NPS_DATA.length)*100)}%</span>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
                {[['all','الكل'],['Promoter','مروّجون 😍'],['Passive','محايدون 😐'],['Detractor','منتقدون 😠']].map(([k,l]) => (
                    <button key={k} onClick={() => setFilter(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'bg-blue-500 text-white':'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                ))}
            </div>

            {/* Reviews */}
            <div className="space-y-3">
                {filtered.map((r, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${SEG_CONFIG[r.segment]?.bg}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{SEG_CONFIG[r.segment]?.icon}</span>
                                <div>
                                    <p className="font-medium text-white">{r.customer}</p>
                                    <p className="text-xs text-gray-500">{r.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {Array.from({length:10},(_,i)=>(
                                        <div key={i} className={`w-3 h-5 rounded-sm ${i<r.score?'bg-blue-500':'bg-gray-700'}`}></div>
                                    ))}
                                </div>
                                <span className={`text-lg font-bold ${SEG_CONFIG[r.segment]?.color}`}>{r.score}</span>
                            </div>
                        </div>
                        {r.comment && <p className="text-sm text-gray-300 mt-2 mr-9">{r.comment}</p>}
                        {r.segment === 'Detractor' && (
                            <div className="mt-3 mr-9">
                                <button className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                                    📞 تواصل مع العميل
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
