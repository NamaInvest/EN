'use client';
import { useState } from 'react';

export default function SalesCoachPage() {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const analyze = async () => {
        setLoading(true);
        setResult(null);
        const res = await fetch('/api/ai/sales-coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId || undefined }),
        });
        setResult(await res.json());
        setLoading(false);
    };

    const scoreColor = (score: number) =>
        score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ًںڈ… ظ…ط¯ط±ط¨ ط§ظ„ظ…ط¨ظٹط¹ط§طھ ط§ظ„ط°ظƒظٹ (AI Coach)</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">طھط­ظ„ظٹظ„ ط£ط¯ط§ط، ط§ظ„ظ…ظ†ط¯ظˆط¨ + طھظˆطµظٹط§طھ طھط·ظˆظٹط± ط´ط®طµظٹط©</p>
                </div>
            </div>

            <div className="flex gap-3 mb-6 card">
                <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="ط±ظ‚ظ… ط§ظ„ظ…ظ†ط¯ظˆط¨ (ط£ظˆ ط§طھط±ظƒظ‡ ظ„طھط­ظ„ظٹظ„ ط­ط³ط§ط¨ظƒ)"
                    className="flex-1 input text-sm focus:outline-none focus:border-blue-500" />
                <button onClick={analyze} disabled={loading}
                    className="px-5 py-2 btn-primary disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
                    {loading ? 'âڈ³ طھط­ظ„ظٹظ„...' : 'ًںڈ… طھط­ظ„ظٹظ„ ط§ظ„ط£ط¯ط§ط،'}
                </button>
            </div>

            {loading && (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4 animate-bounce">ًں§ </div>
                    <p className="text-[var(--text-muted)]">ظٹط­ظ„ظ„ ط¨ظٹط§ظ†ط§طھ 30 ظٹظˆظ… ط§ظ„ظ…ط§ط¶ظٹط©...</p>
                </div>
            )}

            {result && !result.error && (
                <>
                    {/* Score */}
                    <div className="card p-6 mb-5 flex items-center gap-6">
                        <div className="text-center">
                            <div className={`text-6xl font-black ${scoreColor(result.score)}`}>{result.score}</div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">ظ†ظ‚ط§ط· ط§ظ„ط£ط¯ط§ط،</p>
                        </div>
                        <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${result.score >= 80 ? 'bg-emerald-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(result.score, 100)}%` }} />
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">{result.period}</div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        {[
                            { label: 'ط¹ط¯ط¯ ط§ظ„ظپظˆط§طھظٹط±', value: result.performance?.totalInvoices, icon: 'ًں§¾' },
                            { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', value: `${result.performance?.totalSales?.toLocaleString()} ط±.ط³`, icon: 'ًں’°' },
                            { label: 'ظ…طھظˆط³ط· ط§ظ„ظپط§طھظˆط±ط©', value: `${result.performance?.avgInvoice?.toLocaleString()} ط±.ط³`, icon: 'ًں“ٹ' },
                            { label: 'ظ†ط³ط¨ط© ط§ظ„ط¢ط¬ظ„', value: `${result.performance?.creditRatio}%`, icon: 'âڈ³' },
                        ].map(k => (
                            <div key={k.label} className="card p-4">
                                <div className="text-2xl mb-2">{k.icon}</div>
                                <div className="text-xl font-bold text-[var(--text)]">{k.value}</div>
                                <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                        {/* Top products */}
                        {result.topProducts?.length > 0 && (
                            <div className="card p-5">
                                <h3 className="font-semibold mb-4">ًںڈ† ط£ظƒط«ط± ط§ظ„ظ…ظ†طھط¬ط§طھ ظ…ط¨ظٹط¹ط§ظ‹</h3>
                                <div className="space-y-3">
                                    {result.topProducts.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-lg font-bold ${i===0?'text-amber-400':i===1?'text-[var(--text-secondary)]':'text-amber-700'}`}>{i+1}</span>
                                                <span className="text-sm text-[var(--text-secondary)]">{p.name}</span>
                                            </div>
                                            <span className="text-emerald-400 text-sm font-bold">{p.revenue?.toLocaleString()} ط±.ط³</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        <div className="card p-5">
                            <h3 className="font-semibold mb-4">ًں’، طھظˆطµظٹط§طھ ط§ظ„ظ…ط¯ط±ط¨ ط§ظ„ط°ظƒظٹ</h3>
                            <div className="space-y-3">
                                {(result.recommendations || []).map((rec: string, i: number) => (
                                    <div key={i} className="p-3 card-glass text-sm text-[var(--text-secondary)] border border-gray-700">
                                        {rec}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {result?.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{result.error}</div>
            )}
        </div>
    );
}

