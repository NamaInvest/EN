'use client';
import { useState } from 'react';

const MOCK_CHECKS = [
    { id: 1, product: 'قهوة سعودية 250جم', wo: 'WO-001', batch: 'B-2026-04-001', qty: 500, checked: 480, rejected: 8, status: 'passed', inspector: 'أحمد', date: '2026-04-29', criteria: [{ name: 'وزن العبوة', result: 'pass' }, { name: 'إغلاق التغليف', result: 'pass' }, { name: 'لون المنتج', result: 'pass' }, { name: 'الرائحة', result: 'pass' }] },
    { id: 2, product: 'قهوة مضبوطة 500جم', wo: 'WO-002', batch: 'B-2026-04-002', qty: 200, checked: 60, rejected: 12, status: 'in_progress', inspector: 'سارة', date: '2026-04-29', criteria: [{ name: 'وزن العبوة', result: 'pass' }, { name: 'إغلاق التغليف', result: 'fail' }, { name: 'لون المنتج', result: 'pass' }, { name: 'الرائحة', result: 'pending' }] },
    { id: 3, product: 'قهوة هيل 250جم', wo: 'WO-003', batch: 'B-2026-04-003', qty: 300, checked: 300, rejected: 45, status: 'failed', inspector: 'محمد', date: '2026-04-28', criteria: [{ name: 'وزن العبوة', result: 'fail' }, { name: 'إغلاق التغليف', result: 'fail' }, { name: 'لون المنتج', result: 'pass' }, { name: 'الرائحة', result: 'pass' }] },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    passed: { label: '✅ اجتاز', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    in_progress: { label: '⏳ جارٍ', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    failed: { label: '❌ فشل', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function ManufacturingQCPage() {
    const [selected, setSelected] = useState<number | null>(null);
    const selectedCheck = MOCK_CHECKS.find(c => c.id === selected);

    const totalProduced = MOCK_CHECKS.reduce((s, c) => s + c.checked, 0);
    const totalRejected = MOCK_CHECKS.reduce((s, c) => s + c.rejected, 0);
    const defectRate = ((totalRejected / totalProduced) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🔬 ضبط جودة التصنيع (QC)</h1>
                    <p className="text-gray-400 text-sm mt-1">فحص المنتج النهائي قبل الإرسال للمستودع</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium">+ سجل فحص جديد</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'وحدات مفحوصة', value: totalProduced, icon: '🔍', color: 'blue' },
                    { label: 'وحدات مرفوضة', value: totalRejected, icon: '❌', color: totalRejected > 20 ? 'red' : 'emerald' },
                    { label: 'معدل العيوب', value: `${defectRate}%`, icon: '📊', color: parseFloat(defectRate) > 5 ? 'red' : 'emerald' },
                    { label: 'دفعات اجتازت', value: MOCK_CHECKS.filter(c => c.status === 'passed').length, icon: '✅', color: 'emerald' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${k.color==='blue'?'bg-blue-500/10 border-blue-500/20':k.color==='red'?'bg-red-500/10 border-red-500/20':'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-2xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                    {MOCK_CHECKS.map(c => (
                        <button key={c.id} onClick={() => setSelected(c.id === selected ? null : c.id)}
                            className={`w-full text-right p-4 rounded-xl border transition-all ${selected===c.id?'border-blue-500 bg-blue-500/5':'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-500">{c.wo}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[c.status]?.color}`}>{STATUS_CONFIG[c.status]?.label}</span>
                                    </div>
                                    <h3 className="font-semibold text-white">{c.product}</h3>
                                    <p className="text-xs text-gray-500">{c.batch} • مفتش: {c.inspector} • {c.date}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-gray-400">مفحوص: <span className="text-white font-bold">{c.checked}/{c.qty}</span></p>
                                    <p className={`text-sm ${c.rejected > 10 ? 'text-red-400' : 'text-emerald-400'}`}>مرفوض: {c.rejected}</p>
                                </div>
                            </div>
                            <div className="mt-3 h-2 bg-gray-800 rounded-full">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.checked/c.qty)*100}%` }} />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 h-fit">
                    {selectedCheck ? (
                        <>
                            <h3 className="font-semibold mb-4">📋 نتائج الفحص التفصيلية</h3>
                            <div className="space-y-3">
                                {selectedCheck.criteria.map((cr, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                                        <span className="text-sm text-gray-300">{cr.name}</span>
                                        <span className={`text-sm font-bold ${cr.result==='pass'?'text-emerald-400':cr.result==='fail'?'text-red-400':'text-gray-400'}`}>
                                            {cr.result==='pass'?'✅ نجح':cr.result==='fail'?'❌ فشل':'⏳ معلق'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {selectedCheck.status === 'failed' && (
                                <button className="w-full mt-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/30 transition-colors">
                                    🔄 إعادة العمل (Rework)
                                </button>
                            )}
                            {selectedCheck.status === 'in_progress' && (
                                <button className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm transition-colors">
                                    ✅ إنهاء الفحص
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <div className="text-4xl mb-3">🔬</div>
                            <p className="text-sm">اختر دفعة لعرض تفاصيل الفحص</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
