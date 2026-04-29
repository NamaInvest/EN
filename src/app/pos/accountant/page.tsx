'use client';
import { useState } from 'react';

// ظ…ط­ط§ط³ط¨ ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹ â€” ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظپط±ظˆظ‚ط§طھ ط§ظ„ظٹظˆظ…ظٹط© ظˆظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط®ط²ظٹظ†ط©
const MOCK_SESSIONS = [
    { id: 1, cashier: 'ط£ط­ظ…ط¯ ط§ظ„ط¹ظ…ط±ظٹ', register: 'ظƒط§ط´ظٹط± 1', date: '2026-04-29', openCash: 500, closeCash: 2540, expectedCash: 2580, totalSales: 3420, totalCard: 1320, invoices: 18, diff: -40, status: 'pending' },
    { id: 2, cashier: 'ط³ط§ط±ط© ط§ظ„ظ…ط·ظٹط±ظٹ', register: 'ظƒط§ط´ظٹط± 2', date: '2026-04-29', openCash: 500, closeCash: 1480, expectedCash: 1480, totalSales: 2180, totalCard: 1200, invoices: 12, diff: 0, status: 'approved' },
    { id: 3, cashier: 'ط®ط§ظ„ط¯ ط§ظ„ط²ظ‡ط±ط§ظ†ظٹ', register: 'ظƒط§ط´ظٹط± 3', date: '2026-04-28', openCash: 500, closeCash: 2270, expectedCash: 2250, totalSales: 1750, totalCard: 0, invoices: 9, diff: +20, status: 'approved' },
    { id: 4, cashier: 'ظ†ظˆط±ط© ط§ظ„ط´ظ…ط±ظٹ', register: 'ظƒط§ط´ظٹط± 4', date: '2026-04-28', openCash: 500, closeCash: 850, expectedCash: 900, totalSales: 890, totalCard: 490, invoices: 5, diff: -50, status: 'flagged' },
];

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    pending: { label: 'âڈ³ ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ط±ط§ط¬ط¹ط©', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    approved: { label: 'âœ… ظ…ط¹طھظ…ط¯', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    flagged: { label: 'ًںڑ¨ ظپط±ظˆظ‚ ظ…ط´ط¨ظˆظ‡ط©', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
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
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ًں§¾ ظ…ط­ط§ط³ط¨ ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظپط±ظˆظ‚ط§طھ ط§ظ„ظٹظˆظ…ظٹط© ظˆظ…ط·ط§ط¨ظ‚ط© ط®ط²ط§ط¦ظ† ط§ظ„ظƒط§ط´ظٹط±</p>
                </div>
                <button className="px-5 py-2.5 btn-primary rounded-xl text-sm font-medium">ًں“¤ طھطµط¯ظٹط± طھظ‚ط±ظٹط±</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ط±ط§ط¬ط¹ط©', value: pending, icon: 'âڈ³', color: 'amber' },
                    { label: 'ظپط±ظˆظ‚ ظ…ط´ط¨ظˆظ‡ط©', value: flagged, icon: 'ًںڑ¨', color: flagged > 0 ? 'red' : 'emerald' },
                    { label: 'طµط§ظپظٹ ط§ظ„ظپط±ظˆظ‚ط§طھ ط§ظ„ظٹظˆظ…', value: `${totalDiff > 0 ? '+' : ''}${totalDiff} ط±.ط³`, icon: 'âڑ–ï¸ڈ', color: totalDiff === 0 ? 'emerald' : 'red' },
                    { label: 'ظ…ظ†ط§ظˆط¨ط§طھ ظ…ط·ط§ط¨ظ‚ط©', value: MOCK_SESSIONS.filter(m => m.diff === 0).length, icon: 'âœ…', color: 'emerald' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
                        k.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                        'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-[var(--text)]">{k.value}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-5">
                {[['all','ط§ظ„ظƒظ„'],['pending','ظ…ط¹ظ„ظ‚'],['flagged','ظ…ط´ط¨ظˆظ‡'],['approved','ظ…ط¹طھظ…ط¯']].map(([k,l]) => (
                    <button key={k} onClick={() => setFilter(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'btn-primary':'btn btn-ghost'}`}>{l}</button>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                    {filtered.map(session => (
                        <button key={session.id} onClick={() => setSelected(session.id === selected ? null : session.id)}
                            className={`w-full text-right p-4 rounded-xl border transition-all ${selected === session.id ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-gray-700'}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CFG[session.status]?.color}`}>{STATUS_CFG[session.status]?.label}</span>
                                    </div>
                                    <h3 className="font-semibold text-[var(--text)]">{session.cashier}</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">{session.register} â€¢ {session.date}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-lg font-bold text-[var(--text)]">{session.totalSales.toLocaleString()} ط±.ط³</p>
                                    <p className={`text-sm font-bold ${session.diff === 0 ? 'text-emerald-400' : session.diff > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {session.diff === 0 ? 'âœ… ظ…ط·ط§ط¨ظ‚' : `${session.diff > 0 ? '+' : ''}${session.diff} ط±.ط³`}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-[var(--text-muted)] mt-2">
                                <span>ظپظˆط§طھظٹط±: {session.invoices}</span>
                                <span>ظ†ظ‚ط¯: {session.closeCash.toLocaleString()}</span>
                                <span>ط´ط¨ظƒط©: {session.totalCard.toLocaleString()}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="card p-5 h-fit">
                    {selectedSession ? (
                        <>
                            <h3 className="font-semibold mb-4">ًں”چ طھظپط§طµظٹظ„ ط§ظ„ظ…ط·ط§ط¨ظ‚ط©</h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { label: 'ط±طµظٹط¯ ظپطھط­ ط§ظ„ط®ط²ظٹظ†ط©', value: `${selectedSession.openCash} ط±.ط³`, color: 'text-[var(--text-secondary)]' },
                                    { label: 'ط§ظ„ظ…ط¨ظٹط¹ط§طھ ط§ظ„ظƒظ„ظٹط©', value: `${selectedSession.totalSales.toLocaleString()} ط±.ط³`, color: 'text-[var(--text)]' },
                                    { label: 'ظ…ظ†ظ‡ط§ ط¯ظپط¹ ط´ط¨ظƒط©', value: `${selectedSession.totalCard.toLocaleString()} ط±.ط³`, color: 'text-blue-400' },
                                    { label: 'ط§ظ„ظ†ظ‚ط¯ ط§ظ„ظ…طھظˆظ‚ط¹', value: `${selectedSession.expectedCash.toLocaleString()} ط±.ط³`, color: 'text-emerald-400' },
                                    { label: 'ط§ظ„ظ†ظ‚ط¯ ط§ظ„ظپط¹ظ„ظٹ', value: `${selectedSession.closeCash.toLocaleString()} ط±.ط³`, color: 'text-[var(--text)] font-bold' },
                                    { label: 'ط§ظ„ظپط±ظ‚', value: `${selectedSession.diff >= 0 ? '+' : ''}${selectedSession.diff} ط±.ط³`, color: selectedSession.diff === 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold' },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between py-2 border-b border-[var(--border-light)]">
                                        <span className="text-[var(--text-muted)]">{r.label}</span>
                                        <span className={r.color}>{r.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2">
                                {selectedSession.status === 'pending' && (
                                    <>
                                        <button className="w-full py-2 btn-success rounded-lg text-sm transition-colors">âœ… ط§ط¹طھظ…ط§ط¯ ظˆط¥ط؛ظ„ط§ظ‚</button>
                                        {selectedSession.diff !== 0 && (
                                            <button className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors">ًںڑ¨ ط¥ط­ط§ظ„ط© ظ„ظ„طھط­ظ‚ظٹظ‚</button>
                                        )}
                                    </>
                                )}
                                <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">ًں–¨ï¸ڈ ط·ط¨ط§ط¹ط© طھظ‚ط±ظٹط± ط§ظ„ظ…ظ†ط§ظˆط¨ط©</button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-[var(--text-secondary)]">
                            <div className="text-4xl mb-3">ًں§¾</div>
                            <p className="text-sm">ط§ط®طھط± ظ…ظ†ط§ظˆط¨ط© ظ„ظ„ظ…ط±ط§ط¬ط¹ط©</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

