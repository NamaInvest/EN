'use client';
import { useState } from 'react';

const KAM_ACCOUNTS = [
    { id: 1, name: 'مجموعة الأندلس التجارية', sector: 'تجزئة', revenue: 485000, growth: 18, health: 92, contacts: 3, lastContact: '2026-04-28', status: 'healthy', tier: 'Platinum', contractEnd: '2026-12-31' },
    { id: 2, name: 'شركة نجد للتوزيع', sector: 'توزيع', revenue: 312000, growth: -5, health: 61, contacts: 2, lastContact: '2026-04-15', status: 'at_risk', tier: 'Gold', contractEnd: '2026-06-30' },
    { id: 3, name: 'مؤسسة الفارس', sector: 'تجزئة', revenue: 225000, growth: 32, health: 88, contacts: 4, lastContact: '2026-04-27', status: 'healthy', tier: 'Gold', contractEnd: '2027-01-15' },
    { id: 4, name: 'شركة اليمامة الصناعية', sector: 'صناعة', revenue: 580000, growth: 8, health: 95, contacts: 5, lastContact: '2026-04-29', status: 'champion', tier: 'Platinum', contractEnd: '2027-03-31' },
    { id: 5, name: 'مجموعة رشيد الدولية', sector: 'استيراد', revenue: 148000, growth: -12, health: 45, contacts: 1, lastContact: '2026-04-01', status: 'churning', tier: 'Silver', contractEnd: '2026-05-15' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    champion: { label: '🏆 بطل', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    healthy: { label: '✅ صحي', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    at_risk: { label: '⚠️ خطر', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    churning: { label: '🚨 مهدد', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const TIER_COLOR: Record<string, string> = {
    Platinum: 'text-cyan-400',
    Gold: 'text-amber-400',
    Silver: 'text-gray-300',
};

export default function KAMPage() {
    const [selected, setSelected] = useState<number | null>(null);
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? KAM_ACCOUNTS : KAM_ACCOUNTS.filter(a => a.status === filter);
    const totalRevenue = KAM_ACCOUNTS.reduce((s, a) => s + a.revenue, 0);
    const atRisk = KAM_ACCOUNTS.filter(a => a.status === 'at_risk' || a.status === 'churning');
    const selectedAcc = KAM_ACCOUNTS.find(a => a.id === selected);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🤝 إدارة الحسابات الكبرى (KAM)</h1>
                    <p className="text-gray-400 text-sm mt-1">متابعة العملاء الاستراتيجيين ومعدلات النمو</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-sm">+ حساب جديد</button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'إجمالي الإيرادات', value: `${(totalRevenue/1000).toFixed(0)}K ر.س`, icon: '💰', color: 'emerald' },
                    { label: 'حسابات في خطر', value: atRisk.length, icon: '⚠️', color: atRisk.length > 0 ? 'red' : 'emerald' },
                    { label: 'عقود تنتهي قريباً', value: KAM_ACCOUNTS.filter(a => (new Date(a.contractEnd).getTime()-Date.now())/86400000 < 60).length, icon: '📅', color: 'amber' },
                    { label: 'متوسط صحة العلاقة', value: `${Math.round(KAM_ACCOUNTS.reduce((s,a)=>s+a.health,0)/KAM_ACCOUNTS.length)}%`, icon: '❤️', color: 'blue' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':
                        k.color==='red'?'bg-red-500/10 border-red-500/20':
                        k.color==='amber'?'bg-amber-500/10 border-amber-500/20':
                        'bg-blue-500/10 border-blue-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-5">
                {[['all','الكل'],['champion','بطل'],['healthy','صحي'],['at_risk','خطر'],['churning','مهدد']].map(([k,l]) => (
                    <button key={k} onClick={() => setFilter(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'bg-blue-500 text-white':'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* Account list */}
                <div className="lg:col-span-2 space-y-3">
                    {filtered.map(acc => {
                        const daysToContract = Math.ceil((new Date(acc.contractEnd).getTime()-Date.now())/86400000);
                        return (
                            <button key={acc.id} onClick={() => setSelected(acc.id===selected?null:acc.id)}
                                className={`w-full text-right p-4 rounded-xl border transition-all ${selected===acc.id?'border-blue-500 bg-blue-500/5':'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold ${TIER_COLOR[acc.tier]}`}>{acc.tier}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[acc.status]?.color}`}>{STATUS_CONFIG[acc.status]?.label}</span>
                                        </div>
                                        <h3 className="font-semibold text-white">{acc.name}</h3>
                                        <p className="text-xs text-gray-500">{acc.sector} • آخر تواصل: {acc.lastContact}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-white">{acc.revenue.toLocaleString()}</p>
                                        <p className={`text-xs ${acc.growth>=0?'text-emerald-400':'text-red-400'}`}>{acc.growth>=0?'↑':'↓'} {Math.abs(acc.growth)}%</p>
                                    </div>
                                </div>
                                {/* Health bar */}
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>صحة العلاقة</span>
                                        <span className={`font-bold ${acc.health>=80?'text-emerald-400':acc.health>=60?'text-amber-400':'text-red-400'}`}>{acc.health}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full">
                                        <div className={`h-full rounded-full ${acc.health>=80?'bg-emerald-500':acc.health>=60?'bg-amber-500':'bg-red-500'}`} style={{ width: `${acc.health}%` }} />
                                    </div>
                                </div>
                                {daysToContract <= 60 && (
                                    <p className="text-xs text-amber-400 mt-2">⏰ العقد ينتهي خلال {daysToContract} يوم ({acc.contractEnd})</p>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Account detail */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 h-fit">
                    {selectedAcc ? (
                        <>
                            <h3 className="font-semibold mb-1">{selectedAcc.name}</h3>
                            <p className="text-xs text-gray-500 mb-4">{selectedAcc.sector}</p>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">التصنيف</span><span className={`font-bold ${TIER_COLOR[selectedAcc.tier]}`}>{selectedAcc.tier}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">الإيرادات</span><span className="text-white font-bold">{selectedAcc.revenue.toLocaleString()} ر.س</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">النمو</span><span className={selectedAcc.growth>=0?'text-emerald-400':'text-red-400'}>{selectedAcc.growth}%</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">جهات التواصل</span><span className="text-white">{selectedAcc.contacts}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">نهاية العقد</span><span className="text-white">{selectedAcc.contractEnd}</span></div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors">📞 جدولة اجتماع</button>
                                <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">📋 عرض سجل التواصل</button>
                                {(selectedAcc.status==='at_risk'||selectedAcc.status==='churning') && (
                                    <button className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">🚨 خطة إنقاذ العميل</button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <div className="text-4xl mb-3">🤝</div>
                            <p className="text-sm">اختر حساباً لعرض التفاصيل</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
