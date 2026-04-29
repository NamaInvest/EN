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
        critical: { label: 'ًںڑ¨ ط­ط±ط¬', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
        soon: { label: 'âڑ ï¸ڈ ظ‚ط±ظٹط¨ط§ظ‹', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ok: { label: 'âœ… ظƒط§ظپظچ', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    };

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ًں¤– طھظˆظ‚ط¹ ط§ظ„ط·ظ„ط¨ ط¨ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">طھظ†ط¨ط¤ ط¨ط§ط­طھظٹط§ط¬ط§طھ ط§ظ„ظ…ط®ط²ظˆظ† ط¨ط§ط³طھط®ط¯ط§ظ… Moving Average + Trend Detection</p>
                </div>
            </div>

            {/* Mode selector */}
            <div className="flex gap-3 mb-6 card">
                <div className="flex gap-2 mb-0">
                    {[['batch','ًں“ٹ طھظ†ط¨ط¤ ط¬ظ…ط§ط¹ظٹ (ط£ظپط¶ظ„ 20 ظ…ظ†طھط¬)'],['single','ًں”چ طھظ†ط¨ط¤ ظ…ظ†طھط¬ ظ…ط­ط¯ط¯']].map(([k,l]) => (
                        <button key={k} onClick={() => { setMode(k as any); setResults(null); }}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${mode===k?'btn-primary':'bg-gray-800 text-[var(--text-muted)] hover:text-[var(--text)]'}`}>{l}</button>
                    ))}
                </div>
                {mode === 'single' && (
                    <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="ط£ط¯ط®ظ„ ط±ظ‚ظ… ط§ظ„ظ…ظ†طھط¬..."
                        className="input text-sm w-48 focus:outline-none focus:border-blue-500" />
                )}
                <button onClick={mode === 'batch' ? runBatch : runSingle} disabled={loading}
                    className="px-5 py-2 btn-primary disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
                    {loading ? 'âڈ³ ط¬ط§ط±ظچ ط§ظ„طھط­ظ„ظٹظ„...' : 'â–¶ طھط´ط؛ظٹظ„ ط§ظ„طھظ†ط¨ط¤'}
                </button>
            </div>

            {/* Info box */}
            {!results && !loading && (
                <div className="card p-8 text-center">
                    <div className="text-5xl mb-4">ًں§ </div>
                    <p className="text-[var(--text-muted)]">ط§ط¶ط؛ط· "طھط´ط؛ظٹظ„ ط§ظ„طھظ†ط¨ط¤" ظ„طھط­ظ„ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ ظˆطھظˆظ‚ط¹ ط§ظ„ط·ظ„ط¨</p>
                    <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm text-[var(--text-secondary)]">
                        {['ًں“ˆ ظٹط­ظ„ظ„ ظ…ط¨ظٹط¹ط§طھ 90 ظٹظˆظ… ط§ظ„ظ…ط§ط¶ظٹط©','ًں“ٹ ظٹظƒطھط´ظپ ط§ظ„ط§طھط¬ط§ظ‡ (طµط§ط¹ط¯/ظ‡ط§ط¨ط·/ظ…ط³طھظ‚ط±)','ًں“¦ ظٹظˆطµظٹ ط¨ظƒظ…ظٹط© ط§ظ„ط·ظ„ط¨ ط§ظ„ظ…ط«ظ„ظ‰'].map(t => (
                            <div key={t} className="card-glass p-3">{t}</div>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center py-20">
                    <div className="text-4xl mb-4 animate-pulse">ًں§ </div>
                    <p className="text-[var(--text-muted)]">ظٹط­ظ„ظ„ ط§ظ„ظ†ط¸ط§ظ… ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ...</p>
                </div>
            )}

            {/* Batch results */}
            {results && !results.single && (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                        {[
                            { label: 'ظ…ظ†طھط¬ط§طھ ظ…ط­ظ„ظ„ط©', value: results.total, icon: 'ًں“¦', color: 'blue' },
                            { label: 'طھظ†ط¨ظٹظ‡ ط­ط±ط¬', value: results.critical, icon: 'ًںڑ¨', color: results.critical > 0 ? 'red' : 'emerald' },
                            { label: 'طھط­طھط§ط¬ ط·ظ„ط¨ط§ظ‹ ظ‚ط±ظٹط¨ط§ظ‹', value: (results.forecasts || []).filter((f: any) => f.urgency === 'soon').length, icon: 'âڑ ï¸ڈ', color: 'amber' },
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
                                <th className="text-right p-3">ط§ظ„ظ…ظ†طھط¬</th>
                                <th className="text-right p-3">ط§ظ„ظ…ط®ط²ظˆظ† ط§ظ„ط­ط§ظ„ظٹ</th>
                                <th className="text-right p-3">طھظˆظ‚ط¹ 30 ظٹظˆظ…</th>
                                <th className="text-right p-3">ظٹظƒظپظٹ ظ„ظ€</th>
                                <th className="text-right p-3">ط§ظ„ط­ط§ظ„ط©</th>
                            </tr></thead>
                            <tbody>
                                {(results.forecasts || []).map((f: any, i: number) => (
                                    <tr key={i} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-card-hover)]">
                                        <td className="p-3 font-medium">{f.productName || `ظ…ظ†طھط¬ #${f.productId}`}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{f.currentStock}</td>
                                        <td className="p-3 text-blue-400">{f.forecastedDemand30Days}</td>
                                        <td className={`p-3 font-bold ${f.stockWillLastDays < 14 ? 'text-red-400' : f.stockWillLastDays < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {f.stockWillLastDays === 999 ? 'âˆ‍' : `${f.stockWillLastDays} ظٹظˆظ…`}
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
                            { label: 'ط§ظ„ظ…ط®ط²ظˆظ† ط§ظ„ط­ط§ظ„ظٹ', value: results.product?.currentStock, icon: 'ًں“¦' },
                            { label: 'طھظˆظ‚ط¹ 30 ظٹظˆظ…', value: results.forecast?.forecastedDemand, icon: 'ًںژ¯' },
                            { label: 'ظٹظƒظپظٹ ظ„ظ€', value: `${results.forecast?.stockWillLastDays} ظٹظˆظ…`, icon: 'âڈ³' },
                            { label: 'ط§ظ„ط§طھط¬ط§ظ‡', value: results.forecast?.trendLabel, icon: 'ًں“ˆ' },
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
                            <p className="text-amber-400 font-medium">ًں“‹ ظƒظ…ظٹط© ط§ظ„ط·ظ„ط¨ ط§ظ„ظ…ظˆطµظ‰ ط¨ظ‡ط§: <strong className="text-[var(--text)] text-lg">{results.forecast?.recommendedOrder} ظˆط­ط¯ط©</strong></p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

