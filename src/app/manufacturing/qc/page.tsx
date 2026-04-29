'use client';
import { useState } from 'react';

const MOCK_CHECKS = [
    { id: 1, product: 'ظ‚ظ‡ظˆط© ط³ط¹ظˆط¯ظٹط© 250ط¬ظ…', wo: 'WO-001', batch: 'B-2026-04-001', qty: 500, checked: 480, rejected: 8, status: 'passed', inspector: 'ط£ط­ظ…ط¯', date: '2026-04-29', criteria: [{ name: 'ظˆط²ظ† ط§ظ„ط¹ط¨ظˆط©', result: 'pass' }, { name: 'ط¥ط؛ظ„ط§ظ‚ ط§ظ„طھط؛ظ„ظٹظپ', result: 'pass' }, { name: 'ظ„ظˆظ† ط§ظ„ظ…ظ†طھط¬', result: 'pass' }, { name: 'ط§ظ„ط±ط§ط¦ط­ط©', result: 'pass' }] },
    { id: 2, product: 'ظ‚ظ‡ظˆط© ظ…ط¶ط¨ظˆط·ط© 500ط¬ظ…', wo: 'WO-002', batch: 'B-2026-04-002', qty: 200, checked: 60, rejected: 12, status: 'in_progress', inspector: 'ط³ط§ط±ط©', date: '2026-04-29', criteria: [{ name: 'ظˆط²ظ† ط§ظ„ط¹ط¨ظˆط©', result: 'pass' }, { name: 'ط¥ط؛ظ„ط§ظ‚ ط§ظ„طھط؛ظ„ظٹظپ', result: 'fail' }, { name: 'ظ„ظˆظ† ط§ظ„ظ…ظ†طھط¬', result: 'pass' }, { name: 'ط§ظ„ط±ط§ط¦ط­ط©', result: 'pending' }] },
    { id: 3, product: 'ظ‚ظ‡ظˆط© ظ‡ظٹظ„ 250ط¬ظ…', wo: 'WO-003', batch: 'B-2026-04-003', qty: 300, checked: 300, rejected: 45, status: 'failed', inspector: 'ظ…ط­ظ…ط¯', date: '2026-04-28', criteria: [{ name: 'ظˆط²ظ† ط§ظ„ط¹ط¨ظˆط©', result: 'fail' }, { name: 'ط¥ط؛ظ„ط§ظ‚ ط§ظ„طھط؛ظ„ظٹظپ', result: 'fail' }, { name: 'ظ„ظˆظ† ط§ظ„ظ…ظ†طھط¬', result: 'pass' }, { name: 'ط§ظ„ط±ط§ط¦ط­ط©', result: 'pass' }] },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    passed: { label: 'âœ… ط§ط¬طھط§ط²', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    in_progress: { label: 'âڈ³ ط¬ط§ط±ظچ', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    failed: { label: 'â‌Œ ظپط´ظ„', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function ManufacturingQCPage() {
    const [selected, setSelected] = useState<number | null>(null);
    const selectedCheck = MOCK_CHECKS.find(c => c.id === selected);

    const totalProduced = MOCK_CHECKS.reduce((s, c) => s + c.checked, 0);
    const totalRejected = MOCK_CHECKS.reduce((s, c) => s + c.rejected, 0);
    const defectRate = ((totalRejected / totalProduced) * 100).toFixed(1);

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ًں”¬ ط¶ط¨ط· ط¬ظˆط¯ط© ط§ظ„طھطµظ†ظٹط¹ (QC)</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">ظپط­طµ ط§ظ„ظ…ظ†طھط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹ ظ‚ط¨ظ„ ط§ظ„ط¥ط±ط³ط§ظ„ ظ„ظ„ظ…ط³طھظˆط¯ط¹</p>
                </div>
                <button className="px-5 py-2.5 btn-primary rounded-xl text-sm font-medium">+ ط³ط¬ظ„ ظپط­طµ ط¬ط¯ظٹط¯</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'ظˆط­ط¯ط§طھ ظ…ظپط­ظˆطµط©', value: totalProduced, icon: 'ًں”چ', color: 'blue' },
                    { label: 'ظˆط­ط¯ط§طھ ظ…ط±ظپظˆط¶ط©', value: totalRejected, icon: 'â‌Œ', color: totalRejected > 20 ? 'red' : 'emerald' },
                    { label: 'ظ…ط¹ط¯ظ„ ط§ظ„ط¹ظٹظˆط¨', value: `${defectRate}%`, icon: 'ًں“ٹ', color: parseFloat(defectRate) > 5 ? 'red' : 'emerald' },
                    { label: 'ط¯ظپط¹ط§طھ ط§ط¬طھط§ط²طھ', value: MOCK_CHECKS.filter(c => c.status === 'passed').length, icon: 'âœ…', color: 'emerald' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${k.color==='blue'?'bg-blue-500/10 border-blue-500/20':k.color==='red'?'bg-red-500/10 border-red-500/20':'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-2xl font-bold text-[var(--text)]">{k.value}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                    {MOCK_CHECKS.map(c => (
                        <button key={c.id} onClick={() => setSelected(c.id === selected ? null : c.id)}
                            className={`w-full text-right p-4 rounded-xl border transition-all ${selected===c.id?'border-blue-500 bg-blue-500/5':'border-[var(--border)] bg-[var(--bg-card)] hover:border-gray-700'}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-[var(--text-secondary)]">{c.wo}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[c.status]?.color}`}>{STATUS_CONFIG[c.status]?.label}</span>
                                    </div>
                                    <h3 className="font-semibold text-[var(--text)]">{c.product}</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">{c.batch} â€¢ ظ…ظپطھط´: {c.inspector} â€¢ {c.date}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-[var(--text-muted)]">ظ…ظپط­ظˆطµ: <span className="text-[var(--text)] font-bold">{c.checked}/{c.qty}</span></p>
                                    <p className={`text-sm ${c.rejected > 10 ? 'text-red-400' : 'text-emerald-400'}`}>ظ…ط±ظپظˆط¶: {c.rejected}</p>
                                </div>
                            </div>
                            <div className="mt-3 h-2 bg-gray-800 rounded-full">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.checked/c.qty)*100}%` }} />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="card p-5 h-fit">
                    {selectedCheck ? (
                        <>
                            <h3 className="font-semibold mb-4">ًں“‹ ظ†طھط§ط¦ط¬ ط§ظ„ظپط­طµ ط§ظ„طھظپطµظٹظ„ظٹط©</h3>
                            <div className="space-y-3">
                                {selectedCheck.criteria.map((cr, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 card-glass">
                                        <span className="text-sm text-[var(--text-secondary)]">{cr.name}</span>
                                        <span className={`text-sm font-bold ${cr.result==='pass'?'text-emerald-400':cr.result==='fail'?'text-red-400':'text-[var(--text-muted)]'}`}>
                                            {cr.result==='pass'?'âœ… ظ†ط¬ط­':cr.result==='fail'?'â‌Œ ظپط´ظ„':'âڈ³ ظ…ط¹ظ„ظ‚'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {selectedCheck.status === 'failed' && (
                                <button className="w-full mt-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/30 transition-colors">
                                    ًں”„ ط¥ط¹ط§ط¯ط© ط§ظ„ط¹ظ…ظ„ (Rework)
                                </button>
                            )}
                            {selectedCheck.status === 'in_progress' && (
                                <button className="w-full mt-4 py-2.5 btn-success rounded-xl text-sm transition-colors">
                                    âœ… ط¥ظ†ظ‡ط§ط، ط§ظ„ظپط­طµ
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 text-[var(--text-secondary)]">
                            <div className="text-4xl mb-3">ًں”¬</div>
                            <p className="text-sm">ط§ط®طھط± ط¯ظپط¹ط© ظ„ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ظپط­طµ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

