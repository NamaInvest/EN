'use client';
import { useState } from 'react';

// ظ…ط­ظ„ظ„ ط£ط¯ط§ط، ط§ظ„ظ…ط¨ظٹط¹ط§طھ â€” Sales BI & Analytics
export default function SalesAnalyticsPage() {
    const [period, setPeriod] = useState('month');
    const [view, setView] = useState('overview');

    const teams = [
        { name: 'ظپط±ظٹظ‚ ط§ظ„ط´ظ…ط§ظ„', target: 80000, actual: 71200, reps: 4, topRep: 'ط£ط­ظ…ط¯ ط§ظ„ط¹ظ…ط±ظٹ', growth: 8 },
        { name: 'ظپط±ظٹظ‚ ط§ظ„ط¬ظ†ظˆط¨', target: 60000, actual: 63400, reps: 3, topRep: 'ط³ط§ط±ط© ط§ظ„ظ…ط·ظٹط±ظٹ', growth: 22 },
        { name: 'ظپط±ظٹظ‚ B2B', target: 120000, actual: 88000, reps: 5, topRep: 'ط®ط§ظ„ط¯ ط§ظ„ط²ظ‡ط±ط§ظ†ظٹ', growth: -8 },
        { name: 'ظپط±ظٹظ‚ ط§ظ„ط±ظٹط§ط¶', target: 90000, actual: 95000, reps: 4, topRep: 'ظ†ظˆط±ط© ط§ظ„ط´ظ…ط±ظٹ', growth: 15 },
    ];

    const reps = [
        { name: 'ط£ط­ظ…ط¯ ط§ظ„ط¹ظ…ط±ظٹ', team: 'ط§ظ„ط´ظ…ط§ظ„', sales: 28400, target: 25000, invoices: 47, avgTicket: 604, trend: 'up', conv: 34 },
        { name: 'ط³ط§ط±ط© ط§ظ„ظ…ط·ظٹط±ظٹ', team: 'ط§ظ„ط¬ظ†ظˆط¨', sales: 31200, target: 28000, invoices: 62, avgTicket: 503, trend: 'up', conv: 41 },
        { name: 'ط®ط§ظ„ط¯ ط§ظ„ط²ظ‡ط±ط§ظ†ظٹ', team: 'B2B', sales: 19800, target: 30000, invoices: 18, avgTicket: 1100, trend: 'down', conv: 22 },
        { name: 'ظ†ظˆط±ط© ط§ظ„ط´ظ…ط±ظٹ', team: 'ط§ظ„ط±ظٹط§ط¶', sales: 33600, target: 28000, invoices: 55, avgTicket: 611, trend: 'up', conv: 38 },
        { name: 'ظ…ط­ظ…ط¯ ط§ظ„ط؛ط§ظ…ط¯ظٹ', team: 'B2B', sales: 15200, target: 25000, invoices: 14, avgTicket: 1086, trend: 'down', conv: 18 },
    ].sort((a, b) => b.sales - a.sales);

    const products = [
        { name: 'ظ‚ظ‡ظˆط© ط³ط¹ظˆط¯ظٹط© 250ط¬ظ…', units: 840, revenue: 42000, margin: 38 },
        { name: 'ظ‚ظ‡ظˆط© ظ…ط¶ط¨ظˆط·ط© 500ط¬ظ…', units: 520, revenue: 52000, margin: 42 },
        { name: 'ظ‡ظٹظ„ ظ…ط·ط­ظˆظ† 200ط¬ظ…', units: 1200, revenue: 24000, margin: 55 },
        { name: 'ظ‚ظ‡ظˆط© ظ‡ظٹظ„ ط®ط§طµط© 250ط¬ظ…', units: 380, revenue: 28500, margin: 48 },
    ];

    const totalActual = teams.reduce((s, t) => s + t.actual, 0);
    const totalTarget = teams.reduce((s, t) => s + t.target, 0);
    const attainment = Math.round((totalActual / totalTarget) * 100);

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ًں“ˆ طھط­ظ„ظٹظ„ط§طھ ط£ط¯ط§ط، ط§ظ„ظ…ط¨ظٹط¹ط§طھ (BI)</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">ظ…ط¤ط´ط±ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ + ط§ظ„ظپط±ظ‚ + ط§ظ„ظ…ظ†ط¯ظˆط¨ظˆظ† + ط§ظ„ظ…ظ†طھط¬ط§طھ</p>
                </div>
                <div className="flex gap-2">
                    {[['month','ط§ظ„ط´ظ‡ط±'],['quarter','ط§ظ„ط±ط¨ط¹'],['year','ط§ظ„ط³ظ†ط©']].map(([k,l]) => (
                        <button key={k} onClick={() => setPeriod(k)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${period===k?'btn-primary':'btn btn-ghost'}`}>{l}</button>
                    ))}
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', value: `${totalActual.toLocaleString()} ط±.ط³`, icon: 'ًں’°', color: 'emerald' },
                    { label: 'ط§ظ„ظ‡ط¯ظپ ط§ظ„ظƒظ„ظٹ', value: `${totalTarget.toLocaleString()} ط±.ط³`, icon: 'ًںژ¯', color: 'blue' },
                    { label: 'ظ†ط³ط¨ط© ط§ظ„ط¥ظ†ط¬ط§ط²', value: `${attainment}%`, icon: 'ًں“ٹ', color: attainment >= 100 ? 'emerald' : attainment >= 80 ? 'amber' : 'red' },
                    { label: 'ط£ظپط¶ظ„ ظپط±ظٹظ‚', value: 'ظپط±ظٹظ‚ ط§ظ„ط±ظٹط§ط¶', icon: 'ًںڈ†', color: 'purple' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${k.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':k.color==='blue'?'bg-blue-500/10 border-blue-500/20':k.color==='amber'?'bg-amber-500/10 border-amber-500/20':k.color==='red'?'bg-red-500/10 border-red-500/20':'bg-purple-500/10 border-purple-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-[var(--text)]">{k.value}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {[['overview','ًں“ٹ ط§ظ„ظپط±ظ‚'],['reps','ًں‘¤ ط§ظ„ظ…ظ†ط¯ظˆط¨ظˆظ†'],['products','ًں“¦ ط§ظ„ظ…ظ†طھط¬ط§طھ']].map(([k,l]) => (
                    <button key={k} onClick={() => setView(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${view===k?'btn-primary':'btn btn-ghost'}`}>{l}</button>
                ))}
            </div>

            {view === 'overview' && (
                <div className="space-y-3">
                    {teams.map(t => {
                        const pct = Math.min(Math.round((t.actual / t.target) * 100), 100);
                        const overTarget = t.actual > t.target;
                        return (
                            <div key={t.name} className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-[var(--text)]">{t.name}</h3>
                                        <p className="text-xs text-[var(--text-secondary)]">ط£ظپط¶ظ„ ظ…ظ†ط¯ظˆط¨: {t.topRep} â€¢ {t.reps} ظ…ظ†ط¯ظˆط¨ظٹظ†</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-[var(--text)]">{t.actual.toLocaleString()} ط±.ط³</p>
                                        <p className={`text-xs font-bold ${t.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.growth >= 0 ? 'â†‘' : 'â†“'} {Math.abs(t.growth)}%</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                                    <span>ط§ظ„ظ‡ط¯ظپ: {t.target.toLocaleString()}</span>
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
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
                            <th className="text-right p-3">ط§ظ„طھط±طھظٹط¨</th><th className="text-right p-3">ط§ظ„ظ…ظ†ط¯ظˆط¨</th>
                            <th className="text-right p-3">ط§ظ„ظ…ط¨ظٹط¹ط§طھ</th><th className="text-right p-3">ط§ظ„ط¥ظ†ط¬ط§ط²</th>
                            <th className="text-right p-3">ط§ظ„ظپظˆط§طھظٹط±</th><th className="text-right p-3">ظ…طھظˆط³ط· ط§ظ„ظپط§طھظˆط±ط©</th>
                            <th className="text-right p-3">ط§ظ„ط§طھط¬ط§ظ‡</th>
                        </tr></thead>
                        <tbody>
                            {reps.map((r, i) => (
                                <tr key={r.name} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-card-hover)]">
                                    <td className="p-3 font-bold text-center">
                                        <span className={i===0?'text-amber-400':i===1?'text-[var(--text-secondary)]':i===2?'text-amber-700':'text-[var(--text-secondary)]'}>{i+1}</span>
                                    </td>
                                    <td className="p-3"><p className="font-medium">{r.name}</p><p className="text-xs text-[var(--text-secondary)]">{r.team}</p></td>
                                    <td className="p-3 text-emerald-400 font-bold">{r.sales.toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`text-xs font-bold ${r.sales >= r.target ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {Math.round((r.sales/r.target)*100)}%
                                        </span>
                                    </td>
                                    <td className="p-3 text-[var(--text-secondary)]">{r.invoices}</td>
                                    <td className="p-3 text-[var(--text-secondary)]">{r.avgTicket.toLocaleString()}</td>
                                    <td className="p-3 text-xl">{r.trend === 'up' ? 'ًں“ˆ' : 'ًں“‰'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'products' && (
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
                            <th className="text-right p-3">ط§ظ„ظ…ظ†طھط¬</th><th className="text-right p-3">ط§ظ„ظˆط­ط¯ط§طھ</th>
                            <th className="text-right p-3">ط§ظ„ط¥ظٹط±ط§ط¯</th><th className="text-right p-3">ظ‡ط§ظ…ط´ ط§ظ„ط±ط¨ط­</th>
                        </tr></thead>
                        <tbody>
                            {products.map((p, i) => (
                                <tr key={i} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-card-hover)]">
                                    <td className="p-3 font-medium">{p.name}</td>
                                    <td className="p-3 text-[var(--text-secondary)]">{p.units.toLocaleString()}</td>
                                    <td className="p-3 text-emerald-400 font-bold">{p.revenue.toLocaleString()} ط±.ط³</td>
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

