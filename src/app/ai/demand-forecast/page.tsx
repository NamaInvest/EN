'use client';
import { useState } from 'react';

export default function DemandForecastPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [mode, setMode] = useState<'single' | 'batch'>('batch');
    const [productId, setProductId] = useState('');

    const runBatch = async () => {
        setLoading(true);
        setResults(null);
        const res = await fetch('/api/ai/demand-forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const data = await res.json();
        setResults(data);
        setLoading(false);
    };

    const runSingle = async () => {
        if (!productId) return;
        setLoading(true);
        setResults(null);
        const res = await fetch(`/api/ai/demand-forecast?productId=${productId}&days=30`);
        const data = await res.json();
        setResults({ single: true, ...data });
        setLoading(false);
    };

    const urgencyConfig: Record<string, { label: string; color: string }> = {
        critical: { label: '🚨 حرج', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
        soon: { label: '⚠️ قريباً', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ok: { label: '✅ كافٍ', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    };

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🤖 توقع الطلب بالذكاء الاصطناعي</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">تنبؤ باحتياجات المخزون باستخدام Moving Average + Trend Detection</p>
                </div>
            </div>

            {/* Mode selector */}
            <div className="flex gap-3 mb-6 card">
                <div className="flex gap-2 mb-0">
                    {[['batch','📊 تنبؤ جماعي (أفضل 20 منتج)'],['single','🔍 تنبؤ منتج محدد']].map(([k,l]) => (
                        <button key={k} onClick={() => { setMode(k as any); setResults(null); }}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${mode===k?'btn-primary':'bg-gray-800 text-[var(--text-muted)] hover:text-[var(--text)]'}`}>{l}</button>
                    ))}
                </div>
                {mode === 'single' && (
                    <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="أدخل رقم المنتج..."
                        className="input text-sm w-48 focus:outline-none focus:border-blue-500" />
                )}
                <button onClick={mode === 'batch' ? runBatch : runSingle} disabled={loading}
                    className="px-5 py-2 btn-primary disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
                    {loading ? '⏳ جارٍ التحليل...' : '▶ تشغيل التنبؤ'}
                </button>
            </div>

            {/* Info box */}
            {!results && !loading && (
                <div className="card p-8 text-center">
                    <div className="text-5xl mb-4">ًں§ </div>
                    <p className="text-[var(--text-muted)]">اضغط "تشغيل التنبؤ" لتحليل بيانات المبيعات وتوقع الطلب</p>
                    <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm text-[var(--text-secondary)]">
                        {['📈 يحلل مبيعات 90 يوم الماضية','📊 يكتشف الاتجاه (صاعد/هابط/مستقر)','📦 يوصي بكمية الطلب المثلى'].map(t => (
                            <div key={t} className="card-glass p-3">{t}</div>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center py-20">
                    <div className="text-4xl mb-4 animate-pulse">ًں§ </div>
                    <p className="text-[var(--text-muted)]">يحلل النظام بيانات المبيعات...</p>
                </div>
            )}

            {/* Batch results */}
            {results && !results.single && (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                        {[
                            { label: 'منتجات محللة', value: results.total, icon: '📦', color: 'blue' },
                            { label: 'تنبيه حرج', value: results.critical, icon: '🚨', color: results.critical > 0 ? 'red' : 'emerald' },
                            { label: 'تحتاج طلباً قريباً', value: (results.forecasts || []).filter((f: any) => f.urgency === 'soon').length, icon: '⚠️', color: 'amber' },
                        ].map(k => (
                            <div key={k.label} className={`rounded-2xl border p-4 ${k.color==='blue'?'bg-blue-500/10 border-blue-500/20':k.color==='red'?'bg-red-500/10 border-red-500/20':k.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':'bg-amber-500/10 border-amber-500/20'}`}>
                                <div className="text-2xl mb-2">{k.icon}</div>
                                <div className="text-2xl font-bold text-[var(--text)]">{k.value}</div>
                                <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
                                <th className="text-right p-3">المنتج</th>
                                <th className="text-right p-3">المخزون الحالي</th>
                                <th className="text-right p-3">توقع 30 يوم</th>
                                <th className="text-right p-3">يكفي لـ</th>
                                <th className="text-right p-3">الحالة</th>
                            </tr></thead>
                            <tbody>
                                {(results.forecasts || []).map((f: any, i: number) => (
                                    <tr key={i} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-card-hover)]">
                                        <td className="p-3 font-medium">{f.productName || `منتج #${f.productId}`}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{f.currentStock}</td>
                                        <td className="p-3 text-blue-400">{f.forecastedDemand30Days}</td>
                                        <td className={`p-3 font-bold ${f.stockWillLastDays < 14 ? 'text-red-400' : f.stockWillLastDays < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {f.stockWillLastDays === 999 ? '∞' : `${f.stockWillLastDays} يوم`}
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${urgencyConfig[f.urgency]?.color}`}>{urgencyConfig[f.urgency]?.label}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Single result */}
            {results?.single && results.forecast && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'المخزون الحالي', value: results.product?.currentStock, icon: '📦' },
                            { label: 'توقع 30 يوم', value: results.forecast?.forecastedDemand, icon: '🎯' },
                            { label: 'يكفي لـ', value: `${results.forecast?.stockWillLastDays} يوم`, icon: '⏳' },
                            { label: 'الاتجاه', value: results.forecast?.trendLabel, icon: '📈' },
                        ].map(k => (
                            <div key={k.label} className="card p-4">
                                <div className="text-2xl mb-2">{k.icon}</div>
                                <div className="text-xl font-bold text-[var(--text)]">{k.value}</div>
                                <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                            </div>
                        ))}
                    </div>
                    {results.forecast?.recommendedOrder > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <p className="text-amber-400 font-medium">📋 كمية الطلب الموصى بها: <strong className="text-[var(--text)] text-lg">{results.forecast?.recommendedOrder} وحدة</strong></p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
